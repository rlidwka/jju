#!/usr/bin/env node

var marked = require('marked')
var jade = require('jade')
var renderer = new marked.Renderer()
renderer.heading = function (text, level) {
	var escapedText = text.toLowerCase().replace(/\./g, '').replace(/[^\w]+/g, '-');

	return '<h' + level + '><a name="' +
		escapedText +
		'" class="anchor" href="#' +
		escapedText +
		'"><span class="header-link"></span></a>' +
		text + '</h' + level + '>';
}

jade.filters.md = function(md) {
	return marked(md, { renderer: renderer })
}

marked.setOptions({
	highlight: function (code, lang) {
		if (lang) {
			return require('highlight.js').highlight(lang, code).value;
		} else {
			return require('highlight.js').highlightAuto(code).value;
		}
	}
})

var options = {
	compileDebug: false,
	filename: process.argv[2],
}

var buf = require('fs').readFileSync(process.argv[2])
var fn = jade.compile(buf, options)
var output = fn(options)
process.stdout.write(output)

