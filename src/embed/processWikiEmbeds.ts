import * as fs from "fs";
import _ = require("lodash");

const getSrc = (app, name) => {

	if (name.slice(0, 4) === "http") return name

	const basePath = app.vault.adapter.basePath;
	const mediaPath = app.vault.config.attachmentFolderPath;
	const origin = basePath + "/" + mediaPath + "/" + name;

	// Create an out/static
	const staticPathOut = basePath + "/out/static";
	const existsMediaPathOut = fs.existsSync(staticPathOut)
	if (!existsMediaPathOut) fs.mkdirSync(staticPathOut)

	// console.log(app.vault.adapter)

	// Copy over the file to out/static if it's not there yet
	try {
		const ext = app.vault.adapter.path.extname(name)
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

const processWikiEmbeds = ({ app }) => (str) => {
	// Handle pictures

	let _str = str.replace(/!\[([ \w\d\.]*)(?:\|(\d{1,4})x?(\d{0,4}))?\]\((.+)\)/g, (_, name = null, width = null, height = null, url = "") => {
		console.log({ str, name, url, width, height })

		const src = getSrc(app, url)
		
		return `<img style="${width ? `width: ${width};` : ""}${height ? `height: ${height};` : ""}" src="${src}">`

	})

	_str = _str.replace(/!\[\[([ \w\d\.]+)(?:\|(\d{1,4})x?(\d{0,4}))?\]\]/g, (_, name, width, height = null) => {
		// console.log({ str, name, width, height })

		const src = getSrc(app, name)

		return `<img style="${width ? `width: ${width};` : ""}${height ? `height: ${height};` : ""}" src="${src}">`
	})


	return _str
}

export default processWikiEmbeds
