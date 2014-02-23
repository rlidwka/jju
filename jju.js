(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":3}],2:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],3:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("/tmp/jju_demo/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":2,"/tmp/jju_demo/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":5,"inherits":4}],4:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(require,module,exports){

module.exports.__defineGetter__('parse', function() {
	return require('./lib/parse').parse
})

module.exports.__defineGetter__('stringify', function() {
	return require('./lib/stringify').stringify
})

module.exports.__defineGetter__('tokenize', function() {
	return require('./lib/parse').tokenize
})

module.exports.__defineGetter__('update', function() {
	return require('./lib/document').update
})

module.exports.__defineGetter__('analyze', function() {
	return require('./lib/analyze').analyze
})

module.exports.__defineGetter__('utils', function() {
	return require('./lib/utils')
})


},{"./lib/analyze":7,"./lib/document":8,"./lib/parse":9,"./lib/stringify":10,"./lib/utils":12}],7:[function(require,module,exports){
/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/jju
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

var assert = require('assert')
  , tokenize = require('./parse').tokenize

module.exports.analyze = function analyzeJSON(input, options) {
	if (options == null) options = {}

	if (!Array.isArray(input)) {
		input = tokenize(input, options)
	}

	var result = {
		has_whitespace: false,
		has_comments: false,
		has_newlines: false,
		indent: '',
		newline: '\n',
	}

	var stats = {
		indent: {},
		newline: {},
	}

	for (var i=0; i<input.length; i++) {
		if (input[i].type === 'newline') {
			if (input[i+1] && input[i+1].type === 'whitespace') {
				if (input[i+1].raw[0] === '\t') {
					// if first is tab, then indent is tab
					stats.indent['\t'] = (stats.indent['\t'] || 0) + 1
				}
				if (input[i+1].raw.match(/^\x20+$/)) {
					// if all are spaces, then indent is space
					// this can fail with mixed indent (4, 2 would display 3)
					var ws_len = input[i+1].raw.length
					var indent_len = input[i+1].stack.length + 1
					if (ws_len % indent_len === 0) {
						var t = Array(ws_len / indent_len + 1).join(' ')
						stats.indent[t] = (stats.indent[t] || 0) + 1
					}
				}
			}

			stats.newline[input[i].raw] = (stats.newline[input[i].raw] || 0) + 1
		}

		if (input[i].type === 'newline') {
			result.has_newlines = true
		}
		if (input[i].type === 'whitespace') {
			result.has_whitespace = true
		}
		if (input[i].type === 'comment') {
			result.has_comments = true
		}
	}

	for (var k in stats) {
		if (Object.keys(stats[k]).length) {
			result[k] = Object.keys(stats[k]).reduce(function(a, b) {
				return stats[k][a] > stats[k][b] ? a : b
			})
		}
	}

	return result
}


},{"./parse":9,"assert":1}],8:[function(require,module,exports){
/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/jju
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

var assert = require('assert')
  , tokenize = require('./parse').tokenize
  , stringify = require('./stringify').stringify
  , analyze = require('./analyze').analyze

function isObject(x) {
	return typeof(x) === 'object' && x !== null
}

function value_to_tokenlist(value, stack, options, is_key) {
	options._stringify_key = !!is_key

	if (options._splitMin == null) options._splitMin = 0
	if (options._splitMax == null) options._splitMax = 0

	var stringified = stringify(value, options)

	if (is_key) {
		return [ { raw: stringified, type: 'literal', stack: stack, value: value } ]
	}

	options._addstack = stack
	var result = tokenize(stringified, {
		_addstack: stack,
	})
	result.data = null
	options._addstack = null
	return result
}

// '1.2.3' -> ['1','2','3']
function arg_to_path(path) {
	// array indexes
	if (typeof(path) === 'number') path = String(path)

	if (path === '') path = []
	if (typeof(path) === 'string') path = path.split('.')

	if (!Array.isArray(path)) throw new Error('Invalid path type, string or array expected')
	return path
}

// returns new [begin, end] or false if not found
//
//          {x:3, xxx: 111, y: [111,  {q: 1, e: 2}  ,333]  }
// f('y',0) returns this       B^^^^^^^^^^^^^^^^^^^^^^^^E
// then f('1',1) would reduce it to   B^^^^^^^^^^E
function find_element_in_tokenlist(element, lvl, tokens, begin, end) {
	while(tokens[begin].stack[lvl] != element) {
		if (begin++ >= end) return false
	}
	while(tokens[end].stack[lvl] != element) {
		if (end-- < begin) return false
	}
	return [begin, end]
}

function is_whitespace(token_type) {
	return token_type === 'whitespace'
	    || token_type === 'newline'
	    || token_type === 'comment'
}

function find_first_non_ws_token(tokens, begin, end) {
	while(is_whitespace(tokens[begin].type)) {
		if (begin++ >= end) return false
	}
	return begin
}

function find_last_non_ws_token(tokens, begin, end) {
	while(is_whitespace(tokens[end].type)) {
		if (end-- < begin) return false
	}
	return end
}

/*
 * when appending a new element of an object/array, we are trying to
 * figure out the style used on the previous element
 *
 * return {prefix, sep1, sep2, suffix}
 *
 *      '    "key" :  "element"    \r\n'
 * prefix^^^^ sep1^ ^^sep2     ^^^^^^^^suffix
 *
 * begin - the beginning of the object/array
 * end - last token of the last element (value or comma usually)
 */
function detect_indent_style(tokens, is_array, begin, end, stack) {
	var result = {
		sep1: [],
		sep2: [],
		suffix: [],
		prefix: [],
		newline: [],
	}

	if (tokens[end].type === 'separator' && tokens[end].stack.length !== stack.length+1 && tokens[end].raw !== ',') {
		// either a beginning of the array (no last element) or other weird situation
		//
		// just return defaults
		return result
	}

	var level = tokens[end+1].stack.length

	//                              ' "key"  : "value"  ,'
	// skipping last separator, we're now here        ^^
	if (tokens[end].type === 'separator')
		end = find_last_non_ws_token(tokens, begin, end - 1)
	if (end === false) return result

	//                              ' "key"  : "value"  ,'
	// skipping value                          ^^^^^^^
	while(tokens[end].stack.length > level) end--

	if (!is_array) {
		while(is_whitespace(tokens[end].type)) {
			if (end < begin) return result
			if (tokens[end].type === 'whitespace') {
				result.sep2.unshift(tokens[end])
			} else {
				// newline, comment or other unrecognized codestyle
				return result
			}
			end--
		}

		//                              ' "key"  : "value"  ,'
		// skipping separator                    ^
		assert.equal(tokens[end].type, 'separator')
		assert.equal(tokens[end].raw, ':')
		while(is_whitespace(tokens[--end].type)) {
			if (end < begin) return result
			if (tokens[end].type === 'whitespace') {
				result.sep1.unshift(tokens[end])
			} else {
				// newline, comment or other unrecognized codestyle
				return result
			}
		}

		assert.equal(tokens[end].type, 'literal')
		end--
	}

	//                              ' "key"  : "value"  ,'
	// skipping key                   ^^^^^
	while(is_whitespace(tokens[end].type)) {
		if (end < begin) return result
		if (tokens[end].type === 'whitespace') {
			result.prefix.unshift(tokens[end])
		} else if (tokens[end].type === 'newline') {
			result.newline.unshift(tokens[end])
			return result
		} else {
			// comment or other unrecognized codestyle
			return result
		}
		end--
	}

	return result
}

function Document(text, options) {
	if (!(this instanceof Document)) return new Document(text, options)

	if (options == null) options = {}
	//options._structure = true
	var tokens = this._tokens = tokenize(text, options)
	this._data = tokens.data
	tokens.data = null
	this._options = options

	var stats = analyze(text, options)
	if (options.indent == null) {
		options.indent = stats.indent
	}
}

// return true if it's a proper object
//        throw otherwise
function check_if_can_be_placed(key, object, is_unset) {
	//if (object == null) return false
	function error(add) {
		return new Error("You can't " + (is_unset ? 'unset' : 'set') + " key '" + key + "'" + add)
	}

	if (!isObject(object)) {
		throw error(" of an non-object")
	}
	if (Array.isArray(object)) {
		// array, check boundary
		if (String(key).match(/^\d+$/)) {
			key = Number(String(key))
			if (object.length < key || (is_unset && object.length === key)) {
				throw error(", out of bounds")
			} else if (is_unset && object.length !== key+1) {
				throw error(" in the middle of an array")
			} else {
				return true
			}
		} else {
			throw error(" of an array")
		}
	} else {
		// object
		return true
	}
}

// usage: document.set('path.to.something', 'value')
//    or: document.set(['path','to','something'], 'value')
Document.prototype.set = function(path, value) {
	path = arg_to_path(path)

	// updating this._data and check for errors
	if (path.length === 0) {
		if (value === undefined) throw new Error("can't remove root document")
		this._data = value
		var new_key = false

	} else {
		var data = this._data

		for (var i=0; i<path.length-1; i++) {
			check_if_can_be_placed(path[i], data, false)
			data = data[path[i]]
		}
		if (i === path.length-1) {
			check_if_can_be_placed(path[i], data, value === undefined)
		}

		var new_key = !(path[i] in data)

		if (value === undefined) {
			if (Array.isArray(data)) {
				data.pop()
			} else {
				delete data[path[i]]
			}
		} else {
			data[path[i]] = value
		}
	}

	// for inserting document
	if (!this._tokens.length)
		this._tokens = [ { raw: '', type: 'literal', stack: [], value: undefined } ]

	var position = [
		find_first_non_ws_token(this._tokens, 0, this._tokens.length - 1),
		find_last_non_ws_token(this._tokens, 0, this._tokens.length - 1),
	]
	for (var i=0; i<path.length-1; i++) {
		position = find_element_in_tokenlist(path[i], i, this._tokens, position[0], position[1])
		if (position == false) throw new Error('internal error, please report this')
	}
	// assume that i == path.length-1 here

	if (path.length === 0) {
		var newtokens = value_to_tokenlist(value, path, this._options)
		// all good

	} else if (!new_key) {
		var newtokens = value_to_tokenlist(value, path, this._options)
		// replace old value with a new one (or deleting something)
		var pos_old = position
		position = find_element_in_tokenlist(path[i], i, this._tokens, position[0], position[1])

		if (value === undefined && position !== false) {
			// deleting element (position !== false ensures there's something)

			if (!Array.isArray(data)) {
				// removing element from an object, `{x:1, key:CURRENT} -> {x:1}`
				// removing sep, literal and optional sep
				// ':'
				var pos2 = find_last_non_ws_token(this._tokens, pos_old[0], position[0] - 1)
				assert.equal(this._tokens[pos2].type, 'separator')
				assert.equal(this._tokens[pos2].raw, ':')
				position[0] = pos2

				// key
				var pos2 = find_last_non_ws_token(this._tokens, pos_old[0], position[0] - 1)
				assert.equal(this._tokens[pos2].type, 'literal')
				assert.equal(this._tokens[pos2].value, path[path.length-1])
				position[0] = pos2
			}

			// removing comma in arrays and objects
			var pos2 = find_last_non_ws_token(this._tokens, pos_old[0], position[0] - 1)
			assert.equal(this._tokens[pos2].type, 'separator')
			if (this._tokens[pos2].raw === ',') {
				position[0] = pos2
			} else {
				// beginning of the array/object, so we should remove trailing comma instead
				pos2 = find_first_non_ws_token(this._tokens, position[1] + 1, pos_old[1])
				assert.equal(this._tokens[pos2].type, 'separator')
				if (this._tokens[pos2].raw === ',') {
					position[1] = pos2
				}
			}
		}

	} else {
		// insert new key, that's tricky
		var path_1 = path.slice(0, i)

		//	find a last separator after which we're inserting it
		var pos2 = find_last_non_ws_token(this._tokens, position[0] + 1, position[1] - 1)
		assert(pos2 !== false)

		var indent = pos2 !== false
		           ? detect_indent_style(this._tokens, Array.isArray(data), position[0] + 1, pos2, path_1)
		           : {}

		var _prefix = this._options._prefix
		this._options._prefix = indent.prefix.map(function(x) {
			return x.raw
		}).join('')
		var newtokens = value_to_tokenlist(value, path, this._options)
		this._options._prefix = _prefix

		// adding leading whitespaces according to detected codestyle
		var prefix = []
		if (indent.newline && indent.newline.length)
			prefix = prefix.concat(indent.newline)
		if (indent.prefix && indent.prefix.length)
			prefix = prefix.concat(indent.prefix)

		// adding '"key":' (as in "key":"value") to object values
		if (!Array.isArray(data)) {
			prefix = prefix.concat(value_to_tokenlist(path[path.length-1], path_1, this._options, true))
			if (indent.sep1 && indent.sep1.length)
				prefix = prefix.concat(indent.sep1)
			prefix.push({raw: ':', type: 'separator', stack: path_1})
			if (indent.sep2 && indent.sep2.length)
				prefix = prefix.concat(indent.sep2)
		}

		newtokens.unshift.apply(newtokens, prefix)

		// check if prev token is a separator AND they're at the same level
		if (this._tokens[pos2].type === 'separator' && this._tokens[pos2].stack.length === path.length-1) {
			// previous token is either , or [ or {
			if (this._tokens[pos2].raw === ',') {
				// restore ending comma
				newtokens.push({raw: ',', type: 'separator', stack: path_1})
			}
		} else {
			// previous token isn't a separator, so need to insert one
			newtokens.unshift({raw: ',', type: 'separator', stack: path_1})
		}

		if (indent.suffix && indent.suffix.length)
			newtokens.push.apply(newtokens, indent.suffix)

		assert.equal(this._tokens[position[1]].type, 'separator')
		position[0] = pos2+1
		position[1] = pos2
	}

	newtokens.unshift(position[1] - position[0] + 1)
	newtokens.unshift(position[0])
	this._tokens.splice.apply(this._tokens, newtokens)

	return this
}

// convenience method
Document.prototype.unset = function(path) {
	return this.set(path, undefined)
}

Document.prototype.get = function(path) {
	path = arg_to_path(path)

	var data = this._data
	for (var i=0; i<path.length; i++) {
		if (!isObject(data)) return undefined
		data = data[path[i]]
	}
	return data
}

Document.prototype.has = function(path) {
	path = arg_to_path(path)

	var data = this._data
	for (var i=0; i<path.length; i++) {
		if (!isObject(data)) return false
		data = data[path[i]]
	}
	return data !== undefined
}

// compare old object and new one, and change differences only
Document.prototype.update = function(value) {
	var self = this
	change([], self._data, value)
	return self

	function change(path, old_data, new_data) {
		if (!isObject(new_data) || !isObject(old_data)) {
			// if source or dest is primitive, just replace
			if (new_data !== old_data)
				self.set(path, new_data)

		} else if (Array.isArray(new_data) != Array.isArray(old_data)) {
			// old data is an array XOR new data is an array, replace as well
			self.set(path, new_data)

		} else if (Array.isArray(new_data)) {
			// both values are arrays here

			if (new_data.length > old_data.length) {
				// adding new elements, so going forward
				for (var i=0; i<new_data.length; i++) {
					path.push(String(i))
					change(path, old_data[i], new_data[i])
					path.pop()
				}

			} else {
				// removing something, so going backward
				for (var i=old_data.length-1; i>=0; i--) {
					path.push(String(i))
					change(path, old_data[i], new_data[i])
					path.pop()
				}
			}

		} else {
			// both values are objects here
			for (var i in new_data) {
				path.push(String(i))
				change(path, old_data[i], new_data[i])
				path.pop()
			}

			for (var i in old_data) {
				if (i in new_data) continue
				path.push(String(i))
				change(path, old_data[i], new_data[i])
				path.pop()
			}
		}
	}
}

Document.prototype.toString = function() {
	return this._tokens.map(function(x) {
		return x.raw
	}).join('')
}

module.exports.Document = Document

module.exports.update = function updateJSON(source, new_value, options) {
	return (new Document(source, options)).update(new_value).toString()
}


},{"./analyze":7,"./parse":9,"./stringify":10,"assert":1}],9:[function(require,module,exports){
/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/jju
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

// RTFM: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf

var Uni = require('./unicode')

function isHexDigit(x) {
	return (x >= '0' && x <= '9')
	    || (x >= 'A' && x <= 'F')
	    || (x >= 'a' && x <= 'f')
}

function isDecDigit(x) {
	return x >= '0' && x <= '9'
}

var unescapeMap = {
	'\'': '\'',
	'"' : '"',
	'\\': '\\',
	'b' : '\b',
	'f' : '\f',
	'n' : '\n',
	'r' : '\r',
	't' : '\t',
	'v' : '\v',
	'/' : '/',
}

function formatError(input, msg, position, lineno, column, json5) {
	var result = msg + ' at ' + (lineno + 1) + ':' + (column + 1)
	  , tmppos = position - column - 1
	  , srcline = ''
	  , underline = ''

	var isLineTerminator = json5 ? Uni.isLineTerminator : Uni.isLineTerminatorJSON

	// output no more than 70 characters before the wrong ones
	if (tmppos < position - 70) {
		tmppos = position - 70
	}

	while (1) {
		var chr = input[++tmppos]

		if (isLineTerminator(chr) || tmppos === input.length) {
			if (position >= tmppos) {
				// ending line error, so show it after the last char
				underline += '^'
			}
			break
		}
		srcline += chr

		if (position === tmppos) {
			underline += '^'
		} else if (position > tmppos) {
			underline += input[tmppos] === '\t' ? '\t' : ' '
		}

		// output no more than 78 characters on the string
		if (srcline.length > 78) break
	}

	return result + '\n' + srcline + '\n' + underline
}

function parse(input, options) {
	// parse as a standard JSON mode
	var json5 = !(options.mode === 'json' || options.legacy)
	var isLineTerminator = json5 ? Uni.isLineTerminator : Uni.isLineTerminatorJSON
	var isWhiteSpace = json5 ? Uni.isWhiteSpace : Uni.isWhiteSpaceJSON

	var length = input.length
	  , lineno = 0
	  , linestart = 0
	  , position = 0
	  , stack = []

	var tokenStart = function() {}
	var tokenEnd = function(v) {return v}

	/* tokenize({
	     raw: '...',
	     type: 'whitespace'|'comment'|'literal'|'separator',
	     value: 'number'|'string'|'whatever',
	     path: [...],
	   })
	*/
	if (options._tokenize) {
		;(function() {
			var start = null
			tokenStart = function() {
				if (start !== null) throw new Error('internal error, token overlap')
				start = position
			}

			tokenEnd = function(v, type) {
				if (start != position) {
					var hash = {
						raw: input.substr(start, position-start),
						type: type,
						stack: stack.slice(0),
					}
					if (v !== undefined) hash.value = v
					options._tokenize.call(null, hash)
				}
				start = null
				return v
			}
		})()
	}

	function fail(msg) {
		var column = position - linestart

		if (!msg) {
			if (position < length) {
				var token = '\'' +
					JSON
						.stringify(input[position])
						.replace(/^"|"$/g, '')
						.replace(/'/g, "\\'")
						.replace(/\\"/g, '"')
					+ '\''

				if (!msg) msg = 'Unexpected token ' + token
			} else {
				if (!msg) msg = 'Unexpected end of input'
			}
		}

		var error = new SyntaxError(formatError(input, msg, position, lineno, column, json5))
		error.row = lineno + 1
		error.column = column + 1
		throw error
	}

	function newline(chr) {
		// account for <cr><lf>
		if (chr === '\r' && input[position] === '\n') position++
		linestart = position
		lineno++
	}

	function parseGeneric(is_key) {
		var result
		//console.log('parse: =============\n', input.substr(position, 40))

		while (position < length) {
			tokenStart()
			var chr = input[position++]

			if (chr === '"' || (chr === '\'' && json5)) {
				return tokenEnd(parseString(chr), 'literal')

			} else if (chr === '{') {
				tokenEnd(undefined, 'separator')
				return parseObject()

			} else if (chr === '[') {
				tokenEnd(undefined, 'separator')
				return parseArray()

			} else if (chr === '-'
			       ||  chr === '.'
			       ||  isDecDigit(chr)
			           //           + number       Infinity          NaN
			       ||  (json5 && (chr === '+' || chr === 'I' || chr === 'N'))
			) {
				return tokenEnd(parseNumber(is_key), 'literal')

			} else if (chr === 'n' && !is_key) {
				parseKeyword('null')
				return tokenEnd(null, 'literal')

			} else if (chr === 't' && !is_key) {
				parseKeyword('true')
				return tokenEnd(true, 'literal')

			} else if (chr === 'f' && !is_key) {
				parseKeyword('false')
				return tokenEnd(false, 'literal')

			} else if (json5
			       &&  is_key
			       &&  Uni.isIdentifierStart(chr) || (chr === '\\' && input[position === 'u'])) {
				// unicode char or a unicode sequence
				var rollback = position - 1
				var result = parseIdentifier()

				if (result === undefined) {
					position = rollback
					return tokenEnd(undefined)
				} else {
					return tokenEnd(result, 'literal')
				}

			} else {
				position--
				return tokenEnd(undefined)
			}
		}
	}

	function skipWhiteSpace() {
		tokenStart()
		while (position < length) {
			var chr = input[position++]

			if (isLineTerminator(chr)) {
				position--
				tokenEnd(undefined, 'whitespace')
				tokenStart()
				position++
				newline(chr)
				tokenEnd(undefined, 'newline')
				tokenStart()

			} else if (isWhiteSpace(chr)) {
				// nothing

			} else if (chr === '/'
			       && json5
			       && (input[position] === '/' || input[position] === '*')
			) {
				position--
				tokenEnd(undefined, 'whitespace')
				tokenStart()
				position++
				skipComment(input[position++] === '*')
				tokenEnd(undefined, 'comment')
				tokenStart()

			} else {
				position--
				break
			}
		}
		return tokenEnd(undefined, 'whitespace')
	}

	function skipComment(multi) {
		while (position < length) {
			var chr = input[position++]

			if (isLineTerminator(chr)) {
				// LineTerminator is an end of singleline comment
				if (!multi) {
					// let parent function deal with newline
					position--
					return
				}

				newline(chr)

			} else if (chr === '*' && multi) {
				// end of multiline comment
				if (input[position] === '/') {
					position++
					return
				}

			} else {
				// nothing
			}
		}

		if (multi) {
			fail('Unclosed multiline comment')
		}
	}

	function parseKeyword(keyword) {
		// keyword[0] is not checked because it should've checked earlier
		var _pos = position
		var len = keyword.length
		for (var i=1; i<len; i++) {
			if (position >= length || keyword[i] != input[position]) {
				position = _pos-1
				fail()
			}
			position++
		}
	}

	function parseObject() {
		var result = options.null_prototype ? Object.create(null) : {}
		  , empty_object = {}
		  , is_non_empty = false

		while (position < length) {
			skipWhiteSpace()
			var item1 = parseGeneric(json5)
			skipWhiteSpace()
			tokenStart()
			var chr = input[position++]
			tokenEnd(undefined, 'separator')

			if (chr === '}' && item1 === undefined) {
				if (!json5 && is_non_empty) {
					position--
					fail('Trailing comma in object')
				}
				return result

			} else if (chr === ':' && item1 !== undefined) {
				skipWhiteSpace()
				stack.push(item1)
				var item2 = parseGeneric()
				stack.pop()

				if (item2 === undefined) fail('No value found for key ' + item1)
				if (typeof(item1) !== 'string') {
					if (!json5 || typeof(item1) !== 'number') {
						fail('Wrong key type: ' + item1)
					}
				}

				if ((item1 in empty_object || empty_object[item1] != null) && options.reserved_keys !== 'replace') {
					if (options.reserved_keys === 'throw') {
						fail('Reserved key: ' + item1)
					} else {
						// silently ignore it
					}
				} else {
					if (typeof(options.reviver) === 'function') {
						item2 = options.reviver.call(null, item1, item2)
					}

					if (item2 !== undefined) {
						is_non_empty = true
						Object.defineProperty(result, item1, {
							value: item2,
							enumerable: true,
							configurable: true,
							writable: true,
						})
					}
				}

				skipWhiteSpace()

				tokenStart()
				var chr = input[position++]
				tokenEnd(undefined, 'separator')

				if (chr === ',') {
					continue

				} else if (chr === '}') {
					return result

				} else {
					fail()
				}

			} else {
				position--
				fail()
			}
		}

		fail()
	}

	function parseArray() {
		var result = []

		while (position < length) {
			skipWhiteSpace()
			stack.push(result.length)
			var item = parseGeneric()
			stack.pop()
			skipWhiteSpace()
			tokenStart()
			var chr = input[position++]
			tokenEnd(undefined, 'separator')

			if (item !== undefined) {
				if (typeof(options.reviver) === 'function') {
					item = options.reviver.call(null, String(result.length), item)
				}
				if (item === undefined) {
					result.length++
					item = true // hack for check below, not included into result
				} else {
					result.push(item)
				}
			}

			if (chr === ',') {
				if (item === undefined) {
					fail('Elisions are not supported')
				}

			} else if (chr === ']') {
				if (!json5 && item === undefined && result.length) {
					position--
					fail('Trailing comma in array')
				}
				return result

			} else {
				position--
				fail()
			}
		}
	}

	function parseNumber(no_sign) {
		// rewind because we don't know first char
		position--

		var start = position
		  , chr = input[position++]
		  , t

		var to_num = function() {
			var str = input.substr(start, position - start)
			var result = Number(str)
			if (Number.isNaN(result)) {
				position--
				fail('Bad numeric literal - "' + input.substr(start, position - start) + '"')
			} else if (!json5 && !str.match(/^-?(0|[1-9][0-9]*)(\.[0-9]+)?(e[+-]?[0-9]+)?$/i)) {
				// additional restrictions imposed by json
				position--
				fail('Non-json numeric literal - "' + input.substr(start, position - start) + '"')
			} else {
				return result
			}
		}

		// ex: -5982475.249875e+29384
		//     ^ skipping this
		if ((chr === '-' || (chr === '+' && json5)) && !no_sign) chr = input[position++]

		if (chr === 'N' && json5) {
			parseKeyword('NaN')
			return NaN
		}

		if (chr === 'I' && json5) {
			parseKeyword('Infinity')

			// returning +inf or -inf
			return to_num()
		}

		if (chr >= '1' && chr <= '9') {
			// ex: -5982475.249875e+29384
			//        ^^^ skipping these
			while (position < length && isDecDigit(input[position])) position++
			chr = input[position++]
		}

		// special case for leading zero: 0.123456
		if (chr === '0') {
			chr = input[position++]

			if (json5 && (chr === 'x' || chr === 'X')) {
				while (position < length && isHexDigit(input[position])) position++

				// signed hex gotcha
				if (input[start] === '-') {
					start++
					return -to_num()

				} else if (input[start] === '+') {
					start++
					return to_num()

				} else {
					return to_num()
				}
			}
		}

		if (chr === '.') {
			// ex: -5982475.249875e+29384
			//                ^^^ skipping these
			while (position < length && isDecDigit(input[position])) position++
			chr = input[position++]
		}

		if (chr === 'e' || chr === 'E') {
			chr = input[position++]
			if (chr === '-' || chr === '+') position++
			// ex: -5982475.249875e+29384
			//                       ^^^ skipping these
			while (position < length && isDecDigit(input[position])) position++
			chr = input[position++]
		}

		// we have char in the buffer, so count for it
		position--
		return to_num()
	}

	function parseIdentifier() {
		// rewind because we don't know first char
		position--

		var result = ''

		while (position < length) {
			var chr = input[position++]

			if (chr === '\\'
			&&  input[position] === 'u'
			&&  isHexDigit(input[position+1])
			&&  isHexDigit(input[position+2])
			&&  isHexDigit(input[position+3])
			&&  isHexDigit(input[position+4])
			) {
				// UnicodeEscapeSequence
				chr = String.fromCharCode(parseInt(input.substr(position+1, 4), 16))
				position += 5
			}

			if (result.length) {
				// identifier started
				if (Uni.isIdentifierPart(chr)) {
					result += chr
				} else {
					position--
					return result
				}

			} else {
				if (Uni.isIdentifierStart(chr)) {
					result += chr
				} else {
					return undefined
				}
			}
		}

		fail()
	}

	function parseString(endChar) {
		// 7.8.4 of ES262 spec
		var result = ''

		while (position < length) {
			var chr = input[position++]

			if (chr === endChar) {
				return result

			} else if (chr === '\\') {
				if (position >= length) fail()
				chr = input[position++]

				if (unescapeMap[chr] && (json5 || (chr != 'v' && chr != "'"))) {
					result += unescapeMap[chr]

				} else if (json5 && isLineTerminator(chr)) {
					// line continuation
					newline(chr)

				} else if (chr === 'u' || (chr === 'x' && json5)) {
					// unicode/character escape sequence
					var off = chr === 'u' ? 4 : 2

					// validation for \uXXXX
					for (var i=0; i<off; i++) {
						if (position >= length) fail()
						if (!isHexDigit(input[position])) fail('Bad escape sequence')
						position++
					}

					result += String.fromCharCode(parseInt(input.substr(position-off, off), 16))
				} else if (json5 && isDecDigit(chr)) {
					if (!isDecDigit(input[position])) {
						// \0 is allowed still
						result += '\0'
					} else {
						fail('Octal literals are not supported')
					}

				} else if (json5) {
					// \X -> x
					result += chr

				} else {
					position--
					fail()
				}

			} else if (isLineTerminator(chr)) {
				fail()

			} else {
				if (!json5 && chr.charCodeAt(0) < 32) {
					position--
					fail('Unexpected control character')
				}

				// SourceCharacter but not one of " or \ or LineTerminator
				result += chr
			}
		}

		fail()
	}

	skipWhiteSpace()
	var return_value = parseGeneric()
	if (return_value !== undefined) {
		skipWhiteSpace()

		if (position >= length) {
			if (typeof(options.reviver) === 'function') {
				return_value = options.reviver.call(null, '', return_value)
			}
			return return_value
		} else {
			fail()
		}

	} else {
		if (position) {
			fail('No data, only a whitespace')
		} else {
			fail('No data, empty input')
		}
	}
}

/*
 * parse(text, options)
 * or
 * parse(text, reviver)
 *
 * where:
 * text - string
 * options - object
 * reviver - function
 */
module.exports.parse = function parseJSON(input, options) {
	// support legacy functions
	if (typeof(options) === 'function') {
		options = {
			reviver: options
		}
	}

	if (input === undefined) {
		// parse(stringify(x)) should be equal x
		// with JSON functions it is not 'cause of undefined
		// so we're fixing it
		return undefined
	}

	// JSON.parse compat
	if (typeof(input) !== 'string') input = String(input)
	if (options == null) options = {}
	if (options.reserved_keys == null) options.reserved_keys = 'ignore'

	if (options.reserved_keys === 'throw' || options.reserved_keys === 'ignore') {
		if (options.null_prototype == null) {
			options.null_prototype = true
		}
	}

	return parse(input, options)
}

module.exports.tokenize = function tokenizeJSON(input, options) {
	if (options == null) options = {}

	options._tokenize = function(smth) {
		if (options._addstack) smth.stack.unshift.apply(smth.stack, options._addstack)
		tokens.push(smth)
	}

	var tokens = []
	tokens.data = module.exports.parse(input, options)
	return tokens
}


},{"./unicode":11}],10:[function(require,module,exports){
/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/jju
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

var Uni = require('./unicode')

// Fix Function#name on browsers that do not support it (IE)
// http://stackoverflow.com/questions/6903762/function-name-not-supported-in-ie
if (!(function f(){}).name) {
	Object.defineProperty((function(){}).constructor.prototype, 'name', {
		get: function() {
			var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1]
			// For better performance only parse once, and then cache the
			// result through a new accessor for repeated access.
			Object.defineProperty(this, 'name', { value: name })
			return name
		}
	})
}

var special_chars = {
	0: '\\0', // this is not an octal literal
	8: '\\b',
	9: '\\t',
	10: '\\n',
	11: '\\v',
	12: '\\f',
	13: '\\r',
	92: '\\\\',
}

// for oddballs
var hasOwnProperty = Object.prototype.hasOwnProperty

// some people escape those, so I'd copy this to be safe
var escapable = /[\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/

function _stringify(object, options, recursiveLvl, currentKey) {
	var opt_json = options.mode === 'json'
	/*
	 * Opinionated decision warning:
	 *
	 * Objects are serialized in the following form:
	 * { type: 'Class', data: DATA }
	 *
	 * Class is supposed to be a function, and new Class(DATA) is
	 * supposed to be equivalent to the original value
	 */
	/*function custom_type() {
		return stringify({
			type: object.constructor.name,
			data: object.toString()
		})
	}*/

	// if add, it's an internal indentation, so we add 1 level and a eol
	// if !add, it's an ending indentation, so we just indent
	function indent(str, add) {
		var prefix = options._prefix ? options._prefix : ''
		if (!options.indent) return prefix + str
		var result = ''
		var count = recursiveLvl + (add || 0)
		for (var i=0; i<count; i++) result += options.indent
		return prefix + result + str + (add ? '\n' : '')
	}

	function _stringify_key(key) {
		if (options.quote_keys) return _stringify_str(key)
		if (String(Number(key)) == key && key[0] != '-') return key
		if (key == '') return _stringify_str(key)

		var result = ''
		for (var i=0; i<key.length; i++) {
			if (i > 0) {
				if (!Uni.isIdentifierPart(key[i]))
					return _stringify_str(key)

			} else {
				if (!Uni.isIdentifierStart(key[i]))
					return _stringify_str(key)
			}

			var chr = key.charCodeAt(i)

			if (options.ascii) {
				if (chr < 0x80) {
					result += key[i]

				} else {
					result += '\\u' + ('0000' + chr.toString(16)).slice(-4)
				}

			} else {
				if (escapable.exec(key[i])) {
					result += '\\u' + ('0000' + chr.toString(16)).slice(-4)

				} else {
					result += key[i]
				}
			}
		}

		return result
	}

	function _stringify_str(key) {
		var quote = options.quote
		var quoteChr = quote.charCodeAt(0)

		var result = ''
		for (var i=0; i<key.length; i++) {
			var chr = key.charCodeAt(i)

			if (chr < 0x10) {
				if (chr === 0 && !opt_json) {
					result += '\\0'
				} else if (chr >= 8 && chr <= 13 && (!opt_json || chr !== 11)) {
					result += special_chars[chr]
				} else if (!opt_json) {
					result += '\\x0' + chr.toString(16)
				} else {
					result += '\\u000' + chr.toString(16)
				}

			} else if (chr < 0x20) {
				if (!opt_json) {
					result += '\\x' + chr.toString(16)
				} else {
					result += '\\u00' + chr.toString(16)
				}

			} else if (chr >= 0x20 && chr < 0x80) {
				// ascii range
				if (chr === 47 && i && key[i-1] === '<') {
					// escaping slashes in </script>
					result += '\\' + key[i]

				} else if (chr === 92) {
					result += '\\\\'

				} else if (chr === quoteChr) {
					result += '\\' + quote

				} else {
					result += key[i]
				}

			} else if (options.ascii || Uni.isLineTerminator(key[i]) || escapable.exec(key[i])) {
				if (chr < 0x100) {
					if (!opt_json) {
						result += '\\x' + chr.toString(16)
					} else {
						result += '\\u00' + chr.toString(16)
					}

				} else if (chr < 0x1000) {
					result += '\\u0' + chr.toString(16)

				} else if (chr < 0x10000) {
					result += '\\u' + chr.toString(16)

				} else {
					throw new Error('weird codepoint')
				}
			} else {
				result += key[i]
			}
		}
		return quote + result + quote
	}

	function _stringify_object() {
		if (object === null) return 'null'
		var result = []
		  , len = 0
		  , braces

		if (Array.isArray(object)) {
			braces = '[]'
			for (var i=0; i<object.length; i++) {
				var s = _stringify(object[i], options, recursiveLvl+1, String(i))
				if (s === undefined) s = 'null'
				len += s.length + 2
				result.push(s + ',')
			}

		} else {
			braces = '{}'
			var fn = function(key) {
				if (hasOwnProperty.call(object, key)) {
					var t = _stringify(object[key], options, recursiveLvl+1, key)
					if (t !== undefined) {
						t = _stringify_key(key) + ':' + (options.indent ? ' ' : '') + t + ','
						len += t.length + 1
						result.push(t)
					}
				}
			}

			if (Array.isArray(options.replacer)) {
				for (var i=0; i<options.replacer.length; i++) fn(options.replacer[i])
			} else {
				for (var key in object) fn(key)
			}
		}

		// objects shorter than 30 characters are always inlined
		// objects longer than 60 characters are always splitted to multiple lines
		// anything in the middle depends on indentation level
		len -= 2
		if (options.indent && (len > options._splitMax - recursiveLvl * options.indent.length || len > options._splitMin) ) {
			// remove trailing comma in multiline if asked to
			if (options.no_trailing_comma && result.length) {
				result[result.length-1] = result[result.length-1].substring(0, result[result.length-1].length-1)
			}

			var innerStuff = result.map(function(x) {return indent(x, 1)}).join('')
			return braces[0]
				  + (options.indent ? '\n' : '')
				  + innerStuff
				  + indent(braces[1])
		} else {
			// always remove trailing comma in one-lined arrays
			if (result.length) {
				result[result.length-1] = result[result.length-1].substring(0, result[result.length-1].length-1)
			}

			var innerStuff = result.join(options.indent ? ' ' : '')
			return braces[0]
				  + innerStuff
				  + braces[1]
		}
	}

	function _stringify_nonobject(object) {
		if (typeof(options.replacer) === 'function') {
			object = options.replacer.call(null, currentKey, object)
		}

		switch(typeof(object)) {
			case 'string':
				return _stringify_str(object)

			case 'number':
				if (object === 0 && 1/object < 0) {
					// Opinionated decision warning:
					//
					// I want cross-platform negative zero in all js engines
					// I know they're equal, but why lose that tiny bit of
					// information needlessly?
					return '-0'
				}
				if (options.mode === 'json' && !Number.isFinite(object)) {
					// json don't support infinity (= sucks)
					return 'null'
				}
				return object.toString()

			case 'boolean':
				return object.toString()

			case 'undefined':
				return undefined

			case 'function':
//				return custom_type()

			default:
				// fallback for something weird
				return JSON.stringify(object)
		}
	}

	if (options._stringify_key) {
		return _stringify_key(object)
	}

	if (typeof(object) === 'object') {
		if (object === null) return 'null'

		var str
		if (typeof(str = object.toJSON5) === 'function' && options.mode !== 'json') {
			object = str.call(object, currentKey)

		} else if (typeof(str = object.toJSON) === 'function') {
			object = str.call(object, currentKey)
		}

		if (object === null) return 'null'
		if (typeof(object) !== 'object') return _stringify_nonobject(object)

		if (object.constructor === Number || object.constructor === Boolean || object.constructor === String) {
			object = object.valueOf()
			return _stringify_nonobject(object)

		} else if (object.constructor === Date) {
			// only until we can't do better
			return _stringify_nonobject(object.toISOString())

		} else {
			if (typeof(options.replacer) === 'function') {
				object = options.replacer.call(null, currentKey, object)
				if (typeof(object) !== 'object') return _stringify_nonobject(object)
			}

			return _stringify_object(object)
		}
	} else {
		return _stringify_nonobject(object)
	}
}

/*
 * stringify(value, options)
 * or
 * stringify(value, replacer, space)
 *
 * where:
 * value - anything
 * options - object
 * replacer - function or array
 * space - boolean or number or string
 */
module.exports.stringify = function stringifyJSON(object, options, _space) {
	// support legacy syntax
	if (typeof(options) === 'function' || Array.isArray(options)) {
		options = {
			replacer: options
		}
	} else if (typeof(options) === 'object' && options !== null) {
		// nothing to do
	} else {
		options = {}
	}
	if (_space != null) options.indent = _space

	if (options.indent == null) options.indent = '\t'
	if (options.quote == null) options.quote = "'"
	if (options.ascii == null) options.ascii = false
	if (options.mode == null) options.mode = 'simple'

	if (options.mode === 'json') {
		// json only supports double quotes (= sucks)
		options.quote = '"'

		// json don't support trailing commas (= sucks)
		options.no_trailing_comma = true

		// json don't support unquoted property names (= sucks)
		options.quote_keys = true
	}

	// why would anyone use such objects?
	if (typeof(options.indent) === 'object') {
		if (options.indent.constructor === Number
		||  options.indent.constructor === Boolean
		||  options.indent.constructor === String)
			options.indent = options.indent.valueOf()
	}

	// gap is capped at 10 characters
	if (typeof(options.indent) === 'number') {
		if (options.indent >= 0) {
			options.indent = Array(Math.min(~~options.indent, 10) + 1).join(' ')
		} else {
			options.indent = false
		}
	} else if (typeof(options.indent) === 'string') {
		options.indent = options.indent.substr(0, 10)
	}

	if (options._splitMin == null) options._splitMin = 50
	if (options._splitMax == null) options._splitMax = 70

	return _stringify(object, options, 0, '')
}


},{"./unicode":11}],11:[function(require,module,exports){

// This is autogenerated with esprima tools, see:
// https://github.com/ariya/esprima/blob/master/esprima.js
//
// PS: oh God, I hate Unicode

// ECMAScript 5.1/Unicode v6.3.0 NonAsciiIdentifierStart:

var Uni = module.exports

module.exports.isWhiteSpace = function isWhiteSpace(x) {
	// section 7.2, table 2
	return x === '\u0020'
	    || x === '\u00A0'
	    || x === '\uFEFF' // <-- this is not a Unicode WS, only a JS one
	    // + 9 B C below

	    // + whitespace characters from unicode 6.0.0
	    // http://www.unicode.org/versions/Unicode6.0.0/ch04.pdf
	    || (x >= '\u0009' && x <= '\u000D') // 9 A B C D
	    || x === '\u0085'
	    || x === '\u1680'
	    || x === '\u180E'
	    || (x >= '\u2000' && x <= '\u200A') // 0 1 2 3 4 5 6 7 8 9 A
	    || x === '\u2028'
	    || x === '\u2029'
	    || x === '\u202F'
	    || x === '\u205F'
	    || x === '\u3000'

	// should be total of 26+1 = 27 characters
}

module.exports.isWhiteSpaceJSON = function isWhiteSpaceJSON(x) {
	return x === '\u0020'
	    || x === '\u0009'
	    || x === '\u000A'
	    || x === '\u000D'
}

module.exports.isLineTerminator = function isLineTerminator(x) {
	// ok, here is the part when JSON is wrong
	// section 7.3, table 3
	return x === '\u000A'
	    || x === '\u000D'
	    || x === '\u2028'
	    || x === '\u2029'
}

module.exports.isLineTerminatorJSON = function isLineTerminatorJSON(x) {
	return x === '\u000A'
	    || x === '\u000D'
}

module.exports.isIdentifierStart = function isIdentifierStart(x) {
	return x === '$'
	    || x === '_'
	    || (x >= 'A' && x <= 'Z')
	    || (x >= 'a' && x <= 'z')
	    || (x >= '\u0080' && Uni.NonAsciiIdentifierStart.test(x))
}

module.exports.isIdentifierPart = function isIdentifierPart(x) {
	return x === '$'
	    || x === '_'
	    || (x >= 'A' && x <= 'Z')
	    || (x >= 'a' && x <= 'z')
	    || (x >= '0' && x <= '9') // <-- addition to Start
	    || (x >= '\u0080' && Uni.NonAsciiIdentifierPart.test(x))
}

module.exports.NonAsciiIdentifierStart = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/

// ECMAScript 5.1/Unicode v6.3.0 NonAsciiIdentifierPart:

module.exports.NonAsciiIdentifierPart = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0\u08A2-\u08AC\u08E4-\u08FE\u0900-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1D00-\u1DE6\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA697\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7B\uAA80-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/

},{}],12:[function(require,module,exports){

// this function registers json5 extension, so you
// can do `require("./config.json5")` kind of thing
module.exports.register = function() {
	var r = require, e = 'extensions'
	r[e]['.json5'] = function() {

	}
}

// this function monkey-patches JSON.parse, so it
// will return an exact position of error in case
// of parse failure
module.exports.patch_JSON_parse = function() {
	var _parse = JSON.parse
	JSON.parse = function(text, rev) {
		try {
			return _parse(text, rev)
		} catch(err) {
			// this call should always throw
			require('../').parse(text, {
				mode: 'json',
				legacy: true,
				reviver: rev,
				reserved_keys: 'replace',
				null_prototype: false,
			})

			// if it didn't throw, but original parser did,
			// this is an error in this library and should be reported
			throw err
		}
	}
}

// this function is an express/connect middleware
// that accepts uploads in application/json5 format
module.exports.middleware = function() {
	return function(req, res, next) {

	}
}


},{"../":6}],13:[function(require,module,exports){
var _require = window.require
window.require = function(arg) {
	if (arg === 'jju') return require('jju')
	return _require.apply(this, arguments)
}

},{"jju":6}]},{},[13])