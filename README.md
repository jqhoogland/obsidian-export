## Obsidian Export

[Obsidian Publish](https://obsidian.md/publish) is great but lacks support for many of the plugins we've grown dependent on — most importantly, [Dataview](https://github.com/blacksmithgu/obsidian-dataview).

This plugin lets you compile your `md` notes to `html` for self-hosting. It includes support for (some) of these plugins.

Currently:

- [ ] [Dataview](https://github.com/blacksmithgu/obsidian-dataview)

This uses [remark](https://github.com/remarkjs/remark) under the hood to do the converting. In the future, it'll be possible to use any remark plugins you'd like to use. For now, it uses a set of plugins that recreates Obsidian-like markdown:

- [remark-gfm](https://github.com/remarkjs/remark-gfm)
- [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter)
- [remark-math](https://github.com/remarkjs/remark-math)
- [remark-mermaidjs](https://github.com/remcohaszing/remark-mermaidjs)
- [remark-numbered-footnote-labels](https://github.com/jackfletch/remark-numbered-footnote-labels)
- [remark-wiki-link](https://github.com/landakram/remark-wiki-link)
- [remark-cite](https://github.com/benrbray/remark-cite)

---

## Reference

- As with Obsidian Publish, you just need to include a `published: true` field in your metadata for a note to be included in the export.
- You can add a `slug: "some-slug"` or `slug: ["one", "of", "several", "slugs"]` to specify the slug of the file produced.

---

## Stuff to do

- [ ] Basics
	- [ ] Remove links to unpublished pages
	- [ ] Include slugs in unpublished pages
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
		- [ ] Add support for media (& resizing `![[Image|500]]`).
		- [ ] Add support for embedded pages
		- [ ] Add support for pdfs (and specific page links)
	- [ ] Add support for markdown within html elements.
	- [ ] Check highlighting
	- [ ] Publish this as a separate `remark-ofm` (Remark Obsidian Flavored Markdown) plugin
- [ ] Obsidian plugins
	- [ ] Inline dataview attributes:
		- [ ] `(key:: value)`
		- [ ] `[key:: value]`
	- [ ] Run custom code through local plugins (e.g, `admonition`, `dataview`, `dataviewjs`, `obsidian-button` ).
		- [ ] Inline code
		- [ ] Code blocks
	- [ ] CustomJS
	- [ ] Breadcrumbs  
	- [ ] Add support for citations (by reading obsidian-cite settings).
- [ ] Miscellaneous
    - [ ] Link aliases (forwarding to the primary slug if there are multiple slugs)
	- [ ]
