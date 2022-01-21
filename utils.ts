import _ from "lodash"
import * as fs from "fs";
import { DVResult } from "./src/plugins/obsidian-dataview/types";


/**
 * Retrieve or create a slug for a file.
 *
 * If `slug` is provided in the file's metadata, then...
 * - if it is an array, return the first element.
 * - if it is a string, return that string.
 *
 * Otherwise, create a slug from the file's name (using kebab case).
 * - e.g., "Some File Name" -> "some-file-name"
 *
 * @param f
 */
export const getSlug = (f: DVResult) => {
	if (f?.slug && Array.isArray(f?.slug) && f?.slug?.length > 0) {
		return f?.slug[0]
	} else if (f?.slug && typeof f?.slug === "string") {
		if (f?.slug[f?.slug?.length - 1] === "/") return f?.slug + "index"
		return f?.slug
	} else {
		return _.kebabCase(f?.file?.name)
	}
}

/**
 * One of the plugins turns "Links like this" into `#/page/links_like_this`.
 * This does the opposite.
 */

export const parseUrl = (url: string) => {
	// We don't have to worry about capitalization nor path because dataview can handle the rest.
	let newUrl = url

	if (url.slice(0, 7) === "#/page/") {
		newUrl = newUrl.slice(7, newUrl.length)
	}
	const parts = newUrl.split("/")
	return parts[parts?.length - 1].replace(/\_/g, " ")
}


/**
 * Returns the results of `getSlug(f)` if the file `f` is published.
 * Otherwise, looks for `metadata.external` and uses that, or returns `null`
 * @param f
 */
export const getUrl = (f: DVResult) => {
	if (f?.published) {
		return getSlug(f)
	} else if (f?.external) {
		return f?.external
	}
	return null
}

/**
 * Split slug by `/` to get parent directories.
 * Makes sure that all parent directories exist.
 *
 * @param slug
 */
export const createPathToSlug = async (rootDir: string, slug: string) => {
	const path = slug.split('/');

	const parentDir = rootDir
		+ path.slice(0, path?.length - 1).join("/");

	await fs.mkdir(parentDir, { recursive: true }, err => {
		if (err) console.error(err)
	})
	return `${parentDir}${parentDir[parentDir?.length - 1] === "/" ? "" : "/"}${path[path?.length - 1]}.html`
}
