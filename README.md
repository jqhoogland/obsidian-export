## Obsidian Export

[Obsidian Publish](https://obsidian.md/publish) is great but lacks support for many of the plugins we've grown dependent on — most importantly, [Dataview](https://github.com/blacksmithgu/obsidian-dataview).

This plugin lets you compile your `md` notes to `html` for self-hosting. It includes support for (some) of these plugins.

Currently:

- [ ] [Dataview](https://github.com/blacksmithgu/obsidian-dataview)

---

## Reference

- As with Obsidian Publish, you just need to include a `published: true` field in your metadata for a note to be included in the export.
- You can add a `slug: "some-slug"` or `slug: ["one", "of", "several", "slugs"]` to specify the slug of the file produced.
