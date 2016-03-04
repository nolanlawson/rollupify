rollupify
====

Browserify transform to apply [Rollup](http://rollupjs.org/), converting ES6/ES2015 modules
into one big CommonJS module.

This tends to result in smaller bundle sizes, due to Rollup's [tree-shaking](http://www.2ality.com/2015/12/webpack-tree-shaking.html) and
[scope-hoisting](https://github.com/substack/node-browserify/issues/1379#issuecomment-183383199) capabilities.

Usage
---

    npm install --save-dev rollupify

Then:

    browserify -t rollupify index.js > output.js

Or in your `package.json`:

```js
"browserify": {
  "transform": ["rollupify"]
}
```

Example
---

**Input:**

```js
// index.js
import foo from './hello';

export default hello;
```

```js
// hello.js

export default "hello world";
```

**Output:**

```js
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var hello = "hello world";

console.log(hello);

module.exports = hello;
},{}]},{},[1]);
```

Using alongside other transforms
----

If you are using other transforms like `babelify`, make sure you apply
the transforms in the right order. `rollupify` should apply before `babelify`:

    browserify -t rollupify -t babelify index.js > output.js

Or when configuring:

```js
"browserify": {
  "transform": ["rollupify", "babelify"]
}
```

Details
----

`rollupify` only works on ES6/ES2015 modules. Any `require()` statements will
be left untouched, and passed on to Browserify like normal.

Sourcemaps are supported, assuming you pass `--debug` or `{debug: true}`
into Browserify.