const codes = {
	horizontalTab: -2,
	virtualSpace: -1,
	nul: 0,
	eof: null,
	space: 32
}

function markdownLineEndingOrSpace(code) {
	return code < codes.nul || code === codes.space
}

function markdownLineEnding(code) {
	return code < codes.horizontalTab
}

function highlightSyntax(options = {}) {
	const marker = ["=", "^"].includes(options?.marker) ? options?.marker : "="
	const fence = "=="

	function tokenize(effects, ok, nok) {
		let data

		let startMarkerCursor = 0
		let endMarkerCursor = 0

		return start

		function start(code) {
			if (code !== fence.charCodeAt(startMarkerCursor)) return nok(code)

			effects.enter('highlight')
			effects.enter('highlightMarker')

			return consumeStart(code)
		}

		function consumeStart(code) {
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

		function consumeData(code) {
			if (markdownLineEnding(code) || code === codes.eof) {
				return nok(code)
			}

			effects.enter('highlightData')
			effects.enter('highlightTarget')
			return consumeTarget(code)
		}

		function consumeTarget(code) {
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

		function consumeEnd(code) {
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
		text: { 61: call } // "=" or "equalsTo" (see micromark-util-symbol/codes)
	}
}

export {
	highlightSyntax,
	// html TODO
}
