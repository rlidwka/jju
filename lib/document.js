/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/json5-utils
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

var assert = require('assert')
  , parse = require('./parse').parse
  , stringify = require('./stringify').stringify

function isObject(x) {
	return typeof(x) === 'object' && x !== null
}

function value_to_tokenlist(value, stack, is_key) {
	var stringified = stringify(value, {
		_stringify_key: !!is_key,
	})

	if (is_key) {
		return [ { raw: stringified, type: 'literal', stack: stack, value: value } ]
	}
	
	var tokens = []
	var data = parse(stringified, {
		_tokenize: function(smth) {
			if (stack) smth.stack.unshift.apply(smth.stack, stack)
			tokens.push(smth)
		},
	})
	return tokens
}

// '1.2.3' -> ['1','2','3']
function arg_to_path(path) {
	// array indexes
	if (typeof(path) === 'number') path = String(path)

	if (path === '') path = []
	if (typeof(path) === 'string') path = path.split('.')

	if (!Array.isArray(path)) throw new Error('Invalid path type, string or array expected')
	return path
}

// returns new [begin, end] or false if not found
//
//          {x:3, xxx: 111, y: [111,  {q: 1, e: 2}  ,333]  }
// f('y',0) returns this       B^^^^^^^^^^^^^^^^^^^^^^^^E
// then f('1',1) would reduce it to   B^^^^^^^^^^E
function find_element_in_tokenlist(element, lvl, tokens, begin, end) {
	while(tokens[begin].stack[lvl] != element) {
		if (begin++ >= end) return false
	}
	while(tokens[end].stack[lvl] != element) {
		if (end-- < begin) return false
	}
	return [begin, end]
}

// skips whitespace from begin and end
// returns [begin, end] or throws if not found
//
//     /*...*/    {x: 3, /* */ y: 4}  /*...*/
// returns this   ^^^^^^^^^^^^^^^^^^
function find_something_in_tokenlist(tokens, begin, end) {
	while(tokens[begin].type === 'whitespace' || tokens[begin].type === 'comment') {
		if (begin++ >= end) return false
	}
	while(tokens[end].type === 'whitespace' || tokens[end].type === 'comment') {
		if (end-- < begin) return false
	}
	return [begin, end]
}

function Document(text, options) {
	if (!(this instanceof Document)) return new Document(text)

	if (options == null) options = {}
	//options._structure = true
	var tokens = this._tokens = []
	options._tokenize = function(smth) {
		tokens.push(smth)
	}
	this._data = parse(text, options)
}

// return true if it's a proper object
//        throw otherwise
function check_if_can_be_placed(key, object) {
	//if (object == null) return false
	if (!isObject(object)) {
		throw new Error("You can't set key '" + key + "' of an non-object")
	}
	if (Array.isArray(object)) {
		// array, check boundary
		if (String(key).match(/^\d+$/)) {
			// we allow to set element at the end of the array, but not beyond that
			// so, it's not '<=' here
			if (object.length < Number(String(key))) {
				throw new Error("You can't set key '" + key + "', out of bounds")
			} else {
				return true
			}
		} else {
			throw new Error("You can't set key '" + key + "' of an array")
		}
	} else {
		// object
		return true
	}
}

// usage: document.set('path.to.something', 'value')
//    or: document.set(['path','to','something'], 'value')
Document.prototype.set = function(path, value) {
	path = arg_to_path(path)

	// updating this._data and check for errors
	if (path.length === 0) {
		if (value === undefined) throw new Error("can't remove root document")
		this._data = value
		var new_key = false

	} else {
		var data = this._data

		for (var i=0; i<path.length-1; i++) {
			check_if_can_be_placed(path[i], data)
			data = data[path[i]]
		}
		if (i === path.length-1) {
			check_if_can_be_placed(path[i], data)
		}

		var new_key = !(path[i] in data)

		if (value === undefined) {
			delete data[path[i]]
		} else {
			data[path[i]] = value
		}
	}

	var position = find_something_in_tokenlist(this._tokens, 0, this._tokens.length - 1)
	for (var i=0; i<path.length-1; i++) {
		position = find_element_in_tokenlist(path[i], i, this._tokens, position[0], position[1])
		if (position == false) throw new Error('internal error, please report this')
	}
	// assume that i == path.length-1 here

	var newtokens = value_to_tokenlist(value, path)

	if (path.length === 0) {
		// all good

	} else if (!new_key) {
		// replace old value with a new one
		position = find_element_in_tokenlist(path[i], i, this._tokens, position[0], position[1])

	} else {
		// insert new key, that's tricky
		var path_1 = path.slice(0, i-1)

		if (!Array.isArray(data)) {
			newtokens.unshift({raw: ':', type: 'separator', stack: path_1})
			newtokens.unshift.apply(newtokens, value_to_tokenlist(path[path.length-1], path_1, true))
		}

		//	find a last separator after which we're inserting it
		var pos2 = find_something_in_tokenlist(this._tokens, position[0] + 1, position[1] - 1)
		if (pos2 !== false) {
			if (this._tokens[pos2[1]].type === 'separator') {
				// previous token is either , or [ or {

				if (this._tokens[pos2[1]].raw === ',') {
					// restore ending comma
					newtokens.push({raw: ',', type: 'separator', stack: path_1})
				}
			} else {
				// previous token isn't a separator, so need to insert one
				newtokens.unshift({raw: ',', type: 'separator', stack: path_1})
			}
		}

		assert.equal(this._tokens[position[1]].type, 'separator')
		position[0] = position[1]
		position[1]--
	}

	newtokens.unshift(position[1] - position[0] + 1)
	newtokens.unshift(position[0])
	this._tokens.splice.apply(this._tokens, newtokens)

	return this
}

// convenience method
Document.prototype.unset = function(path) {
	return this.set(path, undefined)
}

Document.prototype.get = function(path) {
	path = arg_to_path(path)

	var data = this._data
	for (var i=0; i<path.length; i++) {
		if (!isObject(data)) return undefined
		data = data[path[i]]
	}
	return data
}

Document.prototype.has = function(path) {
	path = arg_to_path(path)

	var data = this._data
	for (var i=0; i<path.length; i++) {
		if (!isObject(data)) return false
		data = data[path[i]]
	}
	return data !== undefined
}

// compare old object and new one, and change differences only
Document.prototype.update = function(value) {
	var self = this
	change([], self._data, value)
	return self

	function change(path, old_data, new_data) {
		if (!isObject(new_data) || !isObject(old_data)) {
			// if source or dest is primitive, just replace
			self.set(path, new_data)

		} else if (Array.isArray(new_data) != Array.isArray(old_data)) {
			// old data is an array XOR new data is an array, replace as well
			self.set(path, new_data)

		} else if (Array.isArray(new_data)) {
			// both values are arrays
			var max_len = Math.max(new_data.length, old_data.length)

			// update all values
			for (var i=0; i<max_len; i++) {
				path.push(String(i))
				change(path, old_data[i], new_data[i])
				path.pop()
			}

		} else {
			// both values are objects
			for (var i in new_data) {
				path.push(String(i))
				change(path, old_data[i], new_data[i])
				path.pop()
			}

			for (var i in old_data) {
				if (i in new_data) continue
				path.push(String(i))
				change(path, old_data[i], new_data[i])
				path.pop()
			}
		}
	}
}

Document.prototype.toString = function() {
	return this._tokens.map(function(x) {
		return x.raw
	}).join('')
}

module.exports.Document = Document

