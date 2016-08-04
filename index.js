'use strict';

var rollup = require('rollup');
var through = require('through2');
var denodeify = require('denodeify');
var fs = require('fs');
var writeFile = denodeify(fs.writeFile);
var unlink = denodeify(fs.unlink);
var path = require('path');
var noop = require('noop-fn');

var cache;

function rollupify(filename, opts) {
  if (!/\.(?:js|es|es6|jsx|ts|tsx)$/.test(filename)) {
    return through();
  }

  var source = '';

  return through(function (chunk, enc, cb) {
    source += chunk.toString('utf8');
    cb();
  }, function (cb) {
    var self = this;

    // Write a temp file just in case we are preceded by
    // another browserify transform
    var tmpfile = path.resolve(path.dirname(filename),
      path.basename(filename) + '.tmp');

    var doSourceMap = opts.sourceMaps !== false;

    writeFile(tmpfile, source, 'utf8').then(function () {
      var config = {};
      if (typeof opts.config === 'string') {
        var configPath = /^\//.test(opts.config) ? opts.config : process.cwd() + '/' + opts.config;
        config = require(configPath);
      } else if (typeof opts.config === 'object') {
        config = opts.config;
      }

      return rollup.rollup(Object.assign(config, {
        cache: cache,
        entry: tmpfile,
        sourceMap: doSourceMap ? 'inline' : false
      }))
    }).then(function (bundle) {
      var generated = bundle.generate({format: 'cjs'});
      cache = bundle;
      self.push(generated.code);
      self.push(null);

      bundle.modules.forEach(function(module) {
        var file = module.id;
        if (!/\.tmp$/.test(file)) {
          self.emit('file', file)
        }
      });
    }).catch(function (err) {
      self.emit('error', err);
    }).then(function () {
      return unlink(tmpfile).catch(noop);
    }).then(cb);
  });
}

module.exports = rollupify;
