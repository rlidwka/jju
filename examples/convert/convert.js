#!/usr/bin/env node

var fs = require('fs')
  , jju = require('../../')

if (process.argv.length != 3) {
	console.log([
		'Usage: convert.js <filename>'
	].join('\n'))
	process.exit(1)
}

var contents = fs.readFileSync(process.argv[2], 'utf8')

var parsed = jju.parse(contents)

console.log(jju.stringify(parsed, {
	mode: 'json'
}))

