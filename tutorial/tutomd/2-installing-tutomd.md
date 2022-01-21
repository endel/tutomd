![](search:nodejs)

# Installing `tutomd`

You are going to need a few tools installed on your local machine before getting started.

In this tutorial, you'll be able to set up your local environment to use `tutomd`.

# Install Software Requirements

## Download and Install Node.js

The structured tutorial generator (`tutomd`) is written in Node.js, you will need to download and install it.

It is recommended to install the LTS version:

**[Click here to Download Node.js](https://nodejs.org/en/download/)**

## Download and Install Visual Studio Code

You're going to need a text editor that supports editing Markdown (`*.md`) files.

**[Click here to Download Visual Studio Code](https://code.visualstudio.com/download)**

# Install the `tutomd` tool

Now that you have Node.js installed, you can use your terminal to download the `tutomd` binary.

Run the following command to make it available globally:

```
npm install -g tutomd
```

Now, let's confirm if you have the `tutomd` command available by running this command:

```
tutomd --help
```

You should see something similar to this on your terminal:

```bash
tutomd/1.0.0

Usage:
  $ tutomd <dir>

Commands:
  <dir>  generate from directory contents

For more info, run any command with the `--help` flag:
  $ tutomd --help

Options:
  --out <dir>                         output directory (default: output)
  --created-at <timestamp>            tutorial creation date (number of milliseconds since the unix epoch) (default: Fri Jan 21 2022 11:06:14 GMT-0300 (Brasilia Standard Time))
  --date-format <format>              date format [more info: https://github.com/knowledgecode/date-and-time#formatdateobj-arg-utc] (default: MMMM D, YYYY)
  --theme <css-file>                  theme path (default: /Users/endel/Projects/tutomd/template/default.css)
  --unsplash-access-key <access-key>  unplash.com api key for generating section thumbnail images
  -h, --help                          Display this message
  -v, --version                       Display version number
```