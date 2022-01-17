import { ok as assert } from 'uvu/assert'
import { codes } from 'micromark-util-symbol/codes.js'
import { constants } from 'micromark-util-symbol/constants.js'
import { types } from 'micromark-util-symbol/types.js'
import { factorySpace } from "micromark-factory-space";
import { markdownLineEnding } from "micromark-util-character";

/**
 * Based on micromark's code-fenced parser:
 * https://github.com/micromark/micromark/blob/main/packages/micromark-core-commonmark/dev/lib/code-fenced.js
 *
 * Support Obsidian-style comments (`%% ... %%`)
 *
 * TODO: Remove the code that tries to read the code-fenced metadata (i.e., programming language)
 */

/** @type {Construct} */
export const obsidianComments = {
	name: 'comment',
	tokenize: tokenizeObsidianComment,
	concrete: true
}

const obsidianCommentTypes = {
	obsidianComment: "comment",
	obsidianCommentFence: "obsidianCommentFence",
	obsidianCommentFenceSequence: "obsidianCommentFenceSequence",
	obsidianCommentFenceMeta: "obsidianCommentFenceMeta",
	obsidianCommentFenceInfo: "obsidianCommentFenceInfo",
}
const obsidianCommentSequenceSize = 2


/** @type {Tokenizer} */
function tokenizeObsidianComment(effects, ok, nok) {
	/** @type {Construct} */
	const closingFenceConstruct = { tokenize: tokenizeClosingFence, partial: true }
	/** @type {Construct} */
	const nonLazyLine = { tokenize: tokenizeNonLazyLine, partial: true }
	const tail = this.events[this.events.length - 1]
	const initialPrefix =
		tail && tail[1].type === types.linePrefix
			? tail[2].sliceSerialize(tail[1], true).length
			: 0
	let sizeOpen = 0
	/** @type {NonNullable<Code>} */
	let marker

	return start

	/** @type {State} */
	function start(code) {
		console.log("START", code)
		assert(
			code === codes.percentSign,
			'expected `` % ``'
		)
		effects.enter(obsidianCommentTypes.obsidianComment)
		effects.enter(obsidianCommentTypes.obsidianCommentFence)
		effects.enter(obsidianCommentTypes.obsidianCommentFenceSequence)
		marker = code


		return sequenceOpen(code)

	}

	/** @type {State} */
	function sequenceOpen(code) {
		if (code === marker) {
			effects.consume(code)
			sizeOpen++
			return sequenceOpen
		}

		effects.exit(obsidianCommentTypes.obsidianCommentFenceSequence)
		return sizeOpen != obsidianCommentSequenceSize
			? nok(code)
			: factorySpace(effects, contentStart, types.whitespace)(code)
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
					closingFenceConstruct,
					after,
					initialPrefix
						? factorySpace(
						effects,
						contentStart,
						types.linePrefix,
						initialPrefix + 1
						)
						: contentStart
				),
				after
			)(code)
		}

		effects.enter(types.codeFlowValue)
		return contentContinue(code)
	}

	/** @type {State} */
	function contentContinue(code) {
		console.log("CONTINUE", code)
		if (code === codes.eof || markdownLineEnding(code)) {
			effects.exit(types.codeFlowValue)
			return contentStart(code)
		}

		effects.consume(code)
		return contentContinue
	}

	/** @type {State} */
	function after(code) {
		effects.exit(obsidianCommentTypes.obsidianComment)
		return ok(code)
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

	/** @type {Tokenizer} */
	function tokenizeClosingFence(effects, ok, nok) {
		let size = 0

		return factorySpace(
			effects,
			closingSequenceStart,
			types.linePrefix,
			this.parser.constructs.disable.null.includes('codeIndented')
				? undefined
				: constants.tabSize
		)

		/** @type {State} */
		function closingSequenceStart(code) {
			effects.enter(obsidianCommentTypes.obsidianCommentFence)
			effects.enter(obsidianCommentTypes.obsidianCommentFenceSequence)
			return closingSequence(code)
		}

		/** @type {State} */
		function closingSequence(code) {
			if (code === marker) {
				effects.consume(code)
				size++
				return closingSequence
			}

			if (size !== obsidianCommentSequenceSize) return nok(code)
			effects.exit(obsidianCommentTypes.obsidianCommentFenceSequence)
			return factorySpace(effects, closingSequenceEnd, types.whitespace)(code)
		}

		/** @type {State} */
		function closingSequenceEnd(code) {
			if (code === codes.eof || markdownLineEnding(code)) {
				effects.exit(obsidianCommentTypes.obsidianCommentFence)
				return ok(code)
			}

			return nok(code)
		}
	}
}
