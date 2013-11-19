
var assert = require('assert')
var create = require('../lib/document').Document

var str = '{ x\r\n:\n1, y: {"..z.": 123, t: null, s:"123", a:[ 1,2,{x:3},] }}\n'
var d = create(str)
assert.equal(d + '', str)
assert.deepEqual(d.get(''), {x:1,y:{'..z.':123,t:null,s:'123',a:[1,2,{x:3}]}})
assert.deepEqual(d.get('x'), 1)
assert.deepEqual(d.get('x.x'), undefined)
assert.deepEqual(d.get('x.x.x.x'), undefined)
assert.strictEqual(d.get('y.x'), undefined)
assert.deepEqual(d.get('y.s'), '123')
assert.strictEqual(d.get('y.t'), null)
assert.strictEqual(d.get('y.t.x'), undefined)
assert.equal(d.has(''), true)
assert.equal(d.has('x'), true)
assert.equal(d.has('x.x'), false)
assert.equal(d.has('x.x.x.x'), false)
assert.equal(d.has('y.x'), false)
assert.equal(d.has('y'), true)
assert.equal(d.has('y.s'), true)
assert.equal(d.has('y.t'), true)
assert.equal(d.has('a'), false)

// arrays
assert.deepEqual(d.get('y.a'), [1,2,{x:3}])
assert.deepEqual(d.get('y.a.0'), 1)
assert.deepEqual(d.get('y.a.2.x'), 3)
assert.deepEqual(d.get('y.a.10'), undefined)
assert.deepEqual(d.has('y.a.0'), true)
assert.deepEqual(d.has('y.a.10'), false)
assert.deepEqual(d.get('y.a.2'), {x:3})

// controversial
assert.strictEqual(d.get('y.s.0'), undefined)
assert.equal(d.has('y.s.0'), false)

// paths
assert.deepEqual(d.get([]), {x:1,y:{'..z.':123,t:null,s:'123',a:[1,2,{x:3}]}})
assert.strictEqual(d.has([]), true)
assert.strictEqual(d.get(['y','..z.']), 123)
assert.strictEqual(d.has(['y','..z.']), true)
assert.deepEqual(d.get(['y','a',2,'x']), 3)

/*assert.equal(create('"test"').get(''), 'test')
assert.equal(create('"test"').get([]), 'test')
assert.equal(create('"test"').get(false), 'test')
assert.equal(create(undefined).get(''), undefined)

//assert.equal(create('"test"').set('', 'foo').toString(), '"foo"')
*/
