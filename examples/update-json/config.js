#!/usr/bin/env node

var fs = require('fs')
  , jju = require('../../')
  , dottie = require('dottie')

function showhelp() {
	console.log([
		'Usage:',
		' config.js <key> <value> - set config key to value',
		' config.js <key>         - retrieve config key',
		'',
		'Example:',
		' config.js set commands.www 12345',
		' config.js get commands.www',
		' config.js del commands.www',
	].join('\n'))
	process.exit(1)
}

if (process.argv.length <= 2) {
	showhelp()
}

var contents = fs.readFileSync('conf.json', 'utf8')
var json = jju.parse(contents, {mode: 'json'})

if (process.argv[2] === 'get') {
	console.log(dottie.get(json, process.argv[3]))

} else if (process.argv[2] === 'set' || process.argv[2] === 'del') {
	dottie.set(json, process.argv[3], process.argv[4])
	var newcontents = jju.update(contents, json, {mode: 'json'})
	console.log(newcontents)
	//fs.writeFileSync(newcontents, 'conf.json')

} else {
	showhelp()
}

