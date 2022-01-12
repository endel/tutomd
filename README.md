<div align="center">
<img src="https://github.com/endel/tutomd/blob/master/logo.png?raw=1" width="70%" alt="tutomd" />
<h2>Markdown-based Structured Tutorial Generator</h2>
</div>

---

> The output of this tool is highly inspired by Unity Learn tutorials (see [an example](https://learn.unity.com/project/introduction-to-visual-scripting?uv=2021.1))

**[See live demo ✅](https://endel.dev/tutomd/)**. You can find the sources of the live demo at [tutorial/](https://github.com/endel/tutomd/tree/master/tutorial) directory.

## Features

- (optional) Tutorial overview
- Nicely formatted & easy to read/go through
- Completion status for all steps
- Sidebar w/ all tutorial steps
- Visual progress for the reader

> There are still some missing features, such as mobile support. Feel free to
> check this tool out and suggest improvements.

## Installation and usage

```
npm install -g tutomd
```

Generating the HTML output:

```
tutomd generate tutorial/* --out html
Copying from tutorial/4-directory-structure.png to /Users/endel/Projects/endel.dev/tutomd/4-directory-structure.png
Copying from tutorial/head.html to /Users/endel/Projects/endel.dev/tutomd/head.html
Copying from tutorial/tutomd.png to /Users/endel/Projects/endel.dev/tutomd/tutomd.png
Write /Users/endel/Projects/endel.dev/tutomd/index.html
Write /Users/endel/Projects/endel.dev/tutomd/1-what-to-expect.html
Write /Users/endel/Projects/endel.dev/tutomd/2-installing-tutomd.html
Write /Users/endel/Projects/endel.dev/tutomd/3-markdown-essentials.html
Write /Users/endel/Projects/endel.dev/tutomd/4-structure-guide-and-formatting-rules.html
Write /Users/endel/Projects/endel.dev/tutomd/theme.css
```


## Hey, I made this on stream!

Follow me on Twitch 😋 [https://www.twitch.tv/endeld](https://www.twitch.tv/endeld)

## License

MIT.
