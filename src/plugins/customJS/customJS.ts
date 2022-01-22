import { App } from "obsidian";
import * as fs from "fs";

type CustomJS = Record<string, object>

export default function loadCustomJS(basePath: string, app: App): CustomJS {
	const customJSPlugin = app?.plugins?.plugins?.customjs;

	if (!customJSPlugin) {
		console.log(`[Obsidian export]: CustomJS not found among`, Object.keys(app?.plugins?.plugins))
		return {}
	}

	// TODO Currently only loads jsFolder (not jsFiles)
	console.log(customJSPlugin)
	const customJSFilesPathRel = customJSPlugin.settings?.jsFiles.split(",")
	const customJSPathRel = customJSPlugin.settings?.jsFolder;
	const customJSPath = basePath + "/" + customJSPathRel;
	const customJS = {}

	try {
		const fileNames = [
			...fs.readdirSync(customJSPath), // From the dir
			...customJSFilesPathRel.map((filePathRel: string) => `${basePath}/${filePathRel}`)  // Specific files
		]

		fileNames.forEach((fileName: string) => {
			const className = fileName.split(".")[0] // Remove `.js` ending
			const filePath = `${customJSPath}/${fileName}`

			// Unfortunately, customJS doesn't allow exports in the files, so we have to do this in this ugly way
			// with eval (adding on this extra string to make sure eval returns the class)
			const file = String(fs.readFileSync(filePath)) + `\nnew ${className}()`;
			customJS[className] = window.eval(file)
		})

		return customJS
	} catch (e) {
		console.error(`[Obsidian export]: Could not load customJS at ${customJSPath}`, e)
		return customJS
	}
}
