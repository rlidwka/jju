#!/usr/bin/env node

var fs = require('fs')
  , jju = require('../../')

if (process.argv.length != 3) {
	console.log([
		'Usage: strip-comments.js <filename>'
	].join('\n'))
	process.exit(1)
}

var contents = fs.readFileSync(process.argv[2], 'utf8')
var tokens = jju.tokenize(contents)

var stripped = tokens.filter(function(t) {
	// filter out "comments" type of tokens
	// you can also strip newlines and separators the same way if you want
	return t.type !== 'comment'
}).map(function(t) {
	// extract contents from the token to join them together later
	return t.raw
}).join('')

console.log(stripped)

