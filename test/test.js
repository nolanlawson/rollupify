'use strict';

var browserify = require('browserify');
var transform = require('../');
var assert = require('assert');
var stream2promise = require('stream-to-promise');
var spawn = require('child-process-promise').spawn;
var derequire = require('derequire');
var Promise = require('bluebird');

describe('main test', function () {

  function getPreCoffeeifyBrowserifiedCode(path, opts) {
    var b = browserify(require.resolve(path), opts)
      .transform('coffeeify')
      .transform(transform)
      .bundle();
    return stream2promise(b).then(function (buff) {
      var code = derequire(buff.toString('utf8'));
      return code;
    });
  }

  function getPostStripifyBrowserifiedCode(path, opts) {
    var b = browserify(require.resolve(path), opts)
      .transform(transform)
      .transform('stripify')
      .bundle();
    return stream2promise(b).then(function (buff) {
      var code = derequire(buff.toString('utf8'));
      return code;
    });
  }

  function getBrowserifiedCode(path, opts) {
    var b = browserify(require.resolve(path), opts)
      .transform(transform).bundle();
    return stream2promise(b).then(function (buff) {
      var code = derequire(buff.toString('utf8'));
      return code;
    });
  }

  function execBrowserify(code) {
    var output = '';
    return spawn('node').progress(function (child) {
      child.stdout.on('data', function (data) {
        output = data.toString('utf8').replace(/\n$/, '');
      });
      child.stdin.end(code);
    }).then(function () {
      return output;
    });
  }

  function testBrowserify(path, opts, expected) {
    return getBrowserifiedCode(path, opts).then(function (code) {
      return execBrowserify(code)
    }).then(function (output) {
      assert.equal(output, expected);
    });
  }

  it('does a simple package', function () {
    return Promise.resolve().then(function () {
      return testBrowserify('./test1', {}, 'foo');
    }).then(function () {
      return testBrowserify('./test1/', {}, 'foo');
    }).then(function () {
      return testBrowserify('./test1/index', {}, 'foo');
    }).then(function () {
      return testBrowserify('./test1/index.js', {}, 'foo');
    });
  });

  it('does a mixed es6/cjs package', function () {
    return Promise.resolve().then(function () {
      return testBrowserify('./test2', {}, 'foo bar');
    });
  });

  it('does sourcemaps', function () {
    return Promise.resolve().then(function () {
      return getBrowserifiedCode('./test1', {});
    }).then(function (code) {
      assert(!/sourceMappingURL/.test(code));
      return getBrowserifiedCode('./test1', {debug: true});
    }).then(function (code) {
      assert(/sourceMappingURL/.test(code));
      return getBrowserifiedCode('./test1', {debug: false});
    }).then(function (code) {
      assert(!/sourceMappingURL/.test(code));
    });
  });

  it('does a pre-transform transform', function () {
    return getPreCoffeeifyBrowserifiedCode('./test3/index.coffee', {}).then(function (code) {
      return execBrowserify(code)
    }).then(function (output) {
      assert.equal(output, 'foo bar coffee');
    });
  });

  it('does a post-transform transform', function () {
    return getPostStripifyBrowserifiedCode('./test2', {}).then(function (code) {
      return execBrowserify(code)
    }).then(function (output) {
      assert.equal(output, '');
    });
  });



});