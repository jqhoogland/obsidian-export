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
// import { citePlugin as remarkCite } from "@benrbray/remark-cite";
import remarkNumberedFootnoteLabels from "remark-numbered-footnote-labels";
import rehypeRaw from "rehype-raw";
import remarkRemoveObsidianComments from "./src/comments/remarkRemoveObsidianComments";


// Remember to rename these classes and interfaces!

interface ObsidianExportSettings {
	outPath: string;
}

const DEFAULT_SETTINGS: ObsidianExportSettings = {
	outPath: 'out'
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
		const notes = getAPI(this.app).pages().where(f => f.published === true)
		console.log("[Export]: Exporting...", notes)
		console.log(this.app, this.manifest)

		const outPath = this.app.vault?.adapter?.basePath + "/" + this.settings.outPath + "/"

		notes?.values?.forEach(async note => {
			const slug = getSlug(note);
			const inFilePath = (this.app.vault?.adapter?.basePath + "/" + note?.file?.path);
			const outFilePath = await createPathToSlug(outPath, slug);

			fs.readFile(inFilePath, "utf-8", async (err, data) => {
				if (err) console.error(err);
				const parsedData = String(await unified()
					.use(remarkParse)
					.use(remarkRemoveObsidianComments)
					.use(remarkFrontmatter)
					.use(remarkGfm)
					.use(remarkMath)
					.use(remarkMermaid)
					.use(remarkNumberedFootnoteLabels)
					.use(remarkWikiLink, { aliasDivider: "|" })
					// .use(remarkCite)
					.use(remarkRehype, { allowDangerousHtml: true })
					.use(rehypeRaw)
					.use(rehypeStringify,)
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
