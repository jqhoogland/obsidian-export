import { Code, Effects, State } from "micromark-util-types";
import { RemarkHighlightOptions } from "./types";

const codes: Record<string, Code> = {
	horizontalTab: -2,
	virtualSpace: -1,
	nul: 0,
	eof: null,
	space: 32
}

function markdownLineEndingOrSpace(code: Code) {
	return code < codes.nul || code === codes.space
}

function markdownLineEnding(code: Code) {
	return code < codes.horizontalTab
}


function highlightSyntax(options: RemarkHighlightOptions = {}) {
	// "=" (default) is Obsidian-style; "^" is Roam-style
	const marker = options?.marker?.length === 1 ? options?.marker : "="
	const fence = marker.repeat(2)

	function tokenize(effects: Effects, ok: State, nok: State) {
		let data: boolean

		let startMarkerCursor = 0
		let endMarkerCursor = 0

		return start

		function start(code: Code) {
			if (code !== fence.charCodeAt(startMarkerCursor)) return nok(code)

			effects.enter('highlight')
			effects.enter('highlightMarker')

			return consumeStart(code)
		}

		function consumeStart(code: Code) {
			if (startMarkerCursor === fence.length) {
				effects.exit('highlightMarker')
				return consumeData(code)
			}

			if (code !== fence.charCodeAt(startMarkerCursor)) {
				return nok(code)
			}

			effects.consume(code)
			startMarkerCursor++

			return consumeStart
		}

		function consumeData(code: Code) {
			if (markdownLineEnding(code) || code === codes.eof) {
				return nok(code)
			}

			effects.enter('highlightData')
			effects.enter('highlightTarget')
			return consumeTarget(code)
		}

		function consumeTarget(code: Code) {
			if (code === fence.charCodeAt(endMarkerCursor)) {
				if (!data) return nok(code)
				effects.exit('highlightTarget')
				effects.exit('highlightData')
				effects.enter('highlightMarker')
				return consumeEnd(code)
			}

			if (markdownLineEnding(code) || code === codes.eof) {
				return nok(code)
			}

			if (!markdownLineEndingOrSpace(code)) {
				data = true
			}

			effects.consume(code)

			return consumeTarget
		}

		function consumeEnd(code: Code) {
			if (endMarkerCursor === fence.length) {
				effects.exit('highlightMarker')
				effects.exit('highlight')
				return ok(code)
			}

			if (code !== fence.charCodeAt(endMarkerCursor)) {
				return nok(code)
			}

			effects.consume(code)
			endMarkerCursor++

			return consumeEnd
		}
	}

	const call = { tokenize: tokenize }

	return {
		// TODO: Make this compatible with `^` or other characters
		text: { 61: call } // "=" or "equalsTo" (see micromark-util-symbol/codes)
	}
}

export {
	highlightSyntax,
	// html TODO
}
