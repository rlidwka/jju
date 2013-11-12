JSON5-utils - JSON/JSON5 parser and serializer for JavaScript.

## Installation

```
npm install json5-utils 
```

## Usage

```javascript
var JSON5 = require('json5-utils')
```

### JSON5.parse() function

```javascript
/*
 * Main syntax:
 *
 * `text` - text to parse, type: String
 * `options` - parser options, type: Object
 */
JSON5.parse(text[, options])

// compatibility syntax
JSON5.parse(text[, reviver])
```

Options:

 - duplicate\_keys - what to do with duplicate keys (String, default="throw")
   - "ignore" - ignore duplicate keys, including inherited ones
   - "throw" - throw SyntaxError in case of duplicate keys, including inherited ones
   - "replace" - replace duplicate keys, this is the default JSON.parse behaviour, unsafe
   
```javascript
// 'ignore' will cause duplicated keys to be ignored:
parse('{q: 1, q: 2}', {duplicate_keys: 'ignore'}) == {q: 1}
parse('{hasOwnProperty: 1}', {duplicate_keys: 'ignore'}) == {}
parse('{hasOwnProperty: 1, x: 2}', {duplicate_keys: 'ignore'}).hasOwnProperty('x') == true

// 'throw' will cause SyntaxError in these cases:
parse('{q: 1, q: 2}', {duplicate_keys: 'throw'}) == SyntaxError
parse('{hasOwnProperty: 1}', {duplicate_keys: 'throw'}) == SyntaxError

// 'replace' will replace duplicated keys with new ones:
parse('{q: 1, q: 2}', {duplicate_keys: 'throw'}) == {q: 2}
parse('{hasOwnProperty: 1}', {duplicate_keys: 'throw'}) == {hasOwnProperty: 1}
parse('{hasOwnProperty: 1, x: 2}', {duplicate_keys: 'ignore'}).hasOwnProperty('x') == TypeError
```


 - null\_prototype - create object as Object.create(null) instead of '{}' (Boolean)
 
   if `duplicate_keys != 'replace'`, default is **false**
   
   if `duplicate_keys == 'replace'`, default is **true**
   
   It is usually unsafe and not recommended to change this option to false in the last case.
  
 - reviver - reviver function - Function
 
   This function should follow JSON specification

### JSON5.stringify() function

```javascript
/*
 * Main syntax:
 *
 * `value` - value to serialize, type: *
 * `options` - serializer options, type: Object
 */
JSON5.stringify(value[, options])

// compatibility syntax
JSON5.stringify(value[, replacer [, indent])
```

Options:

 - ascii - output ascii only (Boolean, default=false)
   If this option is enabled, output will not have any characters except of 0x20-0x7f.
 
 - indent - indentation (String, Number or Boolean, default='\t')
   This option follows JSON specification.
 
 - quote - enquoting char (String, "'" or '"', default="'")
 - quote\_keys - whether keys quoting in objects is required or not (String, default=false)
   If you want `{"q": 1}` instead of `{q: 1}`, set it to true.
   
 - replacer - replacer function or array (Function or Array)
   This option follows JSON specification.

 - no\_trailing\_comma = don't output trailing comma (Boolean, default=false)
   If this option is set, arrays like this `[1,2,3,]` will never be generated. Otherwise they may be generated for pretty printing.
   
 - mode - operation mode, set it to 'json' if you want correct json in the output (String)
 
   Currently it's either 'json' or something else. If it is 'json', following options are implied:
   
   - options.quote = '"'
   - options.no\_trailing\_comma = true
   - options.quote\_keys = true
   - '\x' literals are not used

## Advantages over existing JSON libraries

In a few cases it makes sense to use this module instead of built-in JSON methods.

Parser:
 - better error reporting with source code and line numbers

In case of syntax error, JSON.parse does not return any good information to the user. This module does:

```
$ node -e 'require("json5-utils").parse("[1,1,1,1,invalid]")'

SyntaxError: Unexpected token 'i' at 0:9
[1,1,1,1,invalid]
         ^
```

This module is about 5 times slower, so if user experience matters to you more than performance, use this module. If you're working with a lot of machine-generated data, use JSON.parse instead.

Stringifier:
 - util.inspect-like pretty printing

This module behaves more smart when dealing with object and arrays, and does not always print newlines in them:

```
$ node -e 'console.log(require("./").stringify([[,,,],,,[,,,,]], {mode:"json"}))'
[
        [null, null, null],
        null,
        null,
        [null, null, null, null]
]
```

JSON.stringify will split this into 15 lines, and it's hard to read.

Yet again, this feature comes with a performance hit, so if user experience matters to you more than performance, use this module. If your JSON will be consumed by machines, use JSON.stringify instead.

As a rule of thumb, if you use "space" argument to indent your JSON, you'd better use this module instead.

## JSON5 syntax

I support slighly modified version of JSON5, see https://groups.google.com/forum/#!topic/json5/3DjClVYI6Wg

I started from ES5 specification and added a set of additional restrictions on top of ES5 spec. So I'd expect my implementation to be much closer to javascript. It's no longer an extension of json, but a reduction of ecmascript, which was my original intent.

This JSON5 version is a subset of ES5 language, specification is here:

http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf

This is a language that defines data structures only, so following notes/restrictions are applied:

- Literals (NullLiteral, BooleanLiteral, NumericLiteral, StringLiteral) are allowed.
- Compatibility syntax is not supported, which means octal literals are forbidden.
- ArrayLiterals and allowed, but instead of AssignmentExpressions you can only use other allowed Literals, ArrayLiterals and ObjectLiterals. Elisions are currently not supported.
- ObjectLiterals and allowed, but instead of AssignmentExpressions you can only use other allowed Literals, ArrayLiterals and ObjectLiterals. Setters and getters are forbidden.
- All other primary expressions ("this", Identifier, Expression) are forbidden.
- Two unary expressions ('-' and '+') allowed before NumericLiterals.
- Any data that has a number type can be represented, including +0, -0, +Infinity, -Infinity and NaN.
- "undefined" is forbidden, use null instead if applicable.
- Comments and whitespace are defined according to spec.

Main authority here is ES5 spec, so strict backward JSON compatibility is not guaranteed.


If you're unsure whether a behaviour of this library is a bug or not, you can run this test:

```javascript
JSON5.parse(String(something))
```

Should always be equal to:

```javascript
eval('(function(){"use strict"\nreturn ('+String(something)+'\n)\n})()')
```

If `something` meets all rules above. Parens and newlines in the example above are carefully placed so comments and another newlines will work properly, so don't look so impressed about that.


## Weirdness of JSON5

These are the parts that I don't particulary like, but see no good way to fix:

 - no elisions, `[,,,] -> [null,null,null]`
 - `[Object], [Circular]` aren't parsed
 - no way of nicely representing multiline strings
 - unicode property names are way to hard to implement
 - Date and other custom objects
 - incompatible with YAML (at least comments)

## Unicode support

This version fully support unicode. But if you're writing JSON5 implementation and don't want to support it, you should follow these guidelines:

```javascript
// 27 whitespace characters (unicode defines 26 characters, and ES5 spec also adds \uFEFF as a whitespace)
var whitespace = /[\u0009-\u000D\u0020\u0085\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/

// 4 line terminators
var lineterminator = /[\u000A\u000D\u2028\u2029]/
```

All json5 libraries MUST support 4 line terminator characters and 27 whitespace characters described above. Some libraries MAY choose not to include support for other unicode characters and apply following restrictions:

Parsers that do not fully support unicode SHOULD treat all unknown characters starting with \x80 as unicode\_letter except for line terminators and whitespace characters. This way all valid json5 objects will be parsed correctly, but some invalid json5 objects will be parsed as well.

Serializers that do not fully support unicode SHOULD treat all unknown characters starting with \x80 as control characters, and quote property names if they happen to be in there. This way all data will be serialized correctly.


