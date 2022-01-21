import { safe } from "mdast-util-to-markdown/lib/util/safe.js";
import { Element } from "hast";
import { Context } from "mdast-util-to-markdown";
import { Token } from "micromark-util-types";
import { RemarkHighlightOptions } from "./types";

export function toMarkdown(options: RemarkHighlightOptions = {}) {
	const marker = options?.marker?.length === 1 ? options?.marker : "="
	const fence = marker.repeat(2)

	const unsafe = [
		{
			character: marker,
			inConstruct: ['phrasing', 'label', 'reference']
		},
	]

	function handler(node: Element, _: any, context: Context) {
		const exit = context.enter('highlight')

		// @ts-ignore
		const nodeValue = safe(context, node.value, { before: marker, after: marker })

		const value = `${fence}${nodeValue}${fence}`

		exit()

		return value
	}

	return {
		unsafe: unsafe,
		handlers: {
			highlight: handler
		}
	}
}


export function fromMarkdown(options: RemarkHighlightOptions) {
	function enterHighlight(token: Token) {
		this.enter(
			{
				type: 'highlight',
				value: null,
				data: {
					alias: null,
					permalink: null,
					exists: null
				}
			},
			token
		)
	}

	function top(stack: any[]) {
		return stack[stack.length - 1]
	}

	function exitHighlightAlias(token: Token) {
		const alias = this.sliceSerialize(token)
		const current = top(this.stack)
		current.data.alias = alias
	}

	function exitHighlightTarget(token: Token) {
		const target = this.sliceSerialize(token)
		const current = top(this.stack)
		current.value = target
	}

	function exitHighlight(token: Token) {
		const highlight = this.exit(token)

		const value = highlight.value

		highlight.data.hName = 'mark'
		highlight.data.hChildren = [{
			type: 'text',
			value
		}]
	}

	return {
		enter: {
			highlight: enterHighlight
		},
		exit: {
			highlightTarget: exitHighlightTarget,
			highlightAlias: exitHighlightAlias,
			highlight: exitHighlight
		}
	}
}
