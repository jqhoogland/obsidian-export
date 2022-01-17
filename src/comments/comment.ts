/**
 * @typedef {} Comment
 * @typedef {import('../types.js').Handle} Handle
 * @typedef {import('../types.js').Exit} Exit
 * @typedef {import('../util/indent-lines.js').Map} Map
 */

import { track } from "mdast-util-to-markdown/lib/util/track"

/**
 * Based on: https://github.com/syntax-tree/mdast-util-to-markdown/blob/main/lib/handle/code.js
 *
 * @type {Handle}
 * @param {Comment} node
 */
export function comment(node, _, context, safeOptions) {
	const marker = '%'
	const raw = node.value || ''
	const suffix = "PercentSign"

	const tracker = track(safeOptions)
	const sequence = marker.repeat(2)
	const exit = context.enter('codeFenced')
	let value = tracker.move(sequence)

	value += tracker.move('\n')

	if (raw) {
		value += tracker.move(raw + '\n')
	}

	value += tracker.move(sequence)
	exit()
	return value
}
