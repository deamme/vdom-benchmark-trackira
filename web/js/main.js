var benchmark = require('vdom-benchmark-base');
var Trackira = require('trackira');
var Element = Trackira.Element;
var Text = Trackira.Text;
var patch = Trackira.patch;

var NAME = 'Trackira';
var VERSION = Trackira.version;

function renderTree(nodes) {
  var children = [];
  var i;
  var n;

  for (i = 0; i < nodes.length; i++) {
    n = nodes[i];
    if (n.children !== null) {
      children.push(new Element("div", { key: n.key }, renderTree(n.children)));
    } else {
      children.push(new Element("span", { key: n.key }, [new Text(n.key.toString())]));
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
  this._node.detach();
};

BenchmarkImpl.prototype.render = function() {
  this._node = new Element("div", {}, renderTree(this.a));
  this._root = this._node.render();
  this.container.appendChild(this._root);
};

BenchmarkImpl.prototype.update = function() {
  var newNode = new Element("div", {}, renderTree(this.b));
  this._root = this._node.patch(newNode);
  this._node = newNode;
};

document.addEventListener('DOMContentLoaded', function(e) {
  benchmark(NAME, VERSION, BenchmarkImpl);
}, false);
