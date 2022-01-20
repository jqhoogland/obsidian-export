import { highlightSyntax } from './micromark-extension-highlight'
import { fromMarkdown, toMarkdown } from './mdast-util-highlight'


export function remarkHighlight(options = {}) {
	const data = this.data()

	add('micromarkExtensions', highlightSyntax(options))
	add('fromMarkdownExtensions', fromMarkdown(options))
	add('toMarkdownExtensions', toMarkdown(options))

	function add(field, value) {
		if (data[field]) data[field].push(value)
		else data[field] = [value]
	}
}
