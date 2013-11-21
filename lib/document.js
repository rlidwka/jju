/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/json5-utils
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

var parse = require('./parse').parse
var stringify = require('./stringify').stringify

function isObject(x) {
	return typeof(x) === 'object' && x !== null
}

function value_to_tokenlist(value, stack) {
	var stringified = stringify(value)
	var tokens = []
	var data = parse(stringified, {
		_tokenize: function(smth) {
			if (stack) smth.stack.unshift.apply(smth.stack, stack)
			tokens.push(smth)
		}
	})
	return tokens
}

function set_value_in_tokenlist(tokens, path, value) {
	var start = 0
	  , end = tokens.length
	  , old_start
	  , old_length = 0

	// finding starting position
	for (var i=start; i<end; i++) {
		if (path[0] == tokens[i].stack[0]) {
			old_start = i
			break
		}
	}
	
	if (old_start == null) old_start = end

	// finding end
	while(i<end) {
		if (path[0] != tokens[i].stack[0]) {
			old_length++
		} else {
			break
		}
		i++
	}

	// replace old value with a new one
	var newtokens = value_to_tokenlist(value)
	newtokens.unshift(old_length)
	newtokens.unshift(old_start)
	tokens.splice.apply(tokens, newtokens)
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

// [1,2,3], 'x' -> {1:{2:{3:x}}}
function prepend_path(path, value) {
	for (var i=path.length-1; i>=0; i--) {
		var h = {}
		h[path[i]] = value
		value = h
	}
	return value
}

// usage: document.set('path.to.something', 'value')
//    or: document.set(['path','to','something'], 'value')
Document.prototype.set = function(path, value) {
	if (!path) path = []
	if (typeof(path) === 'string') path = path.split('.')

	// updating root, special case
	if (path.length === 0) {
		this._data = value

		// replace tokens with new ones
		var newtokens = value_to_tokenlist(value)
		newtokens.unshift(this._tokens.length)
		newtokens.unshift(0)
		this._tokens.splice.apply(this._tokens, newtokens)

		return this
	}

	var data = this._data
	  , tokenpos = 0
	for (var i=0; i<path.length-1; i++) {
		check_if_can_be_placed(path[i], data)
		data = data[path[i]]

		while(this._tokens[tokenpos].stack[i] != path[i]) {
			if (++tokenpos >= this._tokens.length) {
				// weird situation, shouldn't happen
				throw new Error('internal error, please report this')
			}
		}
	}
	// assume that i == path.length-1 here
	
	check_if_can_be_placed(path[i], data)

	var newtokens = value_to_tokenlist(value, path)

	if (path[i] in data) {
		while(this._tokens[tokenpos].stack[i] != path[i]) {
			if (++tokenpos >= this._tokens.length) {
				// weird situation, shouldn't happen
				throw new Error('internal error, please report this')
			}
		}
		var start = tokenpos

		while(this._tokens[tokenpos].stack[i] == path[i]) {
			if (++tokenpos >= this._tokens.length) {
				// weird situation, shouldn't happen
				throw new Error('internal error, please report this')
			}
		}
		var length = tokenpos-start
	} else {
		newtokens.unshift({raw: ',', type: 'separator', stack: path.slice(0, i-1)})

		var lastsep
		while(tokenpos < this._tokens.length) {
			if (this._tokens[tokenpos].stack[i-1] != path[i-1]) {
				break
			}
			if (this._tokens[tokenpos].type === 'separator') lastsep = tokenpos
			tokenpos++
		}
		var start = lastsep
		var length = 0
	}

	data[path[i]] = value
	newtokens.unshift(length)
	newtokens.unshift(start)
	this._tokens.splice.apply(this._tokens, newtokens)

	return this
}

Document.prototype.get = function(path) {
	if (!path) path = []
	if (typeof(path) === 'string') path = path.split('.')

	var data = this._data
	for (var i=0; i<path.length; i++) {
		if (!isObject(data)) return undefined
		data = data[path[i]]
	}
	return data
}

Document.prototype.has = function(path) {
	if (!path) path = []
	if (typeof(path) === 'string') path = path.split('.')

	var data = this._data
	for (var i=0; i<path.length; i++) {
		if (!isObject(data)) return false
		data = data[path[i]]
	}
	return data !== undefined
}

Document.prototype.toString = function() {
	return this._tokens.map(function(x) {
		return x.raw
	}).join('')
}

module.exports.Document = Document

