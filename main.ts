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
import { remarkHighlight } from "./src/core/highlight/remarkHighlight";
import { CitationCSLJSON } from "./src/plugins/obsidian-citation-plugin";


interface ObsidianExportSettings {
	outPath: string;
	staticPath: string;
	buttonDefinitions: string;
	websiteTitle: string,
	navLinks: string[]
}

const DEFAULT_SETTINGS: ObsidianExportSettings = {
	outPath: 'out',
	staticPath: "static", // Relative to `outPath`
	buttonDefinitions: "5 Miscellaneous/Buttons.md",
	websiteTitle: "Jesse Hoogland",
	navLinks: ["articles", "series", "contact"]
} // TODO: Add all of these options to the settings tab.


export default class ObsidianExport extends Plugin {
	settings: ObsidianExportSettings;

	async loadExportRibbon() {
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('paper-plane', 'Export', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.exportMd()
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('obsidian-export');
	}

	async loadExportCommand() {
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'export-obsidian',
			name: 'Export notes to html',
			callback: () => this.exportMd()
		});
	}

	async onload() {
		await this.loadSettings();

		// Make the export command available from the actions dialog and the ribbons bar.
		await this.loadExportCommand()
		await this.loadExportRibbon()

		// This adds a settings tab so the user can configure various aspects of the plugin
		await this.addSettingTab(new SettingsTab(this.app, this));

		console.log("[Obsidian Export]: Loaded")
	}

	/**
	 * Export all snippets from `./.obsidian/snippets/*`
	 *
	 * @param basePath: path to vault (absolute)
	 * @param outPath: path to export target (absolute)
	 * @param staticPathRel: path to exported assets folder (relative to `outPath`)
	 * @return a list of paths to each snippet in the exported assets folder (relative to `outPath`)
	 */
	exportSnippets(basePath: string, outPath: string, staticPathRel: string): string[] {
		const csscache: Map<string, string> = this.app.customCss.csscache;

		return [...csscache].map(([filePathRel, fileContents]) => {
			// Get the snippet's name
			const filePathRelParts = filePathRel.split("/");
			const fileName = filePathRelParts[filePathRelParts.length - 1];

			// Copy over the snippet
			const outFilePathRel = `${staticPathRel}/${fileName}`;
			const outFilePath = outPath + outFilePathRel;

			try {
				fs.writeFileSync(outFilePath, fileContents);
			} catch (e) {
				console.error(`[Obsidian Export]: Failed to write snippet ${fileName} to ${outFilePath}`, e)
			}

			return `/${outFilePathRel}`
		})
	}

	/**
	 * Export the Obsidian theme.
	 * TODO: This probably isn't necessary because all classes are wiped, so this doesn't end up doing anything.
	 *
	 * @param basePath: path to vault (absolute)
	 * @param outPath: path to export target (absolute)
	 * @param staticPathRel: path to exported assets folder (relative to `outPath`)
	 * @return the path to the theme .css file in the exported assets folder (relative to `outPath`)
	 */
	exportTheme(basePath: string, outPath: string, staticPathRel: string): string {
		const theme = app.vault.config.cssTheme;
		const themePath = `${basePath}/.obsidian/.obsidian/themes/${theme}.css`;
		const outFilePathRel = `${staticPathRel}/${theme}.css`;
		const outFilePath = outPath + outFilePathRel;

		try {
			fs.copyFileSync(themePath, outFilePath);
		} catch (e) {
			console.error(`[Obsidian Export]: Failed to copy theme to ${outFilePath}`,)
		}

		return `/${outFilePathRel}`
	}

	/**
	 * Export miscellaneous css files from vault.
	 *
	 * @param basePath: path to vault (absolute)
	 * @param outPath: path to export target (absolute)
	 * @param staticPathRel: path to exported assets folder (relative to `outPath`)
	 *
	 * TODO: Put the following into settings
	 * @param srcPaths: paths to additional css files to copy over (relative to `basePath`)
	 * @return the path to the theme .css file in the exported assets folder (relative to `outPath`)
	 */
	exportCSSOther(basePath: string, outPath, staticPathRel: string, srcPaths: string[]): string[] {
		return srcPaths.map(srcPath => {
			const outFilePathRel = `${staticPathRel}/${srcPath}`
			const outFilePath = outPath + outFilePathRel

			try {
				fs.copyFileSync(`${basePath}/${srcPath}`, outFilePath)
			} catch (e) {
				console.error(`[Obsidian Export]: Failed to copy ${srcPath} to ${outFilePath}`,)
			}

			return `/${outFilePathRel}`
		})

	}

	/**
	 * Export CSS Snippets, Theme, obsidian.css, and plugin.css
	 *
	 * @param basePath: path to vault (absolute)
	 * @param outPath: path to export target (absolute)
	 * @param staticPathRel: path to exported assets folder (relative to `outPath`)
	 * @param otherPaths: paths to additional css files to copy over (relative to `basePath`)
	 * @return a list of paths to each of the exported css files (relative to `outPath`)
	 */
	exportCSS(basePath: string, outPath: string, staticPathRel: string, otherPaths = ["obsidian.css", "publish.css"]): string[] {
		const cssSnippetPaths = this.exportSnippets(basePath, outPath, staticPathRel)
		const cssThemePath = this.exportTheme(basePath, outPath, staticPathRel)
		const cssOtherPaths = this.exportCSSOther(basePath, outPath, staticPathRel, otherPaths)

		return [cssThemePath, ...cssSnippetPaths, ...cssOtherPaths]
	}

	/**
	 *
	 */
	loadCitations(basePath): CitationCSLJSON[] {
		const citationsPlugin = this.app.plugins.plugins?.["obsidian-citation-plugin"]
		let citations = []

		if (!!citationsPlugin) {

			const citationExportRelPath = citationsPlugin?.settings?.citationExportPath;
			const citationExportPath = basePath + "/" + citationExportRelPath;
			const citationsDBString = String(fs.readFileSync(citationExportPath));

			try {
				// TODO: Convert Bibtex-formatted citations files
				citations = JSON.parse(citationsDBString);
			} catch (e) {
				console.error(e)
			}
		}

		// TODO: Disable remark-cite plugin if the `obsidian-citation-plugin` is not installed

		return citations
	}


	async exportMd() {
		// This plugin uses the dataview API to retrieve published notes:
		// https://blacksmithgu.github.io/obsidian-dataview/plugin/develop-against-dataview/
		const dv = await getAPI(this.app)
		const notes = await dv.pages().where(f => f.published === true)
		// TODO: Let users customize `published` field in settings

		console.log("[Obsidian Export]: Exporting...", notes)

		// Determine where to put the compiled html
		const basePath = this.app.vault?.adapter?.basePath  // Absolute path to the vault
		const outPath = basePath + "/" + this.settings.outPath + "/"  // Absolute path to the output folder
		const staticPathRel = this.settings.staticPath // Relative path (from output folder) to assets folder

		// Copy over CSS (snippets, theme, obsidian.css, & publish.css)
		const cssPaths = await this.exportCSS(basePath, outPath, staticPathRel)

		// Citations (must be in csl-json)
		const citationsDB = await this.loadCitations(basePath)

		// Copy over each published note.
		const results = await Promise.all(notes?.values?.map(async note => {
			// Where to find the note & where to put it.
			const title = note?.file?.name;
			const slug = getSlug(note);
			const srcPath = basePath + "/" + note?.file?.path; // Absolute path to current note
			const targetPath = await createPathToSlug(outPath, slug); // Absolute path to target note

			let result = false

			await fs.readFile(srcPath, "utf-8", async (e, _data) => {
				if (e) {
					console.error(`[Obsidian Export] Failed to read ${note?.file?.name}`, e)
					return
				}

				// Applies a few informal regex replaces directly on the stringified data.
				// TODO: Convert these to remark processors. This is cheating.
				const data = await (
					// Delete comments `%%...%%`
					removeComments(_data)
						// Convert wiki-link-style images `![[...]]` to `<img>` tags.
						// And process alias-style sizing `![...|100x100]()`
						// TODO: Split these into separate functions
						.then(processWikiEmbeds({ app: this.app }))
						// Remove the `key` in `[key:: value]` and `(key:: value)` (dataview's inline attributes)
						// TODO: Make this dependent on whether or not DV is installed
						// TODO: Keep the `key` and do something useful with it.
						.then(processDVInline));

				// TODO: Bundle all these remark plugins into a `remarkOfm` ("Obsidian-flavored markdown")
				const parsedData = String(await unified()
					//
					// MDAST
					//
					.use(remarkParse,)
					// "Obsidiam-flavored markdown"
					.use(remarkFrontmatter)
					.use(remarkGfm)
					.use(remarkMath) // In conjunction with `rehypeKatex` below.
					.use(remarkMermaid)
					.use(remarkNumberedFootnoteLabels)
					.use(remarkWikiLink, { aliasDivider: "|" })
					.use(remarkHighlight)
					// Obsidian plugins
					.use(remarkCite, {}) // Exposes `cite` nodes.
					.use(remarkProcessCitations, { db: citationsDB }) // Parse `cite` nodes with the references db.
					.use(remarkButtons, {
						plugin: this?.app?.plugins?.plugins?.buttons,
						definitions: basePath + "/" + this.settings.buttonDefinitions
					})
					.use(remarkDataview, { dv, page: note })
					//
					// HAST
					//
					.use(remarkRehype, { allowDangerousHtml: true })
					.use(rehypeKatex)
					.use(rehypeFixObsidianLinks, { dv }) // Wikilinks doesn't parse until *after* converting to html
					// .use(rehypeRaw)
					.use(rehypeApplyTemplate, {
						styles: cssPaths,
						brand: this.settings.websiteTitle,
						links: this.settings.navLinks,
						title
					})
					.use(rehypeStringify, { allowDangerousHtml: true })
					.process(data)
				)

				return fs.writeFile(targetPath, parsedData, (e) => {
					if (e) {
						console.error(`[Obsidian Export] Failed to write ${note?.file?.name} to ${targetPath}`, e)
						return
					}
					result = title
					return
				})
			})

			return result
		}));

		console.log(`[Obsidian Export]: Exported...`, results.filter((fileName?: string) => !!fileName))
		alert(`Successfully exported ${results?.length} notes`)

		return results
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		return this.settings
	}

	async saveSettings() {
		return this.saveData(this.settings);
	}
}


class SettingsTab extends PluginSettingTab {
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
