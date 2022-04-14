import fs from "fs";
import os from "os";
import path from "path";
import cac from "cac";
import glob from "fast-glob";
import markdownIt from "markdown-it";
import Handlebars, { decorators } from "handlebars";
import mkdirp from 'mkdirp';
import markdownItAnchor from "markdown-it-anchor";
import markdownItIns from "markdown-it-anchor";
import markdownItMark from "markdown-it-mark";
import markdownItMultimdTable from "markdown-it-multimd-table";
import markdownItMetadataBlock from "./markdown-it/metadata-block";
// import markdownItFootnote from "markdown-it-footnote";
import yaml from "yaml";
import { createUnplashAPI, getImage } from "./unsplash";
import { format } from "date-and-time";
import colors from "colors";
import parseGitConfig from "parse-git-config";

const READING_WORDS_PER_MINUTE = 180;

const packageJson = require('../package.json');
const gitconfig = parseGitConfig.sync({ path: path.resolve(os.homedir(), ".gitconfig") });
const metadata: any = {
  author: gitconfig?.user?.name
};

const md = markdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  // highlight:
});

md.use(markdownItAnchor, {});
md.use(markdownItIns); // support ++inserted++ for '<p><ins>inserted</ins></p>'
md.use(markdownItMark); // support ==marked== for '<p><mark>marked</mark></p>'
md.use(markdownItMultimdTable, {
  multiline: true
});
md.use(markdownItMetadataBlock, {
  parseMetadata: yaml.parse,
  meta: metadata
});
// md.use(markdownItFootnote); // why footnotes are not working?


const unsplashSearchKeyword = "search:";

function writeFile(destiny, contents) {
  console.log(`Write ${colors.green(destiny)}`);
  fs.writeFileSync(destiny, contents);
}

function getWordCount(children) {
  let wordCount = 0;

  children.forEach((token) => {
    if (token.type === "inline") {
      wordCount += token.content.split(" ").length;
    }

    if (!token.children) {
      return;
    }

    wordCount += getWordCount(token.children);
  });

  return wordCount;
}

/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 *
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the amount of time
 */
function forHumans(seconds) {
  var levels: Array<[number, string]> = [
    [Math.floor(seconds / 31536000), 'years'],
    [Math.floor((seconds % 31536000) / 86400), 'days'],
    [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hours'],
    [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minutes'],
    // [(((seconds % 31536000) % 86400) % 3600) % 60, 'seconds'],
  ];
  var returntext = '';

  for (var i = 0, max = levels.length; i < max; i++) {
    if (levels[i][0] === 0) continue;
    returntext += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]);
  };
  return returntext.trim();
}

function getFirstImageToken (tokens)  {
  const imgTokenIndex = tokens.findIndex((token) => token.type === "inline" && token.children?.[0]?.tag === "img");
  return (imgTokenIndex !== -1) ? tokens[imgTokenIndex] : false;
}

function recurseAllDirectories(inputFiles: string[]) {
  let allFiles = [];

  inputFiles.forEach(file => {
    if (fs.lstatSync(file).isDirectory()) {
      // recursively read directory files
      const dirFiles = glob.sync(path.resolve(file, "**").replace(/\\/gi, "/"));
      allFiles = allFiles.concat(recurseAllDirectories(dirFiles));

    } else {
      // add new file!
      allFiles.push(path.resolve(file));
    }
  });

  return allFiles;
}

//
// pre-render token transformation
// - <a target="_blank"> for external links
// - (possibly more transformations here in the future)
//
function transform(token) {
  if (token.tag === "a") {
    if (/^https?:/.test(token.attrGet("href"))) {
      token.attrSet("target", "_blank");
    }
  }
  return token;
}

function transformAll(tokens) {
  tokens.forEach((token) => {
    transform(token);
    if (token.children) {
      transformAll(token.children);
    }
  });
}

class File {
  filename: string;
  extname: string;
  num: number;
  contents?: string;
  constructor(public fullpath: string) {
    const extname = path.extname(fullpath);
    const filename = path.basename(fullpath, extname);

    // only read contents of Markdown files.
    if (extname === ".md") {
      this.contents = fs.readFileSync(fullpath).toString();
    }

    const [num, ...segments] = filename.split('-');
    this.num = parseInt(num);

    if (this.num === 0 && segments[0] === "index") {
      this.filename = segments[0];

    } else {
      this.filename = filename;
    }

    this.extname = extname;
  }
}

function getOutputFilename(outDir: string, fromDir: string, file: File) {
  const sourceDir = path.resolve(fromDir);
  const sourcePath = file.fullpath.replace(`${sourceDir}${path.sep}`, "");
  const outputFilename = path.resolve(path.dirname(path.resolve(outDir, sourcePath)), `${file.filename}${file.extname}`);

  // make sure output directory exists
  mkdirp.sync(path.dirname(outputFilename));

  return outputFilename;
}

const cli = cac();

cli
  .command('<dir>', 'generate from directory contents')
  .option("--out <dir>", "output directory", { default: "output" })
  .option("--created-at <timestamp>", "tutorial creation date (number of milliseconds since the unix epoch)", { default: new Date() })
  .option("--date-format <format>", "date format [more info: https://github.com/knowledgecode/date-and-time#formatdateobj-arg-utc]", { default: "MMMM D, YYYY" })
  .option("--theme <css-file>", "theme path", { default: path.resolve(__dirname, "..", "template", "default.css") })
  .option("--unsplash-access-key <access-key>", "unplash.com api key for generating section thumbnail images")
  .action(async (dir, options) => {
    if (dir.length === 0) {
      console.error(colors.red("No files provided. Use --help or -h for help."));
      return;
    }

    const allFiles = recurseAllDirectories([dir]);

    // initial metadata based on CLI input
    metadata.date = options.createdAt;

    // configure handlebars
    Handlebars.registerHelper('wordCountToMinutes', (wordCount) => forHumans(Math.max(60, Math.round((wordCount / READING_WORDS_PER_MINUTE) * 60))));
    Handlebars.registerHelper('formatDate', (date) => date && format(date, options.dateFormat));

    const copiedFiles = [];

    // copy allFiles (that aren't Markdown) over
    allFiles.filter(file => !file.endsWith(".md")).forEach(src => {
      const file = new File(src);
      copiedFiles.push(`${file.filename}${file.extname}`);

      const destiny = getOutputFilename(options.out, dir, file);

      fs.copyFileSync(src, destiny);
    });

    // read custom <head> template
    const customHeadFile = allFiles.find((file) => file.indexOf("head.html") >= 0);
    const head = (customHeadFile)
      ? fs.readFileSync(customHeadFile).toString()
      : "";

    // only consider markdown (.md) files
    const files = new Map(allFiles.filter(file => file.endsWith(".md")).map((filename, i) => {
      const file = new File(filename);
      return [`${i}-${file.filename}`, file];
    }));

    const source = fs.readFileSync(path.resolve(__dirname, "..", "template", "tutorial.hbs")).toString();
    const template = Handlebars.compile(source);

    // iterate over each .md file to generate common sidebar data
    const filenames = Array.from(files.keys());
    const sidebar = await Promise.all(filenames.map(async (filename, i) => {
      const file = files.get(filename);

      let wordCount = 0;

      const contentTokens = md.parse(file.contents, {});
      const h1Tokens = contentTokens.filter((token) => token.type === "heading_open" && token.tag === "h1");
      const tokensPerSection = h1Tokens.map((token, i) => {
        const startIndex = contentTokens.indexOf(token);
        const endIndex = (h1Tokens[i + 1] && contentTokens.indexOf(h1Tokens[i + 1])) || contentTokens.length;
        const sectionTokens = contentTokens.slice(startIndex, endIndex);
        wordCount += getWordCount(sectionTokens);
        return sectionTokens;
      });

      // finds main title
      const index = contentTokens.indexOf(h1Tokens[0]);
      const title = contentTokens[index + 1].content;
      let image = (copiedFiles.indexOf(`${filename}.png`) !== -1)
        ? `${filename}.png` // allow to provide an image
        : undefined;

      // finds first image tag
      const imgToken = getFirstImageToken(contentTokens);
      if (imgToken)  {
        const imgTokenSrc = imgToken.children[0].attrGet("src");

        // use unplash to search for image.
        const unsplashSearch = imgTokenSrc.match(`${unsplashSearchKeyword}(.*)`, "i");
        if (unsplashSearch && unsplashSearch[1]) {
          createUnplashAPI(options.unsplashAccessKey);
          image = await getImage(unsplashSearch[1]);

        } else {
          image = imgTokenSrc;
        }
      }

      return {
        isOverview: (file.num === 0),
        num: file.num,
        title,
        image,
        hasPreviewImage: (!!image),
        wordCount,
        filename,
        tokensPerSection,
      };
    }));

    const total = sidebar[sidebar.length - 1].num;

    // iterate over each .md file to generate its contents
    filenames.forEach((filename, i) => {
      const file = files.get(filename);
      const next = sidebar[i + 1];

      const currentSidebar = JSON.parse(JSON.stringify(sidebar));
      currentSidebar[i].sections = [];

      // TODO: rename "sections" to "steps"?
      const sections = sidebar[i].tokensPerSection.map((sectionTokens, j) => {
        const firstImageToken = (j === 0) && getFirstImageToken(sectionTokens);

        // transform all tokens!
        transformAll(sectionTokens);

        let rendered = (firstImageToken)
          ? md.renderer.render(sectionTokens.filter(token => token !== firstImageToken), md.options, {})
          : md.renderer.render(sectionTokens, md.options, {});

        let id;

        if (j > 0) {
          // no need to get the title from the section, so we can replace with
          // the number of it into the rendered
          const titleToken = sectionTokens.find((token) => token.type === "heading_open");
          const titleIndex = sectionTokens.indexOf(titleToken);
          const title = sectionTokens[titleIndex + 1].content;
          rendered = rendered.replace(title, `${j}. ${title}`)
          id = titleToken.attrGet("id");

          currentSidebar[i].sections.push({ title, num: j, id });
        }

        return { rendered, id };
      });

      const tokens = md.parse(file.contents, {});
      const firstTitleIndex = tokens.findIndex((token) => token.type === "heading_open");

      const data = {
        head,
        metadata,
        isOverview: (sidebar[i].isOverview),
        current: {
          num: sidebar[i].num,
          total
        },
        wordCount: (
          (sidebar[i].isOverview)
            ? sidebar.reduce((acc, cur) => acc += cur.wordCount, 0)
            : sidebar[i].wordCount
        ),
        filename,
        image: sidebar[i].image,
        hasPreviewImage: (!!sidebar[i].image),
        next,
        title: tokens[firstTitleIndex + 1].content,
        sidebar: currentSidebar,
        sections,
      };

      const html = template(data);

      // write html file into the out directory.
      const outputFilename = getOutputFilename(options.out, dir, new File(file.fullpath.replace(/\.md$/, ".html")));
      writeFile(outputFilename, html);

      /**
       * Copy the CSS theme over
       */
      const themeCSS = fs.readFileSync(options.theme).toString();
      const iconsCSS = fs.readFileSync(path.resolve(__dirname, "..", "template", "icons.css")).toString();
      const additionalCSS = options.additionalCSS
        ? fs.readFileSync(options.additionalCSS).toString()
        : "";

      writeFile(path.resolve(path.dirname(outputFilename), "theme.css"), `${iconsCSS}${themeCSS}${additionalCSS}`);

    });

  });

// cli
//   .command('[...files]', 'generate tutorial for file')
//   .option("--out <dir>", "output directory", { default: "output" })
//   .option("--created-at <timestamp>", "tutorial creation date (number of milliseconds since the unix epoch)", { default: new Date() })
//   .option("--date-format <format>", "date format [more info: https://github.com/knowledgecode/date-and-time#formatdateobj-arg-utc]", { default: "MMMM D, YYYY" })
//   .option("--theme <css-file>", "theme path", { default: path.resolve(__dirname, "..", "template", "default.css") })
//   .option("--unsplash-access-key <access-key>", "unplash.com api key for generating section thumbnail images")
//   .action(async (files, options) => {

cli.help();
cli.version(packageJson.version);

(async function() {
  // Parse CLI args without running the command
  cli.parse(process.argv, { run: false });

  // Run the command yourself
  // You only need `await` when your command action returns a Promise
  try {
    await cli.runMatchedCommand();

  } catch (error) {
    console.error(`\nERROR: ${error.message}\n`);

    cli.outputHelp();

    console.error(`\n${error.stack}\n`);
    process.exit(1);
  }
})();
