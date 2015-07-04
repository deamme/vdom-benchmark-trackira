(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var benchmark = require('vdom-benchmark-base');
var t = require('trackira');

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
    t.patch(this._node, new t.Element('div', {}, renderTree(this.b)));
};

document.addEventListener('DOMContentLoaded', function(e) {
    benchmark(NAME, VERSION, BenchmarkImpl);
}, false);
},{"trackira":2,"vdom-benchmark-base":5}],2:[function(require,module,exports){
/**
 * trackira - Virtual DOM boilerplate
 * @Version: v0.1.3
 * @Author: Kenny Flashlight
 * @Homepage: http://trackira.github.io/trackira/
 * @License: MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.Trackira = factory();
})(this, function () {
	'use strict';

	// Type indicating that the virtual node is a Text node
	var types__TEXT = 0x0001;
	// Type indicating that the virtual node is a Element node
	var types__ELEMENT = 0x0002;
	// Type indicating that the virtual node is a Comment node
	var types__COMMENT = 0x0003;

	var ampRegEx = /&/g,
	    lessThanRegEx = /</g;

	// Don't escape unnecessary symbols
	// &lt;> is still not a valid HTML tags
	var escapeHtml = function escapeHtml(value) {
		return String(value).replace(ampRegEx, '&amp;').replace(lessThanRegEx, '&lt;');
	};

	function Text(text) {

		this.text = '' + text;
		this.type = types__TEXT;
	}

	Text.prototype = {

		/**
   * Render and return a virtual text node
   *
   * @return Object
   */
		render: function render() {

			if (!this.node) {

				this.node = document.createTextNode(this.text);
			}

			return this.node;
		},

		/**
   * Attaches an existing textual DOM element.
   *
   * @param  {Object} node
   * @return {Object}
   */
		attach: function attach(node) {

			return this.node = node;
		},

		/**
   * Patches the node by updating the nodeValue.
   *
   * @param {object} node Contains the next text content.
   * @return {Object}
   */
		patch: function patch(node) {

			if (this.equalTo(node)) {

				// .nodeValue gives better performance then textContent
				// http://jsperf.com/update-textcontent-vs-data-vs-nodevalue
				if (node.text !== this.text) {

					this.node.nodeValue = node.text;
				}

				return node.node = this.node;
			}

			// If not the same, destroy the node
			this.destroy();
			// ... and re-render
			node.render();
		},

		/**
   * Removes the text node attached to the virtual node.
   */
		detach: function detach() {

			this.destroy();
		},

		/**
   * Creates an html markup of the text node. This node is not intended to have
   * any features besides containing text content.
   */
		toHTML: function toHTML() {

			return escapeHtml(this.text);
		},

		/**
   * Detach the text node attached to the virtual node.
   */
		destroy: function destroy() {

			var node = this.node;
			if (node.parentNode) {

				node.parentNode.removeChild(node);
			}
		},

		/**
   * Checks if two virtual text nodes are equal to each other, and they can be updated.
   *
   * @param {Object} node
   * @return {boolean}
   */
		equalTo: function equalTo(node) {

			return this.type === node.type;
		}
	};

	function Comment(commentText) {

		this.commentText = '' + commentText;
		this.type = types__COMMENT;
	}

	Comment.prototype = {

		/**
   * Render and return a virtual comment node
   *
   * @return Object
   */
		render: function render() {

			if (!this.node) {

				this.node = document.createComment(this.commentText);
				return this.node;
			}
		},
		/**
   * Patches the node by updating the nodeValue.
   *
   * @param {object} node Contains the next text content.
   * @return {Object}
   */
		patch: function patch(node) {

			if (this.equalTo(node)) {

				// .nodeValue gives better performance then textContent
				// http://jsperf.com/update-textcontent-vs-data-vs-nodevalue
				if (node.commentText !== this.commentText) {

					this.node.nodeValue = node.commentText;
				}
				return node.node = this.node;
			}

			// If not the same, destroy the node
			this.destroy();
			// ... and re-render
			node.render();
		},

		/**
   * Attaches an existing textual DOM element.
   *
   * @param  {Object} node
   * @return {Object}
   */
		attach: function attach(node) {

			return this.node = node;
		},

		/**
   * Returns an html representation of the comment node.
   */
		toHTML: function toHTML() {

			return '<!-- ' + this.commentText.replace(/^\s+|\s+$/gm, '') + ' -->';
		},

		/**
   * Destroys the comment node attached to the virtual node.
   */
		destroy: function destroy() {

			var node = this.node;

			if (node.parentNode) {

				node.parentNode.removeChild(node);
			}
		},

		/**
   * Detach the comment node attached to the virtual node.
   */
		detach: function detach() {

			this.destroy();
		},

		/**
   * Checks if two virtual comment nodes are equal to each other, and if they can be updated.
   *
   * @param {Object} node
   * @return {boolean}
   */
		equalTo: function equalTo(node) {

			return this.type === node.type;
		}
	};

	/** Export */

	var attach = function attach(root, nodes, parent) {

		if (typeof nodes === 'function') {

			nodes = nodes(root, parent);
		}

		if (!(nodes instanceof Array)) {

			nodes = [nodes];
		}

		var i = 0,
		    j = 0,
		    childNodes = root.childNodes,
		    nodesLen = nodes.length,
		    text,
		    textLen,
		    size;

		while (i < nodesLen) {

			if (!nodes[i]) {

				i++;
				continue;
			}

			// VIRTUAL COMMENT NODE

			if (nodes[i].type === types__COMMENT) {

				// comment node

				size = nodes[i].commentText.length;
				text = childNodes[j].data;

				nodes[i].commentText = text;
				nodes[i].attach(childNodes[j], parent);
				i++;

				textLen = text.length;

				while (size < textLen && i < nodesLen) {

					size += nodes[i].commentText.length;
					nodes[i].commentText = '';
					i++;
				}

				// VIRTUAL TEXT NODE
			} else if (nodes[i].type === types__TEXT) {

				size = nodes[i].text.length;
				text = childNodes[j].data;

				nodes[i].text = text;
				nodes[i].attach(childNodes[j], parent);
				i++;

				textLen = text.length;

				while (size < textLen && i < nodesLen) {

					size += nodes[i].text.length;
					nodes[i].text = '';
					i++;
				}

				// ALL OTHERS...
			} else {

				nodes[i].attach(childNodes[j], parent);
				i++;
			}
			j++;
		}
		return nodes;
	};

	/**
   * Combines multiple className strings into one.
   *
   * @param {String|Number|Object} className
   * @return {string}
   */
	var processClasses = function processClasses(className) {

		if (typeof className === 'string' || typeof className === 'number') {

			return className;
		}

		if (typeof className === 'object') {

			var key,
			    classes = '';

			for (key in className) {

				if (className[key]) {

					classes += ' ' + key;
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
			if (propKey === 'className' && propValue !== undefined) {

				node.className = processClasses(propValue);
			} else if (propValue !== undefined) {

				node[propKey] = propValue;
			}
		}
	};

	var prototype_attach = function prototype_attach(node) {

		this.node = node;

		// Render properties
		renderProperties(node, this.props);

		// Render children   
		if (this.children.length) {

			attach(node, this.children, this);
		}

		// Handle events
		if (this.events) {

			node.__root__ = this;
		}

		// Handle callbacks
		if (this.callbacks && this.callbacks.created) {

			this.callbacks.created(this, node);
		}

		return node;
	};

	/**
  * Create root level element of the virtual node.
  *
  * @return {Object}
  */
	var create = function create() {

		if (this.namespace) {

			return this.is ? document.createElementNS(this.namespace, this.tagName, this.is) : document.createElementNS(this.namespace, this.tagName);
		}
		// custom element/web component support
		return this.is ? document.createElement(this.tagName, this.is) : document.createElement(this.tagName);
	};

	// For HTML, certain tags should omit their close tag. We keep a whitelist for
	// those special cased tags

	var voidElementNames = {
		'area': true,
		'base': true,
		'br': true,
		'col': true,
		'command': true,
		'embed': true,
		'hr': true,
		'img': true,
		'input': true,
		'keygen': true,
		'link': true,
		//    "menuitem": true,
		'meta': true,
		'param': true,
		'source': true,
		'track': true,
		'wbr': true
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

		if (typeof value === 'string') {

			return value;
		}

		var key,
		    markup = '';

		for (key in value) {

			// the value will only be stringified if the value itself is true
			if (value[key]) {

				markup += key + ' ';
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

		if (typeof styles === 'object') {

			var styleName,
			    styleValue,
			    serialized = '';
			for (styleName in styles) {

				if (styles[styleName]) {

					styleValue = styles[styleName];
					if (styleValue !== undefined) {

						serialized += styleName + ':';
						serialized += typeof styleValue === 'number' ? styleValue + 'px' : styleValue;
						serialized += ';';
					}
				}
			}
			return serialized;
		}
		return styles;
	};

	var createMarkupForAttributes = function createMarkupForAttributes(attrs, tagName) {

		var markup = '',
		    attrKey,
		    attrValue;

		for (attrKey in attrs) {

			if (attrKey !== 'innerHTML') {

				attrValue = attrs[attrKey];

				if (attrValue) {

					// Special case: "style"
					if (attrKey === 'style') {

						attrValue = createMarkupForStyles(attrValue);
					}
					// Special case: "class"
					if (attrKey === 'class') {

						attrValue = createMarkupForClass(attrValue);
					}

					// Special case - select and textarea values (should not be stringified)
					//              - contenteditable should be ignored
					if (!(attrKey === 'value' && (tagName === 'textarea' || tagName === 'select' || attrs.contenteditable))) {

						markup += ' ' + attrKey + '="' + '' + attrValue + '"';
					}
				}
			}
		}

		return markup;
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
		acceptCharset: 'accept-charset',
		className: 'class',
		htmlFor: 'for',
		httpEquiv: 'http-equiv'
	};

	var createAttribute = function createAttribute(key, value) {

		key = (attributeNames[key] || key).toLowerCase();

		var attrType = whitelist[key];

		// a boolean `value` has to be truthy
		// and a overloaded boolean `value` has to be === true
		if (attrType === 1 || attrType === 2 && value === true) {

			return escapeHtml(key);
		}
		return key + '="' + '' + value + '"';
	};

	var createMarkupForProperties = function createMarkupForProperties(props) {

		var markup = '',
		    attr,
		    propValue,
		    propKey;

		for (propKey in props) {

			if (propKey !== 'innerHTML') {

				propValue = props[propKey];

				if (propValue) {

					// Special case: "style"
					if (propKey === 'style') {

						propValue = createMarkupForStyles(propValue);
					}

					// Special case: "class"
					if (propKey === 'className') {

						propValue = createMarkupForClass(propValue);
					}

					attr = createAttribute(propKey, propValue);

					if (attr) {

						markup += ' ' + attr;
					}
				}
			}
		}
		return markup;
	};

	var toHTML = function toHTML() {

		var node = this,
		    tagName = node.tagName.toLowerCase(),
		    html = '<' + tagName;

		// stringify attributes
		if (node.attrs) {

			html += createMarkupForAttributes(node.attrs, node.tagName);
		}

		// stringify properties
		if (node.props) {

			html += createMarkupForProperties(node.props);
		}

		html = html + '>';

		// stringify children
		if (node.children.length) {

			if (node.children.length === 1) {

				html += node.children[0].toHTML();
			} else {

				var i = 0,
				    len = node.children.length;
				for (; i < len; i++) {

					html += node.children[i].toHTML();
				}
			}

			// process innerHTML
		} else if (node.props && node.props.innerHTML) {

			html += node.props.innerHTML;
		}

		// add a closing tag if this isn't a void element
		return html += voidElementNames[tagName] ? '' : '</' + tagName + '>';
	};

	/**
  * Get namespace
  *
  * @param  {String} tagName
  * @param  {Object} parentNode
  * @return {String}
  */
	var getNamespace = function getNamespace(tagName, parentNode) {

		// Use SVG namespace, if this is an <svg> element
		if (tagName === 'svg') {

			return 'http://www.w3.org/2000/svg';
		}

		// ...or MATH namespace, if this is an <math> element
		if (tagName === 'math') {

			return 'http://www.w3.org/1998/Math/MathML';
		}

		// ...or inherit from the parent node
		if (parentNode) {

			return parentNode.namespace;
		}
	};

	var determineNameAndNamespace = function determineNameAndNamespace(value) {

		var colonIndex, namespacePrefix, namespace;

		// are we dealing with a namespaced attribute, e.g. xlink:href?
		colonIndex = value.indexOf(':');

		if (colonIndex !== -1) {

			// looks like we are, yes...
			namespacePrefix = value.substr(0, colonIndex);

			value = value.substring(colonIndex + 1);

			switch (namespacePrefix) {

				case 'xlink':
					namespace = 'http://www.w3.org/1999/xlink';
					break;
				case 'xml':
					namespace = 'http://www.w3.org/XML/1998/namespace';
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

	var // xlink namespace attributes
	xlinkAttributes = 'xlink:actuate xlink:arcrole xlink:href xlink:role xlink:show xlink:title xlink:type'.split(' '),
	   
	// xml namespace attributes
	xmlAttributes = 'xml:base xml:id xml:lang xml:space'.split(' '),
	   
	// boolean attributes
	bools = 'multiple,selected,checked,disabled,readOnly,required,open'.split(','),
	    hook = { set: {}, unset: {} };

	// setter & getter for 'xlink' namespace attributes
	each(xlinkAttributes, function (key) {

		hook.set[key] = function (name, node, attrs, previous) {

			if (attrs[name] || previous && previous[name] !== attrs[name]) {

				var namespace = determineNameAndNamespace(name);
				node.setAttributeNS(namespace.namespace, namespace.name, attrs[name]);
			}
		};

		hook.unset[key] = function (name, node, previous) {

			var namespace = determineNameAndNamespace(key);
			node.removeAttributeNS(namespace.namespace, namespace.name);
		};
	});

	// setter & getter for 'xml' namespace attributes
	each(xmlAttributes, function (key) {

		hook.set[key] = function (name, node, attrs, previous) {

			if (attrs[name] || previous && previous[name] !== attrs[name]) {

				var namespace = determineNameAndNamespace(key);
				node.setAttributeNS(namespace.namespace, namespace.name, attrs[name]);
			}
		};

		hook.unset[key] = function (name, node, previous) {

			// Namespace attributes
			var namespace = determineNameAndNamespace(key);
			node.removeAttributeNS(namespace.namespace, namespace.name);
		};
	});

	// setter for boolean attributes
	each(bools, function (key) {

		hook.set[key] = function (name, node, attrs, previous) {

			if (attrs[name] || previous && previous[name] !== attrs[name]) {

				// Only set boolean attributes if the value is not negative
				if (attrs[name]) {

					node.setAttribute(key, attrs[name]);
					node[key] = true;
				}
			}
		};
	});

	var specialAttrs = hook;

	var renderAttributes = function renderAttributes(node, attrs) {

		var attrName, attributeValue, attrValue, styleName;

		for (attrName in attrs) {

			attrValue = attrs[attrName];
			if (attrValue !== undefined) {

				if (attrName === 'style') {

					if (typeof attrValue === 'object') {

						for (styleName in attrValue) {

							attributeValue = attrValue[styleName];
							if (attributeValue) {

								node.style[styleName] = '' + attributeValue;
							}
						}
					} else if (typeof attrValue === 'string') {

						node.style.cssText = attrValue;
					}
				} else if (attrName === 'value') {

					if (attrValue != null) {

						node.setAttribute(attrName, attrValue);
						node.value = attrValue;
					}
				} else if (attrName === 'class') {

					node.setAttribute(attrName, processClasses(attrValue));
				} else if (specialAttrs.set[attrName]) {

					specialAttrs.set[attrName](attrName, node, attrs, {});
				} else {

					node.setAttribute(attrName, attrValue);
				}
			}
		}
	};

	var processOption = function processOption(vnode, values) {

		if (vnode.tagName === 'option') {

			if (values[vnode.attrs && vnode.attrs.value]) {

				vnode.attrs = vnode.attrs || {};
				vnode.attrs.selected = 'selected';
			} else if (values[vnode.props && vnode.props.value]) {

				vnode.props = vnode.props || {};
				vnode.props.selected = true;
			}
		} else {

			// stringify children
			if (vnode.children.length) {

				if (vnode.children.length === 1) {

					processOption(vnode.children[0], values);
				} else {

					var i = 0,
					    len = vnode.children.length;
					for (; i < len; i++) {

						processOption(vnode.children[i], values);
					}
				}
			}
		}
	};

	var renderSelect = function renderSelect(node) {

		var selectValue = node.attrs && node.attrs.value || node.props && node.props.value,
		    values = {};

		// If the <select> has a specified value, that should override
		// these options
		if (selectValue !== undefined) {

			if (selectValue instanceof Array) {

				var i = 0,
				    value;

				while (i < selectValue.length) {

					value = selectValue[i++];
					values[value] = value;
				}
			} else {

				values[selectValue] = selectValue;
			}

			processOption(node, values);
		}
	};

	var render = function render(parent) {

		if (parent) {

			this.parent = parent;
		}

		// Set valid namespace
		if (this.namespace == null) {

			this.namespace = getNamespace(this.tagName, parent) || null;
		}

		// create a new virtual element
		var node = this.node = this.create(),
		    children = this.children;

		// Special case - select
		if (this.tagName === 'select') {

			renderSelect(this);
		}

		// Render properties
		renderProperties(node, this.props);

		// Render attributes
		renderAttributes(node, this.attrs);

		// Render children
		if (this.children.length) {

			// ignore incompatible children
			if (this.children.length === 1 && children[0]) {

				node.appendChild(children[0].render(this));
			} else {

				var i = 0,
				    len = children.length;
				for (; i < len; i++) {

					if (children[i]) {

						node.appendChild(children[i].render(this));
					}
				}
			}
		}

		// only attach the vnode reference for DOM element which has defined events to minimize overhead
		if (this.events) {

			node.__root__ = this;
		}

		// Handle callbacks
		if (this.callbacks && this.callbacks.created) {

			this.callbacks.created(this, node);
		}

		return node;
	};

	/**
  * Remove a real DOM element from where it was inserted
  */
	var prototype_destroy = function prototype_destroy() {

		var node = this.node,
		    parentElement;

		if (node) {

			// need to check for parent node - DOM may have been altered
			// by something other than Trackira! e.g. jQuery UI...
			if (parentElement = node.parentElement) {

				if (!this.callbacks || !this.callbacks.destroy) {

					return parentElement.removeChild(node);
				}

				this.callbacks.destroy(node, function () {

					parentElement.removeChild(node);
				});
			}
			// should silently abort if the element has no parent
		}
	};

	//import detach        from "../core/detach";
	//import insertChildAt from "../core/insertChildAt";

	function keysIndexes(fromChildren, startIndex, endIndex) {
		var i,
		    keys = {},
		    key;

		if (endIndex === 1) {

			key = fromChildren[0].key;
			if (key !== undefined) {
				keys[key] = 0;
			}
		} else {

			for (i = endIndex; i >= startIndex; i--) {
				key = fromChildren[i].key;
				if (key !== undefined) {
					keys[key] = i;
				}
			}
		}

		return keys;
	}

	var updateChildren = function updateChildren(container, fromChildren, toChildren, parent) {

		var fromStartIndex = 0,
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
		    before;

		var updated = false;

		if (fromChildren != null && fromEndIndex > -1) {

			if (toChildren == null || toChildren.length === 0) {

				for (; fromStartIndex <= fromEndIndex; fromStartIndex++) {

					if (fromChildren[fromStartIndex] !== undefined) {
						fromChildren[fromStartIndex].detach();
					}
				}
			} else {

				if (fromEndIndex < 2 && toEndIndex < 2) {

					// Implicit key with same type or explicit key with same key.
					if (fromStartNode.key == null && fromStartNode.equalTo(toStartNode) || fromStartNode.key != null && fromStartNode.key === toStartNode.key) {
						fromStartNode.patch(toStartNode);
					} else {
						fromStartNode.detach();
						container.appendChild(toStartNode.render());
					}
				} else if (fromChildren.length === 1) {

					while (toStartIndex <= toEndIndex) {

						toStartNode = toChildren[toStartIndex++];
						if (fromStartNode.key == null && fromStartNode.equalTo(toStartNode) || fromStartNode.key != null && fromStartNode.key === toStartNode.key) {

							fromStartNode.patch(toStartNode);
							updated = true;
							break;
						}
						container.insertBefore(toStartNode.render(), fromStartNode.node);
					}

					if (updated) {
						while (toStartIndex < toChildren.length) {
							container.appendChild(toChildren[toStartIndex++].render());
						}
					} else {

						fromStartNode.detach();
					}
				} else if (toChildren.length === 1) {

					while (fromStartIndex <= fromEndIndex) {

						fromStartNode = fromChildren[fromStartIndex++];
						if (toStartNode.key == null && toStartNode.equalTo(fromStartNode) || toStartNode.key != null && toStartNode.key === fromStartNode.key) {

							toStartNode.patch(fromStartNode);
							updated = true;
							break;
						}
						fromStartNode.detach();
					}

					if (updated) {
						while (fromStartIndex < fromChildren.length) {
							fromChildren[fromStartIndex++].detach();
						}
					} else {
						container.appendChild(toChildren[0].render());
					}
				} else {

					while (fromStartIndex <= fromEndIndex && toStartIndex <= toEndIndex) {

						if (fromStartNode === undefined) {
							fromStartNode = fromChildren[++fromStartIndex];
						} else if (fromEndNode === undefined) {
							fromEndNode = fromChildren[--fromEndIndex];
						} else if (fromStartNode.equalTo(toStartNode)) {
							fromStartNode.patch(toStartNode);
							fromStartNode = fromChildren[++fromStartIndex];
							toStartNode = toChildren[++toStartIndex];
						} else if (fromEndNode.equalTo(toEndNode)) {
							fromEndNode.patch(toEndNode);
							fromEndNode = fromChildren[--fromEndIndex];
							toEndNode = toChildren[--toEndIndex];
						} else if (fromStartNode.equalTo(toEndNode)) {
							fromStartNode.patch(toEndNode);
							container.insertBefore(fromStartNode.node, fromEndNode.node.nextSibling);
							fromStartNode = fromChildren[++fromStartIndex];
							toEndNode = toChildren[--toEndIndex];
						} else if (fromEndNode.equalTo(toStartNode)) {
							fromEndNode.patch(toStartNode);
							container.insertBefore(fromEndNode.node, fromStartNode.node);
							fromEndNode = fromChildren[--fromEndIndex];
							toStartNode = toChildren[++toStartIndex];
						} else {

							if (indexes === undefined) {
								indexes = keysIndexes(fromChildren, fromStartIndex, fromEndIndex);
							}
							index = indexes[toStartNode.key];
							if (index === undefined) {
								container.insertBefore(toStartNode.render(parent), fromStartNode.node);
								toStartNode = toChildren[++toStartIndex];
							} else {
								node = fromChildren[index];
								node.patch(toStartNode);
								fromChildren[index] = undefined;
								container.insertBefore(node.node, fromStartNode.node);
								toStartNode = toChildren[++toStartIndex];
							}
						}
					}
					if (fromStartIndex > fromEndIndex) {
						before = toChildren[toEndIndex + 1] === undefined ? null : toChildren[toEndIndex + 1].node;
						for (; toStartIndex <= toEndIndex; toStartIndex++) {
							container.insertBefore(toChildren[toStartIndex].render(parent), before);
						}
					} else if (toStartIndex > toEndIndex) {

						for (; fromStartIndex <= fromEndIndex; fromStartIndex++) {
							if (fromChildren[fromStartIndex] !== undefined) {
								fromChildren[fromStartIndex].detach();
							}
						}
					}
				}

				return toChildren;
			}
		}
	};

	var patchProperties = function patchProperties(node, props, prevProps) {

		var propKey;

		if (prevProps) {

			for (propKey in prevProps) {

				if (prevProps[propKey] !== undefined && props[propKey] === undefined) {

					if (propKey === 'className') {

						node.className = '';
					} else {

						node[propKey] = null;
					}
				}
			}
		}

		if (props) {

			for (propKey in props) {

				if (!prevProps || prevProps[propKey] !== props[propKey]) {

					if (propKey === 'className') {

						node.className = processClasses(props[propKey]);
					} else {

						node[propKey] = props[propKey];
					}
				}
			}
		}
	};

	var patchAttributes = function patchAttributes(node, attrs, previousAttr) {

		var propKey, styleName, attrName, previousAttrValue, attrValue, oldStyle, styleValue;

		if (previousAttr != null) {
			for (attrName in previousAttr) {

				previousAttrValue = previousAttr[attrName];

				if (!previousAttrValue || attrs && attrs[attrName] != null) {
					continue;
				}

				// Unset styles on `previousAttr` but not on `attrs`.
				if (attrName === 'style') {
					for (styleName in previousAttrValue) {
						node.style[styleName] = '';
					}
				} else if (specialAttrs.unset[attrName]) {

					specialAttrs.unset[attrName](attrName, node, previousAttr);
				} else {

					node.removeAttribute(attrName);
				}
			}
		}

		if (attrs != null) {
			for (attrName in attrs) {

				attrValue = attrs[attrName];

				if (attrName === 'style') {

					oldStyle = previousAttr[attrName];

					// checking both for typeof "string" and "object", avoid
					// trouble with array etc.
					if (typeof attrValue === 'object') {

						if (typeof oldStyle === 'object') {

							for (propKey in oldStyle) {
								node.style[propKey] = '';
							}
							// Update styles that changed since `previousAttr`.
							for (propKey in attrValue) {
								styleValue = attrValue[propKey];
								node.style[propKey] = styleValue;
							}
						} else {

							if (oldStyle) {
								node.style.cssText = '';
							}

							for (propKey in attrValue) {
								styleValue = attrValue[propKey];
								node.style[propKey] = styleValue;
							}
						}
					}
				} else if (attrName === 'class') {
					node.setAttribute(attrName, processClasses(attrValue));
				} else if (previousAttr[attrName] !== attrValue) {

					if (attrName === 'value') {

						node.setAttribute(attrName, attrValue);
						node[attrName] = attrValue ? attrValue : '';
					} else if (attrValue != null) {

						node.setAttribute(attrName, attrValue);
					}
				}
			}
		}
	};

	var patch = function patch(ref) {

		/** @type {HTMLElement} */
		var node = ref.node = this.node;

		// Only patch if the nodes are equal
		if (this.equalTo(ref)) {

			// Special case - select
			if (this.tagName === 'select') {

				renderSelect(ref);
			}

			// Update properties
			patchProperties(node, ref.props, this.props);

			// Update attributes
			patchAttributes(node, ref.attrs, this.attrs);

			// Update children
			if (this.children !== ref.children) {

				updateChildren(node, this.children, ref.children);
			}

			// Handle events
			if (ref.events) {

				node.__root__ = ref;
			} else if (this.events) {

				node.__root__ = undefined;
			}

			// Handle callbacks
			if (this.callbacks && this.callbacks.updated) {

				this.callbacks.updated(this, node);
			}

			return node;
		}
		// No equal node, detach the previous one
		this.detach(false);
		// ... and render a new one
		return ref.render(this.parent);
	};

	/**
  * Removes the DOM node attached to the virtual node.
  */
	var detach = function detach(destroy) {

		if (this.children && this.children.length) {

			var i = 0,
			    node = undefined,
			    len = this.children.length;

			for (; i < len; i++) {

				node = this.children[i];

				if (node.callbacks && node.callbacks.detach) {

					node.callbacks.detach(node, node.node);
				}
			}
		}

		if (this.callbacks && this.callbacks.detach) {

			this.callbacks.detach(this, this.node);
		}

		if (destroy !== false) {

			this.destroy();
		}
	};

	/**
   * Checks if two virtual nodes are equal to each other, and they can be updated.
   *
   * @param {Object} node
   * @return {boolean}
   */
	var equalTo = function equalTo(node) {

		return !(this.key !== node.key || // "key" highest priority in "patching"
		this.tagName !== node.tagName || this.type !== node.type || this.namespace !== node.namespace || this.is !== node.is);
	};

	var init = function init(tagName, options, children) {

		options = options || {};

		/**
   * Tag contain tag name of the virtual node
   */
		this.tagName = tagName || 'div';

		/**
   * List of children nodes. 
   */
		this.children = children || [];

		/**
   * Properties
   */
		this.props = options.props || {};

		/**
   * Attributes
   */
		this.attrs = options.attrs || {};

		/**
   * Events
   */
		this.events = options.events;

		/**
   * Callbacks / lifecycle hooks
   */
		this.callbacks = options.callbacks;

		/**
   * Reference to the virtual node 
   */

		/**
  * Reference to the virtual node. It will be available after the virtual node is
  * created or patched. 
  */
		this.node = null;

		/**
   * Reference to the parent node 
   */
		this.parent = null;

		/**
   * Add data 
   */
		this.data = options.data;

		/**
   * Key Used for sorting/replacing during diffing
   */
		this.key = options.key || null;
		/**
   * Namespace for xlink and xml attributes
   */
		this.namespace = options.attrs && options.attrs.xmlns || null;
		/**
   * is - custom elements / attributes, and type extensions
   */
		this.is = options.attrs && options.attrs.is || null;
		/**
   * Reference to the virtual node's type
   */
		this.type = types__ELEMENT;
	};

	function Element(tagName, options, children) {

		this.init(tagName, options, children);
	}

	Element.prototype = {
		attach: prototype_attach,
		create: create,
		toHTML: toHTML,
		render: render,
		patch: patch,
		destroy: prototype_destroy,
		detach: detach,
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

	/**
  * Mounts a virtual tree into a passed selector.
  *
  * @param {String|Object}   selector
  * @param {Function|Object} factory
  * @param {Object}          data
  */
	var prototype_mount = function prototype_mount(selector, factory, data) {

		return this.apply(selector, factory, data, function (root, nodes) {

			if (typeof nodes === 'function') {

				nodes = nodes(root);
			}

			if (!(nodes instanceof Array)) {

				nodes = [nodes];
			}

			// Render children
			if (nodes.length) {

				// ignore incompatible children
				if (nodes.length === 1 && nodes[0]) {

					root.appendChild(nodes[0].render());
				} else {

					var i = 0,
					    len = nodes.length;
					for (; i < len; i++) {

						if (nodes[i]) {

							root.appendChild(nodes[i].render());
						}
					}
				}
			}

			return nodes;
		});
	};

	/**
  * @module detach
  */
	var core_detach = function core_detach(nodes) {

		var i = 0;

		while (i < nodes.length) {

			nodes[i++].detach();
		}
	};

	var unmount = function unmount(uuid) {

		if (arguments.length) {

			var mount = this.mountContainer[uuid];

			if (mount) {

				core_detach(mount.children);
				delete mount.root.virtualTreeID;
				delete this.mountContainer[uuid];
			}
		} else {

			// Remove the world. Unmount everything.
			for (uuid in this.mountContainer) {

				this.unmount(uuid);
			}
		}
	};

	var update = function update(root, prevNodes, nodes, parent) {

		if (typeof nodes === 'function') {

			nodes = nodes(root, parent);
		}

		if (!(nodes instanceof Array)) {

			nodes = [nodes];
		}

		return updateChildren(root, prevNodes, nodes, parent);
	};

	var prototype_update = function prototype_update(mountId, tree) {

		if (arguments.length) {

			var mount = this.mountContainer[mountId];

			if (mount) {

				// Make sure focus is never lost
				var activeElement = document.activeElement;

				mount.children = update(mount.root, mount.children, tree ? tree : mount.factory);

				if (document.activeElement !== activeElement) {

					activeElement.focus();
				}
			}
		} else {

			for (mountId in this.mountContainer) {

				this.update(mountId);
			}
		}
	};

	var mounted = function mounted(uuid) {

		return arguments.length ? this.mountContainer[uuid] : this.mountContainer;
	};

	/**
  * Find a DOM node by it's CSS selector
  *
  * @param {String|DOMElement} selector
  * @param {DOMElement|null} element
  * @return {DOMElement} The node where to mount the virtual tree
  */
	var findDOMNode = function findDOMNode(selector, element) {

		if (element == null) {

			element = document;
		}

		if (typeof selector === 'string') {

			var quickMatch = /^(?:(\w+)|\.([\w\-]+))$/.exec(selector);
			return quickMatch ? element.getElementsByClassName(quickMatch[2])[0] : element.querySelector(selector);
		}

		if (selector.nodeType === 1) {

			return selector;
		}
	};

	// Generate a unique identifier
	var uuidFunc = function uuidFunc(char) {
		return char == 'x' ? Math.random() * 16 | 0 : (Math.random() * 16 | 0 & 0x3 | 0x8).toString(16);
	};
	var guid = function guid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, uuidFunc);
	};

	var apply = function apply(selector, factory, container, children) {

		// Find the selector where we are going to mount the virtual tree
		var root = findDOMNode(selector),
		    mountId;

		if (root) {

			container = container || {};

			// Unmount if already mounted
			if (root.virtualTreeID) {

				this.unmount(root.virtualTreeID);
			}

			mountId = container.mountId ? container.mountId : guid();

			container.root = root;
			container.factory = factory;
			container.children = children(root, factory, null);

			this.mountContainer[mountId] = container;

			return root.virtualTreeID = mountId;
		}
	};

	var Tree_prototype_attach = function Tree_prototype_attach(selector, factory, data) {

		return this.apply(selector, factory, data, attach);
	};

	var prototype_guid = function prototype_guid() {

		return guid();
	};

	var Tree = function Tree() {

		this.init();
	};

	Tree.prototype = {
		init: prototype_init,
		apply: apply,
		attach: Tree_prototype_attach,
		mount: prototype_mount,
		unmount: unmount,
		update: prototype_update,
		mounted: mounted,
		guid: prototype_guid
	};

	var core_patch = function core_patch(anchorNode, finaleNode) {

		var node = anchorNode.node;

		if (anchorNode === finaleNode) {

			return node;
		}

		var patchedNode = anchorNode.patch(finaleNode);

		// prevent unnecessary replaceChild calls
		if (patchedNode !== node) {

			// replace the 'patched' node with the old one
			if (node.parentElement) {

				node.parentElement.replaceChild(patchedNode, node);
			}
		}
		return patchedNode;
	};

	var events_prototype_init = function events_prototype_init(delegateHandler, container) {

		this.eventHandler = delegateHandler;
		this.context = container || document.body; // Default to document body
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

	var bubbleEvent = function bubbleEvent(root, type) {

		return function (e) {

			e.isPropagationStopped = false;
			e.delegateTarget = e.target;
			e.stopPropagation = function () {

				this.isPropagationStopped = true;
			};

			while (e.delegateTarget && e.delegateTarget !== root.eventHandler) {

				root.eventHandler(type, e);
				if (e.isPropagationStopped) {

					break;
				}
				e.delegateTarget = e.delegateTarget.parentNode;
			}
		};
	};

	/**
  * Bind an bubbled event on a DOM node.
  *
  * NOTE: The listener will be invoked with a normalized event object.
  *
  * @param {String} type
  * @param {Boolean} useCapture
  */
	var bind = function bind(type, useCapture) {

		var evt = bubbleEvent(this, type);

		// remove the 'event type' if the event are bind already
		if (this.eventContainer[type]) {

			this.unbind(type);
		}

		this.eventContainer[type] = evt;
		addEventListener(this.context, type, this.eventContainer[type], useCapture || false);

		return evt;
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
	var commonEvents = ('blur change click contextmenu copy cut dblclick drag dragend dragenter dragexit dragleave dragover dragstart ' + 'drop focus input keydown keyup keypress mousedown mousemove mouseout mouseover mouseup paste scroll submit ' + 'touchcancel touchend touchmove touchstart wheel').split(' ');

	var bindDefaultEvents = function bindDefaultEvents() {
		var _this = this;

		each(commonEvents, function (evt) {

			_this.bind(evt);
		});
	};

	var events = function events(delegateHandler, container) {

		this.init(delegateHandler, container);
	};

	events.prototype = {
		init: events_prototype_init,
		bind: bind,
		unbind: unbind,
		listeners: listeners,
		bindDefaultEvents: bindDefaultEvents
	};

	var _events = events;

	// In XML (and XML-based languages such as XHTML), tagName preserves case. On HTML elements in
	// DOM trees flagged as HTML documents, tagName returns the element name in the uppercase form.
	/**
  * Return 'nodeName' in lowerCase()
  * @return {String|Null}
  */
	var getNodeName = function getNodeName(node) {
		return node.nodeName.toLowerCase();
	};

	var rreturn = /\r/g;

	var getEventValues = function getEventValues(node, value) {

		var type = node.getAttribute('type') == null ? getNodeName(node) : node.getAttribute('type');

		if (arguments.length === 1) {

			if (type === 'checkbox' || type === 'radio') {

				if (!node.checked) {

					return false;
				}

				var val = node.getAttribute('value');

				return val == null ? true : val;
			} else if (type === 'select') {

				if (node.multiple) {

					var result = [];

					each(node.options, function (option) {

						if (option.selected &&
						// Don't return options that are disabled or in a disabled optgroup
						option.getAttribute('disabled') === null && (!option.parentNode.disabled || getNodeName(option.parentNode) !== 'optgroup')) {

							result.push(option.value || option.text);
						}
					});

					return result;
				}
				return ~node.selectedIndex ? node.options[node.selectedIndex].value : '';
			}
		}

		var ret = node.value;
		return typeof ret === 'string' ?
		// Handle most common string cases
		ret.replace(rreturn, '') :
		// Handle cases where value is null/undef or number
		ret == null ? '' : ret;
	};

	var genericHandler = function genericHandler(eventName, ev) {

		var node = ev.delegateTarget,
		    value;

		eventName = 'on' + eventName;

		if (node.__root__ && (node.__root__.events && node.__root__.events[eventName])) {

			switch (getNodeName(node)) {

				case 'input':
				case 'select':
				case 'radio':
				case 'button':
				case 'textarea':
					value = getEventValues(node);

					break;
			}

			return node.__root__.events[eventName](ev, value);
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

	var Trackira = {

		Element: Element,
		Comment: Comment,
		Text: Text,
		Tree: Tree,
		detach: core_detach,
		updateChildren: updateChildren,
		patch: core_patch,
		update: update,
		attach: attach,
		initEvent: initEvent
	};

	Trackira.version = '0.1.3';

	var trackira = Trackira;

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