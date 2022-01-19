import * as fs from "fs";
import _ = require("lodash");

const getSrc = (app, name) => {
	const basePath = app.vault.adapter.basePath;
	const mediaPath = app.vault.config.attachmentFolderPath;
	const origin = basePath + "/" + mediaPath + "/" + name;

	// Create an out/static
	const staticPathOut = basePath + "/out/static";
	const existsMediaPathOut = fs.existsSync(staticPathOut)
	if (!existsMediaPathOut) fs.mkdirSync(staticPathOut)

	// console.log(app.vault.adapter)

	// Copy over the file to out/static if it's not there yet
	const ext = app.vault.adapter.path.extname(name)
	const targetName = _.kebabCase(app.vault.adapter.path.basename(name, ext)) + ext;
	const target = staticPathOut + "/" + targetName
	const targetRelative = "static/" + targetName
	const existsTarget = fs.existsSync(target)
	if (!existsTarget) fs.copyFileSync(origin, target)

	return targetRelative
}

const processWikiEmbeds = ({ app }) => (str) => {
	// Handle pictures

	return str.replace(/!\[\[([ \w\d\.]+)(?:\|(\d{1,4})x?(\d{0,4}))?\]\]/g, (_, name, width, height = null) => {
		console.log({ str, name, width, height })

		const src = getSrc(app, name)

		if (width) {
			return `<img style="width: ${width};${height ? `height: ${height};` : ""}" src="${src}">`
		}
		return `![](${name})`
	})

}

export default processWikiEmbeds
