![](search:structure)

# Structure Guide and Markdown Essentials

The `tutomd` tool processes Markdown and transforms it to HTML.

Here you will learn:

- Essential Markdown tags
- Recommended text and file structure for best output

---

# Markdown Essentials

| Element | Markdown Syntax |
|--|--|
| Heading | ```         \
|         | # H1        \
|         | ## H2       \
|         | ### H3      \
|         | ```         |
| Bold    | ```         \
|         | **bold text**  \
|         | ```         |
| Italic    | ```         \
|         | *italic text*  \
|         | ```         |
| Blockquote    | ```         \
|         | > blockquote  \
|         | ```         |
| Ordered list    | ```         \
|         | 1. First item \
|         | 2. Second item \
|         | 3. Third item \
|         | ```         |
| Unordered list    | ```         \
|         | - First item \
|         | - Second item \
|         | - Third item \
|         | ```         |
| Code    | ````         \
|         | ``` \
|         | Code \
|         | ``` \
|         | ````         |
| Horizontal rule    | ```         \
|         | -- \
|         | ```         |
| Link | ```         \
|         | [title](https://www.example.com) \
|         | ```         |
| Image | ```         \
|         | ![alt text](image.jpg) \
|         | ```         |


## Using HTML

HTML is supported inside Markdown. You may add any HTML tag you'd like, such as YouTube iframes:

```html
<iframe width="100%" height="315" src="https://www.youtube.com/embed/moduMHp7TKQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

Result:

<iframe width="100%" height="315" src="https://www.youtube.com/embed/moduMHp7TKQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

---

# `tutomd` Directory Structure

Heyyy

![Directory Structure](3-directory-structure.png)

## ...

- ...