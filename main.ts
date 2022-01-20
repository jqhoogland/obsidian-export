import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { getAPI } from "obsidian-dataview";
import { createPathToSlug, getSlug } from "./utils";
import * as fs from "fs";
import remarkParse from "remark-parse";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import remarkFrontmatter from "remark-frontmatter";
import { remarkMermaid } from "remark-mermaidjs";
import remarkMath from "remark-math";
import remarkWikiLink from "remark-wiki-link";
import remarkNumberedFootnoteLabels from "remark-numbered-footnote-labels";
import { removeComments } from "./src/core/comments/comments";
import remarkDataview from "./src/plugins/obsidian-dataview/remarkDataview";
import rehypeFixObsidianLinks from "./src/core/links/rehypeFixObsidianLinks";
import processWikiEmbeds from "./src/core/embed/processWikiEmbeds";
import rehypeApplyTemplate from "./src/core/templates/rehypeApplyTemplate";
import processDVInline from "./src/plugins/obsidian-dataview/processDVInline";
import remarkProcessCitations from "./src/plugins/obsidian-citation-plugin/remarkProcessCitations";
import { citePlugin as remarkCite } from '@benrbray/remark-cite';
import remarkButtons from "./src/plugins/buttons/remarkButtons";
import rehypeKatex from "rehype-katex";

// Remember to rename these classes and interfaces!

interface ObsidianExportSettings {
	outPath: string;
	buttonDefinitions: string;
	websiteTitle: string,
	navLinks: string[]
}

const DEFAULT_SETTINGS: ObsidianExportSettings = {
	outPath: 'out',
	buttonDefinitions: "5 Miscellaneous/Buttons.md",
	websiteTitle: "Jesse Hoogland",
	navLinks: ["articles", "series", "contact"]
}


export default class ObsidianExport extends Plugin {
	settings: ObsidianExportSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('paper-plane', 'Export', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.exportMd()
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('obsidian-export');


		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'export-obsidian',
			name: 'Export notes to html',
			callback: () => this.exportMd()
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

	}

	exportMd() {
		const dv = getAPI(this.app)
		const notes = dv.pages().where(f => f.published === true)

		console.log("[Export]: Exporting...", notes)
		console.log(this.app, this.manifest,)

		// Where to put the compiled html
		const basePath = this.app.vault?.adapter?.basePath
		const outPath = basePath + "/" + this.settings.outPath + "/"

		// Export custom css snippets
		const csscache: Map<string, string> = this.app.customCss.csscache;
		const relSnippetOutPaths = [...csscache].map(([relFilePath, fileContents]) => {
			const _relFilePathParts = relFilePath.split("/");
			const fileName = _relFilePathParts[_relFilePathParts.length - 1];
			const relOutFilePath = "static/" + fileName;
			const outFilePath = outPath + relOutFilePath;
			fs.writeFileSync(outFilePath, fileContents);
			return relOutFilePath
		})

		// Copy over the current theme
		const cssTheme = app.vault.config.cssTheme;
		const cssThemePath = `${basePath}/.obsidian/.obsidian/themes/${cssTheme}.css`;
		const cssThemeRelOutPath = `static/${cssTheme}.css`
		const cssThemeOutPath = outPath + cssThemeRelOutPath;
		try {
			fs.copyFileSync(cssThemePath, cssThemeOutPath);
			relSnippetOutPaths.unshift("/" + cssThemeRelOutPath)
		} catch (e) {
			console.error(e)
		}

		// And the standard app.css
		fs.copyFileSync(`${basePath}/obsidian.css`, `${outPath}static/obsidian.css`)
		relSnippetOutPaths.unshift("/static/obsidian.css")


		// Citations (must be in csl-json)
		const citationExportRelPath = this.app.plugins.plugins?.["obsidian-citation-plugin"]?.settings?.citationExportPath;
		const citationExportPath = basePath + "/" + citationExportRelPath;
		const citationsDBString = String(fs.readFileSync(citationExportPath));
		let citationsDB = []

		try {
			citationsDB = JSON.parse(citationsDBString);
		} catch (e) {
			console.error(e)
		}

		// Parse the markdown, clean up the links, etc.
		notes?.values?.forEach(async note => {
			const slug = getSlug(note);
			const inFilePath = (this.app.vault?.adapter?.basePath + "/" + note?.file?.path);
			const outFilePath = await createPathToSlug(outPath, slug);

			fs.readFile(inFilePath, "utf-8", async (err, _data) => {
				if (err) console.error(err);

				// Informal processors (substantially easier than writing new remark plugins.
				// TODO: Eventually migrate to remark

				const data = processDVInline(processWikiEmbeds({ app: this.app })(await removeComments(_data)))

				const parsedData = String(await unified()
					.use(remarkParse,)
					.use(remarkFrontmatter)
					.use(remarkGfm)
					// .use(remarkRemoveObsidianComments)
					.use(remarkMath)
					.use(remarkMermaid)
					.use(remarkNumberedFootnoteLabels)
					.use(remarkWikiLink, { aliasDivider: "|" })
					.use(remarkDataview, { dv, page: note })
					.use(remarkCite, {})
					.use(remarkProcessCitations, { db: citationsDB })
					.use(remarkButtons, {
						plugin: this?.app?.plugins?.plugins?.buttons,
						definitions: basePath + "/" + this.settings.buttonDefinitions
					})
					// Convert to HAST
					.use(remarkRehype, { allowDangerousHtml: true })
					.use(rehypeKatex)
					.use(rehypeFixObsidianLinks, { dv }) // Wikilinks doesn't parse until *after* converting to html
					// .use(rehypeRaw)
					.use(rehypeApplyTemplate, {
						styles: relSnippetOutPaths,
						title: this.settings.websiteTitle,
						links: this.settings.navLinks
					})
					.use(rehypeStringify, { allowDangerousHtml: true })
					.process(data)
				)

				// console.log({ data, parsedData })

				if (data) {
					fs.writeFile(outFilePath, parsedData, (err) => {
						if (err) console.error(err)
					})
				}
			})
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class SampleSettingTab extends PluginSettingTab {
	plugin: ObsidianExport;

	constructor(app: App, plugin: ObsidianExport) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings' });

		new Setting(containerEl)
			.setName('Out path')
			.setDesc('Where to export compiled html.')
			.addText(text => text
				.setPlaceholder('out')
				.setValue(this.plugin.settings.outPath)
				.onChange(async (value) => {
					this.plugin.settings.outPath = value;
					await this.plugin.saveSettings();
				}));
	}
}
