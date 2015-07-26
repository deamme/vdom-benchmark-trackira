(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"trackiraa":2,"vdom-benchmark-base":5}],2:[function(require,module,exports){
/**
 * conut - ConutJS
 * @Version: v0.0.1
 * @Author: Kenny Flashlight
 * @Homepage: http://trackira.github.io/trackira/
 * @License: MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.Conut = factory();
})(this, function () {
    'use strict';

    function Replace(oldNode, newNode) {
        this._oldNode = oldNode;
        this._newNode = newNode;
    }

    Replace.prototype = {
        applyTo: function applyTo(domNode) {
            this._oldNode.unmount();
            var newDomNode = this._newNode.renderToDom();
            domNode.parentNode.replaceChild(newDomNode, domNode);
            this._newNode.mount();
            return newDomNode;
        }
    };

    function RemoveChildren(childNodes) {
        this._childNodes = childNodes;
    }

    RemoveChildren.prototype = {
        applyTo: function applyTo(domNode) {
            var j = 0,
                childNodes = this._childNodes,
                len = childNodes.length;

            while (j < len) {
                childNodes[j++].unmount();
            }

            domNode.innerHTML = "";
        }
    };

    var RemoveChildrenOp = RemoveChildren;

    function AppendChild(childNode) {
        this._childNode = childNode;
    }

    AppendChild.prototype = {
        applyTo: function applyTo(domNode) {
            domNode.appendChild(this._childNode.renderToDom());
            this._childNode.mount();
        }
    };
    var AppendChildOp = AppendChild;

    function InsertChild(childNode, idx) {
        this._childNode = childNode;
        this._idx = idx;
    }

    InsertChild.prototype = {
        applyTo: function applyTo(domNode) {
            domNode.insertBefore(this._childNode.renderToDom(), domNode.childNodes[this._idx]);
            this._childNode.mount();
        }
    };
    var InsertChildOp = InsertChild;

    function MoveChild(idxFrom, idxTo) {
        this._idxFrom = idxFrom;
        this._idxTo = idxTo;
    }

    MoveChild.prototype = {
        applyTo: function applyTo(domNode) {
            var childDomNodes = domNode.childNodes;
            domNode.insertBefore(childDomNodes[this._idxFrom], childDomNodes[this._idxTo]);
        }
    };

    var MoveChildOp = MoveChild;

    function RemoveChild(childNode, idx) {
        this._childNode = childNode;
        this._idx = idx;
    }

    RemoveChild.prototype = {
        applyTo: function applyTo(domNode) {
            this._childNode.unmount();
            domNode.removeChild(domNode.childNodes[this._idx]);
        }
    };
    var RemoveChildOp = RemoveChild;

    var patchDom = function patchDom(domNode, patch) {
        var i = 0,
            len = patch.length,
            res;

        while (i < len) {
            if (res = patch[i++].applyTo(domNode)) {
                return res;
            }
        }
    };

    function UpdateChildren(children) {
        this._children = children;
    }

    UpdateChildren.prototype = {
        applyTo: function applyTo(domNode) {
            var j = 0,
                children = this._children,
                len = children.length,
                childDomNodes = domNode.childNodes,
                childPatch;

            while (j < len) {
                childPatch = children[j++];
                patchDom(childDomNodes[childPatch.idx], childPatch.patch);
            }
        }
    };

    var UpdateChildrenOp = UpdateChildren;

    var calcPatch = function calcPatch(treeA, treeB, res) {
        res || (res = []);
        treeA.calcPatch(treeB, res);
        return res;
    };

    function UpdateText(text) {
        this._text = text;
    }

    UpdateText.prototype = {
        applyTo: function applyTo(domNode) {
            domNode.nodeValue = this._text;
        }
    };

    function Text() {

        this.type = Text;
        this._text = "";
        this._key = null;
    }

    Text.prototype.text = function (text) {
        this._text = text;
        return this;
    };
    Text.prototype.key = function (key) {
        this._key = key;
        return this;
    };
    Text.prototype.renderToDom = function () {
        return document.createTextNode(this._text);
    };
    Text.prototype.mount = function () {};
    Text.prototype.unmount = function () {};
    Text.prototype.calcPatch = function (node, patch) {

        if (this.type !== node.type) {
            patch.push(new Replace(this, node));
        } else if (this._text !== node._text) {
            patch.push(new UpdateText(node._text));
        }
    };

    function Element(tag) {
        this._domNode = null;
        this.type = Element;
        this._tag = tag;
        this._key = null;
        this._ns = null;
        this._attrs = null;
        this._children = null;
        this._on = null;
        this._ctx = null;
        this._ref = null;
    }

    Element.prototype = {
        key: function key(_key) {
            this._key = _key;
            return this;
        },

        ns: function ns(_ns) {
            this._ns = _ns;
            return this;
        },

        attrs: function attrs(_attrs) {
            this._attrs = _attrs;
            return this;
        },

        children: function children(_children) {
            this._children = processChildren(_children);
            return this;
        },

        on: function on(_on) {
            this._on = _on;
            return this;
        },

        ref: function ref(_ref) {
            this._ref = _ref;
            return this;
        },

        renderToDom: function renderToDom(ctx) {
            var domNode = this._ns ? document.createElementNS(this._ns, this._tag) : document.createElement(this._tag),
                children = this._children,
                attrs = this._attrs,
                name,
                value;

            if (children) {
                var i = 0,
                    len = children.length;

                while (i < len) {
                    domNode.appendChild(children[i++].renderToDom(ctx));
                }
            }

            if (attrs) {
                for (name in attrs) {
                    //                (value = attrs[name]) != null &&
                    //                  ATTRS_TO_EVENTS[name]?
                    //                    domEventManager.addListener(domNode, ATTRS_TO_EVENTS[name], value) :
                    //                  domAttrsMutators(name).set(domNode, name, value);
                }
            }

            this._domNode = domNode;

            if (ctx) {
                this._ctx = ctx;
                this._ref && ctx.setRef(this._ref, domNode);
            }

            return domNode;
        },

        mount: function mount() {
            var children = this._children;

            if (children) {
                var i = 0,
                    len = children.length;

                while (i < len) {
                    children[i++].mount();
                }
            }
        },

        unmount: function unmount() {
            var children = this._children;

            if (children) {
                var i = 0,
                    len = children.length;

                while (i < len) {
                    children[i++].unmount();
                }
            }

            // domEventManager.removeListeners(this._domNode);
        },

        calcPatch: function calcPatch(node, patch) {
            if (this.type !== node.type || this._tag !== node._tag || this._ns !== node._ns) {
                patch.push(new Replace(this, node));
            } else {
                this._calcChildrenPatch(node, patch);
                this._calcAttrsPatch(node, patch);

                if (this._domNode) {
                    node._domNode = this._domNode;
                    node._ctx = this._ctx;

                    if (node._ctx && node._ref) {
                        node._ctx.setRef(node._ref, node._domNode);
                    }
                }
            }
        },

        _calcChildrenPatch: function _calcChildrenPatch(node, patch) {
            var childrenA = this._children,
                childrenB = node._children,
                hasChildrenA = childrenA && childrenA.length,
                hasChildrenB = childrenB && childrenB.length;

            if (!hasChildrenB) {
                hasChildrenA && patch.push(new RemoveChildrenOp(childrenA));
                return;
            }

            var iB = 0;

            if (!hasChildrenA) {

                while (iB < childrenB.length) {
                    patch.push(new AppendChildOp(childrenB[iB++]));
                }
                return;
            }

            var childrenALen = childrenA.length,
                childrenBLen = childrenB.length,
                childrenPatch = [];

            if (childrenALen === 1 && childrenBLen === 1) {
                addChildPatchToChildrenPatch(childrenA[0], childrenB[0], 0, childrenPatch);
            } else {
                var iA = 0,
                    childA,
                    childB,
                    childAKey,
                    childBKey,
                    childrenAKeys,
                    childrenBKeys,
                    skippedAIndices = {},
                    minMovedAIdx = childrenALen,
                    foundAIdx,
                    foundIdx,
                    foundChildA,
                    skippedCnt;

                iB = 0;
                while (iB < childrenBLen) {
                    childB = childrenB[iB];

                    while (skippedAIndices[iA]) {
                        ++iA;
                    }

                    if (iA >= childrenALen) {
                        patch.push(new AppendChildOp(childB));
                        ++iB;
                    } else {
                        childA = childrenA[iA];
                        childAKey = childA._key;
                        childBKey = childB._key;
                        if (childBKey != null) {
                            if (childAKey === childBKey) {
                                addChildPatchToChildrenPatch(childA, childB, iB, childrenPatch);
                                ++iA;
                                ++iB;
                            } else {
                                childrenAKeys || (childrenAKeys = buildKeys(childrenA));
                                if (childBKey in childrenAKeys) {
                                    childrenBKeys || (childrenBKeys = buildKeys(childrenB));
                                    if (childAKey == null || !(childAKey in childrenBKeys)) {
                                        patch.push(new RemoveChildOp(childA, iB));
                                        ++iA;
                                    } else {
                                        foundAIdx = childrenAKeys[childBKey];
                                        skippedCnt = 0;
                                        if (foundAIdx < minMovedAIdx) {
                                            minMovedAIdx = foundAIdx;
                                        } else {
                                            for (var j = iA + 1; j < foundAIdx; j++) {
                                                skippedAIndices[j] && ++skippedCnt;
                                            }
                                        }

                                        foundIdx = foundAIdx - skippedCnt + iB - iA;
                                        foundChildA = childrenA[foundAIdx];
                                        skippedAIndices[foundAIdx] = true;

                                        foundIdx !== iB && patch.push(new MoveChildOp(foundIdx, iB));
                                        addChildPatchToChildrenPatch(foundChildA, childB, iB, childrenPatch);
                                        ++iB;
                                    }
                                } else {
                                    childrenBKeys || (childrenBKeys = buildKeys(childrenB));
                                    if (childAKey != null && !(childAKey in childrenBKeys)) {
                                        addChildPatchToChildrenPatch(childA, childB, iB, childrenPatch);
                                        ++iA;
                                    } else {
                                        patch.push(new InsertChildOp(childB, iB));
                                    }

                                    ++iB;
                                }
                            }
                        } else if (childAKey != null) {
                            childrenBKeys || (childrenBKeys = buildKeys(childrenB));
                            if (childAKey in childrenBKeys) {
                                patch.push(new InsertChildOp(childB, iB));
                                ++iB;
                            } else {
                                patch.push(new RemoveChildOp(childA, iB));
                                ++iA;
                            }
                        } else {
                            addChildPatchToChildrenPatch(childA, childB, iB, childrenPatch);
                            ++iA;
                            ++iB;
                        }
                    }
                }

                while (iA < childrenALen) {
                    skippedAIndices[iA] || patch.push(new RemoveChildOp(childrenA[iA], iB));
                    ++iA;
                }
            }

            childrenPatch.length && patch.push(new UpdateChildrenOp(childrenPatch));
        },

        _calcAttrsPatch: function _calcAttrsPatch(node, patch) {
            var attrsA = this._attrs,
                attrsB = node._attrs,
                attrName,
                attrAVal,
                attrBVal;

            if (attrsB) {
                for (attrName in attrsB) {
                    attrBVal = attrsB[attrName];
                    if (!attrsA || (attrAVal = attrsA[attrName]) == null) {
                        if (attrBVal != null) {
                            patch.push(new UpdateAttrOp(attrName, attrBVal));
                        }
                    } else if (attrBVal == null) {
                        patch.push(new RemoveAttrOp(attrName));
                    } else if (typeof attrBVal === "object" && typeof attrAVal === "object") {
                        calcAttrObjPatch(attrName, attrAVal, attrBVal, patch);
                    } else if (attrAVal !== attrBVal) {
                        patch.push(new UpdateAttrOp(attrName, attrBVal));
                    }
                }
            }

            if (attrsA) {
                for (attrName in attrsA) {
                    if ((!attrsB || !(attrName in attrsB)) && (attrAVal = attrsA[attrName]) != null) {
                        patch.push(new RemoveAttrOp(attrName));
                    }
                }
            }
        }
    };

    function calcAttrObjPatch(attrName, objA, objB, patch) {
        var hasDiff = false,
            diffObj = {},
            i;

        for (i in objB) {
            if (objA[i] != objB[i]) {
                hasDiff = true;
                diffObj[i] = objB[i];
            }
        }

        for (i in objA) {
            if (objA[i] != null && !(i in objB)) {
                hasDiff = true;
                diffObj[i] = null;
            }
        }

        hasDiff && patch.push(new UpdateAttrOp(attrName, diffObj));
    }

    function addChildPatchToChildrenPatch(childA, childB, idx, childrenPatch) {
        var childPatch = [];
        calcPatch(childA, childB, childPatch);
        childPatch.length && childrenPatch.push({
            idx: idx,
            patch: childPatch
        });
    }

    function processChildren(children) {
        return typeof children === "string" ? [new Text().text(children)] : children && (Array.isArray(children) ? children : [children]);
    }

    function buildKeys(children) {
        var res = {},
            i = 0,
            len = children.length,
            child;

        while (i < len) {
            child = children[i];
            child._key != null && (res[child._key] = i);
            ++i;
        }

        return res;
    }

    /**
     * Virtual Component node
     */
    function Component(component) {

        this.type = Component;
        this._component = component;
        this._key = null;
        this._attrs = null;
        this._props = null;
        this._instance = null;
        this._children = null;
        this._ref = null;
    }

    Component.prototype.key = function (key) {
        this._key = key;
        return this;
    };

    Component.prototype.attrs = function (attrs) {
        this._attrs = attrs;
        return this;
    };

    Component.prototype.props = function (props) {
        this._props = props;
        return this;
    };

    Component.prototype.children = function (children) {
        this._children = children;
        return this;
    };

    Component.prototype.render = function () {
        return document.createTextNode(this._text);
    };
    Component.prototype.mount = function () {
        this._instance.mount();
    };
    Component.prototype.unmount = function () {
        if (this._instance) {
            this._instance.unmount();
            this._instance = null;
        }
    };
    Component.prototype.patch = function (node, patch) {};

    var createNode = function createNode(type) {

        // TODO! Whitelist this one later on with valid 'tagNames'
        if (typeof type === "string") {
            return new Element(type);
        } else if (typeof type === "function") {
            return new Component(type);
        } else {
            return new Text(type);
        }
    };

    var mountComponent = function mountComponent() {

        this._isMounted = true;
        this._rootNode.mount();
        this.onMount(this._attrs);
    };


    var unmountComponent = function unmountComponent() {

        this._isMounted = false;
        this._refs = null;
        this._rootNode.unmount();
        this.onUnmount();
    };

    var isComponentMounted = function isComponentMounted() {
        return this._isMounted;
    };

    var renderComponentToDom = function renderComponentToDom() {
        return this._domNode = this._rootNode.renderToDom(this);
    };

    var patchComponentDom = function patchComponentDom(patch) {

        var newDomNode = patchDom(this._domNode, patch);
        if (newDomNode) {
            this._domNode = newDomNode;
        }
        this.onUpdate();
    };

    var emptyAttrs = {};

    var renderComponent = function renderComponent() {

        this._refs = {};

        return this.onRender(this._attrs || emptyAttrs, this._children) || createNode("noscript");
    };

    var raf = function raf(callback) {
        return setTimeout(callback, 1000 / 60);
    },
        batch = [];

    function applyBatch() {
        var i = 0,
            item;

        while (i < batch.length) {
            item = batch[i++];
            item.fn.call(item.fnCtx || this);
        }

        batch = [];
    }

    var core_raf = function core_raf(fn, fnCtx) {
        batch.push({
            fn: fn,
            fnCtx: fnCtx
        }) === 1 && raf(applyBatch);
    };

    var updateComponent = function updateComponent(cb, cbCtx) {

        var patch = this.calcPatch(this._attrs, this._children);

        if (patch.length) {
            core_raf(function () {
                if (this.isMounted()) {
                    this.patchDom(patch);
                    if (cb) {
                        cb.call(cbCtx || this);
                    }
                }
            }, this);
        } else {
            if (cb) {
                cb.call(cbCtx || this);
            }
        }
    };

    var calcComponentPatch = function calcComponentPatch(attrs, children) {

        var prevRootNode = this._rootNode,
            prevAttrs = this._attrs;

        if (prevAttrs !== attrs) {
            this._attrs = attrs;
            if (this.isMounted()) {
                this.onAttrsReceive(attrs || {}, prevAttrs || {});
            }
        }

        this._children = children;
        this._rootNode = this.render();

        if (!this.isMounted()) {
            return [];
        }

        return calcPatch(prevRootNode, this._rootNode);
    };

    var getComponentRef = function getComponentRef(ref) {
        return this._refs[ref] || null;
    };

    var setComponentRef = function setComponentRef(ref, domNode) {
        this._refs[ref] = domNode;
    };

    var updateComponentSync = function updateComponentSync() {

        var patch = this.calcPatch(this._attrs, this._children);
        if (patch.length) {
            this.patchDom(patch);
        }
    };

    function createComponent(props, staticProps) {

        var res = function res(attrs, children) {

            this._attrs = attrs;
            this._children = children;
            this._refs = null;
            this._rootNode = this.render();
            this._domNode = null;
            this._isMounted = false;
        };

        var i,
            ptp = {

            mount: mountComponent,
            unmount: unmountComponent,
            onMount: function onMount() {},
            onUnmount: function onUnmount() {},
            onAttrsReceive: function onAttrsReceive() {},
            onUpdate: function onUpdate() {},
            isMounted: isComponentMounted,
            renderToDom: renderComponentToDom,
            patchDom: patchComponentDom,
            render: renderComponent,
            onRender: function onRender() {},
            update: updateComponent,
            updateSync: updateComponentSync,
            calcPatch: calcComponentPatch,
            getRef: getComponentRef,
            setRef: setComponentRef

        };

        for (i in props) {

            ptp[i] = props[i];
        }

        res.prototype = ptp;
        for (i in staticProps) {
            res[i] = staticProps[i];
        }
        return res;
    }

    var ID_PROP = "__trackira__id__",
        getDomNodeId__counter = 1;

    var getDomNodeId = function getDomNodeId(node, onlyGet) {
        return node[ID_PROP] || (onlyGet ? null : node[ID_PROP] = getDomNodeId__counter++);
    };

    var mountedNodes = {},
        mount__counter = 0;

    function _mountToDom(domNode, tree, cb, cbCtx, syncMode) {
        var domNodeId = getDomNodeId(domNode),
            prevMounted = mountedNodes[domNodeId],
            mountId;

        if (prevMounted && prevMounted.tree) {
            var patch = calcPatch(prevMounted.tree, tree);
            if (patch.length) {
                mountId = ++prevMounted.id;
                var patchFn = function patchFn() {
                    if (mountedNodes[domNodeId] && mountedNodes[domNodeId].id === mountId) {
                        prevMounted.tree = tree;
                        patchDom(domNode.childNodes[0], patch);
                        callCb(cb, cbCtx);
                    }
                };
                syncMode ? patchFn() : core_raf(patchFn);
            } else if (!syncMode) {
                callCb(cb, cbCtx);
            }
        } else {
            mountedNodes[domNodeId] = {
                tree: null,
                id: mountId = ++mount__counter
            };
            var renderFn = function renderFn() {
                if (mountedNodes[domNodeId] && mountedNodes[domNodeId].id === mountId) {
                    mountedNodes[domNodeId].tree = tree;
                    domNode.appendChild(tree.renderToDom());
                    tree.mount();
                    callCb(cb, cbCtx);
                }
            };

            syncMode ? renderFn() : core_raf(renderFn);
        }
    }

    function _unmountFromDom(domNode, cb, cbCtx, syncMode) {
        var domNodeId = getDomNodeId(domNode),
            prevMounted = mountedNodes[domNodeId];

        if (prevMounted) {
            var mountId = ++prevMounted.id,
                unmountFn = function unmountFn() {
                var mounted = mountedNodes[domNodeId];
                if (mounted && mounted.id === mountId) {
                    mounted.tree && mounted.tree.unmount();
                    delete mountedNodes[domNodeId];
                    domNode.innerHTML = "";
                    callCb(cb, cbCtx);
                }
            };

            prevMounted.tree ? syncMode ? unmountFn() : core_raf(unmountFn) : syncMode || callCb(cb, cbCtx);
        } else if (!syncMode) {
            callCb(cb, cbCtx);
        }
    }

    function callCb(cb, cbCtx) {
        cb && cb.call(cbCtx || this);
    }

    var mount = {
        mountToDom: function mountToDom(domNode, tree, cb, cbCtx) {
            _mountToDom(domNode, tree, cb, cbCtx, false);
        },

        mountToDomSync: function mountToDomSync(domNode, tree) {
            _mountToDom(domNode, tree, null, null, true);
        },

        unmountFromDom: function unmountFromDom(domNode, cb, cbCtx) {
            _unmountFromDom(domNode, cb, cbCtx, false);
        },

        unmountFromDomSync: function unmountFromDomSync(domNode) {
            _unmountFromDom(domNode, null, null, true);
        }
    };

    var conut = {

        /**
         * Creates a virtual node with the given tagName.
         */

        createNode: createNode,
        /**
         * Creates a component class.
         */

        createComponent: createComponent,

        /**
         * Mount a virtual tree
         */
        mountToDom: mount.mountToDom,

        /**
         * Unmount a virtual tree
         */
        mountToDomSync: mount.mountToDomSync,

        mountToDomSync: mount.unmountFromDom,

        mountToDomSync: mount.unmountFromDomSync
    };

    /**
     * Current version of the library
     */
    conut.version = "0.0.1";

    return conut;
});
//# sourceMappingURL=./conut.js.map
//window.requestAnimationFrame ||
//window.webkitRequestAnimationFrame ||
//window.mozRequestAnimationFrame ||
},{}],3:[function(require,module,exports){
'use strict';

var Executor = require('./executor');

function Benchmark() {
  this.running = false;
  this.impl = null;
  this.tests = null;
  this.reportCallback = null;
  this.enableTests = false;

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
    }, undefined, false).start();
  }, undefined, this.enableTests).start();
};

module.exports = Benchmark;

},{"./executor":4}],4:[function(require,module,exports){
'use strict';

function render(nodes) {
  var children = [];
  var j;
  var c;
  var i;
  var e;
  var n;

  for (i = 0; i < nodes.length; i++) {
    n = nodes[i];
    if (n.children !== null) {
      e = document.createElement('div');
      c = render(n.children);
      for (j = 0; j < c.length; j++) {
        e.appendChild(c[j]);
      }
      children.push(e);
    } else {
      e = document.createElement('span');
      e.textContent = n.key.toString();
      children.push(e);
    }
  }

  return children;
}

function testInnerHtml(testName, nodes, container) {
  var c = document.createElement('div');
  var e = document.createElement('div');
  var children = render(nodes);
  for (var i = 0; i < children.length; i++) {
    e.appendChild(children[i]);
  }
  c.appendChild(e);
  if (c.innerHTML !== container.innerHTML) {
    console.log('error in test: ' + testName);
    console.log('container.innerHTML:');
    console.log(container.innerHTML);
    console.log('should be:');
    console.log(c.innerHTML);
  }
}


function Executor(impl, container, tests, iterations, cb, iterCb, enableTests) {
  if (iterCb === void 0) iterCb = null;

  this.impl = impl;
  this.container = container;
  this.tests = tests;
  this.iterations = iterations;
  this.cb = cb;
  this.iterCb = iterCb;
  this.enableTests = enableTests;

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

      if (this.enableTests) {
        testInnerHtml(test.name + 'render()', test.data.a, this.container);
      }

      t = window.performance.now();
      e.update();
      updateTime = window.performance.now() - t;

      if (this.enableTests) {
        testInnerHtml(test.name + 'update()', test.data.b, this.container);
      }

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

},{}],5:[function(require,module,exports){
'use strict';

var Benchmark = require('./benchmark');
var benchmark = new Benchmark();

function initFromScript(scriptUrl, impl) {
  var e = document.createElement('script');
  e.src = scriptUrl;

  e.onload = function() {
    benchmark.tests = window.generateBenchmarkData();
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

  if (qs['test'] !== void 0) {
    benchmark.enableTests = true;
    console.log('tests enabled');
  }

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

},{"./benchmark":3}]},{},[1])


//# sourceMappingURL=main.js.map