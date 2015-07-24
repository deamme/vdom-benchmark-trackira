(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var benchmark = require('vdom-benchmark-base');
var Trackira = require('trackiraa/Trackira');
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
},{"trackiraa/Trackira":2,"vdom-benchmark-base":5}],2:[function(require,module,exports){
/**
 * trackira - Virtual DOM boilerplate
 * @Version: v0.1.8b
 * @Author: Kenny Flashlight
 * @Homepage: http://trackira.github.io/trackira/
 * @License: MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.Trackira = factory();
})(this, function () {
    'use strict';

    // Various flags indication that the virtual node is a...

    // ... Text node
    var flags__TEXT = 0x0001;
    // ...  Element node
    var flags__ELEMENT = 0x0002;
    // ... Comment node
    var flags__COMMENT = 0x0003;

    var ampRegEx = /&/g,
        lessThanRegEx = /</g,
        greaterThanRegEx = />/g;

    /**
     * Returns a string with ampersand, less-than, and greater-than characters replaced with HTML
     * entities, e.g.,
     * ```
     * '&lt;code&gt;'This &amp; That'&lt;/code&gt;'
     * ```
     * becomes
     * ```
     * '&amp;lt;code&amp;gt;'This &amp;amp; That'&amp;lt;/code&amp;gt;'
     * ```
     *
     * @param {String} value - A string with entities you'd like to escape/convert.
     * @returns {String} A string that is properly escaped (the above characters.)
     * @public
     */
    var escapeHtml = function escapeHtml(value) {
        return value.replace(ampRegEx, "&amp;").replace(lessThanRegEx, "&lt;").replace(greaterThanRegEx, "&gt;");
    };

    function Text(text) {

        /**
         * The text content of a Text node.
         */
        this.text = text;
    }

    /**
     * The type, used to identify the type of this node
     */
    Text.prototype.flag = flags__TEXT;

    /**
     * Creates a virtual text node.
     * @return {!Text}
     */
    Text.prototype.create = function () {
        if (!this.node) {
            this.node = document.createTextNode(this.text);
        }
        return this.node;
    };

    /**
     * Render a virtual text node
     *
     * @return Object
     */
    Text.prototype.render = function () {
        return this.create();
    };

    /**
     * Attaches an existing textual DOM element.
     *
     * @param  {Object} node
     * @return {Object}
     */
    Text.prototype.append = function (node) {
        return this.node = node;
    };

    /**
     * Patches the node by updating the nodeValue.
     *
     * @param {object} to Contains the next text content.
     * @return {Object}
     */
    Text.prototype.patch = function (ref) {

        if (this.equalTo(ref)) {

            ref.node = this.node;

            // .nodeValue gives better performance then textContent
            // http://jsperf.com/update-textcontent-vs-data-vs-nodevalue
            if (ref.text !== this.text) {
                this.node.nodeValue = ref.text;
            }

            return this.node;
        }

        // re-render...
        ref.render();
    };

    /**
     * Destroys the text node attached to the virtual node.
     */
    Text.prototype.destroy = function () {
        var node = this.node;
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    };

    /**
     * Creates an html markup of the text node. This node is not intended to have
     * any features besides containing text content. 
     *
     * Note! The text node will only be escaped if a boolean ( true ) are passed in as
     * the first argument.
     *
     * @param {Boolean} escape
     *
     */
    Text.prototype.toHTML = function (escape) {
        if (escape) {
            return escapeHtml(this.text);
        } else {
            return this.text;
        }
    };

    /**
     * Removes the DOM node attached to the virtual node.
     */
    Text.prototype.detach = function () {
        this.destroy();
    };

    /**
     * Checks if two virtual text nodes are equal to each other, and they can be updated.
     *
     * @param {Object} to
     * @return {boolean}
     */
    Text.prototype.equalTo = function (node) {
        return this.flag === node.flag;
    };

    var trimRegExp = /-{2,}/g;

    /**
     * Initialize a new `Comment`.
     *
     * @param {String} comment
     */
    function Comment(comment) {
        /**
         * The text content of a Comment node.
         */
        this.text = comment;
    }

    /**
     * The type, used to identify the type of this node
     */
    Comment.prototype.flag = flags__COMMENT;

    /**
     * Creates a virtual comment node.
     * @return {!Comment}
     */
    Comment.prototype.create = function () {
        if (!this.node) {
            this.node = document.createComment(this.text);
        }
        return this.node;
    };

    /**
     * Render and return a virtual comment node
     *
     * @return Object
     */
    Comment.prototype.render = function () {
        return this.create();
    };

    /**
     * Patches the node by updating the nodeValue.
     *
     * @param {object} to Contains the next text content.
     * @return {Object}
     */
    Comment.prototype.patch = function (ref) {

        if (this.equalTo(ref)) {

            // .nodeValue gives better performance then textContent
            // http://jsperf.com/update-textcontent-vs-data-vs-nodevalue
            if (ref.text !== this.text) {
                this.node.nodeValue = ref.text;
            }
            return ref.node = this.node;
        }

        // re-render...
        ref.render();
    };

    /**
     * Append an existing textual DOM element.
     *
     * @param  {Object} node
     * @return {Object}
     */
    Comment.prototype.append = function (node) {
        return this.node = node;
    };

    /**
     * Returns an html representation of the comment node.
     */
    Comment.prototype.toHTML = function () {
        return "<!-- " + this.text.replace(trimRegExp, "-") + " -->";
    };

    /**
     * Destroys the text node attached to the virtual node.
     */
    Comment.prototype.destroy = function () {
        var node = this.node;
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    };

    /**
     * Removes the DOM node attached to the virtual node.
     */
    Comment.prototype.detach = function () {

        this.destroy();
    };

    /**
     * Checks if two virtual comment nodes are equal to each other, and if they can be updated.
     *
     * @param {Object} to
     * @return {boolean}
     */
    Comment.prototype.equalTo = function (node) {
        return this.flag === node.flag;
    };

    var isArray = function isArray(value) {
        return value instanceof Array;
    };

    var normalizeChildren = function normalizeChildren(children) {

        if (typeof children === "function") {
            children = [children(children)];
        } else if (!isArray(children)) {
            children = [children];
        }

        return children;
    };

    var append = function append(node, children, parent) {

        /**
         * NOTE!! 
         *
         * The server side rendring only works if there exist a 'parent container', and
         * child nodes as a HTML markup. E.g. <div id="mount-point"><div>Foo</div></div>
         */

        if (node) {
            // normalize child nodes
            children = normalizeChildren(children, parent);

            var i = 0,
                j = 0,
                childNodes = node.childNodes,
                nodesLen = children.length,
                text,
                textLen,
                size;

            while (i < nodesLen) {

                if (children[i]) {

                    // Virtual text -and comment nodes
                    if (childNodes[j] !== undefined && (children[i].flag === flags__COMMENT || children[i].flag === flags__TEXT)) {

                        size = children[i].text.length;
                        text = childNodes[j].data;

                        // stop here if no text...
                        if (text) {

                            children[i].text = text;
                            children[i].append(childNodes[j], parent);
                            i++;

                            textLen = text.length;

                            while (size < textLen && i < nodesLen) {

                                size += children[i].text.length;
                                children[i].text = "";
                                i++;
                            }
                        }
                        // Element node...
                    } else {

                            children[i].append(childNodes[j], parent);
                            i++;
                        }
                    j++;
                }
                return children;
            }
        }
    };

    /**
      * Combines multiple className strings into one.
      *
      * @param {String|Number|Object} className
      * @return {string}
      */
    var processClasses = function processClasses(className) {

        // quick 'bail out' if 'className' is a string, number or a date value

        if (typeof className === "string" || typeof className === "number" || className instanceof Date) {

            return className;
        }

        if (typeof className === "object") {

            var key,
                classes = "";

            for (key in className) {

                if (className[key]) {

                    classes += " " + key;
                }
            }
            // https://jsperf.com/slice-vs-substr-vs-substring-methods-long-string/88
            return classes.substr(1);
        }
    };

    var renderProperties = function renderProperties(node, props) {

        var propKey, propValue;

        for (propKey in props) {

            propValue = props[propKey];

            if (propValue !== undefined) {

                if (propKey === "className") {
                    node.className = processClasses(propValue);
                } else if (propKey === "type") {

                    var value = node.value;
                    node[propKey] = propValue;
                    node.value = value;
                } else {
                    node[propKey] = propValue;
                }
            }
        }
    };

    var prototype_append = function prototype_append(node) {

        // If current HTML node don't have any child nodes when we are doing
        // server-rendring, the node will be set to 'undefined'

        if (node) {
            var props = this.props;
            var children = this.children;
            var events = this.events;
            var hooks = this.hooks;

            this.node = node;

            // Append properties
            if (props) {
                renderProperties(node, props);
            }

            // Append children   
            if (children.length) {
                append(node, children, this);
            }

            // Handle events
            if (events) {

                node._handler = this;
            }

            // Handle hooks
            if (hooks && hooks.created) {

                hooks.created(this, node);
            }

            return node;
        }
    };

    /**
     * Creates an Element.
     * @return {!Element}
     */
    var create = function create() {
        var namespace = this.namespace;
        var tagName = this.tagName;
        var typeExtension = this.typeExtension;
        var doc = document;

        if (typeExtension) {
            return namespace ? doc.createElementNS(namespace, tagName, typeExtension) : doc.createElement(tagName, typeExtension);
        } else {
            return namespace ? doc.createElementNS(namespace, tagName) : doc.createElement(tagName);
        }
    };

    // For HTML, certain tags should omit their close tag. We keep a whitelist for
    // those special cased tags

    var selfClosing = {
        "area": 1,
        "base": 1,
        "br": 1,
        "col": 1,
        "command": 1,
        "embed": 1,
        "hr": 1,
        "img": 1,
        "input": 1,
        "keygen": 1,
        "link": 1,
        //    "menuitem": 1,
        "meta": 1,
        "param": 1,
        "source": 1,
        "track": 1,
        "wbr": 1
        // NOTE: menuitem's close tag should be omitted, but that causes problems.
    };

    /**
     *  Creates markup for HTML class / className attribute / properties
     *
     * @param {Object} value
     * @return {String}
     * @example
     *
     * new Trackira.Element("div", attrs: { class: { "foo":true, "bar":false, "baz":true } }).toHTML();
     *
     * Result:  <div class="foo baz"></div>   // "bar" are skipped because it's a falsy value
     */
    var createMarkupForClass = function createMarkupForClass(value) {

        if (typeof value === "string" || typeof value === "number" || value instanceof Date) {

            return value;
        }

        var key,
            markup = "";

        for (key in value) {

            // the value will only be stringified if the value itself is true
            if (value[key]) {

                markup += key + " ";
            }
        }

        return markup.trim();
    };

    /**
     *  Creates markup for CSS style values
     *
     * @param {Object} styles
     * @return {String}
     */

    var createMarkupForStyles = function createMarkupForStyles(styles) {

        if (typeof styles === "object") {

            var styleName,
                styleValue,
                serialized = "";
            for (styleName in styles) {

                if (styles[styleName]) {

                    styleValue = styles[styleName];
                    if (styleValue !== undefined) {

                        serialized += styleName + ":";
                        serialized += typeof styleValue === "number" ? styleValue + "px" : styleValue;
                        serialized += ";";
                    }
                }
            }
            return serialized;
        }
        return styles;
    };

    var createMarkupForAttributes = function createMarkupForAttributes(attrs, tagName) {

        var markup = "",
            key,
            val;

        if (attrs) {

            for (key in attrs) {

                if (key !== "innerHTML") {

                    val = attrs[key];

                    if (val) {

                        // Special case for style. We need to iterate over all rules to create a
                        // hash of applied css properties.
                        if (key === "style") {

                            val = createMarkupForStyles(val);
                        }
                        // Special case for class.
                        if (key === "class") {

                            val = createMarkupForClass(val);
                        }

                        // Special case - select and textarea values (should not be stringified)
                        //              - contenteditable should be ignored
                        if (!(key === "value" && (tagName === "textarea" || tagName === "select" || attrs.contenteditable))) {

                            markup += " " + key + "=\"" + "" + val + "\"";
                        }
                    }
                }
            }
            return markup;
        }
    };

    var whitelist = {
        /**
         * Standard Properties
         */
        accept: true,
        acceptCharset: true,
        accessKey: true,
        action: true,
        allowFullScreen: 1,
        allowTransparency: true,
        alt: true,
        async: 1,
        autocomplete: true,
        autofocus: 1,
        autoplay: 1,
        capture: 1,
        cellPadding: true,
        cellSpacing: true,
        charset: true,
        challenge: true,
        checked: 1,
        classID: true,
        className: true,
        cols: true,
        colSpan: true,
        content: true,
        contentEditable: true,
        contextMenu: true,
        controls: 1,
        coords: true,
        crossOrigin: true,
        currentTime: true,
        data: true,
        dateTime: true,
        defer: 1,
        dir: true,
        disabled: 1,
        download: 2,
        draggable: true,
        enctype: true,
        form: true,
        formAction: true,
        formEncType: true,
        formMethod: true,
        formNoValidate: 1,
        formTarget: true,
        frameBorder: true,
        headers: true,
        height: true,
        hidden: 1,
        href: true,
        hreflang: true,
        htmlFor: true,
        httpEquiv: true,
        icon: true,
        id: true,
        is: true,
        keyParams: true,
        keyType: true,
        label: true,
        lang: true,
        list: true,
        loop: 1,
        low: true,
        manifest: true,
        marginHeight: true,
        marginWidth: true,
        max: true,
        maxLength: true,
        media: true,
        mediaGroup: true,
        method: true,
        min: true,
        minLength: true,
        multiple: 1,
        muted: 1,
        name: true,
        noValidate: 1,
        open: true,
        optimum: true,
        pattern: true,
        placeholder: true,
        playbackRate: true,
        poster: true,
        preload: true,
        radiogroup: true,
        readOnly: 1,
        rel: true,
        required: 1,
        role: true,
        rows: true,
        rowSpan: true,
        sandbox: true,
        scope: true,
        scoped: 1,
        scrolling: true,
        seamless: 1,
        selected: 1,
        shape: true,
        size: true,
        sizes: true,
        span: true,
        spellcheck: true,
        src: true,
        srcdoc: true,
        srcset: true,
        srcObject: true,
        start: true,
        step: true,
        style: true,
        tabIndex: true,

        target: true,
        title: true,
        type: true,
        useMap: true,
        value: true,
        volume: true,
        width: true,
        wmode: true,

        /**
         * Non-standard Properties
         */
        // autoCapitalize and autoCorrect are supported in Mobile Safari for
        // keyboard hints.
        autocapitalize: true,
        autocorrect: true,
        // itemProp, itemScope, itemType are for Microdata support. See
        // http://schema.org/docs/gs.html
        itemProp: true,
        itemScope: 1,
        itemType: true,
        // itemID and itemRef are for Microdata support as well but
        // only specified in the the WHATWG spec document. See
        // https://html.spec.whatwg.org/multipage/microdata.html#microdata-dom-api
        itemID: true,
        itemRef: true,
        // property is supported for OpenGraph in meta tags.
        property: true,
        // IE-only attribute that controls focus behavior
        unselectable: true
    };

    var attributeNames = {
        acceptCharset: "accept-charset",
        className: "class",
        htmlFor: "for",
        httpEquiv: "http-equiv"
    };

    var createAttribute = function createAttribute(key, value) {

        key = (attributeNames[key] || key).toLowerCase();

        var attrType = whitelist[key];

        // a boolean `value` has to be truthy
        // and a overloaded boolean `value` has to be === true
        if (attrType === 1 || attrType === 2 && value === true) {

            return escapeHtml(key);
        }
        return key + "=\"" + "" + value + "\"";
    };

    var createMarkupForProperties = function createMarkupForProperties(props) {

        var markup = "",
            attr,
            propValue,
            propKey;

        for (propKey in props) {

            if (propKey !== "innerHTML") {

                propValue = props[propKey];

                if (propValue) {

                    // Special case: "style"
                    if (propKey === "style") {

                        propValue = createMarkupForStyles(propValue);
                    }

                    // Special case: "class"
                    if (propKey === "className") {

                        propValue = createMarkupForClass(propValue);
                    }

                    attr = createAttribute(propKey, propValue);

                    if (attr) {

                        markup += " " + attr;
                    }
                }
            }
        }
        return markup;
    };

    var toHTML = function toHTML() {
        var attrs = this.attrs;
        var props = this.props;
        var children = this.children;
        var tagName = this.tagName;

        tagName = tagName.toLowerCase();

        var innerHTML = props && props.innerHTML,
            html = "<" + tagName;

        // create markup for ...

        // ...HTML attributes
        if (attrs) {

            html += createMarkupForAttributes(attrs, tagName);
        }

        // ... HTML properties
        if (props) {

            html += createMarkupForProperties(props);
        }

        html = html + ">";

        // ... child nodes
        if (children.length) {

            if (children.length === 1) {

                html += children[0].toHTML();
            } else {

                var index = 0,
                    len = children.length;

                for (; index < len; index++) {

                    html += children[index].toHTML();
                }
            }

            // process innerHTML
        } else if (innerHTML) {

                html += innerHTML;
            }

        // add a closing tag if this isn't a void element
        html += selfClosing[tagName] ? "" : "</" + tagName + ">";

        return html;
    };

    /**
     * Checking to see if it is a namespace boundary, and if so,
     * return an object with current info
     * @param {string} value
     */

    var namespaceBoundary = function namespaceBoundary(value) {

        var colonIndex, namespacePrefix, namespace;

        // are we dealing with a namespaced attribute, e.g. xlink:href?
        colonIndex = value.indexOf(":");

        if (colonIndex !== -1) {

            // looks like we are, yes...
            namespacePrefix = value.substr(0, colonIndex);

            value = value.substring(colonIndex + 1);

            switch (namespacePrefix) {

                case "xlink":
                    namespace = "http://www.w3.org/1999/xlink";
                    break;
                case "xml":
                    namespace = "http://www.w3.org/XML/1998/namespace";
                    break;
            }

            return {
                name: value,
                namespace: namespace,
                namespacePrefix: namespacePrefix
            };
        }
    };

    /**
     * Invokes the `callback` function once for each item in `arr` collection,
     * which can only be an array.
     *
     * @param {Array} collection
     * @param {Function} callback
     * @return {Array}
     * @private
     */
    var each = function each(collection, callback) {

        var arr = collection || [],
            index = -1,
            length = arr.length;

        while (++index < length) {

            callback(arr[index], index, arr);
        }
        return arr;
    };

    var hooks__hooks = { set: {}, unset: {} };

    each("xlink:actuate xlink:arcrole xlink:href xlink:role xlink:show xlink:title xlink:type".split(" "), function (key) {

        /**
         * Custom unset hook for the 'xlink' attribute.
         */
        hooks__hooks.set[key] = function (node, attrs, previous) {

            if (attrs !== previous) {

                var namespace = namespaceBoundary(key);
                // sets the namespace to create an element (of a given tag).
                node.setAttributeNS(namespace.namespace, namespace.name, attrs);
            }
        };

        /**
         * Custom unset hook for the 'xlink' attribute.
         */
        hooks__hooks.unset[key] = function (node) {

            var namespace = namespaceBoundary(key);
            node.removeAttributeNS(namespace.namespace, namespace.name);
        };
    });

    each("xml:base xml:id xml:lang xml:space".split(" "), function (key) {

        /**
         * Custom set hook for the 'xml' attribute.
         */
        hooks__hooks.set[key] = function (node, attrs, previous) {

            if (attrs !== previous) {

                var namespace = namespaceBoundary(key);
                node.setAttributeNS(namespace.namespace, namespace.name, attrs);
            }
        };

        /**
         * Custom unset hook for the 'xml' attribute.
         */
        hooks__hooks.unset[key] = function (node) {

            // Namespace attributes
            var namespace = namespaceBoundary(key);
            node.removeAttributeNS(namespace.namespace, namespace.name);
        };
    });

    each("multiple,selected,checked,disabled,readOnly,required,open".split(","), function (key) {

        /**
         * Custom set hook for boolean attributes.
         */
        hooks__hooks.set[key] = function (node, attrs) {
            if (attrs) {
                node.setAttribute(key, attrs);
                node[key] = true;
            }
        };
    });

    var hooks__default = hooks__hooks;

    var special_type = function special_type(node, key, value) {

        var val = node.getAttribute("value");

        node.setAttribute(key, value);
        node.setAttribute("value", val);
        node.value = val;
    };

    /**
     * Applies a style to an virtual node. No vendor prefix expansion is done for
     * property names/values.
     *
     * @param  {Object} node  A DOM element.
     * @param  {String|Object} style The style to set. Either a
     *     string of css or an object containing property-value pairs.
     */
    var renderStyles = function renderStyles(node, style) {

        if (typeof style === "string") {
            node.style.cssText = style;
        } else {

            for (var prop in style) {
                node.style[prop] = style[prop];
            }
        }
    };

    var renderAttributes = function renderAttributes(node, attrs) {

        var key, val;

        for (key in attrs) {

            val = attrs[key];

            if (val != null) {

                if (key === "style") {
                    renderStyles(node, val);
                } else if (key === "type") {
                    special_type(node, key, val);
                } else if (key === "value") {
                    node.setAttribute(key, val);
                    node.value = val;
                } else if (key === "class") {
                    node.setAttribute(key, processClasses(val));
                } else {
                    // hooks
                    if (hooks__default.set[key]) {

                        hooks__default.set[key](node, val);
                    } else if (val != null) {

                        node.setAttribute(key, val);
                    }
                }
            }
        }
    };

    var processOption = function processOption(vnode, values) {

        if (vnode.tagName === "option") {
            if (vnode.attrs && values === vnode.attrs.value) {
                vnode.attrs.selected = "selected";
            } else if (vnode.props && values === vnode.props.value) {
                vnode.props.selected = true;
            }
            // process virtual child nodes
        } else if (vnode.children.length) {

                var children = vnode.children,
                    index = 0,
                    length = children.length;
                for (; index < length; index += 1) {

                    processOption(children[index], values);
                }
            }
    };

    var renderSelect = function renderSelect(node) {

        var selectValue = node.attrs && node.attrs.value || node.props && node.props.value;

        if (selectValue == null) {
            return;
        }

        if (isArray(selectValue)) {

            var index = selectValue.length;

            while (index--) {
                processOption(node, selectValue[index]);
            }
        } else {
            processOption(node, selectValue);
        }

        /**
         * Due to a bug in Webkit browsers, we need to remove the
         * value. Else 'selected' will not be marked.
         * Works just fine in Firefox and Internet Explorer
         */

        if (node.attrs && node.attrs.value) {
            delete node.attrs.value;
        } else if (node.props && node.props.value) {
            delete node.props.value;
        }
    };

    var render = function render(parent) {
        var tagName = this.tagName;
        var children = this.children;
        var props = this.props;
        var attrs = this.attrs;
        var hooks = this.hooks;

        if (parent) {

            this.parent = parent;
        }

        // Set the namespace to create an element (of a given tag) in.
        if (this.namespace == null) {
            switch (tagName) {
                // Use SVG namespace, if this is an <svg> element
                case "svg":
                    this.namespace = "http://www.w3.org/2000/svg";
                    break;
                // ...or MATH, if the parent is a <math> element
                case "math":
                    this.namespace = "http://www.w3.org/1998/Math/MathML";
                    break;
                default:
                    // ...or inherit from the parent node
                    if (parent) {
                        this.namespace = parent.namespace;
                    }
            }
        }

        // create a new virtual element
        var node = this.node = this.create();

        /**
         * Note! We are checking for 'null' for 'attrs' and 'props'
         * twice because of performance optimizing
         */
        if (props != null || attrs != null) {

            // Special case - select
            if (tagName === "select") {

                renderSelect(this);
            }

            // Render properties
            if (props != null) {
                renderProperties(node, props);
            }

            // Render attributes
            if (attrs != null) {
                renderAttributes(node, attrs);
            }
        }

        // Render children
        if (children.length) {

            // ignore incompatible children
            if (children.length === 1 && children[0]) {

                node.appendChild(children[0].render(this));
            } else {

                var index = 0,
                    length = children.length;

                for (; index < length; index += 1) {
                    // ignore incompatible children
                    if (children[index]) {

                        node.appendChild(children[index].render(this));
                    }
                }
            }
        }

        /**
         * Note! Only attach the reference for the virtual node if the DOM element 
         * has defined events to minimize overhead.
         */
        if (this.events) {

            node._handler = this;
        }

        // Handle hooks

        if (hooks !== undefined) {
            if (hooks.created) {
                hooks.created(this, node);
            }
        }
        return node;
    };

    /**
     * Remove a real DOM element from where it was inserted
     */
    var destroy = function destroy() {
        var node = this.node;
        var hooks = this.hooks;

        if (node) {

            var parentElement = node.parentNode;

            if (parentElement) {

                if (hooks && hooks.destroy) {

                    hooks.destroy(node, function () {

                        parentElement.removeChild(node);
                    });
                } else {
                    parentElement.removeChild(node);
                }
            }

            // should silently abort if the element has no parent
        }
    };

    /**
     * Creates a mapping that can be used to look up children using a key.
     *
     * @param  {Array}  children An array of nodes.
     * @param  {Number} startIndex 
     * @param  {Number} endIndex 
     * @return {Object} A mapping of keys to the children of the virtual node.
     */
    var keyMapping = function keyMapping(children, startIndex, endIndex) {

        var child,
            keys = {};

        for (; startIndex < endIndex; startIndex += 1) {
            child = children[startIndex].key;
            if (child) {
                keys[child] = startIndex;
            }
        }

        return keys;
    };

    /**
     * Removes one or more virtual nodes attached to a real DOM node
     *
     * @param {Array} nodes
     */
    var detach = function detach(nodes) {
        var index = 0,
            length = nodes.length;
        for (; index < length; index += 1) {

            nodes[index].detach();
        }
    };

    var patch = function patch(container, oldChildren, children) {

        if (children.length == null || children.length === 0) {
            detach(oldChildren);
        } else {

            var firstChild = oldChildren[0],
                lastChild = children[0],
                updated = false,
                index = 0,
                length;

            /**
             * Both 'oldChildren' and 'children' are a lonely child
             */
            if (oldChildren.length === 1 && children.length === 1) {

                if (firstChild.equalTo(lastChild)) {
                    firstChild.patch(lastChild);
                } else {
                    firstChild.detach();
                    container.appendChild(lastChild.render());
                }

                /**
                 * 'oldChildren' is a single child
                 */
            } else if (oldChildren.length === 1) {

                    for (index = 0, length = children.length; index < length; index += 1) {

                        lastChild = children[index];

                        if (firstChild.equalTo(lastChild)) {
                            firstChild.patch(lastChild);
                        }
                        container.insertBefore(lastChild.render(), firstChild.node);
                    }

                    /**
                     * 'children' is a single child
                     */
                } else if (children.length === 1) {

                        for (index = 0, length = oldChildren.length; index < length; index += 1) {

                            firstChild = oldChildren[index];

                            if (firstChild.equalTo(lastChild)) {
                                firstChild.patch(lastChild);
                                updated = true;
                            } else {
                                // Detach the node
                                firstChild.detach();
                            }
                        }

                        if (updated) {
                            for (length = oldChildren.length; index < length; index += 1) {
                                oldChildren[index++].detach();
                            }
                        } else {
                            container.appendChild(lastChild.render());
                        }
                    } else {

                        var oldStartIndex = 0,
                            StartIndex = 0,
                            oldEndIndex = oldChildren.length - 1,
                            oldStartNode = oldChildren[0],
                            oldEndNode = oldChildren[oldEndIndex],
                            endIndex = children.length - 1,
                            startNode = children[0],
                            endNode = children[endIndex],
                            map,
                            node;

                        while (oldStartIndex <= oldEndIndex && StartIndex <= endIndex) {

                            if (oldStartNode === undefined) {
                                oldStartIndex++;
                            } else if (oldEndNode === undefined) {
                                oldEndIndex--;
                                // Update nodes with the same key at the beginning.	
                            } else if (oldStartNode.equalTo(startNode)) {
                                    oldStartNode.patch(startNode);
                                    oldStartIndex++;
                                    StartIndex++;
                                    // Update nodes with the same key at the end.	
                                } else if (oldEndNode.equalTo(endNode)) {
                                        oldEndNode.patch(endNode);
                                        oldEndIndex--;
                                        endIndex--;
                                        // Move nodes from left to right.
                                    } else if (oldStartNode.equalTo(endNode)) {
                                            oldStartNode.patch(endNode);

                                            container.insertBefore(oldStartNode.node, oldEndNode.node.nextSibling);

                                            oldStartIndex++;

                                            endIndex--;

                                            // Move nodes from right to left.	
                                        } else if (oldEndNode.equalTo(startNode)) {

                                                oldEndNode.patch(startNode);
                                                container.insertBefore(oldEndNode.node, oldStartNode.node);
                                                oldEndIndex--;
                                                StartIndex++;
                                            } else {

                                                if (map === undefined) {
                                                    map = keyMapping(oldChildren, oldStartIndex, oldEndIndex);
                                                }

                                                index = map[startNode.key];

                                                if (index) {

                                                    node = oldChildren[index];
                                                    oldChildren[index] = undefined;
                                                    node.patch(startNode);
                                                    container.insertBefore(node.node, oldStartNode.node);
                                                } else {
                                                    // create a new element

                                                    container.insertBefore(startNode.render(), oldStartNode.node);
                                                }

                                                StartIndex++;
                                            }
                            oldStartNode = oldChildren[oldStartIndex];
                            oldEndNode = oldChildren[oldEndIndex];
                            endNode = children[endIndex];
                            startNode = children[StartIndex];
                        }
                        if (oldStartIndex > oldEndIndex) {

                            for (; StartIndex <= endIndex; StartIndex++) {
                                if (children[endIndex + 1] === undefined) {
                                    container.appendChild(children[StartIndex].render());
                                } else {
                                    container.insertBefore(children[StartIndex].render(), children[endIndex + 1].node);
                                }
                            }
                        } else if (StartIndex > endIndex) {

                            for (; oldStartIndex <= oldEndIndex; oldStartIndex++) {
                                if (oldChildren[oldStartIndex] !== undefined) {
                                    oldChildren[oldStartIndex].detach();
                                }
                            }
                        }
                    }
        }

        return children;
    };

    var patchProperties = function patchProperties(node, properties, previousProps) {

        if (previousProps != null) {

            var key, propValue;

            for (key in previousProps) {

                if (!properties || properties[key] == null) {

                    if (key === "className") {

                        node.className = "";
                    } else {

                        node[key] = null;
                    }
                }
            }

            for (key in properties) {

                propValue = properties[key];

                if (key === "className") {

                    if (propValue) {
                        node.className = processClasses(propValue);
                    }
                } else if (previousProps[key] !== propValue) {
                    // Support: IE9+
                    // Restore value when type is changed
                    if (key === "type") {
                        var value = node.value;
                        node[key] = propValue;
                        node.value = value;
                    } else {
                        node[key] = propValue;
                    }
                }
            }
            /**
             * There is no 'previousProps', so we just insert all properties
             */
        } else if (properties != null) {
                renderProperties(node, properties);
            }
    };

    /**
     * Applies a style to an Element. No vendor prefix expansion is done for
     * property names/values.
     * @param {!Element}node
     * @param {string|Object} key
     * @param {string|Object} value
     * @param {string|Object} prevStyle
     */
    var patchStyles = function patchStyles(node, key, value, prevStyle) {

        if (typeof value === "object") {

            if (typeof prevStyle === "object") {

                for (key in prevStyle) {
                    node.style[key] = "";
                }

                for (key in value) {
                    node.style[key] = value[key];
                }
            } else {

                if (prevStyle) {
                    node.style.cssText = "";
                }

                for (key in value) {
                    node.style[key] = value[key];
                }
            }
        }
    };

    var patchAttributes = function patchAttributes(node, attrs, previousAttr) {

        if (previousAttr != null) {

            var attrName, previousAttrValue, attrValue;
            for (attrName in previousAttr) {

                if (!attrs || attrs[attrName] == null) {

                    previousAttrValue = previousAttr[attrName];

                    // styles
                    if (attrName === "style") {
                        for (attrName in previousAttrValue) {
                            node.style[attrName] = "";
                        }
                        // hooks
                    } else if (hooks__default.unset[attrName]) {
                            hooks__default.unset[attrName](node, previousAttrValue);
                        } else {
                            node.removeAttribute(attrName);
                        }
                }
            }

            for (attrName in attrs) {

                attrValue = attrs[attrName];

                if (attrName === "class") {
                    node.setAttribute(attrName, processClasses(attrValue));
                } else if (attrName === "style") {
                    patchStyles(node, attrName, attrValue, previousAttr[attrName]);
                } else if (previousAttr[attrName] !== attrValue) {
                    // Support: IE9+
                    // Restore value when type is changed
                    if (attrName === "type") {
                        special_type(node, attrName, attrValue);
                    } else if (attrName === "value") {
                        node.setAttribute(attrName, attrValue);
                        node[attrName] = attrValue ? attrValue : "";
                    } else if (attrValue != null) {

                        node.setAttribute(attrName, attrValue);
                    }
                }
            }

            /**
             * There is no 'previousAttr', so we just insert all attributes
             */
        } else if (attrs != null) {
                renderAttributes(node, attrs);
            }
    };

    var prototype_patch = function prototype_patch(ref) {

        if (!this.equalTo(ref)) {

            return ref.render(this.parent);
        }

        var node = this.node;

        // Special case - select
        var tagName = this.tagName;
        var props = this.props;
        var attrs = this.attrs;
        var children = this.children;
        var events = this.events;
        var hooks = this.hooks;
        if (tagName === "select" && (ref.props != null || ref.attrs != null)) {

            renderSelect(ref);
        }

        ref.node = this.node;

        // Patch / diff children
        if (children !== ref.children) {
            patch(node.shadowRoot ? node.shadowRoot : node, children, ref.children);
        }

        // Patch / diff properties
        if (props !== ref.props) {
            patchProperties(node, ref.props, props);
        }
        // Patch / diff attributes
        if (attrs !== ref.attrs) {
            patchAttributes(node, ref.attrs, attrs);
        }

        if (events !== ref.events) {
            // Handle events
            if (ref.events) {

                node._handler = ref;
            } else if (events !== undefined) {

                node._handler = undefined;
            }
        }
        // Handle hooks
        if (hooks !== undefined) {
            if (hooks.updated) {
                hooks.updated(this, node);
            }
        }

        return node;
    };

    /**
     * Removes the DOM node attached to the virtual node.
     */
    var prototype_detach = function prototype_detach() {
        var children = this.children;

        /**
         * If any children, trigger the 'detach' hook on each child node
         */
        var hooks = this.hooks;
        if (children.length) {

            if (children.length === 1) {

                var firstChild = children[0];

                if (firstChild.hooks && firstChild.hooks.detach) {

                    firstChild.hooks.detach(firstChild, firstChild.node);
                }
            } else {

                var index = children.length,
                    node;

                while (index--) {

                    node = children[index];

                    if (node.hooks && node.hooks.detach) {

                        node.hooks.detach(node, node.node);
                    }
                }
            }
        }

        /**
         * Trigger the 'detach' hook on the root node
         *
         */
        if (hooks && hooks.detach) {

            hooks.detach(this, this.node);
        }
        // Destroy the node...
        this.destroy();
    };

    /**
      * Checks if two virtual nodes are equal to each other.
      *
      * @param {Object} node
      * @return {boolean}
      */
    var equalTo = function equalTo(node) {

        return !(this.key !== node.key || this.tagName !== node.tagName || this.flag !== node.flag || this.namespace !== node.namespace || this.typeExtension !== node.typeExtension);
    };

    var init = function init(tagName, options, children) {

        options = options || {};

        /**
         * The node name for this node.
         */
        this.tagName = tagName || "div";

        /**
         * List of children nodes. 
         */
        this.children = children || [];

        /**
         * The properties and their values.
         */
        this.props = options.props || null;

        /**
         * The attributes and their values.
         */
        this.attrs = options.attrs || null;

        /**
         * Events
         */
        this.events = options.events;

        /**
         * Callbacks / lifecycle hooks
         */
        this.hooks = options.hooks;

        /**
         * Reference to the virtual node. It will be available after the virtual node is
         * created or patched. 
         */
        this.node = null;

        /**
         * Reference to the parent node - a DOM element used for W3C DOM API calls
         */
        this.parent = null;

        /**
         * Add data 
         */
        this.data = options.data;

        /**
         * The key used to identify this node, used to preserve DOM nodes when they
         * move within their parent.
         */
        this.key = options.key || null;

        /**
         * Namespace indicates the closest HTML namespace as it cascades down from an ancestor, or a given namespace
         */
        this.namespace = options.attrs && options.attrs.xmlns || null;

        /**
         * is - custom elements / attributes, and type extensions
         */
        this.typeExtension = options.attrs && options.attrs.is || null;

        /**
         * Reference to the virtual node's flag
         */
        this.flag = flags__ELEMENT;
    };

    function Element(tagName, options, children) {

        this.init(tagName, options, children);
    }

    Element.prototype = {
        append: prototype_append,
        create: create,
        toHTML: toHTML,
        render: render,
        patch: prototype_patch,
        destroy: destroy,
        detach: prototype_detach,
        equalTo: equalTo,
        init: init
    };

    /** Export */

    /**
     * Initialize the virtual tree
     */
    var prototype_init = function prototype_init() {

        /** Container to hold all mounted virtual trees. */
        this.mountContainer = {};
    };

    var prototype_mount = function prototype_mount(selector, factory, data) {

        return this.glue(selector, factory, data, function (root, nodes) {

            /**
             * Normalize the child nodes
             */
            nodes = normalizeChildren(nodes);

            /**
             * Render child nodes and attach to the root node
             */
            if (nodes.length) {

                if (nodes.length === 1 && nodes[0]) {

                    root.appendChild(nodes[0].render());
                } else {

                    var index = 0,
                        length = nodes.length;
                    for (; index < length; index += 1) {

                        // ignore incompatible children
                        if (nodes[index]) {

                            root.appendChild(nodes[index].render());
                        }
                    }
                }
            }

            return nodes;
        });
    };

    var unmount = function unmount(uuid) {

        if (uuid != null) {

            var mount = this.mountContainer[uuid];

            // if mounted..
            if (mount) {

                // Detach all children on the mounted virtual tree
                detach(mount.children);

                // setting 'undefined' gives better performance
                mount.root.rootID = undefined;

                delete this.mountContainer[uuid];
            }
        } else {

            // Remove the world. Unmount everything.
            for (uuid in this.mountContainer) {

                this.unmount(uuid);
            }
        }
    };

    var updateChildren = function updateChildren(root, prevChildren, newChildren) {
        if (prevChildren !== newChildren) {
            // Normalize the child nodes, and patch/diff the children
            return patch(root, prevChildren, normalizeChildren(newChildren));
        }
    };

    /**
     * Main focus on active element
     *
     * @param {DOMElement} previousActiveElement
     */
    var maintainFocus = function maintainFocus(previousActiveElement) {

        if (previousActiveElement && previousActiveElement !== document.body && previousActiveElement !== document.activeElement) {

            previousActiveElement.focus();
        }
    };

    var update = function update(uuid, node) {

        if (arguments.length) {

            // get the mounted virtual tree
            var mount = this.mountContainer[uuid];

            if (mount) {

                // Make sure focus is never lost
                var activeElement = document.activeElement;

                if (!node) {
                    node = mount.factory;
                }

                // update and re-order child nodes         
                mount.children = updateChildren(mount.root, mount.children, node);

                // maintain focus
                maintainFocus(activeElement);
            }
        } else {
            // update all mounted virtual trees
            for (uuid in this.mountContainer) {

                this.update(uuid);
            }
        }
    };

    var mounted = function mounted(uuid) {

        return uuid != null ? this.mountContainer[uuid] : this.mountContainer;
    };

    /**
     * Find a DOM node by it's CSS selector
     *
     * @param {String|DOMElement} selector
     * @param {DOMElement|null} context
     * @return {DOMElement} The node where to mount the virtual tree
     */
    var findDOMNode = function findDOMNode(selector, context) {

        if (context == null) {
            context = document;
        }

        if (typeof selector === "string") {
            return context.querySelector(selector);
        }

        if (selector.nodeType === 1) {
            return selector;
        }
    };

    var glue = function glue(selector, factory, container, children) {
        if (container === undefined) container = {};

        // Find the selector where we are going to mount the virtual tree
        var root = findDOMNode(selector),
            mountId;

        if (root) {

            // Unmount if already mounted
            if (root.rootID) {
                this.unmount(root.rootID);
            }

            // use 'container' id if it exist, or...
            if (container.mountId) {
                mountId = container.mountId;
            } else {
                // ... create a unique identifier
                mountId = this.guid();
            }

            container.root = root;
            container.factory = factory;
            container.children = children(root, factory);

            this.mountContainer[mountId] = container;

            root.rootID = mountId;

            return root.rootID;
        }
    };

    var Tree_prototype_append = function Tree_prototype_append(selector, factory, data) {

        return this.glue(selector, factory, data, append);
    };

    // Generate a unique identifier
    // - source: ReactivejS ( early stage )
    var uuidFunc = function uuidFunc(char) {
        return char == "x" ? Math.random() * 16 | 0 : (Math.random() * 16 | 0 & 0x3 | 0x8).toString(16);
    };
    var guid = function guid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, uuidFunc);
    };

    var prototype_guid = function prototype_guid() {

        return guid();
    };

    /**
     * Return all mounted children for a virtual DOM node
     * @param  {String|Number} uuid
     */
    var prototype_children = function prototype_children(uuid) {

        if (uuid) {

            var mount = this.mountContainer[uuid];

            return mount.children;
        }
    };

    /**
     * Return  the corresponding native browser DOM element where the virtual tree are mounted
     * @param  {String|Number} uuid
     */
    var mountPoint = function mountPoint(uuid) {

        if (uuid) {

            var mount = this.mountContainer[uuid];

            return mount.root;
        }
    };

    var Tree = function Tree() {
        /**
         * Initialize the tree
         */
        this.init();
    };

    Tree.prototype = {

        /**
         * Initialize
         */
        init: prototype_init,

        /**
         * "Glue" / attach virtual trees or server rendered HTML markup 
         * to a given selector
         */
        glue: glue,

        /**
         * Append server rendered HTML markup
         */
        append: Tree_prototype_append,

        /**
         * Mount a virtual tree
         */
        mount: prototype_mount,

        /**
         * Unmount a virtual tree
         */
        unmount: unmount,

        /**
         * Update a virtual tree
         */
        update: update,

        /**
         * Return overview over mounted tree, or all mounted trees
         */
        mounted: mounted,

        /**
         * Generate a unique identifier for mounting virtual trees
         */
        guid: prototype_guid,

        /**
         * Returns all child nodes beloning to the mounted tree
         */
        children: prototype_children,

        /**
         * Return a real DOM node where the virtual tree are mounted
         */
        mountPoint: mountPoint
    };

    var hyperscript = function hyperscript(context, children) {

        var config = context || {},
            childNodes = children;

        if (typeof context === "string" || typeof context === "number" || context instanceof Date) {
            // Create and return a virtual text node
            return new Text(context);
        }

        var tagName = (config.tagName || "div").toLowerCase();

        delete config.tagName;

        if (children !== undefined && children !== null) {

            if (Array.isArray(children)) {
                each(children, function (child, index) {
                    if (typeof child === "string" || typeof child === "number" || child instanceof Date) {
                        childNodes[index] = new Text(child);
                    } else {
                        childNodes[index] = child;
                    }
                });
                childNodes = children;
            } else if (typeof children === "string" || typeof children === "number" || children instanceof Date) {
                childNodes = [new Text(children)];
            }
        }

        return new Element(tagName, config, childNodes);
    };

    var events_prototype_init = function events_prototype_init(delegateHandler, container) {

        this.eventHandler = delegateHandler;
        this.context = container || document;
        this.eventContainer = [];
    };

    /**
     * Bind an event `type` to a callback function
     *
     * @param {Element} node
     * @param {String} type
     * @param {Function} callback
     * @param {Boolean} useCapture
     */

    var addEventListener = function addEventListener(node, type, callback, useCapture) {

        node.addEventListener(type, callback, useCapture || false);
    };

    /**
     * Eventhandler
     *
     * @param {Object} root
     * @param {String} evt
     */
    var eventHandler = function eventHandler(root, evt) {

        return function (e) {

            e.isPropagationStopped = false;
            e.delegateTarget = e.target;

            e.stopPropagation = function () {

                this.isPropagationStopped = true;
            };

            while (e.delegateTarget && e.delegateTarget !== root.eventHandler) {

                root.eventHandler(evt, e);

                if (e.isPropagationStopped) {

                    break;
                }
                e.delegateTarget = e.delegateTarget.parentNode;
            }
        };
    };

    var bind = function bind(evt, useCapture) {

        var handler = eventHandler(this, evt);

        // remove the event 'evt' if the event are bound already
        if (this.eventContainer[evt]) {
            this.unbind(evt);
        }

        this.eventContainer[evt] = handler;
        addEventListener(this.context, evt, this.eventContainer[evt], useCapture || false);

        return handler;
    };

    /**
     * Unbind an event `type`' to a callback function
     * @param {Element} node
     * @param {String} type
     * @param {Function} callback
     * @param {Boolean} useCapture
     */
    var removeEventListener = function removeEventListener(node, type, callback, useCapture) {

        node.removeEventListener(type, callback, useCapture || false);
    };

    var unbind = function unbind(type, useCapture) {

        if (arguments.length) {

            if (this.eventContainer[type]) {

                removeEventListener(this.context, type, this.eventContainer[type], useCapture || false);
            }
        } else {

            var events;

            // Unbind all events
            for (events in this.eventContainer) {

                this.unbind(events);
            }
        }
    };

    /**
     * Returns all events we are listening to
     *
     * @return Array
     */
    var listeners = function listeners() {
        return Object.keys(this.eventContainer);
    };

    /**
     * List of common events.
     */
    var commonEvents = ("blur change click contextmenu copy cut dblclick drag dragend dragenter dragexit dragleave dragover dragstart " + "drop focus input keydown keyup keypress mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup paste scroll " + "submit touchcancel touchend touchmove touchstart wheel").split(" ");

    var bindDefaultEvents = function bindDefaultEvents() {
        var _this = this;

        each(commonEvents, function (evt) {

            _this.bind(evt);
        });
    };

    var _events__events = function _events__events(delegateHandler, container) {

        this.init(delegateHandler, container);
    };

    _events__events.prototype = {
        init: events_prototype_init,
        bind: bind,
        unbind: unbind,
        listeners: listeners,
        bindDefaultEvents: bindDefaultEvents
    };

    var _events = _events__events;

    /**
     * Return 'nodeName' in lowerCase()
     *
     * In XML (and XML-based languages such as XHTML), tagName preserves case. On HTML elements in
     * DOM trees flagged as HTML documents, tagName returns the element name in the uppercase form.
     *
     * @param {DOMElement} node A node to get the node name for.
     * @return {String} The node name for the Node, if applicable.
     */
    var getNodeName = function getNodeName(node) {
        return node.nodeName.toLowerCase();
    };

    var rreturn = /\r/g;

    var getEventValues = function getEventValues(node, value) {

        var type = node.getAttribute("type") == null ? getNodeName(node) : node.getAttribute("type");

        if (arguments.length === 1) {

            if (type === "checkbox" || type === "radio") {

                if (!node.checked) {

                    return false;
                }

                var val = node.getAttribute("value");

                return val ? val : true;
            } else if (type === "select") {

                if (node.multiple) {

                    var result = [];

                    each(node.options, function (option) {

                        if (option.selected &&
                        // Don't return options that are disabled or in a disabled optgroup
                        option.getAttribute("disabled") === null && (!option.parentNode.disabled || getNodeName(option.parentNode) !== "optgroup")) {

                            result.push(option.value || option.text);
                        }
                    });

                    return result;
                }
                return ~node.selectedIndex ? node.options[node.selectedIndex].value : "";
            }
        }

        var ret = node.value;
        return typeof ret === "string" ?
        // Handle most common string cases
        ret.replace(rreturn, "") :
        // Handle cases where value is null/undef or number
        ret == null ? "" : ret;
    };

    var tagNames = {
        input: 1,
        select: 1,
        radio: 1,
        button: 1,
        textarea: 1
    };

    var genericHandler = function genericHandler(eventName, ev) {

        var node = ev.delegateTarget,
            value;

        // if any events...
        if (node._handler && node._handler.events) {

            // A 'eventName' can either be 'onclick' or 'click'
            eventName = node._handler.events["on" + eventName] || node._handler.events[eventName];

            if (eventName) {

                if (tagNames[getNodeName(node)]) {
                    value = getEventValues(node);
                }
                return eventName(ev, value);
            }
        }
    };

    var _handler;

    var initEvent = function initEvent() {

        if (!_handler) {

            _handler = new _events(genericHandler);

            _handler.bindDefaultEvents();
        }
        return _handler;
    };

    var trackira = {

        /**
         * Virtual Element
         */
        Element: Element,
        /**
         * Virtual Comment node
         */
        Comment: Comment,
        /**
         * Virtual Text node
         */
        Text: Text,
        /**
         * Virtual Tree
         */
        Tree: Tree,
        /**
         * Detach one or more virtual nodes
         */
        detach: detach,
        /**
         * Patch two virtual DOM nodes
         */
        patch: patch,
        /**
         * Updates a virtual node
         */
        updateChildren: updateChildren,

        /**
         * Append a virtual tree onto a previously rendered DOM tree.
         */
        append: append,

        /**
         * Init events
         */
        initEvent: initEvent,
        /**
         * Hyperscript
         */
        h: hyperscript,

        /**
         * Current version of the library
         */
        version: "0.1.8b"
    };

    return trackira;
});
//# sourceMappingURL=./trackira.js.map
},{}],3:[function(require,module,exports){
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

},{"./executor":4}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{"./benchmark":3}]},{},[1])


//# sourceMappingURL=main.js.map