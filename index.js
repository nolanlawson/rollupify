'use strict';

var rollup = require('rollup');
var through = require('through2');
var denodeify = require('denodeify');
var fs = require('fs');
var writeFile = denodeify(fs.writeFile);
var unlink = denodeify(fs.unlink);
var path = require('path');

function rollupify(filename, opts) {
  if (!/\.(?:js|es|es6|jsx)$/.test(filename)) {
    return through();
  }

  var source = '';

  return through(function (chunk, enc, cb) {
    source += chunk.toString('utf8');
    cb();
  }, function (cb) {
    var self = this;

    // write a temp file just incase we are preceded by
    // another browserify transform
    var tmpfile = path.resolve(path.dirname(filename),
      path.basename(filename) + '.tmp');

    var doSourceMap = opts.sourceMaps !== false;

    writeFile(tmpfile, source, 'utf8').then(function () {
      return rollup.rollup({
        entry: tmpfile,
        sourceMap: doSourceMap ? 'inline' : false
      })
    }).then(function (bundle) {
      var generated = bundle.generate({format: 'cjs'});
      var sourceMap = generated.map;
      var code = generated.code;
      self.push(code);
      self.push(null);
      return unlink(tmpfile);
    }).then(function () {
      cb();
    }).catch(cb);
  });
}

module.exports = rollupify;
