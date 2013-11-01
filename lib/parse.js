/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/json5-utils
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

// RTFM: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf

var Uni = require('./unicode')

function isHexDigit(x) {
	return (x >= '0' && x <= '9')
	    || (x >= 'A' && x <= 'F')
	    || (x >= 'a' && x <= 'f')
}

function isDecDigit(x) {
	return x >= '0' && x <= '9'
}

var unescapeMap = {
	'\'': '\'',
	'"' : '"',
	'\\': '\\',
	'b' : '\b',
	'f' : '\f',
	'n' : '\n',
	'r' : '\r',
	't' : '\t',
	'v' : '\v',
}

function formatError(input, msg, position, lineno, column) {
	var result = msg + ' at ' + lineno + ':' + column
	  , tmppos = position - column - 1
	  , srcline = ''
	  , underline = ''

	// output no more than 70 characters before the wrong ones
	if (tmppos < position - 70) {
		tmppos = position - 70
	}

	while (++tmppos < input.length) {
		var chr = input[tmppos]

		if (Uni.isLineTerminator(chr)) break
		srcline += chr

		if (position === tmppos) {
			underline += '^'
		} else if (position > tmppos) {
			underline += input[tmppos] === '\t' ? '\t' : ' '
		}

		// output no more than 78 characters on the string
		if (srcline.length > 78) break
	}

	return result + '\n' + srcline + '\n' + underline
}

function parse(input, options) {
	if (input === undefined) {
		// parse(stringify(x)) should be equal x
		// with JSON functions it is not 'cause of undefined
		// so we're fixing it
		return undefined
	}

	// JSON.parse compat
	if (typeof(input) !== 'string') input = String(input)
	if (options == null) options = {}

	// parse as a standard JSON mode
	// it's not really JSON, just cool features turned off
	var legacy = options.legacy

	var length = input.length
	  , lineno = 0
	  , linestart = 0
	  , position = 0

	function fail(msg) {
		var column = position - linestart

		if (!msg) {
			if (position < length) {
				var token = '\'' +
					JSON
						.stringify(input[position])
						.replace(/^"|"$/g, '')
						.replace(/'/g, "\\'")
						.replace(/\\"/g, '"')
					+ '\''

				if (!msg) msg = 'Unexpected token ' + token
			} else {
				if (!msg) msg = 'Unexpected end of input'
			}
		}

		var error = new Error(formatError(input, msg, position, lineno, column))
		error.row = lineno
		error.column = column
		throw error
	}

	function parseGeneric(identAllowed) {
		var result
		//console.log('parse: =============\n', input.substr(position, 40))

		while (position < length) {
			var chr = input[position++]

			if (Uni.isLineTerminator(chr)) {
				// account for <cr><lf>
				if (chr === '\r' && input[position] === '\n') position++
				linestart = position
				lineno++

			} else if (Uni.isWhiteSpace(chr)) {
				// nothing

			} else if (chr === '"' || (chr === '\'' && !legacy)) {
				return parseString(chr)

			} else if (chr === '{') {
				return parseObject()

			} else if (chr === '[') {
				return parseArray()

			} else if (chr === '-'
			       ||  chr === '.'
			       ||  isDecDigit(chr)
			           //           + number       Infinity          NaN
			       ||  (!legacy && (chr === '+' || chr === 'I' || chr === 'N'))
			) {
				return parseNumber()

			} else if (chr === 'n' && !identAllowed) {
				parseKeyword('null')
				return null

			} else if (chr === 't' && !identAllowed) {
				parseKeyword('true')
				return true

			} else if (chr === 'f' && !identAllowed) {
				parseKeyword('false')
				return false

			} else if (chr === '/'
			       && !legacy
			       && (input[position] === '/' || input[position] === '*')
			) {
				skipComment(input[position++] === '*')

			} else if (!legacy
			       &&  identAllowed
			       &&  Uni.isIdentifierStart(chr) || (chr === '\\' && input[position === 'u'])) {
				// unicode char or a unicode sequence
				var rollback = position - 1
				var result = parseIdentifier()

				if (result === undefined) {
					position = rollback
					return
				} else {
					return result
				}

			} else {
				position--
				return
			}
		}
	}

	function skipComment(multi) {
		while (position < length) {
			var chr = input[position++]

			if (Uni.isLineTerminator(chr)) {
				// account for <cr><lf>
				if (chr === '\r' && input[position] === '\n') position++
				linestart = position
				lineno++

				// LineTerminator is an end of singleline comment
				if (!multi) return

			} else if (chr === '*' && multi) {
				// end of multiline comment
				if (input[position] === '/') {
					position++
					return
				}

			} else {
				// nothing
			}
		}

		if (multi) {
			fail('Unclosed multiline comment')
		}
	}

	function parseKeyword(keyword) {
		// keyword[0] is not checked because it should've checked earlier
		var len = keyword.length
		for (var i=1; i<len; i++) {
			if (position >= length) fail()
			if (keyword[i] != input[position]) fail()
			position++
		}
	}

	function parseObject() {
		var result = {}

		while (position < length) {
			var item1 = parseGeneric(!legacy)

			var whitespace = parseGeneric()
			if (whitespace !== undefined) fail('Unexpected literal: ' + JSON.stringify(whitespace))

			var chr = input[position++]

			if (chr === '}' && item1 === undefined) {
				return result

			} else if (chr === ':' && item1 !== undefined) {
				var item2 = parseGeneric()

				if (item2 === undefined) fail('No value found for key ' + item1)
				if (typeof(item1) !== 'string') {
					if (legacy && typeof(item1) !== 'number') {
						fail('Wrong key type: ' + item1)
					}
				}

				Object.defineProperty(result, item1, {
					value: item2,
					enumerable: true,
					configurable: true,
					writable: true,
				})

				var whitespace = parseGeneric()
				if (whitespace !== undefined) fail('Unexpected literal: ' + whitespace)

				var chr = input[position++]
				if (chr === ',') {
					continue

				} else if (chr === '}') {
					return result

				} else {
					fail()
				}

			} else {
				fail()
			}
		}

		fail()
	}

	function parseArray() {
		var result = []

		while (position < length) {
			var item = parseGeneric()

			var whitespace = parseGeneric()
			if (whitespace !== undefined) fail('Unexpected literal: ' + whitespace)

			var chr = input[position++]

			if (item !== undefined) {
				result.push(item)
			}

			if (chr === ',') {
				if (item === undefined) {
					fail('Elisions are not supported')
				}

			} else if (chr === ']') {
				return result

			} else {
				fail()
			}
		}
	}

	function parseNumber() {
		// rewind because we don't know first char
		position--

		var start = position
		  , chr = input[position++]
		  , t

		var to_num = function() {
			var result = Number(input.substr(start, position - start))
			if (Number.isNaN(result)) {
				fail('Bad numeric literal')
			} else {
				return result
			}
		}

		// ex: -5982475.249875e+29384
		//     ^ skipping this
		if (chr === '-' || (chr === '+' && !legacy)) chr = input[position++]

		if (chr === 'N' && !legacy) {
			parseKeyword('NaN')
			return NaN
		}

		if (chr === 'I' && !legacy) {
			parseKeyword('Infinity')

			// returning +inf or -inf
			return to_num()
		}

		if (chr >= '1' && chr <= '9') {
			// ex: -5982475.249875e+29384
			//        ^^^ skipping these
			while (position < length && isDecDigit(input[position])) position++
			chr = input[position++]
		}

		// special case for leading zero: 0.123456
		if (chr === '0') {
			chr = input[position++]

			if (!legacy && (chr === 'x' || chr === 'X')) {
				while (position < length && isHexDigit(input[position])) position++

				// signed hex gotcha
				if (input[start] === '-') {
					start++
					return -to_num()

				} else if (input[start] === '+') {
					start++
					return to_num()

				} else {
					return to_num()
				}
			}
		}

		if (chr === '.') {
			// ex: -5982475.249875e+29384
			//                ^^^ skipping these
			while (position < length && isDecDigit(input[position])) position++
			chr = input[position++]
		}

		if (chr === 'e' || chr === 'E') {
			chr = input[position++]
			if (chr === '-' || chr === '+') position++
			// ex: -5982475.249875e+29384
			//                       ^^^ skipping these
			while (position < length && isDecDigit(input[position])) position++
			chr = input[position++]
		}

		// we have char in the buffer, so count for it
		position--
		return to_num()
	}

	function parseIdentifier() {
		// rewind because we don't know first char
		position--

		var result = ''

		while (position < length) {
			var chr = input[position++]

			if (chr === '\\'
			&&  input[position] === 'u'
			&&  isHexDigit(input[position+1])
			&&  isHexDigit(input[position+2])
			&&  isHexDigit(input[position+3])
			&&  isHexDigit(input[position+4])
			) {
				// UnicodeEscapeSequence
				chr = String.fromCharCode(parseInt(input.substr(position+1, 4), 16))
				position += 5
			}

			if (result.length) {
				// identifier started
				if (Uni.isIdentifierPart(chr)) {
					result += chr
				} else {
					position--
					return result
				}

			} else {
				if (Uni.isIdentifierStart(chr)) {
					result += chr
				} else {
					return undefined
				}
			}
		}

		fail()
	}

	function parseString(endChar) {
		// 7.8.4 of ES262 spec
		var result = ''

		while (position < length) {
			var chr = input[position++]

			if (chr === endChar) {
				return result

			} else if (chr === '\\') {
				if (position >= length) fail()
				chr = input[position++]

				if (unescapeMap[chr]) {
					result += unescapeMap[chr]

				} else if (Uni.isLineTerminator(chr)) {
					// line continuation, do nothing

					// cr+lf
					if (chr === '\r' && input[position] === '\n') position++

				} else if (chr === 'u' || chr === 'x') {
					// unicode/character escape sequence
					var off = chr === 'u' ? 4 : 2

					// validation for \uXXXX
					for (var i=0; i<off; i++) {
						if (position >= length) fail()
						if (!isHexDigit(input[position])) fail()
						position++
					}

					result += String.fromCharCode(parseInt(input.substr(position-off, off), 16))
				} else if (isDecDigit(chr)) {
					if (!isDecDigit(input[position])) {
						// \0 is allowed still
						result += '\0'
					} else {
						fail('Octal literals are not supported')
					}

				} else {
					// \X -> x
					result += chr
				}

			} else if (Uni.isLineTerminator(chr)) {
				fail()

			} else {
				// SourceCharacter but not one of " or \ or LineTerminator
				result += chr
			}
		}

		fail()
	}

	var result = parseGeneric()
	if (result !== undefined) {
		var result2 = parseGeneric()

		if (result2 === undefined && position >= length) {
			return result
		} else {
			fail()
		}

	} else {
		fail()
	}
}

module.exports.parse = parse

