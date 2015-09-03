(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var benchmark = require('vdom-benchmark-base');
var jiesa = require('trackiraa');
var Element = jiesa.Element;
var Text = jiesa.Text;

var NAME = 'jiesa ( Trackira)';
var VERSION = "0.0.7c";

function renderTree(nodes) {
  var children = [];
  var i;
  var n;

  for (i = 0; i < nodes.length; i++) {
    n = nodes[i];
    if (n.children !== null) {
      children.push(new Element("div", { key: n.key }, renderTree(n.children)));
    } else {
      children.push(new Element("span", null, [ new Text(n.key.toString() )] ));
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
 this._root.detach();
};

BenchmarkImpl.prototype.render = function() {
  this._node = new Element("div", {}, renderTree(this.a));
  this._root = this._node.render();
  this.container.appendChild(this._root);
};

BenchmarkImpl.prototype.update = function() {
  var newNode = new Element("div", {}, renderTree(this.b));
  this._node.patch(newNode);
  this._root = newNode;
//  this._node = newNode;
};
document.addEventListener('DOMContentLoaded', function(e) {
  benchmark(NAME, VERSION, BenchmarkImpl);
}, false);
},{"trackiraa":2,"vdom-benchmark-base":5}],2:[function(require,module,exports){
/**
 * jiesa - 
 * @Version: v0.0.7b
 * @Author: Kenny Flashlight
 * @Homepage: 
 * @License: MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.jiesa = factory();
})(this, function () {
    'use strict';

    var ESCAPE_REGEX = /[&><]/g,

    // `"` and `'` are not escaped; they are parsed as regular characters in the
    // context of text content.

    ESCAPE_LOOKUP = {
        "&": "&amp;",
        ">": "&gt;",
        "<": "&lt;"
    };

    var escapeHtml = function escapeHtml(value) {
        return ("" + value).replace(ESCAPE_REGEX, function (match) {
            return ESCAPE_LOOKUP[match];
        });
    };

    /**
     * Initialize a new `Text`.
     * @param {String} text
     */
    function Text(text) {

        /**
         * The text content of a Text node.
         */
        this.data = text;
        this.node = null;
    }

    // Shortcut to improve speed and size
    var Text__proto = Text.prototype;

    /**
     * The type, used to identify the type of this node
     */
    Text__proto.flag = 0x0002;

    Text__proto.create = function () {

        var node = this.node;

        if (node == null) {

            this.node = node = document.createTextNode(this.data);
        }

        return node;
    };

    /**
     * Render a virtual text node
     *
     * @return Object
     */
    Text__proto.render = function () {

        return this.create();
    };

    /**
     * Attaches an existing textual DOM element.
     *
     * @param  {Object} node
     * @return {Object}
     */
    Text__proto.append = function (node) {

        return this.node = node;
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
    Text__proto.toHtml = function (escape) {

        return escape ? this.data : escapeHtml(this.data);
    };

    /**
     * Checks if two virtual text nodes are equal to each other, and they can be updated.
     *
     * @param {Object} to
     * @return {boolean}
     */
    Text__proto.equalTo = function (node) {

        return this.flag === node.flag;
    };

    /**
     * Patches the node by updating the nodeValue.
     *
     * @param {object} to Contains the next text content.
     * @return {Object}
     */
    Text__proto.patch = function (ref) {

        if (this.equalTo(ref)) {

            ref.node = this.node;

            if (this.data !== ref.data) {

                this.node.data = ref.data;
            }

            return this.node;
        }

        // detach previous node
        this.detach(false);

        // re-render
        return ref.render();
    };

    /**
     * Destroys the text node attached to the virtual node.
     */
    Text__proto.destroy = function () {

        var node = this.node,
            parent = node.parentNode;

        if (parent) {

            parent.removeChild(node);
        }
    };

    /**
     * Removes the DOM node attached to the virtual node.
     */
    Text__proto.detach = function (shouldDestroy) {

        if (shouldDestroy !== false) {

            this.destroy();
        }
    };

    var forIn = function forIn(obj, cb) {

        if (obj) {

            var index = 0,
                props = Object.keys(obj),
                length = props.length;

            for (; index < length; ++index) {

                cb(props[index], obj[props[index]]);
            }
        }
        return obj;
    };

    /**
     * Support style names that may come passed in prefixed by adding permutations
     * of vendor prefixes.
     */
    var prefixes = ["Webkit", "O", "Moz", "ms"];

    /**
     * @param {string} prefix vendor-specific prefix, eg: Webkit
     * @param {string} key style name, eg: transitionDuration
     * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
     * WebkitTransitionDuration
     */
    var prefixKey = function prefixKey(prefix, key) {
        return prefix + key.charAt(0).toUpperCase() + key.substring(1);
    };

    /**
     * CSS properties which accept numbers but are not in units of "px".
     */
    var unitlessCfg__unitless = {
        animationIterationCount: true,
        boxFlex: true,
        boxFlexGroup: true,
        boxOrdinalGroup: true,
        counterRreset: true,
        counterIncrement: true,
        columnCount: true,
        flex: true,
        flexGrow: true,
        flexPositive: true,
        flexShrink: true,
        flexNegative: true,
        flexOrder: true,
        float: true,
        fontWeight: true,
        lineClamp: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        pitchRange: true,
        richness: true,
        stress: true,
        tabSize: true,
        volume: true,
        widows: true,
        zIndex: true,
        zoom: true,

        // SVG-related properties
        stopOpacity: true,
        fillOpacity: true,
        strokeDashoffset: true,
        strokeOpacity: true,
        strokeWidth: true
    };

    // convert to vendor prefixed unitless CSS properties
    forIn(unitlessCfg__unitless, function (prop, value) {

        prefixes.forEach(function (prefix) {

            unitlessCfg__unitless[prefixKey(prefix, prop)] = value;
        });
    });

    /**
     * Common snake-cased CSS properties
     */
    forIn({
        "animation-iteration-count": true,
        "box-flex": true,
        "box-flex-group": true,
        "box-ordinal-group": true,
        "counter-reset": true,
        "counter-increment": true,
        "column-count": true,
        "flex-grow": true,
        "flex-positive": true,
        "flex-shrink": true,
        "flex-negative": true,
        "flex-order": true,
        "font-weight": true,
        "line-clamp": true,
        "line-height": true,

        // SVG-related properties
        "stop-opacity": true,
        "fill-opacity": true,
        "stroke-dashoffset": true,
        "stroke-opacity": true,
        "stroke-width": true
    }, function (prop) {

        prefixes.forEach(function (prefix, value) {

            unitlessCfg__unitless[prop] = value;
        });
    });

    var unitlessCfg = unitlessCfg__unitless;

    var cleanValues = function cleanValues(name, value) {

        if (value == null || value === "") {

            return "";
        }

        if (value === 0 || (unitlessCfg[name] || isNaN(value))) {

            return "" + value; // cast to string
        }

        if (typeof value === "string" || value instanceof Date) {

            value = value.trim();
        }

        return value + "px";
    };

    var isArray = function isArray(value) {
        return value.constructor === Array;
    };

    /**
     * Set CSS styles
     *
     * @param {Object} node
     * @param {String} propertyName
     * @param {String} value
     */
    var setObjStyle = function setObjStyle(node, propertyName, value) {

        var idx = 0,
            len = undefined,
            style = node[propertyName];

        forIn(value, function (styleName, styleValue) {

            if (styleValue != null) {

                if (isArray(styleValue)) {

                    for (len = styleValue.length; idx < len; idx++) {

                        style[styleName] = cleanValues(styleName, styleValue[idx]);
                    }
                } else {

                    style[styleName] = cleanValues(styleName, styleValue);
                }
            } else {

                style[styleName] = "";
            }
        });
    };

    var removeSelectValue = function removeSelectValue(node) {

        var options = node.options,
            len = options.length;
        // skip iteration if no length
        if (len) {

            var i = 0;

            while (i < len) {

                options[i++].selected = false;
            }
        }
    };

    var removeProp__defaultPropVals = {};

    function getDefaultPropVal(tag, attrName) {

        var tagAttrs = removeProp__defaultPropVals[tag] || (removeProp__defaultPropVals[tag] = {});
        return attrName in tagAttrs ? tagAttrs[attrName] : tagAttrs[attrName] = document.createElement(tag)[attrName];
    }

    var removeProp = function removeProp(node, name) {

        if (name === "value" && node.tagName === "SELECT") {

            removeSelectValue(node);
        } else {

            node[name] = getDefaultPropVal(node.tagName, name);
        }
    };

    var inArray = function inArray(arr, item) {

        var len = arr.length;

        var i = 0;

        while (i < len) {

            if (arr[i++] == item) {

                return true;
            }
        }

        return false;
    };

    var setSelectValue = function setSelectValue(node, value) {

        var isMultiple = isArray(value),
            options = node.options,
            len = options.length;

        var i = 0,
            optionNode = undefined;

        if (value != null) {

            while (i < len) {

                optionNode = options[i++];

                if (isMultiple) {

                    optionNode.selected = inArray(value, optionNode.value);
                } else {

                    optionNode.selected = optionNode.value == value;
                }
            }
        }
    };

    var setPropWithCheck = function setPropWithCheck(node, name, value) {

        if (name === "value" && node.tagName === "SELECT") {

            setSelectValue(node, value);
        } else {

            if (node[name] !== value) {

                node[name] = value;
            }
        }
    };

    var setBooleanProp = function setBooleanProp(node, propertyName, propertyValue) {

        node[propertyName] = !!propertyValue;
    };

    var boolPropCfg = {
        set: setBooleanProp,
        remove: removeProp
    };

    var setProp = function setProp(node, propertyName, propertyValue) {

        node[propertyName] = propertyValue;
    };

    var defaultPropCfg = {
        set: setProp,
        remove: removeProp
    };

    var removeAttr = function removeAttr(node, name) {

        node.removeAttribute(name);
    };

    var setBooleanAttr = function setBooleanAttr(node, name, attrValue) {

        // don't set falsy values!
        if (attrValue !== false) {

            // booleans should always be lower cased
            node.setAttribute(name, "" + (attrValue == true ? "" : attrValue).toLowerCase());
        }
    };

    var boolAttrCfg = {
        set: setBooleanAttr,
        remove: removeAttr
    };

    var xmlCfg = {
        "xml:base": "base",
        "xml:id": "id",
        "xml:lang": "lang",
        "xml:space": "space"
    };

    var xmlAttrCfg = {
        set: function set(node, key, value) {

            node.setAttributeNS("http://www.w3.org/XML/1998/namespace", xmlCfg[key], "" + value);
        },
        remove: function remove(node, key) {

            node.removeAttributeNS("http://www.w3.org/XML/1998/namespace", xmlCfg[key]);
        }
    };

    var xlinkCfg = {
        "xlink:actuate": "actuate",
        "xlink:arcrole": "arcrole",
        "xlink:href": "href",
        "xlink:role": "role",
        "xlink:show": "show",
        "xlink:title": "title",
        "xlink:type": "type"
    };

    var xlinkAttrCfg = {
        set: function set(node, key, value) {

            node.setAttributeNS("http://www.w3.org/1999/xlink", xlinkCfg[key], "" + value);
        },
        remove: function remove(node, key) {

            node.removeAttributeNS("http://www.w3.org/1999/xlink", xlinkCfg[key]);
        }
    };

    /**
     * Boolean attributes
     * Shared between HTML attributes and SSR
     */
    var boolAttrs = ("multiple allowFullScreen loop muted controls seamless itemScope async nowrap inert required noresize " + "translate truespeed typemustmatch sortable reversed autoplay nohref defaultselected defaultchecked " + "noshade indeterminate draggable defaultSelected defaultChecked compact itemscope").split(" ");

    /**
     * Boolean properties
     * Shared between HTML properties and SSR
     */
    var boolProps = ("multiple allowFullScreen async inert autofocus autoplay checked controls defer disabled enabled formNoValidate " + "loop muted noValidate open readOnly required scoped seamless selected itemScope translate " + "truespeed typemustmatch defaultSelected sortable reversed nohref noresize noshade indeterminate draggable " + "hidden defaultSelected defaultChecked compact autoplay itemscope formNoValidate").split(" ");

    /**
     * xlink namespace attributes
     * Shared between HTML attributes and SSR
     */
    var xlinkAttrs = "xlink:actuate xlink:arcrole xlink:href xlink:role xlink:show xlink:title xlink:type".split(" ");

    /**
     * XML namespace attributes
     * Shared between HTML attributes and SSR
     */
    var xmlAttrs = "xml:base xml:id xml:lang xml:space".split(" ");

    /************************** WARNING!! **********************************
     *  Don't do any changes here except if you know what you are          *
     *  doing. This list controlls wich attributes has to be set as an     *
     *  HTML property, HTML boolean attribute or a HTML boolean property   *
     ***********************************************************************/
    var attrsCfg__attrsCfg = {
        style: {
            set: setObjStyle,
            remove: removeProp
        },
        value: {
            set: setPropWithCheck,
            remove: removeProp
        }
    };

    // Default properties
    ("srcset enctype autocomplete htmlFor className paused placeholder playbackRate radiogroup currentTime srcObject tabIndex volume srcDoc " + "mediagroup kind label default").split(" ").forEach(function (prop) {

        attrsCfg__attrsCfg[prop] = defaultPropCfg;
    });

    // Boolean properties
    boolProps.forEach(function (prop) {

        attrsCfg__attrsCfg[prop] = boolPropCfg;
    });

    /**
     * Boolean attributes
     *
     * We need to do a 'concat' here and merge with a few other boolean attributes not used for
     * 'SSR' to avoid this attributes to be rendered server side as boolean properties.
     */
    boolAttrs.concat(("checked disabled enabled selected hidden noResize " + "allowfullscreen declare spellcheck open autofocus").split(" ")).forEach(function (prop) {

        attrsCfg__attrsCfg[prop.toLowerCase()] = boolAttrCfg;
    });

    // xlink namespace attributes
    xlinkAttrs.forEach(function (prop) {

        attrsCfg__attrsCfg[prop] = xlinkAttrCfg;
    });

    // xml namespace attributes
    xmlAttrs.forEach(function (prop) {

        attrsCfg__attrsCfg[prop] = xmlAttrCfg;
    });

    var attrsCfg__default = attrsCfg__attrsCfg;

    var setAttributes = function setAttributes(node, name, val) {

        if (name === "type" && node.tagName === "INPUT") {

            var value = node.value; // value will be lost in IE if type is changed
            node.setAttribute(name, "" + val);
            node.value = value;
        } else {

            node.setAttribute(name, "" + val);
        }
    };

    var defaultAttrCfg = {
        set: setAttributes,
        remove: removeAttr
    };

    var DOMAttrCfg = function DOMAttrCfg(attrName) {

        return attrsCfg__default[attrName] || defaultAttrCfg;
    };

    /************************** WARNING!! **********************************
     *  Don't do any changes here except if you know what you are          *
     *  doing. This list controlls wich properties has to be set as an     *
     *  HTML attributes, HTML boolean attribute or a HTML boolean property *
     ***********************************************************************/

    var propsCfg__propCfg = {
        style: {
            set: setObjStyle,
            remove: removeProp
        },
        value: {
            set: setPropWithCheck,
            remove: removeProp
        }
    };

    // Boolean attributes
    "paused spellcheck".split(" ").forEach(function (prop) {

        propsCfg__propCfg[prop] = boolAttrCfg;
    });

    // Boolean properties
    boolProps.forEach(function (prop) {

        propsCfg__propCfg[prop] = boolPropCfg;
    });

    // Default attributes
    ("allowTransparency challenge charSet class classID cols contextMenu dateTime dominantBaseline form formAction formEncType " + "formMethod formTarget height keyParams keyType list manifest media role rows size sizes srcset " + "action enctype method novalidate scrolling width wmode " +
    // IE-only attribute that specifies security restrictions on an iframe
    // as an alternative to the sandbox attribute on IE<10
    "security " +
    // itemProp, itemScope, itemType are for
    // Microdata support. See http://schema.org/docs/gs.html
    "itemProp itemType inputMode inlist datatype prefix " +
    // property is supported for OpenGraph in meta tags.
    "property " + "resource rev typeof vocab about for " +
    // itemID and itemRef are for Microdata support as well but
    // only specified in the the WHATWG spec document. See
    // https://html.spec.whatwg.org/multipage/microdata.html#microdata-dom-api
    "itemID itemRef " +
    // All SVG attributes are supported if set as an attribute. This few attributes are added just to
    // prevent stupidity if anyone are trying to set them as properties
    "cursor cx cy d dx dy r rx ry viewBox transform r rx ry version y y1 y2 x1 x2 offset opacity points" +
    // IE-only attribute that controls focus behavior
    "unselectable" + "role rows size sizes srcSet").split(" ").forEach(function (prop) {

        propsCfg__propCfg[prop] = defaultAttrCfg;
    });

    var propsCfg = propsCfg__propCfg;

    var DOMPropsCfg = function DOMPropsCfg(propName) {

        return propsCfg[propName] || defaultPropCfg;
    };

    /**
     * Normalize virtual nodes
     * @param  {Object|Function|Array} children
     * @return {Object} Array wrapped child object
     */
    var normalizeChildren = function normalizeChildren(children) {

        // all 'jiesa nodes' has a 'flag. So quickly wrap the child
        // in brackets, and return.

        if (children.flag) {

            return [children];
        }

        // factory
        if (typeof children === "function") {

            children = children(children);

            return [children];
        }

        // just do a failsafe here
        if (!isArray(children)) {
            children = [children];
        }

        // everything else...	
        return children;
    };

    /**
     * Append a virtual tree onto a previously rendered DOM tree.
     *
     * @param {DOM Element} node
     * @param {Array|Function} children
     */
    var append = function append(node, children) {

        if (node) {

            // normalize the children
            children = normalizeChildren(children);

            var i = 0,
                j = 0,
                childNodes = node.childNodes,
                nodesLen = children.length,
                text = undefined,
                textLen = undefined,
                size = undefined;

            while (i < nodesLen) {

                if (children[i]) {

                    // Virtual text nodes
                    if (childNodes[j] != null && children[i].flag === 0x0002) {

                        // do nothing if we don't have a text value...
                        if (childNodes[j].data) {

                            size = children[i].data.length;
                            text = childNodes[j].data;

                            children[i].data = text;
                            children[i].append(childNodes[j]);
                            i++;

                            textLen = text.length;

                            while (size < textLen && i < nodesLen) {

                                size += children[i].data.length;
                                children[i].data = "";
                                i++;
                            }
                        }

                        // all others...
                    } else {

                            children[i].append(childNodes[j]);

                            i++;
                        }
                    j++;
                }
                return children;
            }
        }
    };

    var prototype_append = function prototype_append(node) {

        if (node) {
            var children = this.children;
            var props = this.props;
            var attrs = this.attrs;
            var hooks = this.hooks;
            var events = this.events;

            this.node = node;

            // Append children   
            if (children != null) {

                append(node, children, this);
            }

            if (attrs != null) {

                forIn(attrs, function (name, value) {

                    if (value != null) {

                        DOMAttrCfg(name).set(node, name, value);
                    }
                });
            }

            if (props != null) {

                forIn(props, function (name, value) {

                    if (value != null) {

                        DOMPropsCfg(name).set(node, name, value);
                    }
                });
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

    var hyphenateStyleName___uppercasePattern = /([A-Z])/g;

    var hyphenateStyleName = function hyphenateStyleName(string) {
        return string.replace(hyphenateStyleName___uppercasePattern, "-$1").toLowerCase();
    };

    /**
     *  Creates markup for CSS style values
     *
     * @param {Object} styles
     * @return {String}
     */
    var createMarkupForStyles = function createMarkupForStyles(styles) {

        var idx = 0,
            len = undefined,
            hSN = undefined,
            html = "";

        forIn(styles, function (styleName, styleValue) {

            if (styleValue != null) {

                hSN = hyphenateStyleName(styleName);

                if (typeof styleValue === "string") {

                    html += hSN + ":" + cleanValues(styleName, styleValue) + ";";
                } else if (isArray(styleValue)) {

                    for (len = styleValue.length; idx < len; idx++) {

                        html += hSN + ":" + cleanValues(styleName, styleValue[idx]) + ";";
                    }
                } else {

                    html += hSN + ":" + cleanValues(styleName, styleValue) + ";";
                }
            }
        });

        return html;
    };

    var booleanAttrToString = function booleanAttrToString(name, value) {

        return value ? name : "";
    };

    var createMarktupForSelect__ctx = null;
    /**
     * To get 'selected' and 'selected multiple' rendered correct, we need to do this
     * 'little' test. Else highlighted select values will not be rendred.
     * E.g. '<option selected value="2"></option>' will become '<option value="2"></option>'
     */

    var createMarktupForSelect = function createMarktupForSelect(tagName, value, props, prop) {

        var html = "";

        if (tagName === "select") {

            createMarktupForSelect__ctx = {
                value: value,
                multiple: props.multiple
            };
        } else if (tagName === "option") {

            if (createMarktupForSelect__ctx && (createMarktupForSelect__ctx.multiple ? inArray(createMarktupForSelect__ctx.value, value) : createMarktupForSelect__ctx.value === value)) {

                html += " " + booleanAttrToString("selected", true) + " " + prop + "=\"" + "" + value + "\"";
            } else {

                html += " " + prop + "=\"" + "" + value + "\"";
            }
        }
        return html;
    };

    var propBoolCfg = {

        download: 0x02
    };

    boolProps.forEach(function (prop) {

        propBoolCfg[prop] = 0x01;
    });

    /**
     * Used *only* for server side rendring (SSR) where properties has to be
     * set as attributes.
     */
    var attrNamesCfg = {
        acceptCharset: "accept-charset",
        className: "class",
        htmlFor: "for",
        httpEquiv: "http-equiv",
        contentEditable: "contenteditable"
    };

    var nsCfg = {};

    xlinkAttrs.forEach(function (prop) {

        nsCfg[prop] = true;
    });

    xmlAttrs.forEach(function (prop) {

        nsCfg[prop] = true;
    });

    // Simplified subset
    var isAttributeNameSafe__VALID_ATTRIBUTE_NAME_REGEX = /^[a-zA-Z_][a-zA-Z_\.\-\d]*$/,
        isAttributeNameSafe__illegalAttributeNameCache = {},
        isAttributeNameSafe__validatedAttributeNameCache = {};

    var isAttributeNameSafe = function isAttributeNameSafe(attributeName) {

        if (isAttributeNameSafe__validatedAttributeNameCache[attributeName]) {

            return true;
        }
        if (isAttributeNameSafe__illegalAttributeNameCache[attributeName]) {

            return false;
        }

        if (isAttributeNameSafe__VALID_ATTRIBUTE_NAME_REGEX.test(attributeName) || nsCfg[attributeName]) {

            isAttributeNameSafe__validatedAttributeNameCache[attributeName] = true;
            return true;
        }

        isAttributeNameSafe__illegalAttributeNameCache[attributeName] = true;

        return false;
    };

    /**
     *  Creates markup for HTML properties
     *
     * @param {Object} props
     * @param {String} tagName
     * @return {String} Markup string, or empty string if the property was invalid.
     */
    var createMarkupForProperties = function createMarkupForProperties(props, tagName) {

        var attrType = undefined,
            html = "",
            attr = undefined;

        forIn(props, function (prop, value) {

            // we need to check for number values, else expected - '<a download="0"></a>' - would
            // become - '<a></a>'. And the '0' - zero - will be skipped.
            if (prop !== "innerHTML" && (value || typeof value === "number")) {

                // Special case: "select" and "select multiple"
                if (prop === "value" && (tagName === "select" || tagName === "option")) {

                    html += createMarktupForSelect(tagName, value, props, prop);

                    // Special case: "style"
                } else if (prop === "style") {

                        html += " " + prop + "=\"" + "" + createMarkupForStyles(value) + "\"";
                    } else if (!isAttributeNameSafe(prop) || value == null) {

                        html += "";
                    } else {

                        prop = (attrNamesCfg[prop] || prop).toLowerCase();

                        attrType = propBoolCfg[prop];

                        // a boolean `value` has to be truthy
                        // and a overloaded boolean `value` has to be === true
                        if (attrType === 0x01 || attrType === 0x02 && value === true) {

                            attr = escapeHtml(prop);
                        } else {

                            attr = prop + "=\"" + "" + (value === true ? "" : value) + "\"";
                        }

                        if (attr) {

                            html += " " + attr;
                        }
                    }
            }
        });

        return html;
    };

    var attrBoolCfg = {};

    boolAttrs.forEach(function (prop) {

        attrBoolCfg[prop.toLowerCase()] = 0x01;
    });

    /**
     *  Creates markup for HTML attributes
     *
     * @param {Object} props
     * @return {String}
     */
    var createMarkupForAttributes = function createMarkupForAttributes(props, tagName) {

        var attrType = undefined,
            html = "",
            attr = undefined;

        forIn(props, function (prop, value) {

            // we need to check for number values, else expected - '<a download="0"></a>' - would
            // become - '<a></a>'. And the '0' - zero - will be skipped.
            if (prop !== "innerHTML" && (value || typeof value === "number")) {

                // Special case: "select" and "select multiple"

                if (prop === "value" && (tagName === "select" || tagName === "option")) {

                    html += createMarktupForSelect(tagName, value, props, prop);

                    // Special case: "style"
                } else if (prop === "style") {

                        html += " " + prop + "=\"" + "" + createMarkupForStyles(value) + "\"";
                    } else {

                        prop = attrNamesCfg[prop] || prop;

                        if (prop !== "viewBox") {

                            prop = prop.toLowerCase();
                        }

                        attrType = attrBoolCfg[prop];

                        // a boolean `value` has to be truthy
                        // and a overloaded boolean `value` has to be === true
                        if (attrType === 0x01 || attrType === 0x02 && value === true) {

                            attr = escapeHtml(prop);
                        } else {

                            // don't render unsafe HTML attributes - e.g. various custom attributes
                            if (!isAttributeNameSafe(prop) || value == null) {

                                html += "";
                            } else {

                                attr = (attrNamesCfg[prop] || prop) + "=\"" + "" + (value === true ? "" : value) + "\"";
                            }
                        }

                        if (attr) {

                            html += " " + attr;
                        }
                    }
            }
        });

        return html;
    };

    // For HTML, certain tags should omit their close tag. We keep a whitelist for
    // those special cased tags
    var voidCfg = {
        "area": true,
        "base": true,
        "br": true,
        "col": true,
        "command": true,
        "embed": true,
        "hr": true,
        "img": true,
        "input": true,
        "keygen": true,
        "link": true,
        "menuitem": true,
        "meta": true,
        "param": true,
        "source": true,
        "track": true,
        "wbr": true
    };

    var toHtml = function toHtml() {
        var key = undefined;var props = this.props;
        var attrs = this.attrs;
        var children = this.children;
        var tagName = this.tagName;

        var attributes = {},
            properties = {};

        if (attrs) {

            for (key in attrs) {

                if (key === "value") {

                    if (this.tagName === "textarea" || attrs.contenteditable) {

                        children = [new Text(attrs[key])];
                        continue;
                    }
                }
                attributes[key] = attrs[key];
            }
        }

        if (props) {
            for (key in props) {

                if (key === "value") {

                    if (this.tagName === "textarea" || props.contenteditable) {

                        children = [new Text(props[key])];
                        continue;
                    }
                }

                properties[key] = this.props[key];
            }
        }

        tagName = this.tagName.toLowerCase();

        var innerHTML = props && props.innerHTML || attrs && attrs.innerHTML,
            html = "<" + tagName;

        // create markup for ...

        // ...HTML attributes
        if (attrs != null) {

            html += createMarkupForAttributes(attributes, tagName);
        }

        // ... HTML properties
        if (props != null) {

            html += createMarkupForProperties(properties, tagName);
        }

        if (voidCfg[tagName]) {

            html = html + "/>";
        } else {

            html = html + ">";

            // ... child nodes
            if (children.length) {

                if (children.length === 1) {

                    html += children[0].toHtml();
                } else {

                    var index = 0;

                    var len = children.length;

                    for (; index < len; index++) {

                        html += children[index].toHtml();
                    }
                }
                // process innerHTML
            } else if (innerHTML) {

                    html += innerHTML;
                }

            html += "</" + tagName + ">";
        }
        return html;
    };

    /**
     * Insert a virtual node
     *
     * @param {Object} container Node to insert.
     * @param {Object} child Reference to the next html element.
     * @param {Object} parent Current parent.
     */
    var appendChild = function appendChild(container, child, parent) {

        child.create(parent);
        container.appendChild(child.node);
        child.render();
    };

    var render = function render(parent) {
        var children = this.children;
        var attrs = this.attrs;
        var props = this.props;
        var hooks = this.hooks;
        var events = this.events;

        var node = this.create(parent);

        // Render children
        if (children.length) {

            // quick patch if only one child
            if (children.length === 1) {

                if (children[0]) {

                    appendChild(node, children[0], this);
                }
            } else {

                var i = 0,
                    len = children.length;

                for (; i < len; i++) {

                    if (children[i]) {

                        appendChild(node, children[i], this);
                    }
                }
            }
        }

        // Render properties
        if (props != null) {

            forIn(props, function (name, value) {

                if (value != null) {

                    DOMPropsCfg(name).set(node, name, value);
                }
            });
        }

        // Render attributes
        if (attrs != null) {

            forIn(attrs, function (name, value) {

                if (value != null) {

                    DOMAttrCfg(name).set(node, name, value);
                }
            });
        }

        if (events != null) {

            node._handler = this;
        }

        // Handle hooks

        if (hooks != null) {

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
        var _this = this;

        var node = this.node;

        if (node) {
            (function () {

                var parentNode = node.parentNode;

                if (parentNode) {

                    var hooks = _this.hooks;

                    if (!hooks || !hooks.destroy) {

                        parentNode.removeChild(node);
                    } else {

                        if (hooks.destroy) {

                            hooks.destroy(node, function () {

                                parentNode.removeChild(node);
                            });

                            _this.andrew = true;
                        }
                    }
                }
            })();
        }
    };

    var patchObject = function patchObject(node, attrName, oldObj, newObj) {

        var hasDiff = false,
            diffObj = {};

        forIn(newObj, function (key, value) {

            if (oldObj[key] != value) {

                hasDiff = true;
                diffObj[key] = value;
            }
        });

        forIn(oldObj, function (key, value) {

            if (value != null && !newObj[key]) {

                hasDiff = true;
                diffObj[key] = null;
            }
        });

        if (hasDiff) {

            DOMAttrCfg(attrName).set(node, attrName, diffObj);
        }
    };

    var patchArray = function patchArray(node, attrName, oldArray, newArray) {

        var lenA = oldArray.length;

        var hasDiff = false;

        if (lenA !== newArray.length) {

            hasDiff = true;
        } else {

            var i = 0;

            while (!hasDiff && i < lenA) {

                if (oldArray[i] != newArray[i]) {

                    hasDiff = true;
                }
                ++i;
            }
        }

        if (hasDiff) {

            DOMAttrCfg(attrName).set(node, attrName, newArray);
        }
    };

    var patchAttributes = function patchAttributes(node, oldAttrs, newAttrs) {

        // newAttrs is empty, remove all properties from oldAttrs.
        if (oldAttrs != null && newAttrs == null) {

            forIn(oldAttrs, function (attrName, attrVal) {

                DOMAttrCfg(attrName).remove(node, attrName);
            });

            return;
        }

        // oldAttrs is empty, insert all attributes from newAttrs.
        if (oldAttrs == null && newAttrs != null) {

            forIn(newAttrs, function (attrName, newAttrVal) {

                DOMAttrCfg(attrName).set(node, attrName, newAttrVal);
            });
            return;
        }

        var attrAVal = undefined,
            isArrayA = undefined,
            isBArray = undefined;

        // Remove and update HTML attributes on the virtual node
        forIn(oldAttrs, function (attrName, attrVal) {

            if (!newAttrs[attrName] && attrVal != null) {

                DOMAttrCfg(attrName).remove(node, attrName);
            }
        });

        forIn(newAttrs, function (attrName, newAttrVal) {

            if ((attrAVal = oldAttrs[attrName]) == null) {

                if (newAttrVal != null) {

                    DOMAttrCfg(attrName).set(node, attrName, newAttrVal);
                }
            } else if (newAttrVal == null) {

                DOMAttrCfg(attrName).remove(node, attrName);
            } else if (typeof newAttrVal === "object" && typeof attrAVal === "object") {

                isBArray = isArray(newAttrVal);
                isArrayA = isArray(attrAVal);
                if (isBArray || isArrayA) {

                    if (isBArray && isArrayA) {

                        patchArray(node, attrName, attrAVal, newAttrVal);
                    } else {

                        DOMAttrCfg(attrName).set(node, attrName, newAttrVal);
                    }
                } else {

                    patchObject(node, attrName, attrAVal, newAttrVal, false);
                }
            } else if (newAttrVal != null || attrAVal !== newAttrVal) {

                DOMAttrCfg(attrName).set(node, attrName, newAttrVal);
            }
        });
    };

    var patchProperties = function patchProperties(node, oldProps, newProps) {

        // remove all properties from oldProps, when newProps is empty.
        if (oldProps != null && newProps == null) {

            forIn(oldProps, function (propName) {

                DOMPropsCfg(propName).remove(node, propName);
            });

            return;

        }

        // insert all properties from newProps when oldProps is empty.
        if (oldProps == null && newProps != null) {

            forIn(newProps, function (propName, propNewVal) {

                DOMPropsCfg(propName).set(node, propName, propNewVal);
            });

            return;
        }

        // Remove and update virtual node HTML properties
        forIn(oldProps, function (propName, propValue) {

            if (!newProps[propName]) {

                DOMPropsCfg(propName).remove(node, propName);
            }
        });

        forIn(newProps, function (propName, propNewVal) {

            // old properties are set to '{}', insert all new properties
            if (oldProps[propName] == null && propNewVal != null) {

                DOMPropsCfg(propName).set(node, propName, propNewVal);
            } else if (propNewVal == null) {

                DOMPropsCfg(propName).remove(node, propName);
            } else if (oldProps[propName] !== propNewVal) {

                DOMPropsCfg(propName).set(node, propName, propNewVal);
            }
        });
    };

    /**
     * Removes one or more virtual children attached to a real DOM node
     * @param {Array} children the child nodes to remove
     */
    var detach = function detach(children) {

        var idx = children.length;

        while (idx--) {

            children[idx].detach();
        }
    };

    /**
     * Creates a mapping that can be used to look up children using a key.
     *
     * @param  {Array}  children An array of nodes.
     * @param  {Number} idxFrom 
     * @param  {Number} idxTo 
     * @return {Object} A mapping of keys to the children of the virtual node.
     */

    var buildKeys = function buildKeys(children, idxFrom, idxTo) {

        var map = {},
            key = undefined;

        while (idxFrom < idxTo) {

            key = children[idxFrom].key;
            if (key != null) {

                map[key] = idxFrom;
            }
            ++idxFrom;
        }

        return map;
    };

    /**
     * Inserts `childNode` as a child of `parentNode` at the `index`.
     *
     * @param {DOMElement} parentNode Parent node in which to insert.
     * @param {DOMElement} childNode Child node to insert.
     * @param {number} index Index at which to insert the child.
     * @internal
     */
    var insertChildAt = function insertChildAt(parentNode, childNode, nextChild, parent) {

        // By exploiting arrays returning `undefined` for an undefined index, we can
        // rely exclusively on `insertBefore(node, null)` instead of also using
        // `appendChild(node)`. However, using `undefined` is not allowed by all
        // browsers so we must replace it with `null`.
        parentNode.insertBefore(childNode.render(parent), nextChild ? nextChild.node : null);
    };

    var moveChild = function moveChild(container, child, nextChild, after) {

        var doc = document,
            activeNode = doc.activeElement,
            domChild = child.node,
            domRefChild = nextChild && nextChild.node;

        if (after) {

            var nextSiblingDomNode = domRefChild.nextSibling;

            if (nextSiblingDomNode) {
                container.insertBefore(domChild, nextSiblingDomNode);
            } else {
                container.appendChild(domChild);
            }
        } else {
            container.insertBefore(domChild, domRefChild);
        }

        if (doc.activeElement !== activeNode) {
            activeNode.focus();
        }
    };

    var patchChildren = function patchChildren(container, oldChildren, children, parent) {

        var oldChildrenLen = oldChildren.length,
            childrenLen = children.length;

        // no old child nodes, insert all child nodes from 'children'
        if (oldChildrenLen === 0) {

            var iB = 0;

            for (; iB < childrenLen; iB++) {

                appendChild(container, children[iB], parent);
            }

            return;
        }

        // no new child nodes, remove all child nodes from 'oldChildren'
        if (childrenLen === 0) {

            detach(oldChildren);

            return;
        }

        // if both 'oldChildren' and 'children' has only one child node...
        if (oldChildrenLen < 2 && childrenLen < 2) {

            if (oldChildren[0].equalTo(children[0])) {

                oldChildren[0].patch(children[0]);
            } else {

                oldChildren[0].detach();
                container.appendChild(children[0].render(parent));
            }

            return;
        }

        // Fast path if only 'children' has one child node
        if (childrenLen === 1) {

            var idx = 0;

            while (idx < oldChildrenLen) {

                oldChildren[idx++].detach();
                appendChild(container, children[0], parent);
            }

            return;
        }

        // Everything else...
        var oldStartIdx = 0,
            startIdx = 0,
            oldEndIdx = oldChildrenLen - 1,
            oldStartChild = oldChildren[0],
            oldEndChild = oldChildren[oldEndIdx],
            endIdx = childrenLen - 1,
            startChild = children[0],
            endChild = children[endIdx],
            oldChildrenKeys = undefined,
            index = undefined,
            foundAChild = undefined;

        while (oldStartIdx <= oldEndIdx && startIdx <= endIdx) {

            if (oldStartChild == null) {

                ++oldStartIdx;
            } else if (oldEndChild == null) {

                --oldEndIdx;
            } else if (oldStartChild.equalTo(startChild)) {

                oldStartChild.patch(startChild);
                ++oldStartIdx;
                ++startIdx;

                // Update nodes with the same key at the end.	
            } else if (oldEndChild.equalTo(endChild)) {

                    oldEndChild.patch(endChild);
                    --oldEndIdx;
                    --endIdx;

                    // Move nodes from left to right.	
                } else if (oldStartChild.equalTo(endChild)) {

                        oldStartChild.patch(endChild);
                        moveChild(container, oldStartChild, oldEndChild, true);
                        ++oldStartIdx;
                        --endIdx;

                        // Move nodes from right to left.
                    } else if (oldEndChild.equalTo(startChild)) {

                            oldEndChild.patch(startChild);
                            moveChild(container, oldEndChild, oldStartChild, false);
                            --oldEndIdx;
                            ++startIdx;
                        } else {

                            oldChildrenKeys || (oldChildrenKeys = buildKeys(oldChildren, oldStartIdx, oldEndIdx));

                            if ((index = oldChildrenKeys[startChild.key]) != null) {

                                foundAChild = oldChildren[index];
                                oldChildren[index] = null;
                                foundAChild.patch(startChild);
                                moveChild(container, foundAChild, oldStartChild, false);
                            } else {

                                insertChildAt(container, startChild, oldStartChild, parent);
                            }
                            ++startIdx;
                        }

            oldStartChild = oldChildren[oldStartIdx];
            endChild = children[endIdx];
            oldEndChild = oldChildren[oldEndIdx];
            startChild = children[startIdx];
        }

        // All old child nodes are updated, insert the remaing new child nodes.
        if (oldStartIdx > oldEndIdx) {

            for (; startIdx <= endIdx; startIdx++) {

                if (startIdx < childrenLen - 1) {

                    insertChildAt(container, children[startIdx], children[endIdx + 1], parent);
                } else {

                    appendChild(container, children[startIdx], parent);
                }
            }
            // All nodes from children are updated, remove the rest from oldChildren.	
        } else if (startIdx > endIdx) {

                for (; oldStartIdx <= oldEndIdx; oldStartIdx++) {

                    if (oldChildren[oldStartIdx] != null) {

                        oldChildren[oldStartIdx].detach();
                    }
                }
            }
    };

    var patch = function patch(ref) {

        if (this.equalTo(ref)) {
            var node = this.node;
            var hooks = this.hooks;
            var events = this.events;
            var attrs = this.attrs;
            var props = this.props;
            var children = this.children;

            ref.node = this.node;

            // patch children
            if (children !== ref.children) {

                patchChildren(ref.node, children, ref.children);
            }

            // patch attributes
            if (attrs !== ref.attrs) {

                patchAttributes(ref.node, attrs, ref.attrs);
            }

            // patch properties
            if (props !== ref.props) {

                patchProperties(ref.node, props, ref.props);
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
        }

        this.detach(false);
        return ref.render();
    };

    /**
     * Removes the DOM node attached to the virtual node.
     */
    var prototype_detach = function prototype_detach(shouldDestroy) {
        var children = this.children;
        var hooks = this.hooks;

        /**
         * If any children, trigger the 'detach' hook on each child node
         */
        if (children.length) {

            if (children.length === 1) {

                var firstChild = children[0];

                if (firstChild.hooks && firstChild.hooks.detach) {

                    firstChild.hooks.detach(firstChild, firstChild.node);
                }
            } else {

                var index = children.length,
                    node = undefined;

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
        if (shouldDestroy !== false) {

            this.destroy();
        }
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

    /**
     * Initialize the virtual DOM element
     *
     * @param {String} tagName 
     * @param {Object|null} options
     * @param {String|Array|null} children
     */
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
         * Add data 
         */
        this.data = options.data;

        /**
         * The key used to identify this node, used to preserve DOM nodes when they
         * move within their parent.
         */
        this.key = options.key != null ? options.key : undefined;

        /**
         * Namespace indicates the closest HTML namespace as it cascades down from an ancestor, or a given namespace
         */
        this.namespace = options.attrs && options.attrs.xmlns || null;

        /**
         * type extensions
         */
        this.typeExtension = options.attrs && options.attrs.is || null;

        /**
        	 * De-activate use of HTML properties is set to true for SVG and MathML namespaces
        	 */
        this.restricted = null;
    };

    /**
     * Reference to the virtual node's flag
     */
    var flag = 0x0001;

    var createElement = function createElement(namespace, tagName, typeExtension) {

        if (namespace == null) {

            if (typeExtension) {

                return document.createElement(tagName, typeExtension);
            }

            return document.createElement(tagName);
        }

        if (typeExtension) {

            return document.createElementNS(namespace, tagName, typeExtension);
        }

        return document.createElementNS(namespace, tagName);
    };

    /**
     * Creates and return the corresponding DOM node.
     * @param {Object} parent
     * @return {Object} A DOM node.
     *
     * NOTE!!
     *
     * Because of IE and Edge browsers need to have the node created
     * and appended to the parent container before attaching the children,
     * we are 'forced' to have a separate 'create' method.
     */
    var create = function create(parent) {

        // create a new virtual node
        if (this.node == null) {

            if (this.namespace == null) {

                if (parent && parent.namespace) {

                    this.namespace = parent.namespace;
                } else {

                    var tagName = this.tagName;

                    // use SVG namespace, if this is an <svg> element
                    if (tagName === "svg") {

                        this.namespace = "http://www.w3.org/2000/svg";

                        // ...or MATH namespace, if this is an <math> element
                    } else if (tagName === "math") {

                            this.namespace = "http://www.w3.org/1998/Math/MathML";
                        }
                }
            }

            this.node = createElement(this.namespace, this.tagName, this.typeExtension);
        }

        return this.node;
    };

    /**
     * Initialize a new virtual element
     *
     * @param  {String} tagName
     * @param  {Object} options
     * @param  {Array}  children An array of child virtual dom nodes.
     */
    function Element(tagName, options, children) {

        this.init(tagName, options, children);
    }

    // Shortcut to improve speed and size
    var Element__proto = Element.prototype;

    // Defining javaScript prototype functions separately are faster than
    // in a dictionary
    Element__proto.append = prototype_append;
    Element__proto.toHtml = toHtml;
    Element__proto.render = render;
    Element__proto.patch = patch;
    Element__proto.destroy = destroy;
    Element__proto.detach = prototype_detach;
    Element__proto.equalTo = equalTo;
    Element__proto.init = init;
    Element__proto.flag = flag;
    Element__proto.create = create;

    /**
     * Initialize the virtual tree
     */
    var prototype_init = function prototype_init() {

        /** Container to hold all mounted virtual trees. */
        this.mountContainer = {};
    };

    /**
     * Mounts a virtual tree into a passed selector.
     *
     * @param {String|Object}   selector
     * @param {Function|Object} factory
     * @param {Object}          data
     */
    var prototype_mount = function prototype_mount(selector, factory, data) {

        return this.combine(selector, factory, data, function (root, nodes) {

            // Normalize the nodes
            nodes = normalizeChildren(nodes);

            // Render children
            if (nodes && nodes.length) {

                var i = nodes.length;

                while (i--) {

                    // ignore incompatible children
                    if (nodes[i]) {

                        root.appendChild(nodes[i].render());
                    }
                }
            }

            return nodes;
        });
    };

    /**
     * Unmounts a virtual tree.
     *
     * @param {String} uuid
     * @param {Function} done
     */
    var unmount = function unmount(uuid) {
        var _this2 = this;

        if (uuid != null) {
            (function () {

                // Find the mounted tree...
                var mounted = _this2.mountContainer[uuid];

                // ... and if it exist, and are mounted..
                if (mounted) {

                    var unmountFn = function unmountFn() {

                        // ... detach all child nodes
                        detach(mounted.children);

                        // Remove everything else...
                        delete mounted.root.rootID;
                        delete _this2.mountContainer[uuid];
                    };

                    unmountFn();
                }
            })();
        } else {

            // Remove the all mounted trees
            forIn(this.mountContainer, function (uid) {

                _this2.unmount(uid);
            });
        }
    };

    /**
     * Updates children of a virtual node.
     *
     * @param {Object} container
     * @param {Object} oldChildren
     * @param {Object} newChildren
     */
    var updateChildren = function updateChildren(container, oldChildren, newChildren) {

        if (oldChildren !== newChildren) {

            if (typeof newChildren === "function") {

                newChildren = newChildren(newChildren);
            }

            if (newChildren.flag) {

                newChildren = [newChildren];
            }

            patchChildren(container, oldChildren, newChildren);

            return newChildren;
        }
    };

    /**
     * Updates a virtual Tree
     *
     * @param {String|number} uuid
     * @param {String} node
     */
    var update = function update(uuid, node) {
        var _this3 = this;

        if (arguments.length) {

            // get the mounted virtual tree
            var mount = this.mountContainer[uuid];

            if (mount) {

                if (!node) {

                    node = mount.factory;
                }

                // update and re-order the child nodes         
                mount.children = updateChildren(mount.root, mount.children, node);
            }
        } else {

            // update all mounted virtual trees
            forIn(this.mountContainer, function (uid) {
                _this3.update(uid);
            });
        }
    };

    var prototype_mounted = function prototype_mounted(uuid) {

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

    /**
     * Applies a virtual tree into a passed selector.
     *
     * @param {String|Object}   selector 
     * @param {Function|Object} factory
     * @param {Object}          container
     * @param {function}        children
     */
    var combine = function combine(selector, factory, container, children) {
        if (container === undefined) container = {};

        // Find the selector where we are going to mount the virtual tree
        var root = findDOMNode(selector);

        if (root != null) {

            var mountId = undefined;

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
            container.factory = factory ? factory : function () {};
            container.children = children ? children(root, factory) : [];
            this.mountContainer[mountId] = container;

            root.rootID = mountId;

            return root.rootID;
        }
    };

    /**
     * Append a virtual tree onto a previously rendered DOM tree.
     *
     * @param {String|Object} selector
     * @param {Function|Object} factory
     * @param {Object} data
     */
    var tree_prototype_append = function tree_prototype_append(selector, factory, data) {

        return this.combine(selector, factory, data, append);
    };

    // Generate a unique identifier
    var uuidFunc = function uuidFunc(char) {
        return char == "x" ? Math.random() * 16 | 0 : (Math.random() * 16 | 0 & 0x3 | 0x8).toString(16);
    };

    var guid = function guid() {

        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, uuidFunc);
    };

    /**
     * Virtual Tree
     */
    function Tree() {

        this.init();
    }

    var Tree__proto = Tree.prototype;

    Tree__proto.init = prototype_init;
    Tree__proto.combine = combine;
    Tree__proto.append = tree_prototype_append;
    Tree__proto.mount = prototype_mount;
    Tree__proto.unmount = unmount;
    Tree__proto.update = update;
    Tree__proto.mounted = prototype_mounted;
    Tree__proto.guid = guid;

    var capturableCfg__captuable = {};

    ("blur focus mouseenter mouseleave change input submit dragstart drag dragenter dragover " + "dragleave dragend drop contextmenu wheel copy cut paste click dblclick keydown keypress keyup").split(" ").forEach(function (evt) {

        capturableCfg__captuable[evt] = true;
    });

    var capturableCfg = capturableCfg__captuable;

    /**
     * Gets the target node from a native browser event by accounting for
     * inconsistencies in browser DOM APIs.
     *
     * @param {object} nativeEvent Native browser event.
     * @return {DOMEventTarget} Target node.
     */
    var getEventTarget = function getEventTarget(nativeEvent) {

        var target = nativeEvent.target || window;
        // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
        // @see http://www.quirksmode.org/js/events_properties.html
        return target.nodeType === 3 ? target.parentNode : target;
    };

    var createHandler = function createHandler(eventName, delegator, props) {

        var target = delegator.target.parentNode,
            node = undefined,
            delegateHandler = delegator._delegateHandler;

        return function (evt) {

            evt.isPropagationStopped = false;
            evt.delegateTarget = getEventTarget(evt);
            evt.stopPropagation = function () {

                this.isPropagationStopped = true;
            };

            while ((node = evt.delegateTarget) !== null && node !== target) {

                delegateHandler(eventName, evt);

                if (evt.isPropagationStopped) {

                    break;
                }

                evt.delegateTarget = node.parentNode; // jshint ignore:line
            }
        };
    };

    function EventEmitter(delegateHandler, context) {

        if (typeof delegateHandler === "function") {

            this._delegateHandler = delegateHandler;
            this.target = context || document;
            this.events = {};
        }
    }

    // Backwards-compat with node 0.10.x
    EventEmitter.EventEmitter = EventEmitter;

    // Shortcut to improve speed and size
    var EventEmitter__proto = EventEmitter.prototype;

    /**
     * Listen to a specified event.
     * The listener will not be added if it is a duplicate.
     *
     * @param {String} eventName The event name to catch.
     */
    EventEmitter__proto.listenTo = function (eventName) {

        var listener = this.events[eventName];

        if (listener) {

            this.unlistenTo(eventName);
        }

        listener = this.events[eventName] = createHandler(eventName, this);

        this.target.addEventListener(eventName, listener, capturableCfg[eventName] !== undefined);
    };

    /**
     * Stops listening to a specified event.
     * @param {String} eventName The event name to uncatch or none to unbind all events.
     */
    EventEmitter__proto.unlistenTo = function (eventName) {
        var _this4 = this;

        if (!this.events || !this.events[eventName]) {

            return this;
        }

        if (eventName) {

            var listener = this.events[eventName];
            if (listener) {

                this.target.removeEventListener(eventName, listener, capturableCfg[eventName] !== undefined);
            }
        } else {

            // Remove all listeners
            forIn(this.events, function (key) {

                _this4.unlistenTo(key);
            });
        }
    };

    /**
     * Returns all events the script are listening to.
     *
     * @return Array All binded events.
     */
    EventEmitter__proto.listeners = function () {

        return Object.keys(this.events);
    };

    var rreturn = /\r/g;

    var elementValue = function elementValue(node, value) {

        var type = undefined;

        if (node.getAttribute("type") != null) {
            type = node.getAttribute("type");
        } else {
            type = node.nodeName.toLowerCase();
        }

        if (arguments.length === 1) {

            if (type === "checkbox" || type === "radio") {

                if (!node.checked) {

                    return false;
                }

                var val = node.getAttribute("value");

                return val ? val : true;
            } else if (type === "select") {

                if (node.multiple) {

                    var result = [],
                        options = node.options,
                        option = undefined,
                        idx = options.length;

                    while (idx--) {

                        option = options[idx];

                        if (option.selected &&
                        // Don't return options that are disabled or in a disabled optgroup
                        option.getAttribute("disabled") === null && (!option.parentNode.disabled || option.parentNode.nodeName.toLowerCase() !== "optgroup")) {

                            result.push(option.value || option.text);
                        }
                    }

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

    var booleanAttrName = {
        input: true,
        select: true,
        textarea: true,
        button: true,
        option: true,
        form: true,
        details: true
    };

    var eventHandler = function eventHandler(eventName, evt) {

        var node = evt.delegateTarget;

        // if any events...
        if (node._handler && node._handler.events) {

            eventName = node._handler.events["on" + eventName] || node._handler.events[eventName];

            if (eventName) {

                var value = undefined;

                if (booleanAttrName[node.tagName.toLowerCase()]) {

                    value = elementValue(node);
                }

                eventName(evt, value, node._handler);
            }
        }
    };

    /**
     * List of default events.
     */
    var defaultEvents = ["blur", "change", "click", "contextmenu", "copy", "cut", "dblclick", "drag", "dragend", "dragenter", "dragexit", "dragleave", "dragover", "dragstart", "drop", "error", "focus", "input", "keydown", "keypress", "keyup", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "paste", "scroll", "submit", "touchcancel", "touchend", "touchmove", "touchstart", "wheel"];

    var initEvent__eventManager = undefined;

    /**
     * Set up the eventEmitter to work with Jiesa
     * @param {Object} opts
     * @return Object
     */
    var initEvent = function initEvent(opts) {

        opts = opts || {};

        /**
         * Because we are allowing custom 'defaultEvents' and 'eventHandler'
         * we need to check if they exist and if not fallback to the default one
         */

        if (!opts.commonEvents) {

            opts.commonEvents = defaultEvents;
        }

        if (!opts.eventHandler) {

            opts.eventHandler = eventHandler;
        }

        var idx = opts.commonEvents.length,
            emitter = (function getManager() {

            if (initEvent__eventManager) {

                return initEvent__eventManager;
            }
            return initEvent__eventManager = new EventEmitter(opts.eventHandler);
        })();

        while (--idx) {

            emitter.listenTo(opts.commonEvents[idx]);
        }

        return emitter;
    };

    var jiesa = {

        Element: Element,
        Text: Text,
        Tree: Tree,
        detach: detach,
        initEvent: initEvent,

        /** 
        Current version of the library 
        */
        version: "0.0.7"
    };

    return jiesa;
});
//# sourceMappingURL=jiesa.js.map
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