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