// http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf

function isHexDigit(x) {
	return (x >= '0' && x <= '9')
	    || (x >= 'A' && x <= 'F')
	    || (x >= 'a' && x <= 'f')
}

function isDecDigit(x) {
	return x >= '0' && x <= '9'
}

function isWhiteSpace(x) {
	// section 7.2, table 2
	return x === '\u0020'
	    || x === '\u00A0'
	    || x === '\uFEFF' // <-- this is not a Unicode WS, only a JS one
	    // + 9 B C below

	    // + whitespace characters from unicode 6.0.0
	    // http://www.unicode.org/versions/Unicode6.0.0/ch04.pdf
	    || (x >= '\u0009' && x <= '\u000D') // 9 A B C D
	    || x === '\u0085'
	    || x === '\u1680'
	    || x === '\u180E'
	    || (x >= '\u2000' && x <= '\u200A') // 0 1 2 3 4 5 6 7 8 9 A
	    || x === '\u2028'
	    || x === '\u2029'
	    || x === '\u202F'
	    || x === '\u205F'
	    || x === '\u3000'

	// should be total of 26+1 = 27 characters
}

function isLineTerminator(x) {
	// ok, here is the part when JSON is wrong
	// section 7.3, table 3
	return x === '\u000A'
	    || x === '\u000D'
	    || x === '\u2028'
	    || x === '\u2029'
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

function parse(input, options) {
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
		var error = new Error(msg + ' at ' + lineno + ':' + column)

		error.row = lineno
		error.column = column
		throw error
	}

	function parseGeneric() {
		var result
		//console.log('parse: ', input.substr(position, 40))

		while (position < length) {
			var chr = input[position++]

			if (isLineTerminator(chr)) {
				// account for <cr><lf>
				if (chr === '\r' && input[position] === '\n') position++
				linestart = 0
				lineno++

			} else if (isWhiteSpace(chr)) {
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

			} else if (chr === 'n') {
				parseKeyword('null')
				return null

			} else if (chr === 't') {
				parseKeyword('true')
				return true

			} else if (chr === 'f') {
				parseKeyword('false')
				return false

			} else {
				position--
				return
			}
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
			var item1 = parseGeneric()
				
			var whitespace = parseGeneric()
			if (whitespace !== undefined) fail('Unexpected literal: ' + whitespace)

			var chr = input[position++]

			if (chr === '}' && item1 === undefined) {
				return result

			} else if (chr === ':' && item1 !== undefined) {
				var item2 = parseGeneric()

				if (item2 === undefined) fail('No value found for key ' + item1)
				if (typeof(item1) !== 'string') {
					fail('Wrong key type: ' + item1)
				}

				result[item1] = item2

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

				// negative hex gotcha
				if (input[start] === '-') {
					start++
					return -to_num()
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

				} else if (isLineTerminator(chr)) {
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

			} else if (isLineTerminator(chr)) {
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

