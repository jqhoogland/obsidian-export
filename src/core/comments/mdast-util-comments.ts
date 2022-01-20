import { safe } from "mdast-util-to-markdown/lib/util/safe.js";

export function toMarkdown(options = {}) {
	// TODO: Add an option to convert to html comments

	const unsafe = [
		{
			character: '%',
			inConstruct: ['phrasing', 'label', 'reference']
		}
	]

	function handler(node, _, context) {
		const exit = context.enter('comments')

		const nodeValue = safe(context, node.value, { before: '%', after: '%' })

		const value = `%%${nodeValue}%%`

		exit()

		return value
	}

	return {
		unsafe: unsafe,
		handlers: {
			comments: handler
		}
	}
}


export function fromMarkdown(options = {}) {
	function enterComments(token) {
		this.enter(
			{
				type: 'comments',
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

	function exitCommentsAlias(token) {
		const alias = this.sliceSerialize(token)
		const current = top(this.stack)
		current.data.alias = alias
	}

	function exitCommentsTarget(token) {
		const target = this.sliceSerialize(token)
		const current = top(this.stack)
		current.value = target
	}

	function exitComments(token) {
		const comments = this.exit(token)

		const value = comments.value

		comments.data.hName = 'mark'
		comments.data.hChildren = [{
			type: 'text',
			value
		}]
	}

	return {
		enter: {
			comments: enterComments
		},
		exit: {
			commentsTarget: exitCommentsTarget,
			commentsAlias: exitCommentsAlias,
			comments: exitComments
		}
	}
}
