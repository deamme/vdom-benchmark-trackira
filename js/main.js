(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var benchmark = require('vdom-benchmark-base');
var t = require('./trackira.js');
console.log(t);
var NAME = 'Trackira';
var VERSION = t.version;

function renderTree(nodes) {
    var children = [];
    var i;
    var e;
    var n;

    for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (n.children !== null) {
            children.push(new t.Element('div', {key: n.key}, renderTree(n.children)));
        } else {
            children.push(new t.Element('span', {key: n.key}, [new t.Text(n.key.toString())]));
        }
    }

    return children;
}

function BenchmarkImpl(container, a, b) {
    this.container = container;
    this.a = a;
    this.b = b;
    this._node = null;
}

BenchmarkImpl.prototype.setUp = function() {
};

BenchmarkImpl.prototype.tearDown = function() {
    this._node.destroy();
};

BenchmarkImpl.prototype.render = function() {
    this._node = new t.Element('div', null, renderTree(this.a));
    this._node.render();
};

BenchmarkImpl.prototype.update = function() {
    t.patch.node(this._node, new t.Element('div', {}, renderTree(this.b)));
};

document.addEventListener('DOMContentLoaded', function(e) {
    benchmark(NAME, VERSION, BenchmarkImpl);
}, false);
},{"./trackira.js":5,"vdom-benchmark-base":4}],2:[function(require,module,exports){
'use strict';

var Executor = require('./executor');

function Benchmark() {
  this.running = false;
  this.impl = null;
  this.tests = null;
  this.reportCallback = null;

  this.container = document.createElement('div');

  this._runButton = document.getElementById('RunButton');
  this._iterationsElement = document.getElementById('Iterations');
  this._reportElement = document.createElement('pre');

  document.body.appendChild(this.container);
  document.body.appendChild(this._reportElement);

  var self = this;

  this._runButton.addEventListener('click', function(e) {
    e.preventDefault();

    if (!self.running) {
      var iterations = parseInt(self._iterationsElement.value);
      if (iterations <= 0) {
        iterations = 10;
      }

      self.run(iterations);
    }
  }, false);

  this.ready(true);
}

Benchmark.prototype.ready = function(v) {
  if (v) {
    this._runButton.disabled = '';
  } else {
    this._runButton.disabled = 'true';
  }
};

Benchmark.prototype.run = function(iterations) {
  var self = this;
  this.running = true;
  this.ready(false);

  new Executor(self.impl, self.container, self.tests, 1, function() { // warmup
    new Executor(self.impl, self.container, self.tests, iterations, function(samples) {
      self._reportElement.textContent = JSON.stringify(samples, null, ' ');
      self.running = false;
      self.ready(true);
      if (self.reportCallback != null) {
        self.reportCallback(samples);
      }
    }).start();
  }).start();
};

module.exports = Benchmark;

},{"./executor":3}],3:[function(require,module,exports){
'use strict';

function Executor(impl, container, tests, iterations, cb, iterCb) {
  if (iterCb === void 0) iterCb = null;

  this.impl = impl;
  this.container = container;
  this.tests = tests;
  this.iterations = iterations;
  this.cb = cb;
  this.iterCb = iterCb;

  this._currentTest = 0;
  this._currentIter = 0;
  this._renderSamples = [];
  this._updateSamples = [];
  this._result = [];

  this._tasksCount = tests.length * iterations;

  this._iter = this.iter.bind(this);
}

Executor.prototype.start = function() {
  this._iter();
};

Executor.prototype.finished = function() {
  this.cb(this._result);
};

Executor.prototype.progress = function() {
  if (this._currentTest === 0 && this._currentIter === 0) {
    return 0;
  }

  var tests = this.tests;
  return (this._currentTest * tests.length + this._currentIter) / (tests.length * this.iterataions);
};

Executor.prototype.iter = function() {
  if (this.iterCb != null) {
    this.iterCb(this);
  }

  var tests = this.tests;

  if (this._currentTest < tests.length) {
    var test = tests[this._currentTest];

    if (this._currentIter < this.iterations) {
      var e, t;
      var renderTime, updateTime;

      e = new this.impl(this.container, test.data.a, test.data.b);
      e.setUp();

      t = window.performance.now();
      e.render();
      renderTime = window.performance.now() - t;

      t = window.performance.now();
      e.update();
      updateTime = window.performance.now() - t;
      e.tearDown();

      this._renderSamples.push(renderTime);
      this._updateSamples.push(updateTime);

      this._currentIter++;
    } else {
      this._result.push({
        name: test.name + ' ' + 'render()',
        data: this._renderSamples.slice(0)
      });

      this._result.push({
        name: test.name + ' ' + 'update()',
        data: this._updateSamples.slice(0)
      });

      this._currentTest++;

      this._currentIter = 0;
      this._renderSamples = [];
      this._updateSamples = [];
    }

    setTimeout(this._iter, 0);
  } else {
    this.finished();
  }
};

module.exports = Executor;

},{}],4:[function(require,module,exports){
'use strict';

var Benchmark = require('./benchmark');
var benchmark = new Benchmark();

function initFromScript(scriptUrl, impl) {
  var e = document.createElement('script');
  e.src = scriptUrl;

  e.onload = function() {
    benchmark.tests = window.benchmarkTests();
    benchmark.ready(true);
  };

  document.head.appendChild(e);
}

function initFromParentWindow(parent, name, version, id) {
  window.addEventListener('message', function(e) {
    var data = e.data;
    var type = data.type;

    if (type === 'tests') {
      benchmark.tests = data.data;
      benchmark.reportCallback = function(samples) {
        parent.postMessage({
          type: 'report',
          data: {
            name: name,
            version: version,
            samples: samples
          },
          id: id
        }, '*');
      };
      benchmark.ready(true);

      parent.postMessage({
        type: 'ready',
        data: null,
        id: id
      }, '*');
    } else if (type === 'run') {
      benchmark.run(data.data.iterations);
    }
  }, false);

  parent.postMessage({
    type: 'init',
    data: null,
    id: id
  }, '*');
}

function init(name, version, impl) {
  // Parse Query String.
  var qs = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
      var p=a[i].split('=', 2);
      if (p.length == 1) {
        b[p[0]] = "";
      } else {
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
      }
    }
    return b;
  })(window.location.search.substr(1).split('&'));

  if (qs['name'] !== void 0) {
    name = qs['name'];
  }

  if (qs['version'] !== void 0) {
    version = qs['version'];
  }

  var type = qs['type'];
  var id;
  if (type === 'iframe') {
    id = qs['id'];
    if (id === void 0) id = null;
    initFromParentWindow(window.parent, name, version, id);
  } else if (type === 'window') {
    if (window.opener != null) {
      id = qs['id'];
      if (id === void 0) id = null;
      initFromParentWindow(window.opener, name, version, id);
    } else {
      console.log('Failed to initialize: opener window is NULL');
    }
  } else {
    var testsUrl = qs['data']; // url to the script generating test data
    if (testsUrl !== void 0) {
      initFromScript(testsUrl);
    } else {
      console.log('Failed to initialize: cannot load tests data');
    }
  }

  benchmark.impl = impl;
}

// performance.now() polyfill
// https://gist.github.com/paulirish/5438650
// prepare base perf object
if (typeof window.performance === 'undefined') {
  window.performance = {};
}
if (!window.performance.now){
  var nowOffset = Date.now();
  if (performance.timing && performance.timing.navigationStart) {
    nowOffset = performance.timing.navigationStart;
  }
  window.performance.now = function now(){
    return Date.now() - nowOffset;
  };
}

module.exports = init;

},{"./benchmark":2}],5:[function(require,module,exports){
/**
 * trackira - Virtual DOM boilerplate
 * @Version: v0.1.2
 * @Author: Kenny Flashlight
 * @Homepage: http://trackira.github.io/trackira/
 * @License: MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.Trackira = factory();
})(this, function () {
    'use strict';

    /**
     * Returns indexes of keyed nodes.
     *
     * @param  Array  children An array of nodes.
     * @return Object          An object of keyed nodes indexes.
     */
    function keysIndexes(children, startIndex, endIndex) {
        var i,
            keys = {},
            key;
        for (i = startIndex; i <= endIndex; ++i) {
            key = children[i].key;
            if (key !== undefined) {
                keys[key] = i;
            }
        }
        return keys;
    }

    function patch(container, children, toChildren, parent) {

        var fromChildren = children,
            fromStartIndex = 0,
            toStartIndex = 0,
            fromEndIndex = fromChildren.length - 1,
            fromStartNode = fromChildren[0],
            fromEndNode = fromChildren[fromEndIndex],
            toEndIndex = toChildren.length - 1,
            toStartNode = toChildren[0],
            toEndNode = toChildren[toEndIndex],
            indexes,
            index,
            node,
            before,
            i = 0;

        if (children == null || children.length === 0) {

            for (; i < toChildren.length; i++) {
                container.appendChild(toChildren[i].render());
            }
        } else if (toChildren == null || toChildren.length === 0) {

            while (i < children.length) {
                children[i++].remove();
            }
        } else {

            if (children.length === 1 && toChildren.length === 1) {

                // Implicit key with same type or explicit key with same key.
                if (fromStartNode.key == null && fromStartNode.match(toStartNode) || fromStartNode.key != null && fromStartNode.key === toStartNode.key) {
                    fromStartNode.patch(toStartNode);
                } else {
                    fromStartNode.remove();
                    container.appendChild(toStartNode.render());
                }
            } else {

                while (fromStartIndex <= fromEndIndex && toStartIndex <= toEndIndex) {

                    if (fromStartNode === undefined) {
                        fromStartNode = fromChildren[++fromStartIndex];
                    } else if (fromEndNode === undefined) {
                        fromEndNode = fromChildren[--fromEndIndex];
                    } else if (fromStartNode.match(toStartNode)) {
                        fromStartNode.patch(toStartNode);
                        fromStartNode = fromChildren[++fromStartIndex];
                        toStartNode = toChildren[++toStartIndex];
                    } else if (fromEndNode.match(toEndNode)) {
                        fromEndNode.patch(toEndNode);
                        fromEndNode = fromChildren[--fromEndIndex];
                        toEndNode = toChildren[--toEndIndex];
                    } else if (fromStartNode.match(toEndNode)) {
                        fromStartNode.patch(toEndNode);
                        container.insertBefore(fromStartNode.element, fromEndNode.element.nextSibling);
                        fromStartNode = fromChildren[++fromStartIndex];
                        toEndNode = toChildren[--toEndIndex];
                    } else if (fromEndNode.match(toStartNode)) {
                        fromEndNode.patch(toStartNode);
                        container.insertBefore(fromEndNode.element, fromStartNode.element);
                        fromEndNode = fromChildren[--fromEndIndex];
                        toStartNode = toChildren[++toStartIndex];
                    } else {

                        if (indexes === undefined) {
                            indexes = keysIndexes(fromChildren, fromStartIndex, fromEndIndex);
                        }
                        index = indexes[toStartNode.key];
                        if (index === undefined) {
                            container.insertBefore(toStartNode.render(parent), fromStartNode.element);
                            toStartNode = toChildren[++toStartIndex];
                        } else {
                            node = fromChildren[index];
                            node.patch(toStartNode);
                            fromChildren[index] = undefined;
                            container.insertBefore(node.element, fromStartNode.element);
                            toStartNode = toChildren[++toStartIndex];
                        }
                    }
                }
                if (fromStartIndex > fromEndIndex) {
                    before = toChildren[toEndIndex + 1] === undefined ? null : toChildren[toEndIndex + 1].element;
                    for (; toStartIndex <= toEndIndex; toStartIndex++) {
                        container.insertBefore(toChildren[toStartIndex].render(parent), before);
                    }
                } else if (toStartIndex > toEndIndex) {
                    for (; fromStartIndex <= fromEndIndex; fromStartIndex++) {
                        if (fromChildren[fromStartIndex] !== undefined) {
                            fromChildren[fromStartIndex].remove();
                        }
                    }
                }
            }

            return toChildren;
        }
    }

    patch.node = function (from, to) {
        var element = from.element;

        if (from === to) {
            return element;
        }
        var next = from.patch(to);

        var container = element.parentNode;
        if (container && next !== element) {
            container.replaceChild(next, element);
        }
        return next;
    };

    function Element(tagName, config, children) {

        this.tagName = tagName || 'div';
        config = config || {};
        this.children = children || [];
        this.props = config.props;
        this.attrs = config.attrs;
        this.attrsNS = config.attrsNS;
        this.events = config.events;
        this.callbacks = config.callbacks;
        this.data = config.data;
        this.element = undefined;
        this.parent = undefined;

        this.key = config.key != null ? config.key : null;

        this.namespace = config.attrs && config.attrs.xmlns || null;
        this.is = config.attrs && config.attrs.is || null;
    }

    Element.prototype = {};

    Element.prototype.match = function (to) {
        return !(this.type !== to.type || this.tagName !== to.tagName || this.key !== to.key || this.namespace !== to.namespace || this.is !== to.is);
    };

    Element.prototype.create = function () {
        return document.createElement(this.tagName);
    };

    Element.prototype.render = function (parent) {

        this.parent = parent;

        var element = this.element = this.create();

        if (this.children.length) {

            if (this.children.length === 1 && this.children[0]) {

                element.appendChild(this.children[0].render(this));
            } else if (this.children.length > 1) {
                for (var i = 0, len = this.children.length; i < len; i++) {

                    element.appendChild(this.children[i].render(this));
                }
            }
        }

        return element;
    };

    Element.prototype.remove = function (destroy) {

        if (destroy !== false) {
            this.destroy();
        }
    };
    Element.prototype.destroy = function () {

        var element = this.element;

        if (!element) {
            return;
        }
        var parentNode = element.parentNode;

        if (!parentNode) {
            return;
        }

        parentNode.removeChild(element);
    };

    Element.prototype.patch = function (to) {

        if (!this.match(to)) {
            this.remove(false);
            return to.render(this.parent);
        }

        to.element = this.element;

        patch(to.element, this.children, to.children, this.parent);

        return to.element;
    };

    var _element = Element;

    /**
     * The Virtual Text constructor.
     *
     * @param  String tagName  The tag name.
     * @param  Array  children An array for children.
     */
    function Text(text) {
        this.text = text;
        this.element = undefined;
    }

    Text.prototype.type = 'Text';

    /**
     * Creates and return the corresponding DOM node.
     *
     * @return Object A DOM node.
     */
    Text.prototype.create = function () {
        return document.createTextNode(this.text);
    };

    /**
     * Renders virtual text node.
     *
     * @return Object        A textual DOM element.
     */
    Text.prototype.render = function () {
        return this.element = this.create();
    };

    /**
     * Check if the node match another node.
     *
     * Note: nodes which doesn't match must be rendered from scratch (i.e. can't be patched).
     *
     * @param  Object  to A node representation to check matching.
     * @return Boolean
     */
    Text.prototype.match = function (to) {
        return this.type === to.type;
    };

    /**
     * Patches a node according to the a new representation.
     *
     * @param  Object to A new node representation.
     * @return Object    A DOM element, can be a new one or simply the old patched one.
     */
    Text.prototype.patch = function (to) {
        if (!this.match(to)) {
            this.remove(false);
            return to.render();
        }
        to.element = this.element;
        if (this.text !== to.text) {
            this.element.nodeValue = to.text;
        }
        return this.element;
    };

    /**
     * Removes the DOM node attached to the virtual node.
     */
    Text.prototype.remove = function (destroy) {
        if (destroy !== false) {
            this.destroy();
        }
    };

    /**
     * Destroys the DOM node attached to the virtual node.
     */
    Text.prototype.destroy = function () {
        var parentNode = this.element.parentNode;
        return parentNode.removeChild(this.element);
    };

    var Nodes_text = Text;

    var Trackira = {

        Element: _element,
        Text: Nodes_text,
        patch: patch

    };

    Trackira.version = '0.1.3';

    var trackira = Trackira;

    return trackira;
});
//# sourceMappingURL=./trackira.js.map
},{}]},{},[1])


//# sourceMappingURL=main.js.map