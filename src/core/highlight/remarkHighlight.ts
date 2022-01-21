import { highlightSyntax } from './micromark-extension-highlight'
import { fromMarkdown, toMarkdown } from './mdast-util-highlight'
import { RemarkHighlightOptions } from "./types";


export function remarkHighlight(options: RemarkHighlightOptions = {}) {
	const data = this.data()

	add('micromarkExtensions', highlightSyntax(options))
	add('fromMarkdownExtensions', fromMarkdown(options))
	add('toMarkdownExtensions', toMarkdown(options))

	function add(field: string, value: any) {
		if (data[field]) data[field].push(value)
		else data[field] = [value]
	}
}
