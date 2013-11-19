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

function Document(text, options) {
	if (!(this instanceof Document)) return new Document(text)

	if (options == null) options = {}
	//options._structure = true
	var tokens = this._tokens = []
	options._tokenize = function(smth) {
		tokens.push(smth)
	}
	this._data = parse(text, options)
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

