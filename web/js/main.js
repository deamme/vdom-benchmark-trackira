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