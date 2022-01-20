import { safe } from "mdast-util-to-markdown/lib/util/safe.js";

export function toMarkdown(options = {}) {
	const unsafe = [
		{
			character: '[',
			inConstruct: ['phrasing', 'label', 'reference']
		},
		{
			character: ']',
			inConstruct: ['label', 'reference']
		}
	]

	function handler(node, _, context) {
		const exit = context.enter('highlight')

		const nodeValue = safe(context, node.value, { before: '=', after: '=' })

		const value = `==${nodeValue}==`

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


export function fromMarkdown(options = {}) {
	function enterHighlight(token) {
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

	function top(stack) {
		return stack[stack.length - 1]
	}

	function exitHighlightAlias(token) {
		const alias = this.sliceSerialize(token)
		const current = top(this.stack)
		current.data.alias = alias
	}

	function exitHighlightTarget(token) {
		const target = this.sliceSerialize(token)
		const current = top(this.stack)
		current.value = target
	}

	function exitHighlight(token) {
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
