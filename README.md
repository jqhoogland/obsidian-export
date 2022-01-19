## Obsidian Export

[Obsidian Publish](https://obsidian.md/publish) is great but lacks support for many of the plugins we've grown dependent on — in particular [Dataview](https://github.com/blacksmithgu/obsidian-dataview), but also Citations, Admonition, and more.

This plugin lets you compile your `md` notes to `html` for self-hosting.

It uses [remark](https://github.com/remarkjs/remark) under the hood to do the converting, so, in the future, it'll be possible to use any remark plugins you'd like. For now, it uses a set of plugins that can interpret Obsidian-flavored markdown:

- [remark-gfm](https://github.com/remarkjs/remark-gfm)
- [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter)
- [remark-math](https://github.com/remarkjs/remark-math)
- [remark-mermaidjs](https://github.com/remcohaszing/remark-mermaidjs)
- [remark-numbered-footnote-labels](https://github.com/jackfletch/remark-numbered-footnote-labels)
- [remark-wiki-link](https://github.com/landakram/remark-wiki-link)
- [remark-cite](https://github.com/benrbray/remark-cite)

Plus a few new modifications to do things like comments and embed wikilinks `![[]]`.

---

## Reference

- As with Obsidian Publish, you just need to include a `published: true` field in your metadata for a note to be included in the export.
- You can add a `slug: "some-slug"` or `slug: ["one", "of", "several", "slugs"]` to specify the slug of the file produced. Otherwise it's just the `kebab-case` of your note name.
- By default, links to unpublished notes will be removed. However, you can include an `external` field in an unpublished note's metadata. Then, the link will be transformed to point to the value of `external`.

---

## Stuff to do

- [ ] Basics
	- [x] Remove links to unpublished pages (or change links to `metadata.external` field)
	- [x] Include slugs in unpublished pages
	- [ ] Add support for css snippets
	- [ ] Add support for theme
	- [ ] Add support for page templates/layouts
	- [ ] Add support for graph views
- [ ] Obsidian-flavored markdown
	- [ ] Add support for tags `#abc`
	- [ ] Block ids with `^123456`
	- [ ] Comments
		- [x] Add support to remove obsidian-markdown-style comments `%% ... %%`
		- [ ] Add support to transform obsidian-markdown-style comments to html comments
	- [ ] More powerful wikilinks
		- [ ] Add support for linking to specific headings. `[[Page#Heading 1]]`
		- [ ] Add support for linking to specific blocks. `[[Page^123456]]`
	- [ ] Add support for embed links `![[...]]`
		- [x] Add support for media (& resizing `![[Image|500]]`). (Images currently only work for media that's kept in a specific folder.).
		- [ ] Add support for embedded pages
		- [ ] Add support for pdfs (and specific page links)
	- [ ] Add support for markdown within html elements.
	- [ ] Check highlighting
	- [ ] Publish this as a separate `remark-ofm` (Remark Obsidian Flavored Markdown) plugin
- [ ] Obsidian plugins
	- [ ] Inline dataview attributes:
		- [x] `(key:: value)`
		- [x] `[key:: value]`
		- [ ] Actually do something with the keys (like put this in a `a.title`)
	- [ ] Dataview blocks
		- [x] dataviewjs
		- [ ] dataview
	- [ ] Admonition
	- [ ] CustomJS
	- [ ] Breadcrumbs
	- [ ] Add support for citations (by reading obsidian-cite settings).
- [ ] Miscellaneous
	- [ ] Link aliases (forwarding to the primary slug if there are multiple slugs)
