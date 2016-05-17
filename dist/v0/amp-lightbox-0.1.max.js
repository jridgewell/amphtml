(window.AMP = window.AMP || []).push(function(AMP) {(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _srcGesture = require('../../../src/gesture');

var _srcLayout = require('../../../src/layout');

var _srcGestureRecognizers = require('../../../src/gesture-recognizers');

var _srcHistory = require('../../../src/history');

var _srcVsync = require('../../../src/vsync');

var _srcStyle = require('../../../src/style');

var st = babelHelpers.interopRequireWildcard(_srcStyle);

var AmpLightbox = (function (_AMP$BaseElement) {
  babelHelpers.inherits(AmpLightbox, _AMP$BaseElement);

  function AmpLightbox() {
    babelHelpers.classCallCheck(this, AmpLightbox);

    _AMP$BaseElement.apply(this, arguments);
  }

  /** @override */

  AmpLightbox.prototype.isLayoutSupported = function isLayoutSupported(layout) {
    return layout == _srcLayout.Layout.NODISPLAY;
  };

  /** @override */

  AmpLightbox.prototype.isReadyToBuild = function isReadyToBuild() {
    // Always defer building until DOMReady.
    return false;
  };

  /** @override */

  AmpLightbox.prototype.buildCallback = function buildCallback() {
    var _this = this;

    st.setStyles(this.element, {
      position: 'fixed',
      zIndex: 1000,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    });

    var children = this.getRealChildren();

    /** @private {!Element} */
    this.container_ = this.element.ownerDocument.createElement('div');
    this.applyFillContent(this.container_);
    this.element.appendChild(this.container_);
    children.forEach(function (child) {
      _this.container_.appendChild(child);
    });

    this.registerAction('close', this.close.bind(this));

    var gestures = _srcGesture.Gestures.get(this.element);
    gestures.onGesture(_srcGestureRecognizers.SwipeXYRecognizer, function () {
      // Consume to block scroll events and side-swipe.
    });

    /** @private {number} */
    this.historyId_ = -1;
  };

  /** @override */

  AmpLightbox.prototype.layoutCallback = function layoutCallback() {
    return Promise.resolve();
  };

  /** @override */

  AmpLightbox.prototype.activate = function activate() {
    var _this2 = this;

    /**  @private {function(this:AmpLightbox, Event)}*/
    this.boundCloseOnEscape_ = this.closeOnEscape_.bind(this);
    this.getWin().document.documentElement.addEventListener('keydown', this.boundCloseOnEscape_);
    this.requestFullOverlay();
    this.getViewport().resetTouchZoom();
    this.getViewport().hideFixedLayer();

    this.mutateElement(function () {
      _this2.element.style.display = '';
      _this2.element.style.opacity = 0;
      // TODO(dvoytenko): use new animations support instead.
      _this2.element.style.transition = 'opacity 0.1s ease-in';
      _srcVsync.vsyncFor(_this2.getWin()).mutate(function () {
        _this2.element.style.opacity = '';
      });
    }).then(function () {
      _this2.updateInViewport(_this2.container_, true);
      _this2.scheduleLayout(_this2.container_);
    });

    this.getHistory_().push(this.close.bind(this)).then(function (historyId) {
      _this2.historyId_ = historyId;
    });
  };

  /**
   * Handles closing the lightbox when the ESC key is pressed.
   * @param {!Event} event.
   * @private
   */

  AmpLightbox.prototype.closeOnEscape_ = function closeOnEscape_(event) {
    if (event.keyCode == 27) {
      this.close();
    }
  };

  AmpLightbox.prototype.close = function close() {
    this.cancelFullOverlay();
    this.getViewport().showFixedLayer();
    this.element.style.display = 'none';
    if (this.historyId_ != -1) {
      this.getHistory_().pop(this.historyId_);
    }
    this.getWin().document.documentElement.removeEventListener('keydown', this.boundCloseOnEscape_);
    this.boundCloseOnEscape_ = null;
    this.schedulePause(this.container_);
  };

  AmpLightbox.prototype.getHistory_ = function getHistory_() {
    return _srcHistory.historyFor(this.element.ownerDocument.defaultView);
  };

  return AmpLightbox;
})(AMP.BaseElement);

AMP.registerElement('amp-lightbox', AmpLightbox);

},{"../../../src/gesture":5,"../../../src/gesture-recognizers":4,"../../../src/history":6,"../../../src/layout":7,"../../../src/style":18,"../../../src/vsync":20}],2:[function(require,module,exports){
/*!
Copyright (C) 2014-2015 by WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
(function(window, document, Object, REGISTER_ELEMENT){'use strict';

// in case it's there or already patched
if (REGISTER_ELEMENT in document) return;

// DO NOT USE THIS FILE DIRECTLY, IT WON'T WORK
// THIS IS A PROJECT BASED ON A BUILD SYSTEM
// THIS FILE IS JUST WRAPPED UP RESULTING IN
// build/document-register-element.js
// and its .max.js counter part

var
  // IE < 11 only + old WebKit for attributes + feature detection
  EXPANDO_UID = '__' + REGISTER_ELEMENT + (Math.random() * 10e4 >> 0),

  // shortcuts and costants
  ATTACHED = 'attached',
  DETACHED = 'detached',
  EXTENDS = 'extends',
  ADDITION = 'ADDITION',
  MODIFICATION = 'MODIFICATION',
  REMOVAL = 'REMOVAL',
  DOM_ATTR_MODIFIED = 'DOMAttrModified',
  DOM_CONTENT_LOADED = 'DOMContentLoaded',
  DOM_SUBTREE_MODIFIED = 'DOMSubtreeModified',
  PREFIX_TAG = '<',
  PREFIX_IS = '=',

  // valid and invalid node names
  validName = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/,
  invalidNames = [
    'ANNOTATION-XML',
    'COLOR-PROFILE',
    'FONT-FACE',
    'FONT-FACE-SRC',
    'FONT-FACE-URI',
    'FONT-FACE-FORMAT',
    'FONT-FACE-NAME',
    'MISSING-GLYPH'
  ],

  // registered types and their prototypes
  types = [],
  protos = [],

  // to query subnodes
  query = '',

  // html shortcut used to feature detect
  documentElement = document.documentElement,

  // ES5 inline helpers || basic patches
  indexOf = types.indexOf || function (v) {
    for(var i = this.length; i-- && this[i] !== v;){}
    return i;
  },

  // other helpers / shortcuts
  OP = Object.prototype,
  hOP = OP.hasOwnProperty,
  iPO = OP.isPrototypeOf,

  defineProperty = Object.defineProperty,
  gOPD = Object.getOwnPropertyDescriptor,
  gOPN = Object.getOwnPropertyNames,
  gPO = Object.getPrototypeOf,
  sPO = Object.setPrototypeOf,

  // jshint proto: true
  hasProto = !!Object.__proto__,

  // used to create unique instances
  create = Object.create || function Bridge(proto) {
    // silly broken polyfill probably ever used but short enough to work
    return proto ? ((Bridge.prototype = proto), new Bridge()) : this;
  },

  // will set the prototype if possible
  // or copy over all properties
  setPrototype = sPO || (
    hasProto ?
      function (o, p) {
        o.__proto__ = p;
        return o;
      } : (
    (gOPN && gOPD) ?
      (function(){
        function setProperties(o, p) {
          for (var
            key,
            names = gOPN(p),
            i = 0, length = names.length;
            i < length; i++
          ) {
            key = names[i];
            if (!hOP.call(o, key)) {
              defineProperty(o, key, gOPD(p, key));
            }
          }
        }
        return function (o, p) {
          do {
            setProperties(o, p);
          } while ((p = gPO(p)) && !iPO.call(p, o));
          return o;
        };
      }()) :
      function (o, p) {
        for (var key in p) {
          o[key] = p[key];
        }
        return o;
      }
  )),

  // DOM shortcuts and helpers, if any

  MutationObserver = window.MutationObserver ||
                     window.WebKitMutationObserver,

  HTMLElementPrototype = (
    window.HTMLElement ||
    window.Element ||
    window.Node
  ).prototype,

  IE8 = !iPO.call(HTMLElementPrototype, documentElement),

  isValidNode = IE8 ?
    function (node) {
      return node.nodeType === 1;
    } :
    function (node) {
      return iPO.call(HTMLElementPrototype, node);
    },

  targets = IE8 && [],

  cloneNode = HTMLElementPrototype.cloneNode,
  setAttribute = HTMLElementPrototype.setAttribute,
  removeAttribute = HTMLElementPrototype.removeAttribute,

  // replaced later on
  createElement = document.createElement,

  // shared observer for all attributes
  attributesObserver = MutationObserver && {
    attributes: true,
    characterData: true,
    attributeOldValue: true
  },

  // useful to detect only if there's no MutationObserver
  DOMAttrModified = MutationObserver || function(e) {
    doesNotSupportDOMAttrModified = false;
    documentElement.removeEventListener(
      DOM_ATTR_MODIFIED,
      DOMAttrModified
    );
  },

  // will both be used to make DOMNodeInserted asynchronous
  asapQueue,
  rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (fn) { setTimeout(fn, 10); },

  // internal flags
  setListener = false,
  doesNotSupportDOMAttrModified = true,
  dropDomContentLoaded = true,

  // needed for the innerHTML helper
  notFromInnerHTMLHelper = true,

  // optionally defined later on
  onSubtreeModified,
  callDOMAttrModified,
  getAttributesMirror,
  observer,

  // based on setting prototype capability
  // will check proto or the expando attribute
  // in order to setup the node once
  patchIfNotAlready,
  patch
;

if (sPO || hasProto) {
    patchIfNotAlready = function (node, proto) {
      if (!iPO.call(proto, node)) {
        setupNode(node, proto);
      }
    };
    patch = setupNode;
} else {
    patchIfNotAlready = function (node, proto) {
      if (!node[EXPANDO_UID]) {
        node[EXPANDO_UID] = Object(true);
        setupNode(node, proto);
      }
    };
    patch = patchIfNotAlready;
}
if (IE8) {
  doesNotSupportDOMAttrModified = false;
  (function (){
    var
      descriptor = gOPD(HTMLElementPrototype, 'addEventListener'),
      addEventListener = descriptor.value,
      patchedRemoveAttribute = function (name) {
        var e = new CustomEvent(DOM_ATTR_MODIFIED, {bubbles: true});
        e.attrName = name;
        e.prevValue = this.getAttribute(name);
        e.newValue = null;
        e[REMOVAL] = e.attrChange = 2;
        removeAttribute.call(this, name);
        this.dispatchEvent(e);
      },
      patchedSetAttribute = function (name, value) {
        var
          had = this.hasAttribute(name),
          old = had && this.getAttribute(name),
          e = new CustomEvent(DOM_ATTR_MODIFIED, {bubbles: true})
        ;
        setAttribute.call(this, name, value);
        e.attrName = name;
        e.prevValue = had ? old : null;
        e.newValue = value;
        if (had) {
          e[MODIFICATION] = e.attrChange = 1;
        } else {
          e[ADDITION] = e.attrChange = 0;
        }
        this.dispatchEvent(e);
      },
      onPropertyChange = function (e) {
        // jshint eqnull:true
        var
          node = e.currentTarget,
          superSecret = node[EXPANDO_UID],
          propertyName = e.propertyName,
          event
        ;
        if (superSecret.hasOwnProperty(propertyName)) {
          superSecret = superSecret[propertyName];
          event = new CustomEvent(DOM_ATTR_MODIFIED, {bubbles: true});
          event.attrName = superSecret.name;
          event.prevValue = superSecret.value || null;
          event.newValue = (superSecret.value = node[propertyName] || null);
          if (event.prevValue == null) {
            event[ADDITION] = event.attrChange = 0;
          } else {
            event[MODIFICATION] = event.attrChange = 1;
          }
          node.dispatchEvent(event);
        }
      }
    ;
    descriptor.value = function (type, handler, capture) {
      if (
        type === DOM_ATTR_MODIFIED &&
        this.attributeChangedCallback &&
        this.setAttribute !== patchedSetAttribute
      ) {
        this[EXPANDO_UID] = {
          className: {
            name: 'class',
            value: this.className
          }
        };
        this.setAttribute = patchedSetAttribute;
        this.removeAttribute = patchedRemoveAttribute;
        addEventListener.call(this, 'propertychange', onPropertyChange);
      }
      addEventListener.call(this, type, handler, capture);
    };
    defineProperty(HTMLElementPrototype, 'addEventListener', descriptor);
  }());
} else if (!MutationObserver) {
  documentElement.addEventListener(DOM_ATTR_MODIFIED, DOMAttrModified);
  documentElement.setAttribute(EXPANDO_UID, 1);
  documentElement.removeAttribute(EXPANDO_UID);
  if (doesNotSupportDOMAttrModified) {
    onSubtreeModified = function (e) {
      var
        node = this,
        oldAttributes,
        newAttributes,
        key
      ;
      if (node === e.target) {
        oldAttributes = node[EXPANDO_UID];
        node[EXPANDO_UID] = (newAttributes = getAttributesMirror(node));
        for (key in newAttributes) {
          if (!(key in oldAttributes)) {
            // attribute was added
            return callDOMAttrModified(
              0,
              node,
              key,
              oldAttributes[key],
              newAttributes[key],
              ADDITION
            );
          } else if (newAttributes[key] !== oldAttributes[key]) {
            // attribute was changed
            return callDOMAttrModified(
              1,
              node,
              key,
              oldAttributes[key],
              newAttributes[key],
              MODIFICATION
            );
          }
        }
        // checking if it has been removed
        for (key in oldAttributes) {
          if (!(key in newAttributes)) {
            // attribute removed
            return callDOMAttrModified(
              2,
              node,
              key,
              oldAttributes[key],
              newAttributes[key],
              REMOVAL
            );
          }
        }
      }
    };
    callDOMAttrModified = function (
      attrChange,
      currentTarget,
      attrName,
      prevValue,
      newValue,
      action
    ) {
      var e = {
        attrChange: attrChange,
        currentTarget: currentTarget,
        attrName: attrName,
        prevValue: prevValue,
        newValue: newValue
      };
      e[action] = attrChange;
      onDOMAttrModified(e);
    };
    getAttributesMirror = function (node) {
      for (var
        attr, name,
        result = {},
        attributes = node.attributes,
        i = 0, length = attributes.length;
        i < length; i++
      ) {
        attr = attributes[i];
        name = attr.name;
        if (name !== 'setAttribute') {
          result[name] = attr.value;
        }
      }
      return result;
    };
  }
}

function loopAndVerify(list, action) {
  for (var i = 0, length = list.length; i < length; i++) {
    verifyAndSetupAndAction(list[i], action);
  }
}

function loopAndSetup(list) {
  for (var i = 0, length = list.length, node; i < length; i++) {
    node = list[i];
    patch(node, protos[getTypeIndex(node)]);
  }
}

function executeAction(action) {
  return function (node) {
    if (isValidNode(node)) {
      verifyAndSetupAndAction(node, action);
      loopAndVerify(
        node.querySelectorAll(query),
        action
      );
    }
  };
}

function getTypeIndex(target) {
  var
    is = target.getAttribute('is'),
    nodeName = target.nodeName.toUpperCase(),
    i = indexOf.call(
      types,
      is ?
          PREFIX_IS + is.toUpperCase() :
          PREFIX_TAG + nodeName
    )
  ;
  return is && -1 < i && !isInQSA(nodeName, is) ? -1 : i;
}

function isInQSA(name, type) {
  return -1 < query.indexOf(name + '[is="' + type + '"]');
}

function onDOMAttrModified(e) {
  var
    node = e.currentTarget,
    attrChange = e.attrChange,
    attrName = e.attrName,
    target = e.target
  ;
  if (notFromInnerHTMLHelper &&
      (!target || target === node) &&
      node.attributeChangedCallback &&
      attrName !== 'style' &&
      e.prevValue !== e.newValue) {
    node.attributeChangedCallback(
      attrName,
      attrChange === e[ADDITION] ? null : e.prevValue,
      attrChange === e[REMOVAL] ? null : e.newValue
    );
  }
}

function onDOMNode(action) {
  var executor = executeAction(action);
  return function (e) {
    asapQueue.push(executor, e.target);
  };
}

function onReadyStateChange(e) {
  if (dropDomContentLoaded) {
    dropDomContentLoaded = false;
    e.currentTarget.removeEventListener(DOM_CONTENT_LOADED, onReadyStateChange);
  }
  loopAndVerify(
    (e.target || document).querySelectorAll(query),
    e.detail === DETACHED ? DETACHED : ATTACHED
  );
  if (IE8) purge();
}

function patchedSetAttribute(name, value) {
  // jshint validthis:true
  var self = this;
  setAttribute.call(self, name, value);
  onSubtreeModified.call(self, {target: self});
}

function setupNode(node, proto) {
  setPrototype(node, proto);
  if (observer) {
    observer.observe(node, attributesObserver);
  } else {
    if (doesNotSupportDOMAttrModified) {
      node.setAttribute = patchedSetAttribute;
      node[EXPANDO_UID] = getAttributesMirror(node);
      node.addEventListener(DOM_SUBTREE_MODIFIED, onSubtreeModified);
    }
    node.addEventListener(DOM_ATTR_MODIFIED, onDOMAttrModified);
  }
  if (node.createdCallback && notFromInnerHTMLHelper) {
    node.created = true;
    node.createdCallback();
    node.created = false;
  }
}

function purge() {
  for (var
    node,
    i = 0,
    length = targets.length;
    i < length; i++
  ) {
    node = targets[i];
    if (!documentElement.contains(node)) {
      length--;
      targets.splice(i--, 1);
      verifyAndSetupAndAction(node, DETACHED);
    }
  }
}

function throwTypeError(type) {
  throw new Error('A ' + type + ' type is already registered');
}

function verifyAndSetupAndAction(node, action) {
  var
    fn,
    i = getTypeIndex(node)
  ;
  if (-1 < i) {
    patchIfNotAlready(node, protos[i]);
    i = 0;
    if (action === ATTACHED && !node[ATTACHED]) {
      node[DETACHED] = false;
      node[ATTACHED] = true;
      i = 1;
      if (IE8 && indexOf.call(targets, node) < 0) {
        targets.push(node);
      }
    } else if (action === DETACHED && !node[DETACHED]) {
      node[ATTACHED] = false;
      node[DETACHED] = true;
      i = 1;
    }
    if (i && (fn = node[action + 'Callback'])) fn.call(node);
  }
}

// set as enumerable, writable and configurable
document[REGISTER_ELEMENT] = function registerElement(type, options) {
  upperType = type.toUpperCase();
  if (!setListener) {
    // only first time document.registerElement is used
    // we need to set this listener
    // setting it by default might slow down for no reason
    setListener = true;
    if (MutationObserver) {
      observer = (function(attached, detached){
        function checkEmAll(list, callback) {
          for (var i = 0, length = list.length; i < length; callback(list[i++])){}
        }
        return new MutationObserver(function (records) {
          for (var
            current, node, newValue,
            i = 0, length = records.length; i < length; i++
          ) {
            current = records[i];
            if (current.type === 'childList') {
              checkEmAll(current.addedNodes, attached);
              checkEmAll(current.removedNodes, detached);
            } else {
              node = current.target;
              if (notFromInnerHTMLHelper &&
                  node.attributeChangedCallback &&
                  current.attributeName !== 'style') {
                newValue = node.getAttribute(current.attributeName);
                if (newValue !== current.oldValue) {
                  node.attributeChangedCallback(
                    current.attributeName,
                    current.oldValue,
                    newValue
                  );
                }
              }
            }
          }
        });
      }(executeAction(ATTACHED), executeAction(DETACHED)));
      observer.observe(
        document,
        {
          childList: true,
          subtree: true
        }
      );
    } else {
      asapQueue = [];
      rAF(function ASAP() {
        while (asapQueue.length) {
          asapQueue.shift().call(
            null, asapQueue.shift()
          );
        }
        rAF(ASAP);
      });
      document.addEventListener('DOMNodeInserted', onDOMNode(ATTACHED));
      document.addEventListener('DOMNodeRemoved', onDOMNode(DETACHED));
    }

    document.addEventListener(DOM_CONTENT_LOADED, onReadyStateChange);
    document.addEventListener('readystatechange', onReadyStateChange);

    document.createElement = function (localName, typeExtension) {
      var
        node = createElement.apply(document, arguments),
        name = '' + localName,
        i = indexOf.call(
          types,
          (typeExtension ? PREFIX_IS : PREFIX_TAG) +
          (typeExtension || name).toUpperCase()
        ),
        setup = -1 < i
      ;
      if (typeExtension) {
        node.setAttribute('is', typeExtension = typeExtension.toLowerCase());
        if (setup) {
          setup = isInQSA(name.toUpperCase(), typeExtension);
        }
      }
      notFromInnerHTMLHelper = !document.createElement.innerHTMLHelper;
      if (setup) patch(node, protos[i]);
      return node;
    };

    HTMLElementPrototype.cloneNode = function (deep) {
      var
        node = cloneNode.call(this, !!deep),
        i = getTypeIndex(node)
      ;
      if (-1 < i) patch(node, protos[i]);
      if (deep) loopAndSetup(node.querySelectorAll(query));
      return node;
    };
  }

  if (-2 < (
    indexOf.call(types, PREFIX_IS + upperType) +
    indexOf.call(types, PREFIX_TAG + upperType)
  )) {
    throwTypeError(type);
  }

  if (!validName.test(upperType) || -1 < indexOf.call(invalidNames, upperType)) {
    throw new Error('The type ' + type + ' is invalid');
  }

  var
    constructor = function () {
      return extending ?
        document.createElement(nodeName, upperType) :
        document.createElement(nodeName);
    },
    opt = options || OP,
    extending = hOP.call(opt, EXTENDS),
    nodeName = extending ? options[EXTENDS].toUpperCase() : upperType,
    upperType,
    i
  ;

  if (extending && -1 < (
    indexOf.call(types, PREFIX_TAG + nodeName)
  )) {
    throwTypeError(nodeName);
  }

  i = types.push((extending ? PREFIX_IS : PREFIX_TAG) + upperType) - 1;

  query = query.concat(
    query.length ? ',' : '',
    extending ? nodeName + '[is="' + type.toLowerCase() + '"]' : nodeName
  );

  constructor.prototype = (
    protos[i] = hOP.call(opt, 'prototype') ?
      opt.prototype :
      create(HTMLElementPrototype)
  );

  loopAndVerify(
    document.querySelectorAll(query),
    ATTACHED
  );

  return constructor;
};

}(window, document, Object, 'registerElement'));
},{}],3:[function(require,module,exports){
'use strict';

/**
 * Constructs a ES6/Promises A+ Promise instance.
 *
 * @constructor
 * @param {function(function(*=), function (*=))} resolver
 */
function Promise(resolver) {
  if (!(this instanceof Promise)) {
    throw new TypeError('Constructor Promise requires `new`');
  }
  if (!isFunction(resolver)) {
    throw new TypeError('Must pass resolver function');
  }

  /**
   * @param {function(this:Promise,*=,function(*=),function(*=),Deferred):!Promise} state
   * @private
   */
  this._state = PendingPromise;

  /**
   * @type {*}
   * @private
   */
  this._value = [];

  /**
   * @type {boolean}
   * @private
   */
  this._isChainEnd = true;

  doResolve(
    this,
    adopter(this, FulfilledPromise),
    adopter(this, RejectedPromise),
    { then: resolver }
  );
}

/****************************
  Public Instance Methods
 ****************************/

/**
 * Creates a new promise instance that will receive the result of this promise
 * as inputs to the onFulfilled or onRejected callbacks.
 *
 * @param {function(*)} onFulfilled
 * @param {function(*)} onRejected
 */
Promise.prototype.then = function(onFulfilled, onRejected) {
  onFulfilled = isFunction(onFulfilled) ? onFulfilled : void 0;
  onRejected = isFunction(onRejected) ? onRejected : void 0;

  if (onFulfilled || onRejected) {
    this._isChainEnd = false;
  }

  return this._state(
    this._value,
    onFulfilled,
    onRejected
  );
};

/**
 * Creates a new promise that will handle the rejected state of this promise.
 *
 * @param {function(*)} onRejected
 * @returns {!Promise}
 */
Promise.prototype.catch = function(onRejected) {
  return this.then(void 0, onRejected);
};

/****************************
  Public Static Methods
 ****************************/

/**
 * Creates a fulfilled Promise of value. If value is itself a then-able,
 * resolves with the then-able's value.
 *
 * @this {!Promise}
 * @param {*=} value
 * @returns {!Promise}
 */
Promise.resolve = function(value) {
  var Constructor = this;
  var promise;

  if (isObject(value) && value instanceof this) {
    promise = value;
  } else {
    promise = new Constructor(function(resolve) {
      resolve(value);
    });
  }

  return /** @type {!Promise} */(promise);
};

/**
 * Creates a rejected Promise of reason.
 *
 * @this {!Promise}
 * @param {*=} reason
 * @returns {!Promise}
 */
Promise.reject = function(reason) {
  var Constructor = this;
  var promise = new Constructor(function(_, reject) {
    reject(reason);
  });

  return /** @type {!Promise} */(promise);
};

/**
 * Creates a Promise that will resolve with an array of the values of the
 * passed in promises. If any promise rejects, the returned promise will
 * reject.
 *
 * @this {!Promise}
 * @param {!Array<Promise|*>} promises
 * @returns {!Promise}
 */
Promise.all = function(promises) {
  var Constructor = this;
  var promise = new Constructor(function(resolve, reject) {
    var length = promises.length;
    var values = new Array(length);

    if (length === 0) {
      return resolve(values);
    }

    each(promises, function(promise, index) {
      Constructor.resolve(promise).then(function(value) {
        values[index] = value;
        if (--length === 0) {
          resolve(values);
        }
      }, reject);
    });
  });

  return /** @type {!Promise} */(promise);
};

/**
 * Creates a Promise that will resolve or reject based on the first
 * resolved or rejected promise.
 *
 * @this {!Promise}
 * @param {!Array<Promise|*>} promises
 * @returns {!Promise}
 */
Promise.race = function(promises) {
  var Constructor = this;
  var promise = new Constructor(function(resolve, reject) {
    for (var i = 0, l = promises.length; i < l; i++) {
      Constructor.resolve(promises[i]).then(resolve, reject);
    }
  });

  return /** @type {!Promise} */(promise);
};

/**
 * An internal use static function.
 */
Promise._overrideUnhandledExceptionHandler = function(handler) {
  onPossiblyUnhandledRejection = handler;
};

/****************************
  Private functions
 ****************************/

/**
 * The Fulfilled Promise state. Calls onFulfilled with the resolved value of
 * this promise, creating a new promise.
 *
 * If there is no onFulfilled, returns the current promise to avoid an promise
 * instance.
 *
 * @this {!Promise} The current promise
 * @param {*=} value The current promise's resolved value.
 * @param {function(*=)=} onFulfilled
 * @param {function(*=)=} unused
 * @param {Deferred} deferred A deferred object that holds a promise and its
 *     resolve and reject functions. It IS NOT passed when called from
 *     Promise#then to save an object instance (since we may return the current
 *     promise). It IS passed in when adopting the Fulfilled state from the
 *     Pending state.
 * @returns {!Promise}
 */
function FulfilledPromise(value, onFulfilled, unused, deferred) {
  if (!onFulfilled) { return this; }
  if (!deferred) {
    deferred = new Deferred(this.constructor);
  }
  defer(tryCatchDeferred(deferred, onFulfilled, value));
  return deferred.promise;
}

/**
 * The Rejected Promise state. Calls onRejected with the resolved value of
 * this promise, creating a new promise.
 *
 * If there is no onRejected, returns the current promise to avoid an promise
 * instance.
 *
 * @this {!Promise} The current promise
 * @param {*=} reason The current promise's rejection reason.
 * @param {function(*=)=} unused
 * @param {function(*=)=} onRejected
 * @param {Deferred} deferred A deferred object that holds a promise and its
 *     resolve and reject functions. It IS NOT passed when called from
 *     Promise#then to save an object instance (since we may return the current
 *     promise). It IS passed in when adopting the Rejected state from the
 *     Pending state.
 * @returns {!Promise}
 */
function RejectedPromise(reason, unused, onRejected, deferred) {
  if (!onRejected) { return this; }
  if (!deferred) {
    deferred = new Deferred(this.constructor);
  }
  defer(tryCatchDeferred(deferred, onRejected, reason));
  return deferred.promise;
}

/**
 * The Pending Promise state. Eventually calls onFulfilled once the promise has
 * resolved, or onRejected once the promise rejects.
 *
 * If there is no onFulfilled and no onRejected, returns the current promise to
 * avoid an promise instance.
 *
 * @this {!Promise} The current promise
 * @param {*=} queue The current promise's pending promises queue.
 * @param {function(*=)=} onFulfilled
 * @param {function(*=)=} onRejected
 * @param {Deferred} deferred A deferred object that holds a promise and its
 *     resolve and reject functions. It IS NOT passed when called from
 *     Promise#then to save an object instance (since we may return the current
 *     promise). It IS passed in when adopting the Pending state from the
 *     Pending state of another promise.
 * @returns {!Promise}
 */
function PendingPromise(queue, onFulfilled, onRejected, deferred) {
  if (!onFulfilled && !onRejected) { return this; }
  if (!deferred) {
    deferred = new Deferred(this.constructor);
  }
  queue.push({
    deferred: deferred,
    onFulfilled: onFulfilled || deferred.resolve,
    onRejected: onRejected || deferred.reject
  });
  return deferred.promise;
}

/**
 * Constructs a deferred instance that holds a promise and its resolve and
 * reject functions.
 *
 * @constructor
 */
function Deferred(Promise) {
  var deferred = this;
  /** @type {!Promise} */
  this.promise = new Promise(function(resolve, reject) {
    /** @type {function(*=)} */
    deferred.resolve = resolve;

    /** @type {function(*=)} */
    deferred.reject = reject;
  });
  return deferred;
}

/**
 * Transitions the state of promise to another state. This is only ever called
 * on with a promise that is currently in the Pending state.
 *
 * @param {!Promise} promise
 * @param {function(this:Promise,*=,function(*=),function(*=),Deferred):!Promise} state
 * @param {*=} value
 */
function adopt(promise, state, value) {
  var queue = promise._value;
  promise._state = state;
  promise._value = value;

  for (var i = 0; i < queue.length; i++) {
    var next = queue[i];
    promise._state(
      value,
      next.onFulfilled,
      next.onRejected,
      next.deferred
    );
  }

  // Determine if this rejected promise will be "handled".
  if (state === RejectedPromise && promise._isChainEnd) {
    setTimeout(function() {
      if (promise._isChainEnd) {
        onPossiblyUnhandledRejection(value, promise);
      }
    }, 0);
  }
}
/**
 * A partial application of adopt.
 *
 * @param {!Promise} promise
 * @param {function(this:Promise,*=,function(*=),function(*=),Deferred):!Promise} state
 * @returns {function(*=)}
 */
function adopter(promise, state) {
  return function(value) {
    adopt(promise, state, value);
  };
}

/**
 * A no-op function to prevent double resolving.
 */
function noop() {}

/**
 * Tests if fn is a Function
 *
 * @param {*} fn
 * @returns {boolean}
 */
function isFunction(fn) {
  return typeof fn === 'function';
}

/**
 * Tests if fn is an Object
 *
 * @param {*} obj
 * @returns {boolean}
 */
function isObject(obj) {
  return obj === Object(obj);
}

var onPossiblyUnhandledRejection = function(reason, promise) {
  throw reason;
}

/**
 * Iterates over each element of an array, calling the iterator with the
 * element and its index.
 *
 * @param {!Array} collection
 * @param {function(*=,number)} iterator
 */
function each(collection, iterator) {
  for (var i = 0; i < collection.length; i++) {
    iterator(collection[i], i);
  }
}

/**
 * Creates a function that will attempt to resolve the deferred with the return
 * of fn. If any error is raised, rejects instead.
 *
 * @param {!Deferred} deferred
 * @param {function(*=)} fn
 * @param {*} arg
 * @returns {function()}
 */
function tryCatchDeferred(deferred, fn, arg) {
  var promise = deferred.promise;
  var resolve = deferred.resolve;
  var reject = deferred.reject;
  return function() {
    try {
      var result = fn(arg);
      if (resolve === fn || reject === fn) {
        return;
      }
      doResolve(promise, resolve, reject, result, result);
    } catch (e) {
      reject(e);
    }
  };
}

/**
 * Queues and executes multiple deferred functions on another run loop.
 */
var defer = (function() {
  /**
   * Defers fn to another run loop.
   */
  var scheduleFlush;
  if (typeof window !== 'undefined' && window.postMessage) {
    window.addEventListener('message', flush);
    scheduleFlush = function() {
      window.postMessage('macro-task', '*');
    };
  } else {
    scheduleFlush = function() {
      setTimeout(flush, 0);
    };
  }

  var queue = new Array(16);
  var length = 0;

  function flush() {
    for (var i = 0; i < length; i++) {
      var fn = queue[i];
      queue[i] = null;
      fn();
    }
    length = 0;
  }

  /**
   * @param {function()} fn
   */
  function defer(fn) {
    if (length === 0) { scheduleFlush(); }
    queue[length++] = fn;
  };

  return defer;
})();

/**
 * The Promise resolution procedure.
 * https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
 *
 * @param {!Promise} promise
 * @param {function(*=)} resolve
 * @param {function(*=)} reject
 * @param {*} value
 * @param {*=} context
 */
function doResolve(promise, resolve, reject, value, context) {
  var _reject = reject;
  var then;
  var _resolve;
  try {
    if (value === promise) {
      throw new TypeError('Cannot fulfill promise with itself');
    }
    var isObj = isObject(value);
    if (isObj && value instanceof promise.constructor) {
      adopt(promise, value._state, value._value);
    } else if (isObj && (then = value.then) && isFunction(then)) {
      _resolve = function(value) {
        _resolve = _reject = noop;
        doResolve(promise, resolve, reject, value, value);
      };
      _reject = function(reason) {
        _resolve = _reject = noop;
        reject(reason);
      };
      then.call(
        context,
        function(value) { _resolve(value); },
        function(reason) { _reject(reason); }
      );
    } else {
      resolve(value);
    }
  } catch (e) {
    _reject(e);
  }
}

module.exports = Promise;

},{}],4:[function(require,module,exports){
exports.__esModule = true;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _gesture = require('./gesture');

var _motion = require('./motion');

var _timer = require('./timer');

/**
 * A "tap" gesture.
 * @typedef {{
 *   clientX: number,
 *   clientY: number
 * }}
 */
var TapDef = undefined;

/**
 * Recognizes "tap" gestures.
 * @extends {GestureRecognizer<TapDef>}
 */

var TapRecognizer = (function (_GestureRecognizer) {
  babelHelpers.inherits(TapRecognizer, _GestureRecognizer);

  /**
   * @param {!Gestures} manager
   */

  function TapRecognizer(manager) {
    babelHelpers.classCallCheck(this, TapRecognizer);

    _GestureRecognizer.call(this, 'tap', manager);

    /** @private {number} */
    this.startX_ = 0;

    /** @private {number} */
    this.startY_ = 0;

    /** @private {number} */
    this.lastX_ = 0;

    /** @private {number} */
    this.lastY_ = 0;
  }

  /**
   * A "doubletap" gesture.
   * @typedef {{
   *   clientX: number,
   *   clientY: number
   * }}
   */

  /** @override */

  TapRecognizer.prototype.onTouchStart = function onTouchStart(e) {
    var touches = e.touches;
    if (!touches || touches.length != 1) {
      return false;
    }
    this.startX_ = touches[0].clientX;
    this.startY_ = touches[0].clientY;
    return true;
  };

  /** @override */

  TapRecognizer.prototype.onTouchMove = function onTouchMove(e) {
    var touches = e.changedTouches || e.touches;
    if (touches && touches.length == 1) {
      this.lastX_ = touches[0].clientX;
      this.lastY_ = touches[0].clientY;
      var dx = Math.abs(this.lastX_ - this.startX_) >= 8;
      var dy = Math.abs(this.lastY_ - this.startY_) >= 8;
      if (dx || dy) {
        return false;
      }
    }
    return true;
  };

  /** @override */

  TapRecognizer.prototype.onTouchEnd = function onTouchEnd(unusedE) {
    this.signalReady(0);
  };

  /** @override */

  TapRecognizer.prototype.acceptStart = function acceptStart() {
    this.signalEmit({ clientX: this.lastX_, clientY: this.lastY_ }, null);
    this.signalEnd();
  };

  return TapRecognizer;
})(_gesture.GestureRecognizer);

exports.TapRecognizer = TapRecognizer;
var DoubletapDef = undefined;

/**
 * Recognizes a "doubletap" gesture. This gesture will block a single "tap"
 * for about 300ms while it's expecting the second "tap".
 * @extends {GestureRecognizer<DoubletapDef>}
 */

var DoubletapRecognizer = (function (_GestureRecognizer2) {
  babelHelpers.inherits(DoubletapRecognizer, _GestureRecognizer2);

  /**
   * @param {!Gestures} manager
   */

  function DoubletapRecognizer(manager) {
    babelHelpers.classCallCheck(this, DoubletapRecognizer);

    _GestureRecognizer2.call(this, 'doubletap', manager);

    /** @private {number} */
    this.startX_ = 0;

    /** @private {number} */
    this.startY_ = 0;

    /** @private {number} */
    this.lastX_ = 0;

    /** @private {number} */
    this.lastY_ = 0;

    /** @private {number} */
    this.tapCount_ = 0;
  }

  /**
   * A "swipe-xy", "swipe-x" or "swipe-y" gesture. A number of these gestures
   * may be emitted for a single touch series.
   * @typedef {{
   *   first: boolean,
   *   last: boolean,
   *   deltaX: number,
   *   deltaY: number,
   *   velocityX: number,
   *   velocityY: number
   * }}
   */

  /** @override */

  DoubletapRecognizer.prototype.onTouchStart = function onTouchStart(e) {
    if (this.tapCount_ > 1) {
      return false;
    }
    var touches = e.touches;
    if (!touches || touches.length != 1) {
      return false;
    }
    this.startX_ = touches[0].clientX;
    this.startY_ = touches[0].clientY;
    return true;
  };

  /** @override */

  DoubletapRecognizer.prototype.onTouchMove = function onTouchMove(e) {
    var touches = e.changedTouches || e.touches;
    if (touches && touches.length == 1) {
      this.lastX_ = touches[0].clientX;
      this.lastY_ = touches[0].clientY;
      var dx = Math.abs(this.lastX_ - this.startX_) >= 8;
      var dy = Math.abs(this.lastY_ - this.startY_) >= 8;
      if (dx || dy) {
        this.acceptCancel();
        return false;
      }
    }
    return true;
  };

  /** @override */

  DoubletapRecognizer.prototype.onTouchEnd = function onTouchEnd(unusedE) {
    this.tapCount_++;
    if (this.tapCount_ < 2) {
      this.signalPending(300);
    } else {
      this.signalReady(0);
    }
  };

  /** @override */

  DoubletapRecognizer.prototype.acceptStart = function acceptStart() {
    this.tapCount_ = 0;
    this.signalEmit({ clientX: this.lastX_, clientY: this.lastY_ }, null);
    this.signalEnd();
  };

  /** @override */

  DoubletapRecognizer.prototype.acceptCancel = function acceptCancel() {
    this.tapCount_ = 0;
  };

  return DoubletapRecognizer;
})(_gesture.GestureRecognizer);

exports.DoubletapRecognizer = DoubletapRecognizer;
var SwipeDef = undefined;

/**
 * Recognizes swipe gestures. This gesture will yield about 10ms to other
 * gestures.
 * @extends {GestureRecognizer<SwipeDef>}
 */

var SwipeRecognizer = (function (_GestureRecognizer3) {
  babelHelpers.inherits(SwipeRecognizer, _GestureRecognizer3);

  /**
   * @param {!Gestures} manager
   */

  function SwipeRecognizer(type, manager, horiz, vert) {
    babelHelpers.classCallCheck(this, SwipeRecognizer);

    _GestureRecognizer3.call(this, type, manager);

    /** @private {boolean} */
    this.horiz_ = horiz;

    /** @private {boolean} */
    this.vert_ = vert;

    /** @private {boolean} */
    this.eventing_ = false;

    /** @private {number} */
    this.startX_ = 0;

    /** @private {number} */
    this.startY_ = 0;

    /** @private {number} */
    this.lastX_ = 0;

    /** @private {number} */
    this.lastY_ = 0;

    /** @private {number} */
    this.prevX_ = 0;

    /** @private {number} */
    this.prevY_ = 0;

    /** @private {time} */
    this.startTime_ = 0;

    /** @private {time} */
    this.lastTime_ = 0;

    /** @private {time} */
    this.prevTime_ = 0;

    /** @private {number} */
    this.velocityX_ = 0;

    /** @private {number} */
    this.velocityY_ = 0;
  }

  /**
   * Recognizes "swipe-xy" gesture. Yields about 10ms to other gestures.
   */

  /** @override */

  SwipeRecognizer.prototype.onTouchStart = function onTouchStart(e) {
    var touches = e.touches;
    if (!touches || touches.length != 1) {
      return false;
    }
    this.startTime_ = _timer.timer.now();
    this.startX_ = touches[0].clientX;
    this.startY_ = touches[0].clientY;
    return true;
  };

  /** @override */

  SwipeRecognizer.prototype.onTouchMove = function onTouchMove(e) {
    var touches = e.changedTouches || e.touches;
    if (touches && touches.length == 1) {
      var x = touches[0].clientX;
      var y = touches[0].clientY;
      this.lastX_ = x;
      this.lastY_ = y;
      if (this.eventing_) {
        this.emit_(false, false, e);
      } else {
        var dx = Math.abs(x - this.startX_);
        var dy = Math.abs(y - this.startY_);
        // Swipe is penalized slightly since it's one of the least demanding
        // gesture, thus -10 in signalReady.
        if (this.horiz_ && this.vert_) {
          if (dx >= 8 || dy >= 8) {
            this.signalReady(-10);
          }
        } else if (this.horiz_) {
          if (dx >= 8 && dx > dy) {
            this.signalReady(-10);
          } else if (dy >= 8) {
            return false;
          }
        } else if (this.vert_) {
          if (dy >= 8 && dy > dx) {
            this.signalReady(-10);
          } else if (dx >= 8) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  };

  /** @override */

  SwipeRecognizer.prototype.onTouchEnd = function onTouchEnd(e) {
    this.end_(e);
  };

  /** @override */

  SwipeRecognizer.prototype.acceptStart = function acceptStart() {
    this.eventing_ = true;
    // Reset start coordinates to where the gesture began to avoid visible
    // jump, but preserve them as "prev" coordinates to calculate the right
    // velocity.
    this.prevX_ = this.startX_;
    this.prevY_ = this.startY_;
    this.prevTime_ = this.startTime_;
    this.startX_ = this.lastX_;
    this.startY_ = this.lastY_;
    this.emit_(true, false, null);
  };

  /** @override */

  SwipeRecognizer.prototype.acceptCancel = function acceptCancel() {
    this.eventing_ = false;
  };

  /**
   * @param {boolean} first
   * @param {boolean} last
   * @param {?Event} event
   * @private
   */

  SwipeRecognizer.prototype.emit_ = function emit_(first, last, event) {
    this.lastTime_ = _timer.timer.now();
    var deltaTime = this.lastTime_ - this.prevTime_;
    // It's often that `touchend` arrives on the next frame. These should
    // be ignored to avoid a significant velocity downgrade.
    if (!last && deltaTime > 4 || last && deltaTime > 16) {
      this.velocityX_ = _motion.calcVelocity(this.lastX_ - this.prevX_, deltaTime, this.velocityX_);
      this.velocityY_ = _motion.calcVelocity(this.lastY_ - this.prevY_, deltaTime, this.velocityY_);
      this.velocityX_ = Math.abs(this.velocityX_) > 1e-4 ? this.velocityX_ : 0;
      this.velocityY_ = Math.abs(this.velocityY_) > 1e-4 ? this.velocityY_ : 0;
      this.prevX_ = this.lastX_;
      this.prevY_ = this.lastY_;
      this.prevTime_ = this.lastTime_;
    }

    this.signalEmit({
      first: first,
      last: last,
      time: this.lastTime_,
      deltaX: this.horiz_ ? this.lastX_ - this.startX_ : 0,
      deltaY: this.vert_ ? this.lastY_ - this.startY_ : 0,
      velocityX: this.horiz_ ? this.velocityX_ : 0,
      velocityY: this.vert_ ? this.velocityY_ : 0
    }, event);
  };

  /**
   * @param {?Event} event
   * @private
   */

  SwipeRecognizer.prototype.end_ = function end_(event) {
    if (this.eventing_) {
      this.eventing_ = false;
      this.emit_(false, true, event);
      this.signalEnd();
    }
  };

  return SwipeRecognizer;
})(_gesture.GestureRecognizer);

var SwipeXYRecognizer = (function (_SwipeRecognizer) {
  babelHelpers.inherits(SwipeXYRecognizer, _SwipeRecognizer);

  /**
   * @param {!Gestures} manager
   */

  function SwipeXYRecognizer(manager) {
    babelHelpers.classCallCheck(this, SwipeXYRecognizer);

    _SwipeRecognizer.call(this, 'swipe-xy', manager, true, true);
  }

  /**
   * Recognizes "swipe-x" gesture. Yields about 10ms to other gestures.
   */
  return SwipeXYRecognizer;
})(SwipeRecognizer);

exports.SwipeXYRecognizer = SwipeXYRecognizer;

var SwipeXRecognizer = (function (_SwipeRecognizer2) {
  babelHelpers.inherits(SwipeXRecognizer, _SwipeRecognizer2);

  /**
   * @param {!Gestures} manager
   */

  function SwipeXRecognizer(manager) {
    babelHelpers.classCallCheck(this, SwipeXRecognizer);

    _SwipeRecognizer2.call(this, 'swipe-x', manager, true, false);
  }

  /**
   * Recognizes "swipe-y" gesture. Yields about 10ms to other gestures.
   */
  return SwipeXRecognizer;
})(SwipeRecognizer);

exports.SwipeXRecognizer = SwipeXRecognizer;

var SwipeYRecognizer = (function (_SwipeRecognizer3) {
  babelHelpers.inherits(SwipeYRecognizer, _SwipeRecognizer3);

  /**
   * @param {!Gestures} manager
   */

  function SwipeYRecognizer(manager) {
    babelHelpers.classCallCheck(this, SwipeYRecognizer);

    _SwipeRecognizer3.call(this, 'swipe-y', manager, false, true);
  }

  /**
   * A "tapzoom" gesture. It has a center, delta off the center center and
   * the velocity of moving away from the center.
   * @typedef {{
   *   first: boolean,
   *   last: boolean,
   *   centerClientX: number,
   *   centerClientY: number,
   *   deltaX: number,
   *   deltaY: number,
   *   velocityX: number,
   *   velocityY: number
   * }}
   */
  return SwipeYRecognizer;
})(SwipeRecognizer);

exports.SwipeYRecognizer = SwipeYRecognizer;
var TapzoomDef = undefined;

/**
 * Recognizes a "tapzoom" gesture. This gesture will block other gestures
 * for about 400ms after first "tap" while it's expecting swipe.
 * @extends {GestureRecognizer<TapzoomDef>}
 */

var TapzoomRecognizer = (function (_GestureRecognizer4) {
  babelHelpers.inherits(TapzoomRecognizer, _GestureRecognizer4);

  /**
   * @param {!Gestures} manager
   */

  function TapzoomRecognizer(manager) {
    babelHelpers.classCallCheck(this, TapzoomRecognizer);

    _GestureRecognizer4.call(this, 'tapzoom', manager);

    /** @private {boolean} */
    this.eventing_ = false;

    /** @private {number} */
    this.startX_ = 0;

    /** @private {number} */
    this.startY_ = 0;

    /** @private {number} */
    this.lastX_ = 0;

    /** @private {number} */
    this.lastY_ = 0;

    /** @private {number} */
    this.tapX_ = 0;

    /** @private {number} */
    this.tapY_ = 0;

    /** @private {number} */
    this.tapCount_ = 0;

    /** @private {number} */
    this.prevX_ = 0;

    /** @private {number} */
    this.prevY_ = 0;

    /** @private {time} */
    this.startTime_ = 0;

    /** @private {time} */
    this.lastTime_ = 0;

    /** @private {time} */
    this.prevTime_ = 0;

    /** @private {number} */
    this.velocityX_ = 0;

    /** @private {number} */
    this.velocityY_ = 0;
  }

  /**
   * A "pinch" gesture. It has a center, delta off the center center and
   * the velocity of moving away from the center. "dir" component of `1`
   * indicates that it's a expand motion and `-1` indicates pinch motion.
   * @typedef {{
   *   first: boolean,
   *   last: boolean,
   *   centerClientX: number,
   *   centerClientY: number,
   *   dir: number,
   *   deltaX: number,
   *   deltaY: number,
   *   velocityX: number,
   *   velocityY: number
   * }}
   */

  /** @override */

  TapzoomRecognizer.prototype.onTouchStart = function onTouchStart(e) {
    if (this.eventing_) {
      return false;
    }
    var touches = e.touches;
    if (!touches || touches.length != 1) {
      return false;
    }
    this.startX_ = touches[0].clientX;
    this.startY_ = touches[0].clientY;
    return true;
  };

  /** @override */

  TapzoomRecognizer.prototype.onTouchMove = function onTouchMove(e) {
    var touches = e.changedTouches || e.touches;
    if (touches && touches.length == 1) {
      this.lastX_ = touches[0].clientX;
      this.lastY_ = touches[0].clientY;
      if (this.eventing_) {
        this.emit_(false, false, e);
      } else {
        var dx = Math.abs(this.lastX_ - this.startX_) >= 8;
        var dy = Math.abs(this.lastY_ - this.startY_) >= 8;
        if (dx || dy) {
          if (this.tapCount_ == 0) {
            this.acceptCancel();
            return false;
          } else {
            this.signalReady(0);
          }
        }
      }
    }
    return true;
  };

  /** @override */

  TapzoomRecognizer.prototype.onTouchEnd = function onTouchEnd(e) {
    if (this.eventing_) {
      this.end_(e);
      return;
    }

    this.tapCount_++;
    if (this.tapCount_ == 1) {
      this.signalPending(400);
      this.tapX_ = this.lastX_;
      this.tapY_ = this.lastY_;
      return;
    }

    this.acceptCancel();
  };

  /** @override */

  TapzoomRecognizer.prototype.acceptStart = function acceptStart() {
    this.tapCount_ = 0;
    this.eventing_ = true;
    this.emit_(true, false, null);
  };

  /** @override */

  TapzoomRecognizer.prototype.acceptCancel = function acceptCancel() {
    this.tapCount_ = 0;
    this.eventing_ = false;
  };

  /**
   * @param {boolean} first
   * @param {boolean} last
   * @param {?Event} event
   * @private
   */

  TapzoomRecognizer.prototype.emit_ = function emit_(first, last, event) {
    this.lastTime_ = _timer.timer.now();
    if (first) {
      this.startTime_ = this.lastTime_;
      this.velocityX_ = this.velocityY_ = 0;
    } else if (this.lastTime_ - this.prevTime_ > 2) {
      this.velocityX_ = _motion.calcVelocity(this.lastX_ - this.prevX_, this.lastTime_ - this.prevTime_, this.velocityX_);
      this.velocityY_ = _motion.calcVelocity(this.lastY_ - this.prevY_, this.lastTime_ - this.prevTime_, this.velocityY_);
    }
    this.prevX_ = this.lastX_;
    this.prevY_ = this.lastY_;
    this.prevTime_ = this.lastTime_;

    this.signalEmit({
      first: first,
      last: last,
      centerClientX: this.startX_,
      centerClientY: this.startY_,
      deltaX: this.lastX_ - this.startX_,
      deltaY: this.lastY_ - this.startY_,
      velocityX: this.velocityX_,
      velocityY: this.velocityY_
    }, event);
  };

  /**
   * @param {?Event} event
   * @private
   */

  TapzoomRecognizer.prototype.end_ = function end_(event) {
    if (this.eventing_) {
      this.eventing_ = false;
      this.emit_(false, true, event);
      this.signalEnd();
    }
  };

  return TapzoomRecognizer;
})(_gesture.GestureRecognizer);

exports.TapzoomRecognizer = TapzoomRecognizer;
var PinchDef = undefined;

/**
 * Recognizes a "pinch" gesture.
 * @extends {GestureRecognizer<PinchDef>}
 */

var PinchRecognizer = (function (_GestureRecognizer5) {
  babelHelpers.inherits(PinchRecognizer, _GestureRecognizer5);

  /**
   * @param {!Gestures} manager
   */

  function PinchRecognizer(manager) {
    babelHelpers.classCallCheck(this, PinchRecognizer);

    _GestureRecognizer5.call(this, 'pinch', manager);

    /** @private {boolean} */
    this.eventing_ = false;

    /** @private {number} */
    this.startX1_ = 0;
    /** @private {number} */
    this.startY1_ = 0;

    /** @private {number} */
    this.startX2_ = 0;
    /** @private {number} */
    this.startY2_ = 0;

    /** @private {number} */
    this.lastX1_ = 0;
    /** @private {number} */
    this.lastY1_ = 0;

    /** @private {number} */
    this.lastX2_ = 0;
    /** @private {number} */
    this.lastY2_ = 0;

    /** @private {number} */
    this.prevDeltaX_ = 0;
    /** @private {number} */
    this.prevDeltaY_ = 0;

    /** @private {number} */
    this.centerClientX_ = 0;
    /** @private {number} */
    this.centerClientY_ = 0;

    /** @private {time} */
    this.startTime_ = 0;
    /** @private {time} */
    this.lastTime_ = 0;
    /** @private {time} */
    this.prevTime_ = 0;

    /** @private {number} */
    this.velocityX_ = 0;
    /** @private {number} */
    this.velocityY_ = 0;
  }

  /** @override */

  PinchRecognizer.prototype.onTouchStart = function onTouchStart(e) {
    var touches = e.touches;
    if (!touches || touches.length != 2) {
      return false;
    }
    this.startTime_ = _timer.timer.now();
    this.startX1_ = touches[0].clientX;
    this.startY1_ = touches[0].clientY;
    this.startX2_ = touches[1].clientX;
    this.startY2_ = touches[1].clientY;
    return true;
  };

  /** @override */

  PinchRecognizer.prototype.onTouchMove = function onTouchMove(e) {
    var touches = e.touches;
    if (!touches || touches.length != 2) {
      return false;
    }
    this.lastX1_ = touches[0].clientX;
    this.lastY1_ = touches[0].clientY;
    this.lastX2_ = touches[1].clientX;
    this.lastY2_ = touches[1].clientY;
    if (this.eventing_) {
      this.emit_(false, false, e);
    } else {
      var dx1 = this.lastX1_ - this.startX1_;
      var dy1 = this.lastY1_ - this.startY1_;
      var dx2 = this.lastX2_ - this.startX2_;
      var dy2 = this.lastY2_ - this.startY2_;
      // Fingers should move in opposite directions and go over the threshold.
      if (dx1 * dx2 <= 0 && dy1 * dy2 <= 0) {
        if (Math.abs(dx1 - dx2) >= 8 || Math.abs(dy1 - dy2) >= 8) {
          this.signalReady(0);
        }
      } else if (Math.abs(dx1 + dx2) >= 8 || Math.abs(dy1 + dy2) >= 8) {
        // Moving in the same direction over a threshold.
        return false;
      }
    }
    return true;
  };

  /** @override */

  PinchRecognizer.prototype.onTouchEnd = function onTouchEnd(e) {
    this.end_(e);
  };

  /** @override */

  PinchRecognizer.prototype.acceptStart = function acceptStart() {
    this.eventing_ = true;
    this.prevTime_ = this.startTime_;
    this.prevDeltaX_ = 0;
    this.prevDeltaY_ = 0;
    this.centerClientX_ = (this.startX1_ + this.startX2_) * 0.5;
    this.centerClientY_ = (this.startY1_ + this.startY2_) * 0.5;
    this.emit_(true, false, null);
  };

  /** @override */

  PinchRecognizer.prototype.acceptCancel = function acceptCancel() {
    this.eventing_ = false;
  };

  /**
   * @param {boolean} first
   * @param {boolean} last
   * @param {?Event} event
   * @private
   */

  PinchRecognizer.prototype.emit_ = function emit_(first, last, event) {
    this.lastTime_ = _timer.timer.now();
    var deltaTime = this.lastTime_ - this.prevTime_;
    var deltaX = this.deltaX_();
    var deltaY = this.deltaY_();
    // It's often that `touchend` arrives on the next frame. These should
    // be ignored to avoid a significant velocity downgrade.
    if (!last && deltaTime > 4 || last && deltaTime > 16) {
      this.velocityX_ = _motion.calcVelocity(deltaX - this.prevDeltaX_, deltaTime, this.velocityX_);
      this.velocityY_ = _motion.calcVelocity(deltaY - this.prevDeltaY_, deltaTime, this.velocityY_);
      this.velocityX_ = Math.abs(this.velocityX_) > 1e-4 ? this.velocityX_ : 0;
      this.velocityY_ = Math.abs(this.velocityY_) > 1e-4 ? this.velocityY_ : 0;
      this.prevDeltaX_ = deltaX;
      this.prevDeltaY_ = deltaY;
      this.prevTime_ = this.lastTime_;
    }

    var startSq = this.sqDist_(this.startX1_, this.startX2_, this.startY1_, this.startY2_);
    var lastSq = this.sqDist_(this.lastX1_, this.lastX2_, this.lastY1_, this.lastY2_);
    this.signalEmit({
      first: first,
      last: last,
      time: this.lastTime_,
      centerClientX: this.centerClientX_,
      centerClientY: this.centerClientY_,
      dir: Math.sign(lastSq - startSq),
      deltaX: deltaX * 0.5,
      deltaY: deltaY * 0.5,
      velocityX: this.velocityX_ * 0.5,
      velocityY: this.velocityY_ * 0.5
    }, event);
  };

  /**
   * @param {?Event} event
   * @private
   */

  PinchRecognizer.prototype.end_ = function end_(event) {
    if (this.eventing_) {
      this.eventing_ = false;
      this.emit_(false, true, event);
      this.signalEnd();
    }
  };

  /**
   * @param {number} x1
   * @param {number} x2
   * @param {number} y1
   * @param {number} y2
   * @return {number}
   * @private
   */

  PinchRecognizer.prototype.sqDist_ = function sqDist_(x1, x2, y1, y2) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
  };

  /**
   * @return {number}
   * @private
   */

  PinchRecognizer.prototype.deltaX_ = function deltaX_() {
    return Math.abs(this.lastX1_ - this.startX1_ - (this.lastX2_ - this.startX2_));
  };

  /**
   * @return {number}
   * @private
   */

  PinchRecognizer.prototype.deltaY_ = function deltaY_() {
    return Math.abs(this.lastY1_ - this.startY1_ - (this.lastY2_ - this.startY2_));
  };

  return PinchRecognizer;
})(_gesture.GestureRecognizer);

exports.PinchRecognizer = PinchRecognizer;

},{"./gesture":5,"./motion":10,"./timer":19}],5:[function(require,module,exports){
exports.__esModule = true;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _observable = require('./observable');

var _pass = require('./pass');

var _log = require('./log');

var _timer = require('./timer');

var PROP_ = '__AMP_Gestures';

/**
 * A gesture object contains the type and data of the gesture such as
 * a tap or a double-tap or a swipe. See {@link GestureRecognizer} for
 * more details.
 * @struct
 * @const
 * @template DATA
 */

var Gesture =
/**
 * @param {string} type The gesture's string type.
 * @param {DATA} data The data of the gesture.
 * @param {time} time The time that the gesture has been emitted.
 * @param {?Event} event An optional browser event that resulted in the
 *   gesture.
 */
function Gesture(type, data, time, event) {
  babelHelpers.classCallCheck(this, Gesture);

  /** @const {string} */
  this.type = type;
  /** @const {DATA} */
  this.data = data;
  /** @const {time} */
  this.time = time;
  /** @const {?Event} */
  this.event = event;
}

/**
 * Gestures object manages all gestures on a particular element. It listens
 * to all pointer events and delegates them to individual gesture recognizers.
 * When a recognizer has recognized a gesture and ready to start emitting it
 * it requests permission to do so from this class which resolves conflicts
 * between competing recognizers to decide which gesture should go forward.
 */
;

exports.Gesture = Gesture;

var Gestures = (function () {

  /**
   * Creates if not yet created and returns the shared Gestures instance for
   * the specified element.
   * @param {!Element} element
   * @return {!Gestures}
   */

  Gestures.get = function get(element) {
    var res = element[PROP_];
    if (!res) {
      res = new Gestures(element);
      element[PROP_] = res;
    }
    return res;
  };

  /**
   * @param {!Element} element
   */

  function Gestures(element) {
    babelHelpers.classCallCheck(this, Gestures);

    /** @private {!Element} */
    this.element_ = element;

    /** @private {!Array<!GestureRecognizer>} */
    this.recognizers_ = [];

    /** @private {!Array<boolean>} */
    this.tracking_ = [];

    /** @private {!Array<time>} */
    this.ready_ = [];

    /** @private {!Array<time>} */
    this.pending_ = [];

    /** @private {?GestureRecognizer} */
    this.eventing_ = null;

    /**
     * This variable indicates that the eventing has stopped on this
     * event cycle.
     * @private {boolean}
     */
    this.wasEventing_ = false;

    /** @private {!Pass} */
    this.pass_ = new _pass.Pass(this.doPass_.bind(this));

    /** @private {!Observable} */
    this.pointerDownObservable_ = new _observable.Observable();

    /**
     * Observers for each type of registered gesture types.
     * @private {!Object<string, !Observable<!Gesture>>}
     */
    this.overservers_ = Object.create(null);

    /** @private @const {function(!Event)} */
    this.boundOnTouchStart_ = this.onTouchStart_.bind(this);
    /** @private @const {function(!Event)} */
    this.boundOnTouchEnd_ = this.onTouchEnd_.bind(this);
    /** @private @const {function(!Event)} */
    this.boundOnTouchMove_ = this.onTouchMove_.bind(this);
    /** @private @const {function(!Event)} */
    this.boundOnTouchCancel_ = this.onTouchCancel_.bind(this);

    this.element_.addEventListener('touchstart', this.boundOnTouchStart_);
    this.element_.addEventListener('touchend', this.boundOnTouchEnd_);
    this.element_.addEventListener('touchmove', this.boundOnTouchMove_);
    this.element_.addEventListener('touchcancel', this.boundOnTouchCancel_);
  }

  /**
   * The gesture recognizer receives the pointer events from Gestures instance.
   * Based on these events, it can "recognize" the gesture it's responsible for,
   * request to start emitting and emit gestures. Gestures instances manages
   * several competing recognizers and decides which ones get to emit gestures
   * and which do not.
   *
   * The recognizer can be in several main states:
   * 1. Tracking state. In this state the recognizer is receiving the series of
   *    touch events from touchstart to touchend. To get into this state the
   *    recognizer has to return "true" from the {@link onTouchStart}.
   * 2. Pending state (optional). The recognizer matched part of the gesture,
   *    but needs more time to get track more events. It requests more time
   *    by calling {@link signalPending}, By the end of this time the recognizer
   *    has either matched the gesture or has been canceled.
   * 3. Ready state. The recognizer matched the whole gesture and ready to start
   *    emitting. It communicates to the Gestures this readiness by calling
   *    {@link signalReady}.
   * 5. Emitting state. If Gestures decides to go ahead with this recognizer, it
   *    will call {@link acceptStart} method. Otherwise, it will call
   *    {@link acceptCancel} method. Once in the emitting state, the recognizer
   *    can emit any number of events by calling {@link signalEmit}.
   * 6. Complete state. Once done, the recognizer can call {@link signalEnd} to
   *    communicate that it's done.
   *
   * @template DATA
   */

  /**
   * Unsubscribes from all pointer events.
   */

  Gestures.prototype.cleanup = function cleanup() {
    this.element_.removeEventListener('touchstart', this.boundOnTouchStart_);
    this.element_.removeEventListener('touchend', this.boundOnTouchEnd_);
    this.element_.removeEventListener('touchmove', this.boundOnTouchMove_);
    this.element_.removeEventListener('touchcancel', this.boundOnTouchCancel_);
    this.pass_.cancel();
  };

  /**
   * Subscribes to a gesture emitted by the specified recognizer. For a first
   * gesture handler registered in this method the recognizer is installed
   * and from that point on it participates in the event processing.
   *
   * @param {function(new:GestureRecognizer<DATA>)} recognizerConstr
   * @param {function(!Gesture<!DATA>)} handler
   * @return {!UnlistenDef}
   * @template DATA
   */

  Gestures.prototype.onGesture = function onGesture(recognizerConstr, handler) {
    var recognizer = new recognizerConstr(this);
    var type = recognizer.getType();
    var overserver = this.overservers_[type];
    if (!overserver) {
      this.recognizers_.push(recognizer);
      overserver = new _observable.Observable();
      this.overservers_[type] = overserver;
    }
    return overserver.add(handler);
  };

  /**
   * Subscribes to pointer down events, such as "touchstart" or "mousedown".
   * @param {!Function} handler
   * @return {!UnlistenDef}
   */

  Gestures.prototype.onPointerDown = function onPointerDown(handler) {
    return this.pointerDownObservable_.add(handler);
  };

  /**
   * Handles all "touchstart" events and dispatches them to the tracking
   * recognizers.
   * @param {!Event} event
   * @private
   */

  Gestures.prototype.onTouchStart_ = function onTouchStart_(event) {
    var now = _timer.timer.now();
    this.wasEventing_ = false;

    this.pointerDownObservable_.fire(event);

    for (var i = 0; i < this.recognizers_.length; i++) {
      if (this.ready_[i]) {
        // If the recognizer is in the "ready" state, it won't receive
        // any more touch series until it's allowed to emit.
        continue;
      }
      if (this.pending_[i] && this.pending_[i] < now) {
        // Pending state expired. Reset.
        this.stopTracking_(i);
      }
      if (this.recognizers_[i].onTouchStart(event)) {
        // When a recognizer is interested in the touch series it returns "true"
        // from its onTouchStart method. For this recognizer we start tracking
        // the whole series of touch events from touchstart to touchend. Other
        // recognizers will not receive them unless they return "true" from
        // onTouchStart.
        this.startTracking_(i);
      }
    }

    this.afterEvent_(event);
  };

  /**
   * Handles all "touchmove" events and dispatches them to the tracking
   * recognizers.
   * @param {!Event} event
   * @private
   */

  Gestures.prototype.onTouchMove_ = function onTouchMove_(event) {
    var now = _timer.timer.now();

    for (var i = 0; i < this.recognizers_.length; i++) {
      if (!this.tracking_[i]) {
        // The whole touch series are ignored for non-tracking recognizers.
        continue;
      }
      if (this.pending_[i] && this.pending_[i] < now) {
        // Pending state expired. Reset.
        this.stopTracking_(i);
        continue;
      }
      if (!this.recognizers_[i].onTouchMove(event)) {
        // Recognizer lost interest in the series. Reset.
        this.stopTracking_(i);
      }
    }

    this.afterEvent_(event);
  };

  /**
   * Handles all "touchend" events and dispatches them to the tracking
   * recognizers.
   * @param {!Event} event
   * @private
   */

  Gestures.prototype.onTouchEnd_ = function onTouchEnd_(event) {
    var now = _timer.timer.now();

    for (var i = 0; i < this.recognizers_.length; i++) {
      if (!this.tracking_[i]) {
        // The whole touch series are ignored for non-tracking recognizers.
        continue;
      }
      if (this.pending_[i] && this.pending_[i] < now) {
        // Pending state expired. Reset.
        this.stopTracking_(i);
        continue;
      }
      this.recognizers_[i].onTouchEnd(event);
      if (!this.pending_[i] || this.pending_[i] < now) {
        this.stopTracking_(i);
      }
    }

    this.afterEvent_(event);
  };

  /**
   * Handles all "touchcancel" events. Cancels all tracking/emitting
   * recognizers.
   * @param {!Event} event
   * @private
   */

  Gestures.prototype.onTouchCancel_ = function onTouchCancel_(event) {
    for (var i = 0; i < this.recognizers_.length; i++) {
      this.cancelEventing_(i);
    }
    this.afterEvent_(event);
  };

  /**
   * Callback for a gesture recognizer to communicate that it's ready to
   * start emitting gestures. Gestures instance may or may not allow the
   * recognizer to proceed.
   * @param {!GestureRecognizer} recognizer
   * @param {number} offset
   * @private
   */

  Gestures.prototype.signalReady_ = function signalReady_(recognizer, offset) {
    // Somebody got here first.
    if (this.eventing_) {
      recognizer.acceptCancel();
      return;
    }

    // Set the recognizer as ready and wait for the pass to
    // make the decision.
    var now = _timer.timer.now();
    for (var i = 0; i < this.recognizers_.length; i++) {
      if (this.recognizers_[i] == recognizer) {
        this.ready_[i] = now + offset;
        this.pending_[i] = 0;
      }
    }
    this.passAfterEvent_ = true;
  };

  /**
   * Callback for a gesture recognizer to communicate that it's close to
   * start emitting gestures, but needs more time to see more events. Once
   * this time expires the recognizer should either signal readiness or it
   * will be canceled.
   * @param {!GestureRecognizer} recognizer
   * @param {number} offset
   * @private
   */

  Gestures.prototype.signalPending_ = function signalPending_(recognizer, timeLeft) {
    // Somebody got here first.
    if (this.eventing_) {
      recognizer.acceptCancel();
      return;
    }

    var now = _timer.timer.now();
    for (var i = 0; i < this.recognizers_.length; i++) {
      if (this.recognizers_[i] == recognizer) {
        this.pending_[i] = now + timeLeft;
      }
    }
  };

  /**
   * Callback for a gesture recognizer to communicate that it's done
   * emitting gestures.
   * @param {!GestureRecognizer} recognizer
   * @private
   */

  Gestures.prototype.signalEnd_ = function signalEnd_(recognizer) {
    if (this.eventing_ == recognizer) {
      this.eventing_ = null;
      this.wasEventing_ = true;
    }
  };

  /**
   * Callback for a gesture emit the gesture. Only the currently emitting
   * recognizer is allowed to emit gestures.
   * @param {!GestureRecognizer} recognizer
   * @param {*} data
   * @param {?Event} event
   * @private
   */

  Gestures.prototype.signalEmit_ = function signalEmit_(recognizer, data, event) {
    _log.dev.assert(this.eventing_ == recognizer, 'Recognizer is not currently allowed: %s', recognizer.getType());
    var overserver = this.overservers_[recognizer.getType()];
    if (overserver) {
      overserver.fire(new Gesture(recognizer.getType(), data, _timer.timer.now(), event));
    }
  };

  /**
   * @param {!Event} event
   * @private
   */

  Gestures.prototype.afterEvent_ = function afterEvent_(event) {
    var cancelEvent = !!this.eventing_ || this.wasEventing_;
    this.wasEventing_ = false;
    if (!cancelEvent) {
      var now = _timer.timer.now();
      for (var i = 0; i < this.recognizers_.length; i++) {
        if (this.ready_[i] || this.pending_[i] && this.pending_[i] >= now) {
          cancelEvent = true;
          break;
        }
      }
    }
    if (cancelEvent) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.passAfterEvent_) {
      this.passAfterEvent_ = false;
      this.doPass_();
    }
  };

  /**
   * The pass that decides which recognizers can start emitting and which
   * are canceled.
   * @param {!Event} event
   * @private
   */

  Gestures.prototype.doPass_ = function doPass_() {
    var now = _timer.timer.now();

    // The "most ready" recognizer is the youngest in the "ready" set.
    // Otherwise we wouldn't wait for it at all.
    var readyIndex = -1;
    for (var i = 0; i < this.recognizers_.length; i++) {
      if (!this.ready_[i]) {
        if (this.pending_[i] && this.pending_[i] < now) {
          // Pending state expired. Reset.
          this.stopTracking_(i);
        }
        continue;
      }
      if (readyIndex == -1 || this.ready_[i] > this.ready_[readyIndex]) {
        readyIndex = i;
      }
    }

    if (readyIndex == -1) {
      // Nothing to do.
      return;
    }

    // Look for conflicts.
    var waitTime = 0;
    for (var i = 0; i < this.recognizers_.length; i++) {
      if (this.ready_[i] || !this.tracking_[i]) {
        continue;
      }
      waitTime = Math.max(waitTime, this.pending_[i] - now);
    }

    if (waitTime < 2) {
      // We waited long enough.
      this.startEventing_(readyIndex);
      return;
    }

    // Some conflicts: have to wait to see who wins.
    this.pass_.schedule(waitTime);
  };

  /**
   * This recognizer is given "go ahead" and all others are canceled.
   * @param {number} index
   * @private
   */

  Gestures.prototype.startEventing_ = function startEventing_(index) {
    var recognizer = this.recognizers_[index];
    for (var i = 0; i < this.recognizers_.length; i++) {
      if (i != index) {
        this.cancelEventing_(i);
      }
    }
    this.ready_[index] = 0;
    this.pending_[index] = 0;
    this.eventing_ = recognizer;
    recognizer.acceptStart();
  };

  /**
   * @param {number} index
   * @private
   */

  Gestures.prototype.startTracking_ = function startTracking_(index) {
    this.tracking_[index] = true;
    this.pending_[index] = 0;
  };

  /**
   * @param {number} index
   * @private
   */

  Gestures.prototype.stopTracking_ = function stopTracking_(index) {
    this.tracking_[index] = false;
    this.pending_[index] = 0;
    if (!this.ready_[index]) {
      this.recognizers_[index].acceptCancel();
    }
  };

  /**
   * @param {number} index
   * @private
   */

  Gestures.prototype.cancelEventing_ = function cancelEventing_(index) {
    this.ready_[index] = 0;
    this.stopTracking_(index);
  };

  return Gestures;
})();

exports.Gestures = Gestures;

var GestureRecognizer = (function () {

  /**
   * @param {string} type
   * @param {!Gestures} manager
   */

  function GestureRecognizer(type, manager) {
    babelHelpers.classCallCheck(this, GestureRecognizer);

    /** @private @const {string} */
    this.type_ = type;

    /** @private @const {!Gestures} */
    this.manager_ = manager;
  }

  /**
   * Returns the type of the gesture emitted by the instance of this class.
   * It has to be unique in the scope of the Gestures instance.
   * @return {string}
   */

  GestureRecognizer.prototype.getType = function getType() {
    return this.type_;
  };

  /**
   * The recognizer can call this method to communicate that it's ready to
   * start emitting the gesture. Optionally it can pass a zero, positive or
   * negative offset - a time on how much the gesture should be penalized or
   * given advantage in conflict resolution. The recognizer at this point is
   * in the "ready" state.
   * @param {time} offset
   */

  GestureRecognizer.prototype.signalReady = function signalReady(offset) {
    this.manager_.signalReady_(this, offset);
  };

  /**
   * The recognizer can call this method to communicate that it needs more
   * time (timeLeft) to match the gesture. By the end of this time the
   * recognizer has to either transit to the ready state using
   * {@link signalReady} or it will be canceled. The recognizer is in the
   * "pending" state.
   * @param {time} timeLeft
   */

  GestureRecognizer.prototype.signalPending = function signalPending(timeLeft) {
    this.manager_.signalPending_(this, timeLeft);
  };

  /**
   * The recognizer can call this method to communicate that it's done
   * emitting the gestures. It will return to the waiting state. Recognizer
   * can only call this method if it has previously received the
   * {@link acceptStart} call.
   */

  GestureRecognizer.prototype.signalEnd = function signalEnd() {
    this.manager_.signalEnd_(this);
  };

  /**
   * The recognizer can call this method to emit the gestures while in the
   * "emitting" state. Recognizer can only call this method if it has
   * previously received the {@link acceptStart} call.
   * @param {!DATA} data
   * @param {?Event} event
   */

  GestureRecognizer.prototype.signalEmit = function signalEmit(data, event) {
    this.manager_.signalEmit_(this, data, event);
  };

  /**
   * The Gestures instance calls this method to allow the recognizer to start
   * emitting the gestures. At this point the recognizer is in the "emitting"
   * state. It will be in this state until it calls {@link signalEnd} or
   * the {@link acceptCancel} is called by the Gestures instance.
   */

  GestureRecognizer.prototype.acceptStart = function acceptStart() {};

  /**
   * The Gestures instance calls this method to reset the recognizer. At this
   * point the recognizer is in the initial waiting state.
   */

  GestureRecognizer.prototype.acceptCancel = function acceptCancel() {};

  /**
   * The Gestures instance calls this method for each "touchstart" event. If
   * the recognizer wants to receive other touch events in the series, it has
   * to return "true".
   * @param {!Event} unusedEvent
   * @return {boolean}
   */

  GestureRecognizer.prototype.onTouchStart = function onTouchStart(unusedEvent) {
    return false;
  };

  /**
   * The Gestures instance calls this method for each "touchmove" event. If
   * the recognizer wants to continue receiving touch events in the series,
   * it has to return "true".
   * @param {!Event} unusedEvent
   * @return {boolean}
   */

  GestureRecognizer.prototype.onTouchMove = function onTouchMove(unusedEvent) {
    return false;
  };

  /**
   * The Gestures instance calls this method for the "touchend" event.
   * Somewhere within this touch series the recognizer has to call
   * {@link signalReady} or {@link signalPending} or it will be reset for the
   * next touch series.
   * @param {!Event} unusedEvent
   */

  GestureRecognizer.prototype.onTouchEnd = function onTouchEnd(unusedEvent) {};

  return GestureRecognizer;
})();

exports.GestureRecognizer = GestureRecognizer;

},{"./log":8,"./observable":11,"./pass":12,"./timer":19}],6:[function(require,module,exports){
exports.__esModule = true;
exports.historyFor = historyFor;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _service = require('./service');

/**
 * Returns service implemented in service/history-impl.
 * @param {!Window} window
 * @return {!History}
 */

function historyFor(window) {
  return _service.getService(window, 'history');
}

;

},{"./service":17}],7:[function(require,module,exports){
exports.__esModule = true;
exports.parseLayout = parseLayout;
exports.getLayoutClass = getLayoutClass;
exports.isLayoutSizeDefined = isLayoutSizeDefined;
exports.isInternalElement = isInternalElement;
exports.parseLength = parseLength;
exports.assertLength = assertLength;
exports.assertLengthOrPercent = assertLengthOrPercent;
exports.getLengthUnits = getLengthUnits;
exports.getLengthNumeral = getLengthNumeral;
exports.hasNaturalDimensions = hasNaturalDimensions;
exports.getNaturalDimensions = getNaturalDimensions;
exports.isLoadingAllowed = isLoadingAllowed;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Implements element layout. See https://goo.gl/9avXuT for
 * details.
 */

var _log = require('./log');

/**
 * @enum {string}
 */
var Layout = {
  NODISPLAY: 'nodisplay',
  FIXED: 'fixed',
  FIXED_HEIGHT: 'fixed-height',
  RESPONSIVE: 'responsive',
  CONTAINER: 'container',
  FILL: 'fill',
  FLEX_ITEM: 'flex-item'
};

exports.Layout = Layout;
/**
 * CSS Length type. E.g. "1px" or "20vh".
 * @typedef {string}
 */
var LengthDef = undefined;

/**
 * @typedef {{
 *   width: string,
 *   height: string
 * }}
 */
var DimensionsDef = undefined;

/**
 * The set of elements with natural dimensions, that is, elements
 * which have a known dimension either based on their value specified here,
 * or, if the value is null, a dimension specific to the browser.
 * `hasNaturalDimensions` checks for membership in this set.
 * `getNaturalDimensions` determines the dimensions for an element in the
 *    set and caches it.
 * @type {!Object<string, ?DimensionsDef>}
 * @private  Visible for testing only!
 */
var naturalDimensions_ = {
  'AMP-PIXEL': { width: '1px', height: '1px' },
  'AMP-ANALYTICS': { width: '1px', height: '1px' },
  // TODO(dvoytenko): audio should have width:auto.
  'AMP-AUDIO': null,
  'AMP-SOCIAL-SHARE': { width: '60px', height: '44px' }
};

exports.naturalDimensions_ = naturalDimensions_;
/**
 * Elements that the progess can be shown for. This set has to be externalized
 * since the element's implementation may not be downloaded yet.
 * @enum {boolean}
 * @private  Visible for testing only!
 */
var LOADING_ELEMENTS_ = {
  'AMP-ANIM': true,
  'AMP-BRIGHTCOVE': true,
  'AMP-EMBED': true,
  'AMP-IFRAME': true,
  'AMP-IMG': true,
  'AMP-INSTAGRAM': true,
  'AMP-LIST': true,
  'AMP-PINTEREST': true,
  'AMP-VIDEO': true,
  'AMP-YOUTUBE': true
};

exports.LOADING_ELEMENTS_ = LOADING_ELEMENTS_;
/**
 * @param {string} s
 * @return {Layout|undefined} Returns undefined in case of failure to parse
 *   the layout string.
 */

function parseLayout(s) {
  for (var k in Layout) {
    if (Layout[k] == s) {
      return Layout[k];
    }
  }
  return undefined;
}

/**
 * @param {!Layout} layout
 * @return {string}
 */

function getLayoutClass(layout) {
  return '-amp-layout-' + layout;
}

/**
 * Whether an element with this layout inherently defines the size.
 * @param {!Layout} layout
 * @return {boolean}
 */

function isLayoutSizeDefined(layout) {
  return layout == Layout.FIXED || layout == Layout.FIXED_HEIGHT || layout == Layout.RESPONSIVE || layout == Layout.FILL || layout == Layout.FLEX_ITEM;
}

/**
 * Whether the tag is an internal (service) AMP tag.
 * @param {!Node|string} tag
 * @return {boolean}
 */

function isInternalElement(tag) {
  var tagName = typeof tag == 'string' ? tag : tag.tagName;
  return tagName && tagName.toLowerCase().indexOf('i-') == 0;
}

/**
 * Parses the CSS length value. If no units specified, the assumed value is
 * "px". Returns undefined in case of parsing error.
 * @param {string|undefined} s
 * @return {!LengthDef|undefined}
 */

function parseLength(s) {
  if (typeof s == 'number') {
    return s + 'px';
  }
  if (!s) {
    return undefined;
  }
  if (!/^\d+(\.\d+)?(px|em|rem|vh|vw|vmin|vmax|cm|mm|q|in|pc|pt)?$/.test(s)) {
    return undefined;
  }
  if (/^\d+(\.\d+)?$/.test(s)) {
    return s + 'px';
  }
  return s;
}

/**
 * Asserts that the supplied value is a non-percent CSS Length value.
 * @param {!LengthDef|string} length
 * @return {!LengthDef}
 */

function assertLength(length) {
  _log.user.assert(/^\d+(\.\d+)?(px|em|rem|vh|vw|vmin|vmax|cm|mm|q|in|pc|pt)$/.test(length), 'Invalid length value: %s', length);
  return length;
}

/**
 * Asserts that the supplied value is a CSS Length value
 * (including percent unit).
 * @param {!LengthDef|string} length
 * @return {!LengthDef}
 */

function assertLengthOrPercent(length) {
  _log.user.assert(/^\d+(\.\d+)?(px|em|rem|vh|vw|vmin|vmax|%)$/.test(length), 'Invalid length or percent value: %s', length);
  return length;
}

/**
 * Returns units from the CSS length value.
 * @param {!LengthDef} length
 * @return {string}
 */

function getLengthUnits(length) {
  assertLength(length);
  var m = _log.user.assert(length.match(/[a-z]+/i), 'Failed to read units from %s', length);
  return m[0];
}

/**
 * Returns the numeric value of a CSS length value.
 * @param {!LengthDef|string} length
 * @return {number}
 */

function getLengthNumeral(length) {
  return parseFloat(length);
}

/**
 * Determines whether the tagName is a known element that has natural dimensions
 * in our runtime or the browser.
 * @param {string} tagName The element tag name.
 * @return {DimensionsDef}
 */

function hasNaturalDimensions(tagName) {
  tagName = tagName.toUpperCase();
  return naturalDimensions_[tagName] !== undefined;
}

/**
 * Determines the default dimensions for an element which could vary across
 * different browser implementations, like <audio> for instance.
 * This operation can only be completed for an element whitelisted by
 * `hasNaturalDimensions`.
 * @param {!Element} element
 * @return {DimensionsDef}
 */

function getNaturalDimensions(element) {
  var tagName = element.tagName.toUpperCase();
  _log.dev.assert(naturalDimensions_[tagName] !== undefined);
  if (!naturalDimensions_[tagName]) {
    var doc = element.ownerDocument;
    var naturalTagName = tagName.replace(/^AMP\-/, '');
    var temp = doc.createElement(naturalTagName);
    // For audio, should no-op elsewhere.
    temp.controls = true;
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    doc.body.appendChild(temp);
    naturalDimensions_[tagName] = {
      width: (temp. /*OK*/offsetWidth || 1) + 'px',
      height: (temp. /*OK*/offsetHeight || 1) + 'px'
    };
    doc.body.removeChild(temp);
  }
  return naturalDimensions_[tagName];
}

/**
 * Whether the loading can be shown for the specified elemeent. This set has
 * to be externalized since the element's implementation may not be
 * downloaded yet.
 * @param {string} tagName The element tag name.
 * @return {boolean}
 */

function isLoadingAllowed(tagName) {
  return LOADING_ELEMENTS_[tagName.toUpperCase()] || false;
}

},{"./log":8}],8:[function(require,module,exports){
exports.__esModule = true;
exports.isUserErrorMessage = isUserErrorMessage;
exports.rethrowAsync = rethrowAsync;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _mode = require('./mode');

/** @const Time when this JS loaded.  */
var start = new Date().getTime();

/**
 * Triple zero width space.
 *
 * This is added to user error messages, so that we can later identify
 * them, when the only thing that we have is the message. This is the
 * case in many browsers when the global exception handler is invoked.
 *
 * @const {string}
 */
var USER_ERROR_SENTINEL = '\u200B\u200B\u200B';

exports.USER_ERROR_SENTINEL = USER_ERROR_SENTINEL;
/**
 * @return {boolean} Whether this message was a user error.
 */

function isUserErrorMessage(message) {
  return message.indexOf(USER_ERROR_SENTINEL) >= 0;
}

/**
 * @enum {number}
 * @private Visible for testing only.
 */
var LogLevel = {
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  FINE: 4
};

exports.LogLevel = LogLevel;
/**
 * Logging class.
 * @final
 * @private Visible for testing only.
 */

var Log = (function () {
  /**
   * @param {!Window} win
   * @param {function(!Mode):!LogLevel} levelFunc
   * @param {string=} opt_suffix
   */

  function Log(win, levelFunc, opt_suffix) {
    babelHelpers.classCallCheck(this, Log);

    /**
     * In tests we use the main test window instead of the iframe where
     * the tests runs because only the former is relayed to the console.
     * @const {!Window}
     */
    this.win = win.AMP_TEST ? win.parent : win;

    /** @private @const {function(!Mode):boolean} */
    this.levelFunc_ = levelFunc;

    /** @private @const {!LogLevel} */
    this.level_ = this.calcLevel_();

    /** @private @const {string} */
    this.suffix_ = opt_suffix || '';
  }

  /**
   * @param {*} val
   * @return {string}
   */

  /**
   * @return {!LogLevel}
   * @private
   */

  Log.prototype.calcLevel_ = function calcLevel_() {
    var mode = _mode.getMode();

    // No console - can't enable logging.
    if (!this.win.console || !this.win.console.log) {
      return LogLevel.OFF;
    }

    // Logging has been explicitly disabled.
    if (mode.log == '0') {
      return LogLevel.OFF;
    }

    // Logging is enabled for tests directly.
    if (this.win.ENABLE_LOG) {
      return LogLevel.FINE;
    }

    // LocalDev by default allows INFO level, unless overriden by `#log`.
    if (mode.localDev && !mode.log) {
      return LogLevel.INFO;
    }

    // Delegate to the specific resolver.
    return this.levelFunc_(mode);
  };

  /**
   * @param {string} tag
   * @param {string} level
   * @param {!Array} messages
   * @param {?} opt_error
   */

  Log.prototype.msg_ = function msg_(tag, level, messages) {
    if (this.level_ != LogLevel.OFF) {
      var fn = this.win.console.log;
      if (level == 'ERROR') {
        fn = this.win.console.error || fn;
      } else if (level == 'INFO') {
        fn = this.win.console.info || fn;
      } else if (level == 'WARN') {
        fn = this.win.console.warn || fn;
      }
      messages.unshift(new Date().getTime() - start, '[' + tag + ']');
      fn.apply(this.win.console, messages);
    }
  };

  /**
   * Whether the logging is enabled.
   * @return {boolean}
   */

  Log.prototype.isEnabled = function isEnabled() {
    return this.level_ != LogLevel.OFF;
  };

  /**
   * Reports a fine-grained message.
   * @param {string} tag
   * @param {...*} var_args
   */

  Log.prototype.fine = function fine(tag, var_args) {
    if (this.level_ >= LogLevel.FINE) {
      this.msg_(tag, 'FINE', Array.prototype.slice.call(arguments, 1));
    }
  };

  /**
   * Reports a informational message.
   * @param {string} tag
   * @param {...*} var_args
   */

  Log.prototype.info = function info(tag, var_args) {
    if (this.level_ >= LogLevel.INFO) {
      this.msg_(tag, 'INFO', Array.prototype.slice.call(arguments, 1));
    }
  };

  /**
   * Reports a warning message.
   * @param {string} tag
   * @param {...*} var_args
   */

  Log.prototype.warn = function warn(tag, var_args) {
    if (this.level_ >= LogLevel.WARN) {
      this.msg_(tag, 'WARN', Array.prototype.slice.call(arguments, 1));
    }
  };

  /**
   * Reports an error message. If the logging is disabled, the error is rethrown
   * asynchronously.
   * @param {string} tag
   * @param {...*} var_args
   * @param {?} opt_error
   */

  Log.prototype.error = function error(tag, var_args) {
    var _arguments = arguments,
        _this = this;

    if (this.level_ >= LogLevel.ERROR) {
      this.msg_(tag, 'ERROR', Array.prototype.slice.call(arguments, 1));
    } else {
      (function () {
        var error = createErrorVargs.apply(null, Array.prototype.slice.call(_arguments, 1));
        _this.prepareError_(error);
        _this.win.setTimeout(function () {
          throw error;
        });
      })();
    }
  };

  /**
   * Creates an error object.
   * @param {...*} var_args
   * @return {!Error}
   */

  Log.prototype.createError = function createError(var_args) {
    var error = createErrorVargs.apply(null, arguments);
    this.prepareError_(error);
    return error;
  };

  /**
   * Throws an error if the first argument isn't trueish.
   *
   * Supports argument substitution into the message via %s placeholders.
   *
   * Throws an error object that has two extra properties:
   * - associatedElement: This is the first element provided in the var args.
   *   It can be used for improved display of error messages.
   * - messageArray: The elements of the substituted message as non-stringified
   *   elements in an array. When e.g. passed to console.error this yields
   *   native displays of things like HTML elements.
   *
   * @param {T} shouldBeTrueish The value to assert. The assert fails if it does
   *     not evaluate to true.
   * @param {string} message The assertion message
   * @param {...*} var_args Arguments substituted into %s in the message.
   * @return {T} The value of shouldBeTrueish.
   * @template T
   */
  /*eslint "google-camelcase/google-camelcase": 0*/

  Log.prototype.assert = function assert(shouldBeTrueish, message, var_args) {
    var firstElement = undefined;
    if (!shouldBeTrueish) {
      message = message || 'Assertion failed';
      var splitMessage = message.split('%s');
      var first = splitMessage.shift();
      var formatted = first;
      var messageArray = [];
      pushIfNonEmpty(messageArray, first);
      for (var i = 2; i < arguments.length; i++) {
        var val = arguments[i];
        if (val && val.tagName) {
          firstElement = val;
        }
        var nextConstant = splitMessage.shift();
        messageArray.push(val);
        pushIfNonEmpty(messageArray, nextConstant.trim());
        formatted += toString(val) + nextConstant;
      }
      var e = new Error(formatted);
      e.fromAssert = true;
      e.associatedElement = firstElement;
      e.messageArray = messageArray;
      this.prepareError_(e);
      throw e;
    }
    return shouldBeTrueish;
  };

  /*eslint "google-camelcase/google-camelcase": 2*/

  /**
   * Asserts and returns the enum value. If the enum doesn't contain such a value,
   * the error is thrown.
   *
   * @param {!Enum<T>} enumObj
   * @param {string} s
   * @param {string=} opt_enumName
   * @return T
   * @template T
   */

  Log.prototype.assertEnumValue = function assertEnumValue(enumObj, s, opt_enumName) {
    for (var k in enumObj) {
      if (enumObj[k] == s) {
        return enumObj[k];
      }
    }
    this.assert(false, 'Unknown %s value: "%s"', opt_enumName || 'enum', s);
  };

  /**
   * @param {!Error} error
   * @private
   */

  Log.prototype.prepareError_ = function prepareError_(error) {
    if (this.suffix_) {
      if (!error.message) {
        error.message = this.suffix_;
      } else if (error.message.indexOf(this.suffix_) == -1) {
        error.message += this.suffix_;
      }
    }
  };

  return Log;
})();

exports.Log = Log;
function toString(val) {
  if (val instanceof Element) {
    return val.tagName.toLowerCase() + (val.id ? '#' + val.id : '');
  }
  return val;
}

/**
 * @param {!Array} array
 * @param {*} val
 */
function pushIfNonEmpty(array, val) {
  if (val != '') {
    array.push(val);
  }
}

/**
 * @param {...*} var_args
 * @return {!Error}
 * @private
 */
function createErrorVargs(var_args) {
  var error = null;
  var message = '';
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (arg instanceof Error && !error) {
      error = arg;
    } else {
      if (message) {
        message += ' ';
      }
      message += arg;
    }
  }
  if (!error) {
    error = new Error(message);
  } else if (message) {
    error.message = message + ': ' + error.message;
  }
  return error;
}

/**
 * Rethrows the error without terminating the current context. This preserves
 * whether the original error designation is a user error or a dev error.
 * @param {...*} var_args
 */

function rethrowAsync(var_args) {
  var error = createErrorVargs.apply(null, arguments);
  setTimeout(function () {
    throw error;
  });
}

/**
 * Publisher level log.
 *
 * Enabled in the following conditions:
 *  1. Not disabled using `#log=0`.
 *  2. Development mode is enabled via `#development=1` or logging is explicitly
 *     enabled via `#log=D` where D >= 1.
 *
 * @const {!Log}
 */
var user = new Log(window, function (mode) {
  var logNum = parseInt(mode.log, 10);
  if (mode.development || logNum >= 1) {
    return LogLevel.FINE;
  }
  return LogLevel.OFF;
}, USER_ERROR_SENTINEL);

exports.user = user;
/**
 * AMP development log. Stripped in the PROD binary.
 *
 * Enabled in the following conditions:
 *  1. Not disabled using `#log=0`.
 *  2. Logging is explicitly enabled via `#log=D`, where D >= 2.
 *
 * @const {!Log}
 */
var dev = new Log(window, function (mode) {
  var logNum = parseInt(mode.log, 10);
  if (logNum >= 3) {
    return LogLevel.FINE;
  }
  if (logNum >= 2) {
    return LogLevel.INFO;
  }
  return LogLevel.OFF;
});
exports.dev = dev;

},{"./mode":9}],9:[function(require,module,exports){
exports.__esModule = true;
exports.getMode = getMode;
exports.setModeForTesting = setModeForTesting;
exports.getFullVersion_ = getFullVersion_;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @typedef {{
 *   localDev: boolean,
 *   development: boolean,
 *   filter: (string|undefined)
 *   minified: boolean,
 *   test: boolean,
 *   log: (string|undefined),
 *   version: string,
 * }}
 */
var ModeDef = undefined;

/** @typedef {?ModeDef} */
var mode = null;

/** @typedef {string} */
var version = '1463506025503';

/**
 * `fullVersion` is the prefixed version we serve off of the cdn.
 * The prefix denotes canary(00) or prod(01) or an experiment version ( > 01).
 * @type {string}
 */
var fullVersion = '';

/**
 * Provides info about the current app.
 * @return {!ModeDef}
 */

function getMode() {
  if (mode) {
    return mode;
  }
  return mode = getMode_();
}

/**
 * Set mode in a test. Pass null in afterEach function to reset.
 * @param {?ModeDef} m
 */

function setModeForTesting(m) {
  mode = m;
}

/**
 * Provides info about the current app.
 * @return {!ModeDef}
 */
function getMode_() {
  if (window.context && window.context.mode) {
    return window.context.mode;
  }
  var isLocalDev = (location.hostname == 'localhost' || location.ancestorOrigins && location.ancestorOrigins[0] && location.ancestorOrigins[0].indexOf('http://localhost:') == 0) &&
  // Filter out localhost running against a prod script.
  // Because all allowed scripts are ours, we know that these can only
  // occur during local dev.
  !!document.querySelector('script[src*="/dist/"],script[src*="/base/"]');

  var developmentQuery = parseQueryString_(
  // location.originalHash is set by the viewer when it removes the fragment
  // from the URL.
  location.originalHash || location.hash);

  if (!fullVersion) {
    fullVersion = getFullVersion_(window, isLocalDev);
  }

  return {
    localDev: isLocalDev,
    // Triggers validation
    development: developmentQuery['development'] == '1' || window.AMP_DEV_MODE,
    // Allows filtering validation errors by error category. For the
    // available categories, see ErrorCategory in validator/validator.proto.
    filter: developmentQuery['filter'],
    minified: 'development' == 'production',
    test: window.AMP_TEST,
    log: developmentQuery['log'],
    version: fullVersion
  };
}

/**
 * Parses the query string of an URL. This method returns a simple key/value
 * map. If there are duplicate keys the latest value is returned.
 * @param {string} queryString
 * @return {!Object<string, string>}
 * TODO(dvoytenko): dedupe with `url.js:parseQueryString`. This is currently
 * necessary here because `url.js` itself inderectly depends on `mode.js`.
 */
function parseQueryString_(queryString) {
  var params = Object.create(null);
  if (!queryString) {
    return params;
  }
  if (queryString.indexOf('?') == 0 || queryString.indexOf('#') == 0) {
    queryString = queryString.substr(1);
  }
  var pairs = queryString.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var eqIndex = pair.indexOf('=');
    var _name = undefined;
    var value = undefined;
    if (eqIndex != -1) {
      _name = decodeURIComponent(pair.substring(0, eqIndex)).trim();
      value = decodeURIComponent(pair.substring(eqIndex + 1)).trim();
    } else {
      _name = decodeURIComponent(pair).trim();
      value = '';
    }
    if (_name) {
      params[_name] = value;
    }
  }
  return params;
}

/**
 * Retrieve the `fullVersion` which will have a numeric prefix
 * denoting canary/prod/experiment.
 *
 * @param {!Window} win
 * @param {boolean} isLocalDev
 * @return {string}
 * @private
 * @visibleForTesting
 */

function getFullVersion_(win, isLocalDev) {
  // If it's local dev then we won't actually have a full version so
  // just use the version.
  if (isLocalDev) {
    return version;
  }

  if (win.AMP_CONFIG && win.AMP_CONFIG.v) {
    return win.AMP_CONFIG.v;
  }

  return version;
}

},{}],10:[function(require,module,exports){
exports.__esModule = true;
exports.calcVelocity = calcVelocity;
exports.continueMotion = continueMotion;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _timer = require('./timer');

var _vsync = require('./vsync');

/** @const {!Funtion} */
var NOOP_CALLBACK_ = function () {};

/** @const {number} */
var MIN_VELOCITY_ = 0.02;

/** @const {number} */
var FRAME_CONST_ = 16.67;

/** @const {number} */
var EXP_FRAME_CONST_ = Math.round(-FRAME_CONST_ / Math.log(0.95));

/**
 * Depreciation factor of 1/100 of a millisecond. This is how much previous
 * velocity is depreciated when calculating the new velocity.
 * @const {number}
 */
var VELOCITY_DEPR_FACTOR_ = FRAME_CONST_ * 2;

/**
 * Calculates velocity for an object traveling the distance deltaV in the
 * time deltaTime given the previous velocity prevVelocity. The calculation
 * assumes a basic informational depreciation of previous velocity.
 * @param {number} deltaV
 * @param {time} deltaTime
 * @param {number} prevVelocity
 * @return {number}
 */

function calcVelocity(deltaV, deltaTime, prevVelocity) {
  if (deltaTime < 1) {
    deltaTime = 1;
  }

  // Calculate speed and speed depreciation.
  var speed = deltaV / deltaTime;

  // Depreciation is simply an informational quality. It basically means:
  // we can't ignore the velocity we knew recently, but we'd only consider
  // it proportionally to how long ago we've seen it. Currently, this
  // depreciation factor is 1/100 of a millisecond. New average velocity is
  // calculated by weighing toward the new velocity and away from old
  // velocity based on the depreciation.
  var depr = 0.5 + Math.min(deltaTime / VELOCITY_DEPR_FACTOR_, 0.5);
  return speed * depr + prevVelocity * (1 - depr);
}

/**
 * Returns a motion process that will yield when the velocity has run down to
 * zerp. For each iteration, the velocity is depreciated and the coordinates
 * are advanced from start X/Y to the destination according to velocity
 * vectors. For each such iteration the callback is called with the new x and y.
 * @param {number} startX Start X coordinate.
 * @param {number} startY Start Y coordinate.
 * @param {number} veloX Starting X velocity.
 * @param {number} veloY Starting Y velocity.
 * @param {function(number, number):boolean} callback The callback for each
 *   step of the deceleration motion.
 * @param {!Vsync=} opt_vsync Mostly for testing only.
 * @return {!Motion}
 */

function continueMotion(startX, startY, veloX, veloY, callback, opt_vsync) {
  return new Motion(startX, startY, veloX, veloY, callback, opt_vsync).start_();
}

/**
 * Motion process that allows tracking and monitoring of the running motion.
 * Most importantly it exposes methods "then" and "thenAlways" that have the
 * semantics of a Promise and signal when the motion has completed or failed.
 * Additionally, it exposes the method "halt" which allows to stop/reset the
 * motion.
 * @implements {IThenable}
 */

var Motion = (function () {
  /**
   * @param {number} startX Start X coordinate.
   * @param {number} startY Start Y coordinate.
   * @param {number} veloX Starting X velocity.
   * @param {number} veloY Starting Y velocity.
   * @param {function(number, number):boolean} callback The callback for each
   *   step of the deceleration motion.
   * @param {!Vsync=} opt_vsync
   */

  function Motion(startX, startY, veloX, veloY, callback, opt_vsync) {
    var _this = this;

    babelHelpers.classCallCheck(this, Motion);

    /** @private @const */
    this.vsync_ = opt_vsync || _vsync.vsyncFor(window);

    /** @private @const */
    this.callback_ = callback;

    /** @private {number} */
    this.lastX_ = startX;

    /** @private {number} */
    this.lastY_ = startY;

    /** @private {number} */
    this.maxVelocityX_ = veloX;

    /** @private {number} */
    this.maxVelocityY_ = veloY;

    /** @private {number} */
    this.velocityX_ = 0;

    /** @private {number} */
    this.velocityY_ = 0;

    /** @private {time} */
    this.startTime_ = _timer.timer.now();

    /** @private {time} */
    this.lastTime_ = this.startTime_;

    /** @private {!Function} */
    this.resolve_;

    /** @private {!Function} */
    this.reject_;

    /** @private {!Promise} */
    this.promise_ = new Promise(function (resolve, reject) {
      _this.resolve_ = resolve;
      _this.reject_ = reject;
    });
  }

  /** @private */

  Motion.prototype.start_ = function start_() {
    this.continuing_ = true;
    if (Math.abs(this.maxVelocityX_) <= MIN_VELOCITY_ && Math.abs(this.maxVelocityY_) <= MIN_VELOCITY_) {
      this.fireMove_();
      this.completeContinue_(true);
    } else {
      this.runContinuing_();
    }
    return this;
  };

  /**
   * Halts the motion. The motion promise will be rejected since the motion
   * has been interrupted.
   */

  Motion.prototype.halt = function halt() {
    if (this.continuing_) {
      this.completeContinue_(false);
    }
  };

  /**
   * Chains to the motion's promise that will resolve when the motion has
   * completed or will reject if motion has failed or was interrupted.
   * @param {!Function=} opt_resolve
   * @param {!Function=} opt_reject
   * @return {!Promise}
   */

  Motion.prototype.then = function then(opt_resolve, opt_reject) {
    if (!opt_resolve && !opt_reject) {
      return this.promise_;
    }
    return this.promise_.then(opt_resolve, opt_reject);
  };

  /**
   * Callback for regardless whether the motion succeeds or fails.
   * @param {!Function=} opt_callback
   * @return {!Promise}
   */

  Motion.prototype.thenAlways = function thenAlways(opt_callback) {
    var callback = opt_callback || NOOP_CALLBACK_;
    return this.then(callback, callback);
  };

  /**
   * @return {!Promise}
   * @private
   */

  Motion.prototype.runContinuing_ = function runContinuing_() {
    this.velocityX_ = this.maxVelocityX_;
    this.velocityY_ = this.maxVelocityY_;
    var boundStep = this.stepContinue_.bind(this);
    var boundComplete = this.completeContinue_.bind(this, true);
    return this.vsync_.runAnimMutateSeries(boundStep, 5000).then(boundComplete, boundComplete);
  };

  /**
   * Returns "true" to continue and "false" to stop motion process.
   * @param {time} timeSinceStart
   * @param {time} timeSincePrev
   * @return {boolean}
   * @private
   */

  Motion.prototype.stepContinue_ = function stepContinue_(timeSinceStart, timeSincePrev) {
    if (!this.continuing_) {
      return false;
    }

    this.lastTime_ = _timer.timer.now();
    this.lastX_ += timeSincePrev * this.velocityX_;
    this.lastY_ += timeSincePrev * this.velocityY_;
    if (!this.fireMove_()) {
      return false;
    }

    var decel = Math.exp(-timeSinceStart / EXP_FRAME_CONST_);
    this.velocityX_ = this.maxVelocityX_ * decel;
    this.velocityY_ = this.maxVelocityY_ * decel;
    return Math.abs(this.velocityX_) > MIN_VELOCITY_ || Math.abs(this.velocityY_) > MIN_VELOCITY_;
  };

  /**
   * @param {boolean} success
   * @private
   */

  Motion.prototype.completeContinue_ = function completeContinue_(success) {
    if (!this.continuing_) {
      return;
    }
    this.continuing_ = false;
    this.lastTime_ = _timer.timer.now();
    this.fireMove_();
    if (success) {
      this.resolve_();
    } else {
      this.reject_();
    }
  };

  /** @private */

  Motion.prototype.fireMove_ = function fireMove_() {
    return this.callback_(this.lastX_, this.lastY_);
  };

  return Motion;
})();

},{"./timer":19,"./vsync":20}],11:[function(require,module,exports){
exports.__esModule = true;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This type signifies a callback that can be called to remove the listener.
 * @typedef {function()}
 */

var UnlistenDef = function UnlistenDef() {
  babelHelpers.classCallCheck(this, UnlistenDef);
}

/**
 * This class helps to manage observers. Observers can be added, removed or
 * fired through and instance of this class.
 * @template TYPE
 */
;

var Observable = (function () {
  function Observable() {
    babelHelpers.classCallCheck(this, Observable);

    /** @const {!Array<function(TYPE)>} */
    this.handlers_ = [];
  }

  /**
   * Adds the observer to this instance.
   * @param {function(TYPE)} handler Observer's handler.
   * @return {!UnlistenDef}
   */

  Observable.prototype.add = function add(handler) {
    var _this = this;

    this.handlers_.push(handler);
    return function () {
      _this.remove(handler);
    };
  };

  /**
   * Removes the observer from this instance.
   * @param {function(TYPE)} handler Observer's instance.
   */

  Observable.prototype.remove = function remove(handler) {
    for (var i = 0; i < this.handlers_.length; i++) {
      if (handler == this.handlers_[i]) {
        this.handlers_.splice(i, 1);
        break;
      }
    }
  };

  /**
   * Fires an event. All observers are called.
   * @param {TYPE} event
   */

  Observable.prototype.fire = function fire(event) {
    this.handlers_.forEach(function (handler) {
      handler(event);
    });
  };

  /**
   * Returns number of handlers. Mostly needed for tests.
   * @return {number}
   */

  Observable.prototype.getHandlerCount = function getHandlerCount() {
    return this.handlers_.length;
  };

  return Observable;
})();

exports.Observable = Observable;

},{}],12:[function(require,module,exports){
exports.__esModule = true;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _timer = require('./timer');

/**
 * Pass class helps to manage single-pass process. A pass is scheduled using
 * delay method. Only one pass can be pending at a time. If no pass is pending
 * the process is considered to be "idle".
 */

var Pass = (function () {

  /**
   * Creates a new Pass instance.
   * @param {function()} handler Handler to be executed when pass is triggered.
   * @param {number=} opt_defaultDelay Default delay to be used when schedule
   *   is called without one.
   */

  function Pass(handler, opt_defaultDelay) {
    babelHelpers.classCallCheck(this, Pass);

    /** @private @const {function()} */
    this.handler_ = handler;

    /** @private @const {number|string} */
    this.defaultDelay_ = opt_defaultDelay || 0;

    /** @private {number|string} */
    this.scheduled_ = -1;

    /** @private {number} */
    this.nextTime_ = 0;

    /** @private {boolean} */
    this.running_ = false;
  }

  /**
   * Whether or not a pass is currently pending.
   * @return {boolean}
   */

  Pass.prototype.isPending = function isPending() {
    return this.scheduled_ != -1;
  };

  /**
   * Tries to schedule a new pass optionally with specified delay. If the new
   * requested pass is requested before the pending pass, the pending pass is
   * canceled. If the new pass is requested after the pending pass, the newly
   * requested pass is ignored.
   *
   * Returns {@code true} if the pass has been scheduled and {@code false} if
   * ignored.
   *
   * @param {number=} opt_delay Delay to schedule the pass. If not specified
   *   the default delay is used, falling back to 0.
   * @return {boolean}
   */

  Pass.prototype.schedule = function schedule(opt_delay) {
    var _this = this;

    var delay = opt_delay || this.defaultDelay_;
    if (this.running_ && delay < 10) {
      // If we get called recursively, wait at least 10ms for the next
      // execution.
      delay = 10;
    }
    var nextTime = _timer.timer.now() + delay;
    // Schedule anew if nothing is scheduled currently of if the new time is
    // sooner then previously requested.
    if (this.scheduled_ == -1 || nextTime - this.nextTime_ < -10) {
      if (this.scheduled_ != -1) {
        _timer.timer.cancel(this.scheduled_);
      }
      this.nextTime_ = nextTime;
      this.scheduled_ = _timer.timer.delay(function () {
        _this.scheduled_ = -1;
        _this.nextTime_ = 0;
        _this.running_ = true;
        _this.handler_();
        _this.running_ = false;
      }, delay);
      return true;
    }
    return false;
  };

  /**
   * Cancels the pending pass if any.
   */

  Pass.prototype.cancel = function cancel() {
    if (this.scheduled_ != -1) {
      _timer.timer.cancel(this.scheduled_);
      this.scheduled_ = -1;
    }
  };

  return Pass;
})();

exports.Pass = Pass;

},{"./timer":19}],13:[function(require,module,exports){
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require('document-register-element/build/document-register-element.max');

var _polyfillsMathSign = require('./polyfills/math-sign');

var _polyfillsObjectAssign = require('./polyfills/object-assign');

var _polyfillsPromise = require('./polyfills/promise');

_polyfillsMathSign.install(window);
_polyfillsObjectAssign.install(window);
_polyfillsPromise.install(window);

},{"./polyfills/math-sign":14,"./polyfills/object-assign":15,"./polyfills/promise":16,"document-register-element/build/document-register-element.max":2}],14:[function(require,module,exports){
exports.__esModule = true;
exports.sign = sign;
exports.install = install;
/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Parses the number x and returns its sign. For positive x returns 1, for
 * negative, -1. For 0 and -0, returns 0 and -0 respectively. For any number
 * that parses to NaN, returns NaN.
 *
 * @param {number} x
 * @returns {number}
 */

function sign(x) {
  x = Number(x);

  // If x is 0, -0, or NaN, return it.
  if (!x) {
    return x;
  }

  return x > 0 ? 1 : -1;
}

;

/**
 * Sets the Math.sign polyfill if it does not exist.
 * @param {!Window} win
 */

function install(win) {
  if (!win.Math.sign) {
    win.Math.sign = sign;
  }
}

},{}],15:[function(require,module,exports){
exports.__esModule = true;
exports.assign = assign;
exports.install = install;
/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Copies values of all enumerable own properties from one or more source
 * objects (provided as extended arguments to the function) to a target object.
 *
 * @param {!Object} target
 * @returns {!Object}
 */

var hasOwnProperty = Object.prototype.hasOwnProperty;

function assign(target) {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var output = Object(target);
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    if (source != null) {
      for (var key in source) {
        if (hasOwnProperty.call(source, key)) {
          output[key] = source[key];
        }
      }
    }
  }
  return output;
}

/**
 * Sets the Math.sign polyfill if it does not exist.
 * @param {!Window} win
 */

function install(win) {
  if (!win.Object.assign) {
    win.Object.assign = assign;
  }
}

},{}],16:[function(require,module,exports){
exports.__esModule = true;
exports.install = install;
/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _promisePjsPromise = require('promise-pjs/promise');

var Promise = babelHelpers.interopRequireWildcard(_promisePjsPromise);

/**
 * Sets the Promise polyfill if it does not exist.
 * @param {!Window} win
 */

function install(win) {
  if (!win.Promise) {
    win.Promise = Promise;
    // In babel the * export is an Object with a default property.
    // In closure compiler it is the Promise function itself.
    if (Promise['default']) {
      win.Promise = Promise['default'];
    }
    // We copy the individual static methods, because closure
    // compiler flattens the polyfill namespace.
    win.Promise.resolve = Promise.resolve;
    win.Promise.reject = Promise.reject;
    win.Promise.all = Promise.all;
    win.Promise.race = Promise.race;
  }
}

},{"promise-pjs/promise":3}],17:[function(require,module,exports){
exports.__esModule = true;
exports.getService = getService;
exports.getServicePromise = getServicePromise;
exports.getServicePromiseOrNull = getServicePromiseOrNull;
exports.resetServiceForTesting = resetServiceForTesting;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Requires polyfills in immediate side effect.

require('./polyfills');

var _log = require('./log');

/**
 * Holds info about a service.
 * - obj: Actual service implementation when available.
 * - promise: Promise for the obj.
 * - resolve: Function to resolve the promise with the object.
 * @typedef {{
 *   obj: (?Object),
 *   promise: (?Promise|undefined),
 *   resolve: (?function(!Object)|undefined),
 * }}
 */
var ServiceHolderDef = undefined;

/**
 * Returns a service for the given id and window (a per-window singleton).
 * If the service is not yet available the factory function is invoked and
 * expected to return the service.
 * Users should typically wrap this as a special purpose function (e.g.
 * viewportFor(win)) for type safety and because the factory should not be
 * passed around.
 * @param {!Window} win
 * @param {string} id of the service.
 * @param {function(!Window):!Object=} opt_factory Should create the service
 *     if it does not exist yet. If the factory is not given, it is an error
 *     if the service does not exist yet.
 * @return {*}
 */

function getService(win, id, opt_factory) {
  var services = getServices(win);
  var s = services[id];
  if (!s) {
    s = services[id] = {
      obj: null,
      promise: null,
      resolve: null
    };
  }

  if (!s.obj) {
    _log.dev.assert(opt_factory, 'Factory not given and service missing %s', id);
    s.obj = opt_factory(win);
    if (!s.promise) {
      s.promise = Promise.resolve(s.obj);
    }
    // The service may have been requested already, in which case we have a
    // pending promise we need to fulfill.
    if (s.resolve) {
      s.resolve(s.obj);
    }
  }
  return s.obj;
}

/**
 * Returns a promise for a service for the given id and window. Also expects
 * an element that has the actual implementation. The promise resolves when
 * the implementation loaded.
 * Users should typically wrap this as a special purpose function (e.g.
 * viewportFor(win)) for type safety and because the factory should not be
 * passed around.
 * @param {!Window} win
 * @param {string} id of the service.
 * @return {!Promise<*>}
 */

function getServicePromise(win, id) {
  var services = getServices(win);
  var s = services[id];
  if (s) {
    return s.promise;
  }

  // TODO(@cramforce): Add a check that if the element is eventually registered
  // that the service is actually provided and this promise resolves.
  var resolve = undefined;
  var p = new Promise(function (r) {
    resolve = r;
  });
  services[id] = {
    obj: null,
    promise: p,
    resolve: resolve
  };

  return p;
}

/**
 * Like getServicePromise but returns null if the service was never registered.
 * @param {!Window} win
 * @param {string} id of the service.
 * @return {?Promise<*>}
 */

function getServicePromiseOrNull(win, id) {
  var services = getServices(win);
  if (services[id]) {
    return services[id].promise;
  }
  return null;
}

/**
 * Returns the object that holds the services registered in a window.
 * @param {!Window} win
 * @return {!Object<string,!ServiceHolderDef>}
 */
function getServices(win) {
  var services = win.services;
  if (!services) {
    services = win.services = {};
  }
  return services;
}

/**
 * Resets a single service, so it gets recreated on next getService invocation.
 * @param {!Window} win
 * @param {string} id of the service.
 */

function resetServiceForTesting(win, id) {
  if (win.services) {
    win.services[id] = null;
  }
}

},{"./log":8,"./polyfills":13}],18:[function(require,module,exports){
exports.__esModule = true;
exports.camelCaseToTitleCase = camelCaseToTitleCase;
exports.getVendorJsPropertyName = getVendorJsPropertyName;
exports.setStyle = setStyle;
exports.getStyle = getStyle;
exports.setStyles = setStyles;
exports.toggle = toggle;
exports.px = px;
exports.translateX = translateX;
exports.translate = translate;
exports.scale = scale;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Note: loaded by 3p system. Cannot rely on babel polyfills.

/** @private @const {!Object<string>} */
var propertyNameCache_ = Object.create(null);

/** @private @const {!Array<string>} */
var vendorPrefixes_ = ['Webkit', 'webkit', 'Moz', 'moz', 'ms', 'O', 'o'];

/**
 * @export
 * @param {string} camelCase camel cased string
 * @return {string} title cased string
 */

function camelCaseToTitleCase(camelCase) {
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * Checks the object if a prefixed version of a property exists and returns
 * it or returns an empty string.
 * @private
 * @param {!Object} object
 * @param {string} titleCase the title case version of a css property name
 * @return {string} the prefixed property name or null.
 */
function getVendorJsPropertyName_(object, titleCase) {
  for (var i = 0; i < vendorPrefixes_.length; i++) {
    var propertyName = vendorPrefixes_[i] + titleCase;
    if (object[propertyName] !== undefined) {
      return propertyName;
    }
  }
  return '';
}

/**
 * Returns the possibly prefixed JavaScript property name of a style property
 * (ex. WebkitTransitionDuration) given a camelCase'd version of the property
 * (ex. transitionDuration).
 * @export
 * @param {!Object} object
 * @param {string} camelCase the camel cased version of a css property name
 * @param {boolean=} opt_bypassCache bypass the memoized cache of property
 *   mapping
 * @return {string}
 */

function getVendorJsPropertyName(object, camelCase, opt_bypassCache) {
  var propertyName = propertyNameCache_[camelCase];
  if (!propertyName || opt_bypassCache) {
    propertyName = camelCase;
    if (object[camelCase] === undefined) {
      var titleCase = camelCaseToTitleCase(camelCase);
      var prefixedPropertyName = getVendorJsPropertyName_(object, titleCase);

      if (object[prefixedPropertyName] !== undefined) {
        propertyName = prefixedPropertyName;
      }
    }
    if (!opt_bypassCache) {
      propertyNameCache_[camelCase] = propertyName;
    }
  }
  return propertyName;
}

/**
 * Sets the CSS style of the specified element with optional units, e.g. "px".
 * @param {!Element} element
 * @param {string} property
 * @param {*} value
 * @param {string=} opt_units
 * @param {boolean=} opt_bypassCache
 */

function setStyle(element, property, value, opt_units, opt_bypassCache) {
  var propertyName = getVendorJsPropertyName(element.style, property, opt_bypassCache);
  if (propertyName) {
    element.style[propertyName] = opt_units ? value + opt_units : value;
  }
}

/**
 * Returns the value of the CSS style of the specified element.
 * @param {!Element} element
 * @param {string} property
 * @param {boolean=} opt_bypassCache
 * @return {*}
 */

function getStyle(element, property, opt_bypassCache) {
  var propertyName = getVendorJsPropertyName(element.style, property, opt_bypassCache);
  if (!propertyName) {
    return undefined;
  }
  return element.style[propertyName];
}

/**
 * Sets the CSS styles of the specified element. The styles
 * a specified as a map from CSS property names to their values.
 * @param {!Element} element
 * @param {!Object<string, *>} styles
 */

function setStyles(element, styles) {
  for (var k in styles) {
    setStyle(element, k, styles[k]);
  }
}

/**
 * Shows or hides the specified element.
 * @param {!Element} element
 * @param {boolean=} opt_display
 */

function toggle(element, opt_display) {
  if (opt_display === undefined) {
    opt_display = !(element.style.display != 'none');
  }
  element.style.display = opt_display ? '' : 'none';
}

/**
 * Returns a pixel value.
 * @param {number} value
 * @return {string}
 */

function px(value) {
  return value + 'px';
}

/**
 * Returns a "translateX" for CSS "transform" property.
 * @param {number|string} value
 * @return {string}
 */

function translateX(value) {
  if (typeof value == 'string') {
    return 'translateX(' + value + ')';
  }
  return 'translateX(' + px(value) + ')';
}

/**
 * Returns a "translateX" for CSS "transform" property.
 * @param {number|string} x
 * @param {(number|string)=} opt_y
 * @return {string}
 */

function translate(x, opt_y) {
  if (typeof x == 'number') {
    x = px(x);
  }
  if (opt_y === undefined) {
    return 'translate(' + x + ')';
  }
  if (typeof opt_y == 'number') {
    opt_y = px(opt_y);
  }
  return 'translate(' + x + ',' + opt_y + ')';
}

/**
 * Returns a "scale" for CSS "transform" property.
 * @param {number|string} value
 * @return {string}
 */

function scale(value) {
  return 'scale(' + value + ')';
}

},{}],19:[function(require,module,exports){
exports.__esModule = true;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Requires polyfills in immediate side effect.

require('./polyfills');

var _log = require('./log');

/**
 * Helper with all things Timer.
 */

var Timer = (function () {

  /**
   * @param {!Window} win
   */

  function Timer(win) {
    babelHelpers.classCallCheck(this, Timer);

    /** @const {!Window} */
    this.win = win;

    /** @private @const {!Promise}  */
    this.resolved_ = Promise.resolve();

    this.taskCount_ = 0;

    this.canceled_ = {};

    /** @const {number} */
    this.startTime_ = this.now();
  }

  /**
   * Returns the current EPOC time in milliseconds.
   * @return {number}
   */

  Timer.prototype.now = function now() {
    return Date.now();
  };

  /**
   * Returns time since start in milliseconds.
   * @return {number}
   */

  Timer.prototype.timeSinceStart = function timeSinceStart() {
    return this.now() - this.startTime_;
  };

  /**
   * Runs the provided callback after the specified delay. This uses a micro
   * task for 0 or no specified time. This means that the delay will actually
   * be close to 0 and this will NOT yield to the event queue.
   *
   * Returns the timer ID that can be used to cancel the timer (cancel method).
   * @param {!function()} callback
   * @param {number=} opt_delay
   * @return {number|string}
   */

  Timer.prototype.delay = function delay(callback, opt_delay) {
    var _this = this;

    if (!opt_delay) {
      var _ret = (function () {
        // For a delay of zero,  schedule a promise based micro task since
        // they are predictably fast.
        var id = 'p' + _this.taskCount_++;
        _this.resolved_.then(function () {
          if (_this.canceled_[id]) {
            delete _this.canceled_[id];
            return;
          }
          callback();
        });
        return {
          v: id
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    }
    return this.win.setTimeout(callback, opt_delay);
  };

  /**
   * Cancels the previously scheduled callback.
   * @param {number|string} timeoutId
   */

  Timer.prototype.cancel = function cancel(timeoutId) {
    if (typeof timeoutId == 'string') {
      this.canceled_[timeoutId] = true;
      return;
    }
    this.win.clearTimeout(timeoutId);
  };

  /**
   * Returns a promise that will resolve after the delay. Optionally, the
   * resolved value can be provided as opt_result argument.
   * @param {number=} opt_delay
   * @param {RESULT=} opt_result
   * @return {!Promise<RESULT>}
   * @template RESULT
   */

  Timer.prototype.promise = function promise(opt_delay, opt_result) {
    var _this2 = this;

    var timerKey = null;
    return new Promise(function (resolve, reject) {
      timerKey = _this2.delay(function () {
        timerKey = -1;
        resolve(opt_result);
      }, opt_delay);
      if (timerKey == -1) {
        reject(new Error('Failed to schedule timer.'));
      }
    })['catch'](function (error) {
      // Clear the timer. The most likely reason is "cancel" signal.
      if (timerKey != -1) {
        _this2.cancel(timerKey);
      }
      throw error;
    });
  };

  /**
   * Returns a promise that will fail after the specified delay. Optionally,
   * this method can take opt_racePromise parameter. In this case, the
   * resulting promise will either fail when the specified delay expires or
   * will resolve based on the opt_racePromise, whichever happens first.
   * @param {number} delay
   * @param {!Promise<RESULT>|undefined} opt_racePromise
   * @param {string=} opt_message
   * @return {!Promise<RESULT>}
   * @template RESULT
   */

  Timer.prototype.timeoutPromise = function timeoutPromise(delay, opt_racePromise, opt_message) {
    var _this3 = this;

    var timerKey = null;
    var delayPromise = new Promise(function (_resolve, reject) {
      timerKey = _this3.delay(function () {
        timerKey = -1;
        reject(_log.user.createError(opt_message || 'timeout'));
      }, delay);
      if (timerKey == -1) {
        reject(new Error('Failed to schedule timer.'));
      }
    })['catch'](function (error) {
      // Clear the timer. The most likely reason is "cancel" signal.
      if (timerKey != -1) {
        _this3.cancel(timerKey);
      }
      throw error;
    });
    if (!opt_racePromise) {
      return delayPromise;
    }
    return Promise.race([delayPromise, opt_racePromise]);
  };

  return Timer;
})();

exports.Timer = Timer;
var timer = new Timer(window);
exports.timer = timer;

},{"./log":8,"./polyfills":13}],20:[function(require,module,exports){
exports.__esModule = true;
exports.vsyncFor = vsyncFor;
/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _service = require('./service');

/**
 * @param {!Window} window
 * @return {!Vsync}
 */

function vsyncFor(window) {
  return _service.getService(window, 'vsync');
}

;

},{"./service":17}]},{},[1])


});
//# sourceMappingURL=amp-lightbox-0.1.max.js.map