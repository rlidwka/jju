export PATH := ./node_modules/.bin:../node_modules/.bin:../../node_modules/.bin:$(PATH)

FILES = index.html editor.html tokenizer.html readme.html

all: node_modules ${FILES} jju.js

clean:
	rm ${FILES} jju.js

VPATH = src

%.html: %.jade layout.jade Makefile package.json5
	./src/jade.js $< > $@

jju.js: jju_wrapper.js Makefile package.json5
	browserify $< > $@

node_modules: Makefile package.json5
	yapm install

