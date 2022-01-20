/**
 * Based on micromark-extension-math (`%%...%%`)
 * https://github.com/micromark/micromark-extension-math/blob/main/dev/lib/math-flow.js
 *
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 * @typedef {import('micromark-util-types').State} State
 */

import { ok as assert } from 'uvu/assert'
import { factorySpace } from 'micromark-factory-space'
import { markdownLineEnding } from 'micromark-util-character'
import { codes } from 'micromark-util-symbol/codes.js'
import { constants } from 'micromark-util-symbol/constants.js'
import { types } from 'micromark-util-symbol/types.js'

export function comment() {
	return {
		flow: { [codes.percentSign]: inlineCommentParser },
		text: { [codes.percentSign]: commentParser }
	}
}

/** @type {Construct} */
export const commentParser = {
	tokenize: tokenizeCommentFenced,
	concrete: true
}

/** @type {Construct} */
const nonLazyLine = { tokenize: tokenizeNonLazyLine, partial: true }

/** @type {Tokenizer} */
function tokenizeCommentFenced(effects, ok, nok) {
	const self = this
	const tail = self.events[self.events.length - 1]
	const initialSize =
		tail && tail[1].type === types.linePrefix
			? tail[2].sliceSerialize(tail[1], true).length
			: 0
	let sizeOpen = 0

	return start

	/** @type {State} */
	function start(code) {
		assert(code === codes.percentSign, 'expected `%`')
		effects.enter('commentBlock')
		effects.enter('commentBlockFence')
		effects.enter('commentBlockFenceSequence')
		return sequenceOpen(code)
	}

	/** @type {State} */
	function sequenceOpen(code) {
		if (code === codes.percentSign) {
			effects.consume(code)
			sizeOpen++
			return sequenceOpen
		}

		effects.exit('commentBlockFenceSequence')
		return sizeOpen < 2
			? nok(code)
			: factorySpace(effects, metaOpen, types.whitespace)(code)
	}

	/** @type {State} */
	function metaOpen(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			return openAfter(code)
		}

		effects.enter('commentBlockFenceMeta')
		effects.enter(types.chunkString, { contentType: constants.contentTypeString })
		return meta(code)
	}

	/** @type {State} */
	function meta(code) {
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.chunkString)
			effects.exit('commentBlockFenceMeta')
			return openAfter(code)
		}

		if (code === codes.percentSign) return nok(code)
		effects.consume(code)
		return meta
	}

	/** @type {State} */
	function openAfter(code) {
		effects.exit('commentBlockFence')
		return self.interrupt ? ok(code) : contentStart(code)
	}

	/** @type {State} */
	function contentStart(code) {
		if (code === codes.eof) {
			return after(code)
		}

		if (markdownLineEnding(code)) {
			return effects.attempt(
				nonLazyLine,
				effects.attempt(
					{ tokenize: tokenizeClosingFence, partial: true },
					after,
					initialSize
						? factorySpace(
						effects,
						contentStart,
						types.linePrefix,
						initialSize + 1
						)
						: contentStart
				),
				after
			)(code)
		}

		effects.enter('commentBlockValue')
		return contentContinue(code)
	}

	/** @type {State} */
	function contentContinue(code) {
		if (code === codes.eof) {
			effects.exit('commentBlockValue')
			return contentStart(code)
		}

		effects.consume(code)
		return contentContinue
	}

	/** @type {State} */
	function after(code) {
		effects.exit('commentBlock')
		return ok(code)
	}

	/** @type {Tokenizer} */
	function tokenizeClosingFence(effects, ok, nok) {
		let size = 0

		return factorySpace(
			effects,
			closingPrefixAfter,
			types.linePrefix,
			constants.tabSize
		)

		/** @type {State} */
		function closingPrefixAfter(code) {
			effects.enter('commentBlockFence')
			effects.enter('commentBlockFenceSequence')
			return closingSequence(code)
		}

		/** @type {State} */
		function closingSequence(code) {
			if (code === codes.percentSign) {
				effects.consume(code)
				size++
				return closingSequence
			}

			if (size < sizeOpen) return nok(code)
			effects.exit('commentBlockFenceSequence')
			return factorySpace(effects, closingSequenceEnd, types.whitespace)(code)
		}

		/** @type {State} */
		function closingSequenceEnd(code) {
			if (code === codes.eof || markdownLineEnding(code)) {
				effects.exit('commentBlockFence')
				return ok(code)
			}

			return nok(code)
		}
	}
}

/** @type {Tokenizer} */
function tokenizeNonLazyLine(effects, ok, nok) {
	const self = this

	return start

	/** @type {State} */
	function start(code) {
		assert(markdownLineEnding(code), 'expected eol')
		effects.enter(types.lineEnding)
		effects.consume(code)
		effects.exit(types.lineEnding)
		return lineStart
	}

	/** @type {State} */
	function lineStart(code) {
		return self.parser.lazy[self.now().line] ? nok(code) : ok(code)
	}
}


/**
 * @param {Options} [options]
 * @returns {Construct}
 */
export const inlineCommentParser = {
	tokenize: tokenizeCommentInline,
	resolve: resolveCommentInline,
	previous
}

/** @type {Tokenizer} */
function tokenizeCommentInline(effects, ok, nok) {
	const self = this
	let sizeOpen = 0
	/** @type {number} */
	let size
	/** @type {Token} */
	let token

	return start

	/** @type {State} */
	function start(code) {
		assert(code === codes.percentSign, 'expected `%`')
		assert(previous.call(self, self.previous), 'expected correct previous')
		effects.enter('commentInline')
		effects.enter('commentInlineSequence')
		return openingSequence(code)
	}

	/** @type {State} */
	function openingSequence(code) {
		// TODO: Restrict to allow only 2-% comments.
		if (code === codes.percentSign) {
			effects.consume(code)
			sizeOpen++
			return openingSequence
		}

		if (sizeOpen < 2) return nok(code)
		effects.exit('commentInlineSequence')
		return gap(code)
	}

	/** @type {State} */
	function gap(code) {
		if (code === codes.eof) {
			return nok(code)
		}

		// Closing fence?
		// Could also be data.
		if (code === codes.percentSign) {
			token = effects.enter('commentInlineSequence')
			size = 0
			return closingSequence(code)
		}

		// Tabs don’t work, and virtual spaces don’t make sense.
		if (code === codes.space) {
			effects.enter('space')
			effects.consume(code)
			effects.exit('space')
			return gap
		}

		if (markdownLineEnding(code)) {
			effects.enter(types.lineEnding)
			effects.consume(code)
			effects.exit(types.lineEnding)
			return gap
		}

		// Data.
		effects.enter('commentInlineData')
		return data(code)
	}

	// In comment.
	/** @type {State} */
	function data(code) {
		if (
			code === codes.eof ||
			code === codes.percentSign
		) {
			effects.exit('commentInlineData')
			return gap(code)
		}

		effects.consume(code)
		return data
	}

	// Closing fence.
	/** @type {State} */
	function closingSequence(code) {
		// More.
		if (code === codes.percentSign) {
			effects.consume(code)
			size++
			return closingSequence
		}

		// Done!
		if (size === sizeOpen) {
			effects.exit('commentInlineSequence')
			effects.exit('commentInline')
			return ok(code)
		}

		// More or less accents: mark as data.
		token.type = 'commentInlineData'
		return data(code)
	}
}

/** @type {Resolver} */
function resolveCommentInline(events) {
	let tailExitIndex = events.length - 4
	let headEnterIndex = 3
	/** @type {number} */
	let index
	/** @type {number|undefined} */
	let enter

	// If we start and end with an EOL or a space.
	if (
		(events[headEnterIndex][1].type === types.lineEnding ||
			events[headEnterIndex][1].type === 'space') &&
		(events[tailExitIndex][1].type === types.lineEnding ||
			events[tailExitIndex][1].type === 'space')
	) {
		index = headEnterIndex

		// And we have data.
		while (++index < tailExitIndex) {
			if (events[index][1].type === 'commentInlineData') {
				// Then we have padding.
				events[tailExitIndex][1].type = 'commentInlinePadding'
				events[headEnterIndex][1].type = 'commentInlinePadding'
				headEnterIndex += 2
				tailExitIndex -= 2
				break
			}
		}
	}

	// Merge adjacent spaces and data.
	index = headEnterIndex - 1
	tailExitIndex++

	while (++index <= tailExitIndex) {
		if (enter === undefined) {
			if (
				index !== tailExitIndex &&
				events[index][1].type !== types.lineEnding
			) {
				enter = index
			}
		} else if (
			index === tailExitIndex ||
			events[index][1].type === types.lineEnding
		) {
			events[enter][1].type = 'commentInlineData'

			if (index !== enter + 2) {
				events[enter][1].end = events[index - 1][1].end
				events.splice(enter + 2, index - enter - 2)
				tailExitIndex -= index - enter - 2
				index = enter + 2
			}

			enter = undefined
		}
	}

	return events
}

/** @type {Previous} */
function previous(code) {
	// If there is a previous code, there will always be a tail.
	return (
		code !== codes.percentSign ||
		this.events[this.events.length - 1][1].type === types.characterEscape
	)
}
