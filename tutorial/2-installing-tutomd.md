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
tutomd/0.9.5

Usage:
  $ tutomd <command> [options]

Commands:
  generate [...files]  Generate tutorial for file

For more info, run any command with the `--help` flag:
  $ tutomd generate --help

Options:
  -h, --help     Display this message
  -v, --version  Display version number
```