
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

## Options

parse(string, options):

stringify(object, options):
 - ascii - output ascii only (bool, default=false)
 - indent - indentation (string or number, default='\t')
 - quote - enquoting char (string, "'" or '"', default="'")

## Modes of operation

TODO: not yet working

- simple:
	no custom datatypes
	no .toJSON/.toJSON5
	for serializing simple json-compatible objects only (i.e. user-generated data)

- full
	custom datatypes
	.toJSON/.toJSON5 present (prototype only)
	for representing arbitrary data structures as close as possible

- json:
	no custom datatypes
	.toJSON present
	json compatible

## Weirdness of JSON5

 - no elisions, `[,,,] -> [null,null,null]`
 - `[Object], [Circular]` aren't parsed
 - no way of nicely representing multiline strings
 - unicode property names are way to hard to implement

## Unicode support

All json5 libraries MUST support 4 line terminator characters and 27 whitespace characters. Some libraries MAY choose not to include support for other unicode characters and apply following restrictions:

Parsers that do not fully support unicode SHOULD treat all unknown characters starting with \x80 as unicode\_letter except for line terminators and whitespace characters. This way all valid json5 objects will be parsed correctly, but some invalid json5 objects will be parsed as well.

Serializers that do not fully support unicode SHOULD treat all unknown characters starting with \x80 as control characters, and quote property names if they happen to be in there. This way all data will be serialized correctly.

