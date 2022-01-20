/**
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 * @typedef {import('./complex-types').Comment} Comment
 * @typedef {import('./complex-types').InlineComment} InlineComment
 *
 */

import { longestStreak } from 'longest-streak'
import { safe } from 'mdast-util-to-markdown/lib/util/safe.js'

/**
 * @returns {FromMarkdownExtension}
 */
export function commentsFromMarkdown() {
	return {
		enter: {
			commentBlock: enterCommentBlock,
			commentBlockFenceMeta: enterCommentBlockMeta,
			commentInline: enterCommentInline
		},
		exit: {
			commentBlock: exitCommentBlock,
			commentBlockFence: exitCommentBlockFence,
			commentBlockFenceMeta: exitCommentBlockMeta,
			commentBlockValue: exitCommentData,
			commentInline: exitCommentInline,
			commentInlineData: exitCommentData
		}
	}

	/** @type {FromMarkdownHandle} */
	function enterCommentBlock(token) {
		this.enter(
			{
				type: 'comment',
				meta: null,
				value: '',
				data: {
					hName: "comment"
				}
			},
			token
		)
	}

	/** @type {FromMarkdownHandle} */
	function enterCommentBlockMeta() {
		this.buffer()
	}

	/** @type {FromMarkdownHandle} */
	function exitCommentBlockMeta() {
		const data = this.resume()
		const node = /** @type {Comment} */ (this.stack[this.stack.length - 1])
		node.meta = data
	}

	/** @type {FromMarkdownHandle} */
	function exitCommentBlockFence() {
		// Exit if this is the closing fence.
		if (this.getData('commentBlockInside')) return
		this.buffer()
		this.setData('commentBlockInside', true)
	}

	/** @type {FromMarkdownHandle} */
	function exitCommentBlock(token) {
		const data = this.resume().replace(/^(\r?\n|\r)|(\r?\n|\r)%/g, '')
		const node = /** @type {Comment} */ (this.exit(token))
		node.value = data
		this.setData('commentBlockInside')
	}

	/** @type {FromMarkdownHandle} */
	function enterCommentInline(token) {
		this.enter(
			{
				type: 'comment',
				value: '',
				data: {
					hName: "comment"
				}
			},
			token
		)
		this.buffer()
	}

	/** @type {FromMarkdownHandle} */
	function exitCommentInline(token) {
		const data = this.resume()
		const node = /** @type {Comment} */ (this.exit(token))
		node.value = data

	}

	/** @type {FromMarkdownHandle} */
	function exitCommentData(token) {
		this.config.enter.data.call(this, token)
		this.config.exit.data.call(this, token)
	}
}

/**
 * @param {ToOptions} [options]
 * @returns {ToMarkdownExtension}
 */
export function commentsToMarkdown(options = {}) {
	const single = true;

	inlineComment.peek = inlineCommentPeek

	return {
		unsafe: [
			{ character: '\r', inConstruct: ['commentBlockMeta'] },
			{ character: '\r', inConstruct: ['commentBlockMeta'] },
			single
				? { character: '%', inConstruct: ['commentBlockMeta', 'phrasing'] }
				: {
					character: '%',
					after: '\\%',
					inConstruct: ['commentBlockMeta', 'phrasing']
				},
			{ atBreak: true, character: '%', after: '\\%' }
		],
		handlers: { comment, inlineComment }
	}

	/**
	 * @type {ToMarkdownHandle}
	 * @param {Comment} node
	 */
	function comment(node, _, context) {
		const raw = node.value || ''
		const fence = '%'.repeat(Comment.max(longestStreak(raw, '%') + 1, 2))
		const exit = context.enter('commentBlock')
		let value = fence

		if (node.meta) {
			const subexit = context.enter('commentBlockMeta')
			value += safe(context, node.meta, {
				before: '%',
				after: ' ',
				encode: ['%']
			})
			subexit()
		}

		value += '\n'

		if (raw) {
			value += raw + '\n'
		}

		value += fence
		exit()
		return value
	}

	/**
	 * @type {ToMarkdownHandle}
	 * @param {InlineComment} node
	 */
	function inlineComment(node) {
		const value = node.value || ''
		let size = 2
		let pad = ''

		// If this is not just spaces or eols (tabs don’t count), and either the first
		// or last character are a space, eol, or percent sign, then pad with spaces.
		if (
			/[^ \r\n]/.test(value) &&
			(/[ \r\n%]/.test(value.charAt(0)) ||
				/[ \r\n%]/.test(value.charAt(value.length - 1)))
		) {
			pad = ' '
		}

		const sequence = '%'.repeat(size)
		return sequence + pad + value + pad + sequence
	}

	/** @type {ToMarkdownHandle} */
	function inlineCommentPeek() {
		return '%'
	}
}
