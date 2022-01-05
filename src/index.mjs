import fs from "fs";
import path from "path";
import cac from "cac";
import markdownIt from "markdown-it";
import Handlebars from "handlebars";
import mkdirp from 'mkdirp';
import markdownItAnchor from "markdown-it-anchor";

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  // highlight:
});

md.use(markdownItAnchor, {});

function parseTitle(contents) {
  const tokens = md.parse(contents);
  const index = tokens.findIndex((token) => token.type === "heading_open");
  return tokens[index + 1].content;
}

const cli = cac();

cli
  .command('generate [...files]', 'Generate tutorial for file')
  .option("--theme <name>", "Theme path", { default: "template/default.css" })
  .option("--prism-theme <name>", "PrismJS theme", { default: "okaidia" })
  .option("--out <dir>", "Output directory", { default: "output" })
  .action((files, options) => {
    // TODO: copy image and other files.

    // only consider markdown (.md) files
    files = files.filter(file => file.endsWith(".md"));

    const source = fs.readFileSync(path.resolve("template", "index.hbs")).toString();
    const template = Handlebars.compile(source);
    const fileContents = {};

    const sidebar = files.map(file => {
      fileContents[file] = fs.readFileSync(file).toString();
      return {
        title: parseTitle(fileContents[file]),
        filename: path.basename(file, ".md")// FIXME: don't duplicate path.basename() here
      };
    });

    files.forEach((file, i) => {
      const filename = path.basename(file, ".md");
      console.log({ filename });

      const currentSidebar = JSON.parse(JSON.stringify(sidebar));
      currentSidebar[i].sections = [];

      const contents = fileContents[file];
      const sections = contents.split("---").map(content => content.trim());
      const renderedSections = sections.map((section, j) => {
        // early return if no content
        if (section.length === 0) { return ""; }

        let rendered = md.render(section);

        if (j > 0) { // no need to
          // get the title from the section, so we can replace with the number
          // of it into the rendered
          const sectionTokens = md.parse(section);
          const titleToken = sectionTokens.find((token) => token.type === "heading_open");
          const titleIndex = sectionTokens.indexOf(titleToken);
          const title = sectionTokens[titleIndex + 1].content;
          rendered = rendered.replace(title, `${j}. ${title}`)

          currentSidebar[i].sections.push({
            title,
            id: titleToken.attrGet("id")
          });

        }

        return rendered;
      });

      const tokens = md.parse(contents);
      const firstTitleIndex = tokens.findIndex((token) => token.type === "heading_open");

      const data = {
        filename,
        title: tokens[firstTitleIndex + 1].content,
        sidebar: currentSidebar,
        sections: renderedSections,
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
      fs.writeFileSync(`${options.out}/${filename}.html`, html);
    });

    /**
     * Copy the CSS theme over
     */
    const themeCSS = fs.readFileSync(options.theme).toString();

    // // Syntax highlight: prism.css + theme file
    // const prismCSS = fs.readFileSync(path.resolve("node_modules", "prismjs", "themes", "prism.css")).toString();
    // const prismCSSTheme = fs.readFileSync(path.resolve("node_modules", "prismjs", "themes", `prism-${options.prismTheme}.css`)).toString();

    // fs.writeFileSync(`${options.out}/theme.css`, `${themeCSS}${prismCSS}${prismCSSTheme}`);
    fs.writeFileSync(`${options.out}/theme.css`, themeCSS);
  });

cli.help();
cli.version('1.0.0');
cli.parse();