![](search:structure)

# Structure Guide and Formatting Rules

In order to generate a good-looking output, there are some rules to follow.

Here you will learn the recommendations for your text and file structure.

# Sidebar Rules

It is important to follow these rules when defining your tutorial:

- Each Markdown file (`.md`) represents an article, and an item on the left sidebar.
- The order of the articles are defined by their file names
- Each `.md` file is turned into a `.html` file.

![Directory Structure](4-directory-structure.png)

# Article Rules

## Header image

An image is optional for each article. You may define it in 3 different ways:

- **By filename**: You may provide a `.png` image with the same name as the `.md` file (e.g.: `"01-article.md"` + `"01-article.png"`)
- **By markdown image tag**: You may use the markdown image tag to provide a custom image: `![](custom-image.png)`
- **By using a special "search" tag on image**: You may automatically search for a unsplash.com image. See next section!

### Using unsplash.com to automatically search for a header image

You will need an account on unsplash.com, and a developer "Access Key" in order to use this feature.

1. Go to unsplash.com/developers and register as developer.
2. Use the `--unsplash-access-key YOUR_ACCESS_KEY_HERE` option with your access key.
3. Use a special image tag to search for an image: `![](search:your search term here)`

Voila!

# Article summary and steps

As you've seen on [What to expect](1-what-to-expect.html), an article has a summary, and an unlimited amount of step sections.

The first title (`# h1`) is going to be the summary.

```markdown
# Title of the article

This content is going to be on the summary.
```

Following titles (`# h1`) are going to be formatted as steps.

```markdown
# Title of the article

This content is going to be on the summary.

# This is the first step

Contents of the first step

# This is the second step

Contents of the second step
```

# Generating the `.html` files from the command-line

Now, we're going to use the `tutomd` from the command-line in order to convert our `.md` files into `.html`.

```
tutomd generate ./path/to/markdown/* --out html
```

You should see an output that looks like this:

```
Copying from tutorial/3-directory-structure.png to /Users/endel/Projects/tutomd/html/3-directory-structure.png
Write /Users/endel/Projects/tutomd/html/index.html
Write /Users/endel/Projects/tutomd/html/1-what-to-expect.html
Write /Users/endel/Projects/tutomd/html/2-installing-tutomd.html
Write /Users/endel/Projects/tutomd/html/3-markdown-structure.html
Write /Users/endel/Projects/tutomd/html/theme.css
```

# Example

See the source-code of this tutorial [here](https://github.com/endel/tutomd/tree/master/tutorial).

# Questions or Ideas

This project is open-source and is available at [endel/tutomd](https://github.com/endel/tutomd). Feel free to create a PR and/or interact on GitHub issues.