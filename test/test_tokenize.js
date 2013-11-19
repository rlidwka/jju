var assert = require('assert')
var parse = require('../').parse

function tokenize(arg) {
	var result = []
	parse(arg, {_tokenize: function(smth) {
		result.push(smth)
	}})
	assert.deepEqual(result.map(function(x){return x.raw}).join(''), arg)
	return result
}

assert.deepEqual(tokenize('123'), [ { raw: '123', value: 123, type: 'literal' }])

assert.deepEqual(tokenize(' /* zz */\r\n true /* zz */\n'), [ { raw: ' ', type: 'whitespace' },
  { raw: '/* zz */', type: 'comment' },
  { raw: '\r\n ', type: 'whitespace' },
  { raw: 'true', type: 'literal', value: true },
  { raw: ' ', type: 'whitespace' },
  { raw: '/* zz */', type: 'comment' },
  { raw: '\n', type: 'whitespace' } ])

assert.deepEqual(tokenize('{q:123,  w : /*zz*/ 345 } '), 
[ { raw: '{', type: 'separator' },
  { raw: 'q', type: 'literal', value: 'q' },
  { raw: ':', type: 'separator' },
  { raw: '123', type: 'literal', value: 123 },
  { raw: ',', type: 'separator' },
  { raw: '  ', type: 'whitespace' },
  { raw: 'w', type: 'literal', value: 'w' },
  { raw: ' ', type: 'whitespace' },
  { raw: ':', type: 'separator' },
  { raw: ' ', type: 'whitespace' },
  { raw: '/*zz*/', type: 'comment' },
  { raw: ' ', type: 'whitespace' },
  { raw: '345', type: 'literal', value: 345 },
  { raw: ' ', type: 'whitespace' },
  { raw: '}', type: 'separator' },
  { raw: ' ', type: 'whitespace' } ])

assert.deepEqual(tokenize('null /* */// xxx\n//xxx'),
[ { raw: 'null', type: 'literal', value: null },
  { raw: ' ', type: 'whitespace' },
  { raw: '/* */', type: 'comment' },
  { raw: '// xxx\n', type: 'comment' },
  { raw: '//xxx', type: 'comment' } ]) 

assert.deepEqual(tokenize('[1,2,[[],[1]],{},{1:2},{q:{q:{}}},]'),
[ { raw: '[', type: 'separator' },
  { raw: '1', type: 'literal', value: 1 },
  { raw: ',', type: 'separator' },
  { raw: '2', type: 'literal', value: 2 },
  { raw: ',', type: 'separator' },
  { raw: '[', type: 'separator' },
  { raw: '[', type: 'separator' },
  { raw: ']', type: 'separator' },
  { raw: ',', type: 'separator' },
  { raw: '[', type: 'separator' },
  { raw: '1', type: 'literal', value: 1 },
  { raw: ']', type: 'separator' },
  { raw: ']', type: 'separator' },
  { raw: ',', type: 'separator' },
  { raw: '{', type: 'separator' },
  { raw: '}', type: 'separator' },
  { raw: ',', type: 'separator' },
  { raw: '{', type: 'separator' },
  { raw: '1', type: 'literal', value: 1 },
  { raw: ':', type: 'separator' },
  { raw: '2', type: 'literal', value: 2 },
  { raw: '}', type: 'separator' },
  { raw: ',', type: 'separator' },
  { raw: '{', type: 'separator' },
  { raw: 'q', type: 'literal', value: 'q' },
  { raw: ':', type: 'separator' },
  { raw: '{', type: 'separator' },
  { raw: 'q', type: 'literal', value: 'q' },
  { raw: ':', type: 'separator' },
  { raw: '{', type: 'separator' },
  { raw: '}', type: 'separator' },
  { raw: '}', type: 'separator' },
  { raw: '}', type: 'separator' },
  { raw: ',', type: 'separator' },
  { raw: ']', type: 'separator' } ])

