const codes = {
	horizontalTab: -2,
	virtualSpace: -1,
	nul: 0,
	eof: null,
	space: 32
}


function commentsSyntax(options = {}) {
	const marker = options?.marker?.length === 1 ? options?.marker : "%"
	const fence = marker.repeat(2)

	function tokenize(effects, ok, nok) {
		let data

		let startMarkerCursor = 0
		let endMarkerCursor = 0

		return start

		function start(code) {
			if (code !== fence.charCodeAt(startMarkerCursor)) return nok(code)

			effects.enter('comments')
			effects.enter('commentsMarker')

			return consumeStart(code)
		}

		function consumeStart(code) {
			if (startMarkerCursor === fence.length) {
				effects.exit('commentsMarker')
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
			effects.enter('commentsData')
			effects.enter('commentsTarget')
			return consumeTarget(code)
		}

		function consumeTarget(code) {
			if (code === fence.charCodeAt(endMarkerCursor)) {
				if (!data) return nok(code)
				effects.exit('commentsTarget')
				effects.exit('commentsData')
				effects.enter('commentsMarker')
				return consumeEnd(code)
			}

			effects.consume(code)

			return consumeTarget
		}

		function consumeEnd(code) {
			if (endMarkerCursor === fence.length) {
				effects.exit('commentsMarker')
				effects.exit('comments')
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

	const call = { tokenize }

	return {
		flow: { 37: call } // "=" or "equalsTo" (see micromark-util-symbol/codes)
	}
}

export {
	commentsSyntax,
	// html TODO
}
