
var assert = require('assert')
var parse = require('./parse').parse

function addTest(arg) {
	console.log('= test', arg)
	assert.deepEqual(parse(arg), eval('('+arg+')'))
}

addTest('"\\uaaaa\\u0000\\uFFFF\\uFaAb"')
addTest(' "\\xaa\\x00\xFF\xFa\0\0"  ')
addTest('"\\\'\\"\\b\\f\\t\\n\\r\\v"')
addTest('"\\q\\w\\e\\r\\t\\y\\\\i\\o\\p\\[\\/\\\\"')
addTest('"\\\n\\\r\n\\\n"')
addTest('  null')
addTest('true  ')
addTest('false')
addTest('[]')
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

