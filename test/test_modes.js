var assert = require('assert')
var jju = require('..')

// plain json
assert.deepEqual(jju.parse('{ "c": 123 }', { legacy: true }),  { c: 123 })
assert.deepEqual(jju.parse('{ "c": 123 }', { mode: 'json' }),  { c: 123 })
assert.deepEqual(jju.parse('{ "c": 123 }', { mode: 'cjson' }), { c: 123 })
assert.deepEqual(jju.parse('{ "c": 123 }', { mode: 'json5' }), { c: 123 })

// cjson
assert.throws(function () {
  jju.parse('{ "c": /* foo */ 123 }', { legacy: true })
}, /No value found/)
assert.throws(function () {
  jju.parse('{ "c": /* foo */ 123 }', { mode: 'json' })
}, /No value found/)
assert.deepEqual(jju.parse('{ "c": /* foo */ 123 }', { mode: 'cjson' }), { c: 123 })
assert.deepEqual(jju.parse('{ "c": /* foo */ 123 }', { mode: 'json5' }), { c: 123 })

// json5
assert.throws(function () {
  jju.parse('{ "c": Infinity }', { legacy: true })
}, /No value found/)
assert.throws(function () {
  jju.parse('{ "c": Infinity }', { mode: 'json' })
}, /No value found/)
assert.throws(function () {
  jju.parse('{ "c": Infinity }', { mode: 'cjson' })
}, /No value found/)
assert.deepEqual(jju.parse('{ "c": Infinity }', { mode: 'json5' }), { c: Infinity })
