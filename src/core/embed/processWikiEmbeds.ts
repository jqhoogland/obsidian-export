import * as fs from "fs";
import _ from "lodash";
import { App } from "obsidian";

const getSrc = (app: App, name: string) => {

	if (name.slice(0, 4) === "http") return name

	// TODO: Figure out what's going wrong with the App definition (or how I call it)
	// @ts-ignore
	const basePath = app.vault.adapter.basePath;
	// @ts-ignore
	const mediaPath = app.vault.config.attachmentFolderPath;
	const origin = basePath + "/" + mediaPath + "/" + name;

	// Create an out/static
	const staticPathOut = basePath + "/out/static";
	const existsMediaPathOut = fs.existsSync(staticPathOut)
	if (!existsMediaPathOut) fs.mkdirSync(staticPathOut)

	// console.log(app.vault.adapter)

	// Copy over the file to out/static if it's not there yet
	try {
		// @ts-ignore
		const ext = app.vault.adapter.path.extname(name)
		// @ts-ignore
		const targetName = _.kebabCase(app.vault.adapter.path.basename(name, ext)) + ext;
		const target = staticPathOut + "/" + targetName
		const targetRelative = "static/" + targetName
		const existsTarget = fs.existsSync(target)
		if (!existsTarget) fs.copyFileSync(origin, target)


		return targetRelative

	} catch (e) {
		console.error(e)
	}

	return name
}

interface ProcessWikiEmbedsOptions {
	app: App
}


const processWikiEmbeds = ({ app }: ProcessWikiEmbedsOptions) => async (str: string) => {
	// Handle pictures

	let _str = await str.replace(/!\[([ \w\d\.]*)(?:\|(\d{1,4})x?(\d{0,4}))?\]\((.+)\)/g, (_: string, name = null, width = null, height = null, url = "") => {
		const src = getSrc(app, url)
		return `<img style="${width ? `width: ${width};` : ""}${height ? `height: ${height};` : ""}" src="${src}">`

	})

	_str = await _str.replace(/!\[\[([ \w\d\.]+)(?:\|(\d{1,4})x?(\d{0,4}))?\]\]/g, (_: string, name: string, width: string, height = null) => {
		const src = getSrc(app, name)
		return `<img style="${width ? `width: ${width};` : ""}${height ? `height: ${height};` : ""}" src="${src}">`
	})


	return _str
}

export default processWikiEmbeds
