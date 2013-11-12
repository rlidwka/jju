/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/json5-utils
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

var parse = require('./parse').parse
var stringify = require('./stringify').stringify

function Document(text, options) {
	if (!(this instanceof Document)) return new Document(text)

	if (options == null) options = {}
	options._structure = true
	this._data = parse(text, options)
	if (this._data === undefined) this._data = {}
	this._commands = []
}

// usage: document.set('path.to.something', 'value')
//    or: document.set(['path','to','something'], 'value')
Document.prototype.set = function(path, value) {
	if (!path) path = []
	if (typeof(path) === 'string') path = path.split('.')
	this._commands.push(path, value)
	return this
}

Document.prototype.get = function(path) {
	if (!path) path = []
	if (typeof(path) === 'string') path = path.split('.')
	
	var data = this._data
	for (var i=0; i<path.length; i++) {
		if (data[path[i]] == null) return undefined
		data = data[path[i]]
	}
	return data.value
}

Document.prototype.has = function(path) {
	if (!path) path = []
	if (typeof(path) === 'string') path = path.split('.')

	var data = this._data
	for (var i=0; i<path.length; i++) {
		if (data[path[i]] == null) return false
		data = data[path[i]]
	}
	return true
}

Document.prototype.toString = function() {
	
}

module.exports.Document = Document

