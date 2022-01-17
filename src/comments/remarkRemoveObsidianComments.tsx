import { obsidianComments } from "./micromark-extension-obsidian-comments";
import { obsidianCommentsFromMarkdown, obsidianCommentsToMarkdown } from "./mdast-util-obsidian-comments";

interface RemarkRemoveObsidianCommentsOptions {
	convertToHTML?: boolean;
}

/**
 * There is a remark-comments plugin, but I ignored it:
 * https://github.com/zestedesavoir/zmarkdown/tree/HEAD/packages/remark-comments#readme
 *
 * Reads `%% ... %%`-style comments from Markdown.
 *
 */
export default function remarkRemoveObsidianComments(options: RemarkRemoveObsidianCommentsOptions = {}) {
	const data = this.data()

	add('micromarkExtensions', obsidianComments)
	add('fromMarkdownExtensions', obsidianCommentsFromMarkdown)
	add('toMarkdownExtensions', obsidianCommentsToMarkdown)

	/**
	 * @param {string} field
	 * @param {unknown} value
	 */
	function add(field, value) {
		const list = /** @type {unknown[]} */ (
			// Other extensions
			/* c8 ignore next 2 */
			data[field] ? data[field] : (data[field] = [])
		)

		list.push(value)
	}
}
