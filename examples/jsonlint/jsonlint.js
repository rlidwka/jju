#!/usr/bin/env node

var fs = require('fs')
  , jju = require('../../')

if (process.argv.length != 3) {
	console.log([
		'Usage: jsonlint.js <filename>'
	].join('\n'))
	process.exit(1)
}

var contents = fs.readFileSync(process.argv[2], 'utf8')

try {
	jju.parse(contents, {mode: 'json'})
	console.log('Your JSON looks good!')
} catch(e) {
	console.log(e.message)
}

