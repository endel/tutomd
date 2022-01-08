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

function parseTitle(contents) {
  const tokens = md.parse(contents);
  const index = tokens.findIndex((token) => token.type === "heading_open");
  return tokens[index + 1].content;
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

const cli = cac();

cli
  .command('generate [...files]', 'Generate tutorial for file')
  .option("--theme <name>", "Theme path", { default: "template/default.css" })
  .option("--prism-theme <name>", "PrismJS theme", { default: "okaidia" })
  .option("--out <dir>", "Output directory", { default: "output" })
  .action((files, options) => {
    // copy files (that aren't Markdown) over
    files.filter(file => !file.endsWith(".md")).forEach(src => {
      const destiny = path.resolve(options.out, path.basename(src));
      fs.copyFileSync(src, destiny);
      console.log("Copying", `'${src}'`, "to", `'${destiny}'`);
    });

    // only consider markdown (.md) files
    files = files.filter(file => file.endsWith(".md"));

    const source = fs.readFileSync(path.resolve("template", "index.hbs")).toString();
    const template = Handlebars.compile(source);
    const fileContents = {};

    const sidebar = files.map((file, i) => {
      fileContents[file] = fs.readFileSync(file).toString();
      return {
        num: i + 1,
        title: parseTitle(fileContents[file]),
        filename: path.basename(file, ".md")// FIXME: don't duplicate path.basename() here
      };
    });

    files.forEach((file, i) => {
      const filename = path.basename(file, ".md");
      const next = sidebar[i + 1];

      const currentSidebar = JSON.parse(JSON.stringify(sidebar));
      currentSidebar[i].sections = [];

      const contents = fileContents[file];
      const rawSections = contents.split("---").map(content => content.trim());
      let wordCount = 0;

      // TODO: rename "sections" to "steps"?
      const sections = rawSections.map((section, j) => {
        // early return if no content
        if (section.length === 0) { return ""; }

        let rendered = md.render(section);
        let id;

        const sectionTokens = md.parse(section);
        wordCount += getWordCount(sectionTokens);

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

      const tokens = md.parse(contents);
      const firstTitleIndex = tokens.findIndex((token) => token.type === "heading_open");

      const data = {
        current: {
          num: i + 1,
          total: files.length
        },
        estimatedReadingTime: forHumans(Math.round((wordCount / READING_WORDS_PER_MINUTE) * 60)),
        filename,
        next,
        title: tokens[firstTitleIndex + 1].content,
        sidebar: currentSidebar,
        sections,
      };

      // sections.forEach((section) => {
      //   console.log("NEW SECTION!");
      //   console.log(md.render(section));
      //   console.log("...");
      // });

      const html = template(data);

      // create out directory
      mkdirp.sync(options.out);

      // write html file into the out directory.
      fs.writeFileSync(path.resolve(options.out, `${filename}.html`) , html);

      // TODO: generate image preview for the section, if none was provided

    });

    /**
     * Copy the CSS theme over
     */
    const themeCSS = fs.readFileSync(options.theme).toString();
    const iconsCSS = fs.readFileSync(path.resolve("template", "icons.css")).toString();

    // // Syntax highlight: prism.css + theme file
    // const prismCSS = fs.readFileSync(path.resolve("node_modules", "prismjs", "themes", "prism.css")).toString();
    // const prismCSSTheme = fs.readFileSync(path.resolve("node_modules", "prismjs", "themes", `prism-${options.prismTheme}.css`)).toString();

    fs.writeFileSync(`${options.out}/theme.css`, `${iconsCSS}${themeCSS}`);
    // fs.writeFileSync(`${options.out}/theme.css`, themeCSS);
  });

cli.help();
cli.version('1.0.0');
cli.parse();