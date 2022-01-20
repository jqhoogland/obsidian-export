import { commentsSyntax } from './micromark-extension-comments'
import { fromMarkdown, toMarkdown } from './mdast-util-comments'


export function remarkComments(options = {}) {
	const data = this.data()

	add('micromarkExtensions', commentsSyntax(options))
	add('fromMarkdownExtensions', fromMarkdown(options))
	add('toMarkdownExtensions', toMarkdown(options))

	function add(field, value) {
		if (data[field]) data[field].push(value)
		else data[field] = [value]
	}
}
