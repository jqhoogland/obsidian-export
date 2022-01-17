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

## Timeline
- [ ] Remove links to unpublished pages 
- [ ] Include slugs in unpublished pages  
- [ ] Add support for citations (by reading obsidian-cite settings).
- [ ] Add support for obsidian-markdown-style comments `%% ... %%`
