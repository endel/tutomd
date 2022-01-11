import fs from "fs";
import path from "path";
import cac from "cac";
import markdownIt from "markdown-it";
import Handlebars from "handlebars";
import mkdirp from 'mkdirp';
import markdownItAnchor from "markdown-it-anchor";
import markdownItIns from "markdown-it-anchor";
import markdownItMark from "markdown-it-mark";
import markdownItFootnote from "markdown-it-footnote";
import { createUnplashAPI, getImage } from "./unsplash.mjs";

const READING_WORDS_PER_MINUTE = 180;

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  // highlight:
});

md.use(markdownItAnchor, {});
md.use(markdownItIns)
md.use(markdownItMark);
// md.use(markdownItFootnote); // why footnotes are not working?

const unsplashSearchKeyword = "search:";

Handlebars.registerHelper('wordCountToMinutes', function (wordCount) {
  return forHumans(Math.round((wordCount / READING_WORDS_PER_MINUTE) * 60));
});

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
  var levels = [
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

class File {
  constructor(fullpath) {
    const extname = path.extname(fullpath);
    const filename = path.basename(fullpath, extname);

    // only read contents of Markdown files.
    if (extname === ".md") {
      this.contents = fs.readFileSync(fullpath).toString();
    }

    const [num, ...segments] = filename.split('-');
    this.num = parseInt(num);

    if (num === 0 && segments[0] === "index") {
      this.filename = segments[0];

    } else {
      this.filename = segments.join('-');
    }

    this.extname = extname;
  }
}

const cli = cac();

cli
  .command('generate [...files]', 'Generate tutorial for file')
  .option("--out <dir>", "Output directory", { default: "output" })
  .option("--theme <name>", "Theme path", { default: "template/default.css" })
  .option("--unsplash-access-key <access-key>", "Unplash.com API key for generating section thumbnail images", { default: "" })
  .action(async (files, options) => {
    // create out directory
    mkdirp.sync(options.out);

    const copiedFiles = [];

    // copy files (that aren't Markdown) over
    files.filter(file => !file.endsWith(".md")).forEach(src => {
      const file = new File(src);
      copiedFiles.push(`${file.filename}${file.extname}`);

      const destiny = path.resolve(options.out, `${file.filename}${file.extname}`);
      fs.copyFileSync(src, destiny);
      console.log("Copying", `'${src}'`, "to", `'${destiny}'`);
    });

    // only consider markdown (.md) files
    files = new Map(files.filter(file => file.endsWith(".md")).map((filename) => {
      const file = new File(filename);
      return [file.filename, file];
    }));

    const source = fs.readFileSync(path.resolve("template", "index.hbs")).toString();
    const template = Handlebars.compile(source);

    // iterate over each .md file to generate common sidebar data
    const filenames = Array.from(files.keys());
    const sidebar = await Promise.all(filenames.map(async (filename, i) => {
      const file = files.get(filename);

      const rawSections = file.contents.split("---").map(content => content.trim());
      let wordCount = 0;

      const tokensPerSection = rawSections.map((section, j) => {
        // early return if no content
        if (section.length === 0) { return ""; }

        const tokens = md.parse(section);
        wordCount += getWordCount(tokens);

        return tokens;
      });

      // finds main title
      const index = tokensPerSection[0].findIndex((token) => token.type === "heading_open");
      const title = tokensPerSection[0][index + 1].content;
      let image = (copiedFiles.indexOf(`${filename}.png`) !== -1)
        ? `${filename}.png` // allow to provide an image
        : undefined;

      // finds first image tag
      const imgToken = getFirstImageToken(tokensPerSection[0]);
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
        rawSections,
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
      const sections = sidebar[i].rawSections.map((section, j) => {
        // early return if no content
        if (section.length === 0) { return ""; }

        const sectionTokens = md.parse(section);
        const firstImageToken = (j === 0) && getFirstImageToken(sectionTokens);

        let rendered = (firstImageToken)
          ? md.renderer.render(sectionTokens.filter(token => token !== firstImageToken), md.options)
          : md.render(section);

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

      const tokens = md.parse(file.contents);
      const firstTitleIndex = tokens.findIndex((token) => token.type === "heading_open");

      const data = {
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
      fs.writeFileSync(path.resolve(options.out, `${filename}.html`) , html);
    });

    /**
     * Copy the CSS theme over
     */
    const themeCSS = fs.readFileSync(options.theme).toString();
    const iconsCSS = fs.readFileSync(path.resolve("template", "icons.css")).toString();
    const additionalCSS = options.additionalCSS
      ? fs.readFileSync(options.additionalCSS).toString()
      : "";

    fs.writeFileSync(`${options.out}/theme.css`, `${iconsCSS}${themeCSS}${additionalCSS}`);
  });

cli.help();
cli.version('1.0.0');

try {
  // Parse CLI args without running the command
  cli.parse(process.argv, { run: false })

  // Run the command yourself
  // You only need `await` when your command action returns a Promise
  await cli.runMatchedCommand()

} catch (error) {
  console.error(`\nERROR: ${error.message}\n`);

  cli.outputHelp();

  console.error(`\n${error.stack}\n`);
  process.exit(1);
}