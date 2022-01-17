/**
 * @typedef {import('mdast').Delete} Delete
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 */

import { containerPhrasing } from 'mdast-util-to-markdown/lib/util/container-phrasing.js'

/** @type {FromMarkdownExtension} */
export const obsidianCommentsFromMarkdown = {
	canContainEols: ['comment'],
	enter: { comment: enterComment },
	exit: { comment: exitComment }
}

/** @type {ToMarkdownExtension} */
export const obsidianCommentsToMarkdown = {
	unsafe: [{ character: '%', inConstruct: 'phrasing' }],
	handlers: { delete: handleDelete }
}

handleDelete.peek = peekDelete

/** @type {FromMarkdownHandle} */
function enterComment(token) {
	this.enter({ type: 'comment', children: [] }, token)
}

/** @type {FromMarkdownHandle} */
function exitComment(token) {
	this.exit(token)
}

/**
 * @type {ToMarkdownHandle}
 * @param {Delete} node
 */
function handleDelete(node, _, context) {
	const exit = context.enter('comment')
	const value = containerPhrasing(node, context, { before: '%', after: '%' })
	exit()
	return '%%' + value + '%%'
}

/** @type {ToMarkdownHandle} */
function peekDelete() {
	return '%'
}
