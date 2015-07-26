var benchmark = require('vdom-benchmark-base');
var Conut = require('trackiraa');

var NAME = 'Conut';
var VERSION = "0.1";

function renderTree(nodes) {
  var children = [];
  var i;
  var n;

  for (i = 0; i < nodes.length; i++) {
    n = nodes[i];
    if (n.children !== null) {
      children.push(Conut.createNode('div').key(n.key).children(renderTree(n.children)));
    } else {
      children.push(Conut.createNode().key(n.key).text(n.key.toString()));
    }
  }

  return children;
}

function BenchmarkImpl(container, a, b) {
  this.container = container;
  this.a = a;
  this.b = b;
  this._node = null;
  this._root = null;
}

BenchmarkImpl.prototype.setUp = function() {
};

BenchmarkImpl.prototype.tearDown = function() {
  Conut.unmountFromDomSync(this.container);
};

BenchmarkImpl.prototype.render = function() {
   Conut.mountToDomSync(
    this.container,
    Conut.createNode('div').children(renderTree(this.a)));
};

BenchmarkImpl.prototype.update = function() {
 Conut.mountToDomSync(
    this.container,
    Conut.createNode('div').children(renderTree(this.b)));
};

document.addEventListener('DOMContentLoaded', function(e) {
  benchmark(NAME, VERSION, BenchmarkImpl);
}, false);
