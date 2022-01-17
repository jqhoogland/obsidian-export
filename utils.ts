import _ from "lodash"
import * as fs from "fs";


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
export const getSlug = (f) => {
	if (f?.slug && Array.isArray(f?.slug) && f?.slug?.length > 0) {
		return f?.slug[0]
	} else if (f?.slug && typeof f?.slug === "string") {
		return f?.slug
	} else {
		return _.kebabCase(f?.file?.name)
	}
}


/**
 * Split slug by `/` to get parent directories.
 * Makes sure that all parent directories exist.
 *
 * @param slug
 */
export const createPathToSlug = async (rootDir, slug) => {
	const path = slug.split('/');

	const parentDir = rootDir
		+ path.slice(0, path?.length - 1).join("/");

	await fs.mkdir(parentDir, { recursive: true }, console.error)
	return `${parentDir}${parentDir[parentDir?.length - 1] === "/" ? "" : "/"}${path[path?.length - 1]}.html`
}
