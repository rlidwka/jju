var assert = require('assert')
var parse = require('../').parse

function addTest(arg, row, col) {
	var fn = function() {
		try {
			parse(arg)
		} catch(err) {
			if (row !== undefined) assert.equal(err.row, row, 'wrong row: ' + err.row)
			if (col !== undefined) assert.equal(err.column, col, 'wrong column: ' + err.column)
			return
		}
		throw new Error("no error")
	}

	if (typeof(describe) === 'function') {
		it('test_errors: ' + JSON.stringify(arg), fn)
	} else {
		fn()
	}
}

// semicolon will be unexpected, so it indicates an error position
addTest(';', 0, 0)
addTest('\n\n\n;', 3, 0)
addTest('\r\n;', 1, 0)
addTest('\n\r;', 2, 0)
addTest('\n\u2028;', 2, 0)
addTest('\n\u2029;', 2, 0)
addTest('[\n1\n,\n;', 3, 0)
addTest('{\n;', 1, 0)
addTest('{\n1\n:\n;', 3, 0)

// line continuations
addTest('["\\\n",\n;', 2, 0)
addTest('["\\\r\n",\n;', 2, 0)
addTest('["\\\u2028",\n;', 2, 0)
addTest('["\\\u2029",\n;', 2, 0)

