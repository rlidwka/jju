
var assert = require('assert')
var parse = require('./parse').parse

function addTest(arg) {
	console.log('testing: ', arg)
	try {
		var x = parse(arg)
	} catch(err) {
		x = 'fail'
	}
	try {
		var z = eval('('+arg+')')
	} catch(err) {
		z = 'fail'
	}
	assert.deepEqual(x, z)
}

addTest('"\\uaaaa\\u0000\\uFFFF\\uFaAb"')
addTest(' "\\xaa\\x00\xFF\xFa\0\0"  ')
addTest('"\\\'\\"\\b\\f\\t\\n\\r\\v"')
addTest('"\\q\\w\\e\\r\\t\\y\\\\i\\o\\p\\[\\/\\\\"')
addTest('"\\\n\\\r\n\\\n"')
addTest('\'\\\n\\\r\n\\\n\'')
addTest('  null')
addTest('true  ')
addTest('false')
addTest(' Infinity ')
addTest('+Infinity')
addTest('[]')
addTest('[ 0xA2, 0X024324AaBf]')
addTest('-0x12')
addTest('  [1,2,3,4,5]')
addTest('[1,2,3,4,5,]  ')
addTest('[1e-13]')
addTest('[null, true, false]')
addTest('  [1,2,"3,4,",5,]')
addTest('[ 1,\n2,"3,4,"  \r\n,\n5,]')
addTest('[  1  ,  2  ,  3  ,  4  ,  5  ,  ]')
addTest('{}  ')
addTest('{"2":1,"3":null,}')
addTest('{ "2 " : 1 , "3":null  , }')
addTest('{ \"2\"  : 25e245 ,  \"3\": 23 }')
addTest('{"2":1,"3":nul,}')
addTest('{:1,"3":nul,}')
addTest('{"3":1,"3":,}')

for (var i=0; i<100; i++) {
	var str = '-01.e'.split('')

	var rnd = [1,2,3,4,5].map(function(x) {
		x = ~~(Math.random()*str.length)
		return str[x]
	}).join('')	

	try {
		var x = parse(rnd)
	} catch(err) {
		x = 'fail'
	}
	try {
		var y = JSON.parse(rnd)
	} catch(err) {
		y = 'fail'
	}
	try {
		var z = eval(rnd)
	} catch(err) {
		z = 'fail'
	}
	//console.log(rnd, x, y, z)
	if (x !== y && x !== z) throw 'ERROR'
}

