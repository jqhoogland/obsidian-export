## Obsidian Export

[Obsidian Publish](https://obsidian.md/publish) is great but lacks support for many of the plugins we Obsidian addicts have grown accustomed to — in particular [Dataview](https://github.com/blacksmithgu/obsidian-dataview), but also [Citations](https://github.com/hans/obsidian-citation-plugin), [Admonition](https://github.com/valentine195/obsidian-admonition), and more.

This plugin lets you export your `md` notes to `html` static files for self-hosting. It supports a bunch of popular plugins.

For an example, check out [my personal website](https://jessehoogland.com/). (You can see it's still a little wonky, but it's getting there.)

---

## Reference

### How to Export

- As with Obsidian Publish, you just need to include a `published: true` field in your metadata for a note to be included in the export.
- You can add a `slug: "some-slug"` or `slug: ["one", "of", "several", "slugs"]` to specify the slug of the file produced. Otherwise, it's just the `kebab-case` of your note name.
- By default, links to unpublished notes will be removed. However, you can include an `external` field in an unpublished note's metadata. Then, the link will be transformed to point to the value of `external`.

```markdown
%% In "My Random Note" %%
---
published: true slug: "custom-slug"  
external: https://www.random.org/
---

- If `published` is true, this file will be included in the export. Just like Obsidian Publish.
- If `slug` is not explicitly provided, it defaults to `my-random-note`.
	- If you provide multiple slugs, e.g., `["custom-slug-1", "custom-slug-2"]`, then the note will be exported to a file whose name is the first provided slug. Eventually, I'd like to add support for redirecting additional slugs to the first.
- If `published` is `false`, links to this note will be replaced with `https://www.random.org/`

```

### Templates

You can create a custom template to wrap your notes in `template.html` (put this in your vault's top-level directory). This uses [mustache](https://www.npmjs.com/package/mustache), with the following options

```js
{
	nav: {
		brand: string,
			items
	:
		{
			label: string, href
		:
			string
		}
	}
,
	// Already rendered:
	main: string, // This is where your note's contents go 
		head
:
	string,
		footer
:
	string,
}
```

### Styling

You can also provide custom styling in a `publish.css` (again in your vault root). Currently, your snippets, theme, and `obsidian.css` are all included in the export. (There is no option yet to opt out).


---

## How it works

This plugin uses [remark](https://github.com/remarkjs/remark) under the hood to do the converting. It uses a set of plugins to recreate "Obsidian-flavored markdown", including:

- [remark-gfm](https://github.com/remarkjs/remark-gfm)
- [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter)
- [remark-math](https://github.com/remarkjs/remark-math)
- [remark-mermaidjs](https://github.com/remcohaszing/remark-mermaidjs)
- [remark-numbered-footnote-labels](https://github.com/jackfletch/remark-numbered-footnote-labels)
- [remark-wiki-link](https://github.com/landakram/remark-wiki-link)
- [remark-cite](https://github.com/benrbray/remark-cite)

Plus a few new modifications to do things like comments and embed wikilinks `![[]]`. Eventually, I'll probably publish this as a new remark plugin (so you can access Obsidian-flavored markdown in other projects). Conversely, I'll add support for arbitrary remark plugins, so you have even more to choose from.

---

## Available plugins

- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) (partial).
	- You can use `dataviewjs` blocks and inline attributes. `dataview` blocks and inline blocks are still unsupported.
- [Citations](https://github.com/hans/obsidian-citation-plugin).
- [Buttons](https://github.com/shabegom/buttons) (only for link buttons)
- [CustomJS](https://github.com/samlewis0602/obsidian-custom-js)

---

## Stuff to do

- [ ] Core
	- [x] Basics
		- [x] Fix/remove links (using `slug` and `external`)
		- [x] CSS snippets
		- [x] Obsidian theme
		- [x] HTML templates to wrap exported files
	- [ ] "Obsidian-flavored markdown"
		- [x] Wiki-links
		- [ ] Embed wiki-links
			- [x] Images
			- [ ] PDFs
			- [ ] Page embeds
			- [ ] Block embeds
		- [ ] Tags (`#abc`)
		- [ ] Block ids (`^123456`)
		- [x] Comments (`%% ... %%`). This plugin currently just ignores comments. Another option would be to convert to html comments.
		- [x] Highlighting (`==...==`)
- [ ] Plugins
	- [ ] [Dataview](https://github.com/blacksmithgu/obsidian-dataview)
		- [ ] Code blocks
			- [x] `dataviewjs` blocks
			- [ ] `dataview` blocks
			- [ ] inline blocks
		- [x] Inline attributes (currently just disregarding the key)
	- [x] [Citations](https://github.com/hans/obsidian-citation-plugin)
	- [x] [Buttons](https://github.com/shabegom/buttons) (only for link buttons)
	- [ ] [Admonition](https://github.com/valentine195/obsidian-admonition)
	- [x] [CustomJS](https://github.com/samlewis0602/obsidian-custom-js)
	- [ ] [Breadcrumbs](https://github.com/SkepticMystic/breadcrumbs)	
