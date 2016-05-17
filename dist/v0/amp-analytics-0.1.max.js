(window.AMP = window.AMP || []).push(function(AMP) {(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.__esModule = true;
exports.installActivityService = installActivityService;
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
 * @fileoverview Provides an ability to collect data about activities the user
 * has performed on the page.
 */

var _srcService = require('../../../src/service');

var _srcViewer = require('../../../src/viewer');

var _srcViewport = require('../../../src/viewport');

var _srcEventHelper = require('../../../src/event-helper');

/**
 * The amount of time after an activity the user is considered engaged.
 * @private @const {number}
 */
var DEFAULT_ENGAGED_SECONDS = 5;

/**
 * @enum {string}
 */
var ActivityEventType = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

/**
 * @typedef {{
 *   type: string,
 *   time: number
 * }}
 */
var ActivityEventDef = undefined;

/**
 * Find the engaged time between the event and the time (exclusive of the time)
 * @param {ActivityEventDef} e1
 * @param {number} time
 * @return {number}
 * @private
 */
function findEngagedTimeBetween(activityEvent, time) {
  var engagementBonus = 0;

  if (activityEvent.type === ActivityEventType.ACTIVE) {
    engagementBonus = DEFAULT_ENGAGED_SECONDS;
  }

  return Math.min(time - activityEvent.time, engagementBonus);
}

var ActivityHistory = (function () {
  function ActivityHistory() {
    babelHelpers.classCallCheck(this, ActivityHistory);

    /** @private {number} */
    this.totalEngagedTime_ = 0;

    /**
     * prevActivityEvent_ remains undefined until the first valid push call.
     * @private {ActivityEventDef}
     */
    this.prevActivityEvent_ = undefined;
  }

  /**
   * Array of event types which will be listened for on the document to indicate
   * activity. Other activities are also observed on the Viewer and Viewport
   * objects. See {@link setUpActivityListeners_} for listener implementation.
   * @private @const {Array<string>}
   */

  /**
   * Indicate that an activity took place at the given time.
   * @param {ActivityEventDef}
   */

  ActivityHistory.prototype.push = function push(activityEvent) {
    if (!this.prevActivityEvent_) {
      this.prevActivityEvent_ = activityEvent;
    }

    if (this.prevActivityEvent_.time < activityEvent.time) {
      this.totalEngagedTime_ += findEngagedTimeBetween(this.prevActivityEvent_, activityEvent.time);
      this.prevActivityEvent_ = activityEvent;
    }
  };

  /**
   * Get the total engaged time up to the given time recorded in
   * ActivityHistory.
   * @param {number} time
   * @return {number}
   */

  ActivityHistory.prototype.getTotalEngagedTime = function getTotalEngagedTime(time) {
    var totalEngagedTime = 0;
    if (this.prevActivityEvent_ !== undefined) {
      totalEngagedTime = this.totalEngagedTime_ + findEngagedTimeBetween(this.prevActivityEvent_, time);
    }
    return totalEngagedTime;
  };

  return ActivityHistory;
})();

var ACTIVE_EVENT_TYPES = ['mousedown', 'mouseup', 'mousemove', 'keydown', 'keyup'];

var Activity = (function () {

  /**
   * Activity tracks basic user activity on the page.
   *  - Listeners are not registered on the activity event types until the
   *    Viewer's `whenFirstVisible` is resolved.
   *  - When the `whenFirstVisible` of Viewer is resolved, a first activity
   *    is recorded.
   *  - The first activity in any second causes all other activities to be
   *    ignored. This is similar to debounce functionality since some events
   *    (e.g. scroll) could occur in rapid succession.
   *  - In any one second period, active events or inactive events can override
   *    each other. Whichever type occured last has precedence.
   *  - Active events give a 5 second "bonus" to engaged time.
   *  - Inactive events cause an immediate stop to the engaged time bonus of
   *    any previous activity event.
   *  - At any point after instantiation, `getTotalEngagedTime` can be used
   *    to get the engage time up to the time the function is called. If
   *    `whenFirstVisible` has not yet resolved, engaged time is 0.
   * @param {!Window} win
   */

  function Activity(win) {
    babelHelpers.classCallCheck(this, Activity);

    /** @private @const */
    this.win_ = win;

    /** @private @const {function} */
    this.boundStopIgnore_ = this.stopIgnore_.bind(this);

    /** @private @const {function} */
    this.boundHandleActivity_ = this.handleActivity_.bind(this);

    /** @private @const {function} */
    this.boundHandleInactive_ = this.handleInactive_.bind(this);

    /** @private @const {function} */
    this.boundHandleVisibilityChange_ = this.handleVisibilityChange_.bind(this);

    /** @private {Array<!UnlistenDef>} */
    this.unlistenFuncs_ = [];

    /** @private {boolean} */
    this.ignoreActivity_ = false;

    /** @private {boolean} */
    this.ignoreInactive_ = false;

    /** @private @const {!ActivityHistory} */
    this.activityHistory_ = new ActivityHistory();

    /** @private @const {!Viewer} */
    this.viewer_ = _srcViewer.viewerFor(this.win_);

    /** @private @const {!Viewport} */
    this.viewport_ = _srcViewport.viewportFor(this.win_);

    this.viewer_.whenFirstVisible().then(this.start_.bind(this));
  }

  /** @private */

  Activity.prototype.start_ = function start_() {
    /** @private @const {number} */
    this.startTime_ = new Date().getTime();
    // record an activity since this is when the page became visible
    this.handleActivity_();
    this.setUpActivityListeners_();
  };

  /** @private */

  Activity.prototype.getTimeSinceStart_ = function getTimeSinceStart_() {
    var timeSinceStart = new Date().getTime() - this.startTime_;
    // Ensure that a negative time is never returned. This may cause loss of
    // data if there is a time change during the session but it will decrease
    // the likelyhood of errors in that situation.
    return timeSinceStart > 0 ? timeSinceStart : 0;
  };

  /**
   * Return to a state where neither activities or inactivity events are
   * ignored when that event type is fired.
   * @private
   */

  Activity.prototype.stopIgnore_ = function stopIgnore_() {
    this.ignoreActivity_ = false;
    this.ignoreInactive_ = false;
  };

  /** @private */

  Activity.prototype.setUpActivityListeners_ = function setUpActivityListeners_() {
    for (var i = 0; i < ACTIVE_EVENT_TYPES.length; i++) {
      this.unlistenFuncs_.push(_srcEventHelper.listen(this.win_.document, ACTIVE_EVENT_TYPES[i], this.boundHandleActivity_));
    }

    this.unlistenFuncs_.push(this.viewer_.onVisibilityChanged(this.boundHandleVisibilityChange_));

    // Viewport.onScroll does not return an unlisten function.
    // TODO(britice): If Viewport is updated to return an unlisten function,
    // update this to capture the unlisten function.
    this.viewport_.onScroll(this.boundHandleActivity_);
  };

  /** @private */

  Activity.prototype.handleActivity_ = function handleActivity_() {
    if (this.ignoreActivity_) {
      return;
    }
    this.ignoreActivity_ = true;
    this.ignoreInactive_ = false;

    this.handleActivityEvent_(ActivityEventType.ACTIVE);
  };

  /** @private */

  Activity.prototype.handleInactive_ = function handleInactive_() {
    if (this.ignoreInactive_) {
      return;
    }
    this.ignoreInactive_ = true;
    this.ignoreActivity_ = false;

    this.handleActivityEvent_(ActivityEventType.INACTIVE);
  };

  /**
   * @param {ActivityEventType}
   * @private
   */

  Activity.prototype.handleActivityEvent_ = function handleActivityEvent_(type) {
    var timeSinceStart = this.getTimeSinceStart_();
    var secondKey = Math.floor(timeSinceStart / 1000);
    var timeToWait = 1000 - timeSinceStart % 1000;

    // stop ignoring activity at the start of the next activity bucket
    setTimeout(this.boundStopIgnore_, timeToWait);

    this.activityHistory_.push({
      type: type,
      time: secondKey
    });
  };

  /** @private */

  Activity.prototype.handleVisibilityChange_ = function handleVisibilityChange_() {
    if (this.viewer_.isVisible()) {
      this.handleActivity_();
    } else {
      this.handleInactive_();
    }
  };

  /**
   * Remove all listeners associated with this Activity instance.
   * @private
   */

  Activity.prototype.unlisten_ = function unlisten_() {
    for (var i = 0; i < this.unlistenFuncs_.length; i++) {
      var unlistenFunc = this.unlistenFuncs_[i];
      // TODO(britice): Due to eslint typechecking, this check may not be
      // necessary.
      if (typeof unlistenFunc === 'function') {
        unlistenFunc();
      }
    }
    this.unlistenFuncs_ = [];
  };

  /** @private */

  Activity.prototype.cleanup_ = function cleanup_() {
    this.unlisten_();
  };

  /**
   * Get total engaged time since the page became visible.
   * @return {number}
   */

  Activity.prototype.getTotalEngagedTime = function getTotalEngagedTime() {
    var secondsSinceStart = Math.floor(this.getTimeSinceStart_() / 1000);
    return this.activityHistory_.getTotalEngagedTime(secondsSinceStart);
  };

  return Activity;
})();

exports.Activity = Activity;
;

/**
 * @param  {!Window} win
 * @return {!Activity}
 */

function installActivityService(win) {
  return _srcService.getService(win, 'activity', function () {
    return new Activity(win);
  });
}

;

},{"../../../src/event-helper":14,"../../../src/service":25,"../../../src/viewer":33,"../../../src/viewport":34}],2:[function(require,module,exports){
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

var _vendors = require('./vendors');

var _instrumentation = require('./instrumentation');

var _srcUrl = require('../../../src/url');

var _srcLog = require('../../../src/log');

var _srcString = require('../../../src/string');

var _cidImpl = require('./cid-impl');

var _storageImpl = require('./storage-impl');

var _activityImpl = require('./activity-impl');

var _visibilityImpl = require('./visibility-impl');

var _srcTypes = require('../../../src/types');

var _transport = require('./transport');

var _srcUrlReplacements = require('../../../src/url-replacements');

var _srcUserNotification = require('../../../src/user-notification');

var _srcXhr = require('../../../src/xhr');

var _srcStyle = require('../../../src/style');

var _third_partyClosureLibrarySha384Generated = require('../../../third_party/closure-library/sha384-generated');

_activityImpl.installActivityService(AMP.win);
_cidImpl.installCidService(AMP.win);
_storageImpl.installStorageService(AMP.win);
_visibilityImpl.installVisibilityService(AMP.win);
_instrumentation.instrumentationServiceFor(AMP.win);

var MAX_REPLACES = 16; // The maximum number of entries in a extraUrlParamsReplaceMap

var AmpAnalytics = (function (_AMP$BaseElement) {
  babelHelpers.inherits(AmpAnalytics, _AMP$BaseElement);

  function AmpAnalytics() {
    babelHelpers.classCallCheck(this, AmpAnalytics);

    _AMP$BaseElement.apply(this, arguments);
  }

  /** @override */

  AmpAnalytics.prototype.getPriority = function getPriority() {
    // Loads after other content.
    return 1;
  };

  /** @override */

  AmpAnalytics.prototype.isLayoutSupported = function isLayoutSupported(unusedLayout) {
    return true;
  };

  /**
   * @override
   */

  AmpAnalytics.prototype.createdCallback = function createdCallback() {
    /**
     * @const {!JSONObject} Copied here for tests.
     * @private
     */
    this.predefinedConfig_ = _vendors.ANALYTICS_CONFIG;

    /** @private @const Instance for testing. */
    this.sha384_ = _third_partyClosureLibrarySha384Generated.sha384;
  };

  /** @override */

  AmpAnalytics.prototype.buildCallback = function buildCallback() {
    var _this = this;

    this.element.setAttribute('aria-hidden', 'true');
    /**
     * The html id of the `amp-user-notification` element.
     * @private @const {?string}
     */
    this.consentNotificationId_ = this.element.getAttribute('data-consent-notification-id');

    /** @private {!Promise} */
    this.consentPromise_ = Promise.resolve();

    if (this.consentNotificationId_ != null) {
      this.consentPromise_ = _srcUserNotification.userNotificationManagerFor(this.getWin()).then(function (service) {
        return service.get(_this.consentNotificationId_);
      });
    }
  };

  /** @override */

  AmpAnalytics.prototype.layoutCallback = function layoutCallback() {
    // Now that we are rendered, stop rendering the element to reduce
    // resource consumption.
    _srcStyle.toggle(this.element, false);

    /**
     * @private {?string} Predefinedtype associated with the tag. If specified,
     * the config from the predefined type is merged with the inline config
     */
    this.type_ = null;

    /**
     * @private {Object<string, string>} A map of request names to the request
     * format string used by the tag to send data
     */
    this.requests_ = {};

    /**
     * @private {JSONObject}
     */
    this.remoteConfig = {};

    return this.consentPromise_.then(this.fetchRemoteConfig_.bind(this)).then(this.onFetchRemoteConfigSuccess_.bind(this));
  };

  /**
   * Handle successful fetching of (possibly) remote config.
   * @return {!Promise|undefined}
   * @private
   */

  AmpAnalytics.prototype.onFetchRemoteConfigSuccess_ = function onFetchRemoteConfigSuccess_() {
    var _this2 = this;

    /**
     * @private {!JSONObject} The analytics config associated with the tag
     */
    this.config_ = this.mergeConfigs_();

    if (this.hasOptedOut_()) {
      // Nothing to do when the user has opted out.
      _srcLog.dev.fine(this.getName_(), 'User has opted out. No hits will be sent.');
      return Promise.resolve();
    }

    this.generateRequests_();

    if (!this.config_['triggers']) {
      _srcLog.user.error(this.getName_(), 'No triggers were found in the ' + 'config. No analytics data will be sent.');
      return Promise.resolve();
    }
    if (this.config_['extraUrlParams'] && this.config_['extraUrlParamsReplaceMap']) {
      // If the config includes a extraUrlParamsReplaceMap, apply it as a set
      // of params to String.replace to allow aliasing of the keys in
      // extraUrlParams.
      var count = 0;
      for (var replaceMapKey in this.config_['extraUrlParamsReplaceMap']) {
        if (++count > MAX_REPLACES) {
          _srcLog.user.error(this.getName_(), 'More than ' + MAX_REPLACES.toString() + ' extraUrlParamsReplaceMap rules aren\'t allowed; Skipping the rest');
          break;
        }

        for (var extraUrlParamsKey in this.config_['extraUrlParams']) {
          var newkey = extraUrlParamsKey.replace(replaceMapKey, this.config_['extraUrlParamsReplaceMap'][replaceMapKey]);
          if (extraUrlParamsKey != newkey) {
            var value = this.config_['extraUrlParams'][extraUrlParamsKey];
            delete this.config_['extraUrlParams'][extraUrlParamsKey];
            this.config_['extraUrlParams'][newkey] = value;
          }
        }
      }
    }

    var promises = [];
    // Trigger callback can be synchronous. Do the registration at the end.
    for (var k in this.config_['triggers']) {
      if (this.config_['triggers'].hasOwnProperty(k)) {
        var _ret = (function () {
          var trigger = _this2.config_['triggers'][k];
          if (!trigger) {
            _srcLog.user.error(_this2.getName_(), 'Trigger should be an object: ', k);
            return 'continue';
          }
          if (!trigger['on'] || !trigger['request']) {
            _srcLog.user.error(_this2.getName_(), '"on" and "request" ' + 'attributes are required for data to be collected.');
            return 'continue';
          }
          promises.push(_this2.isSampledIn_(trigger).then(function (result) {
            if (!result) {
              return;
            }
            _instrumentation.addListener(_this2.getWin(), trigger, _this2.handleEvent_.bind(_this2, trigger));
          }));
        })();

        if (_ret === 'continue') continue;
      }
    }
    return Promise.all(promises);
  };

  /**
   * Returns a promise that resolves when remote config is ready (or
   * immediately if no remote config is specified.)
   * @private
   * @return {!Promise<>}
   */

  AmpAnalytics.prototype.fetchRemoteConfig_ = function fetchRemoteConfig_() {
    var _this3 = this;

    var remoteConfigUrl = this.element.getAttribute('config');
    if (!remoteConfigUrl) {
      return Promise.resolve();
    }
    _srcUrl.assertHttpsUrl(remoteConfigUrl);
    _srcLog.dev.fine(this.getName_(), 'Fetching remote config', remoteConfigUrl);
    var fetchConfig = {
      requireAmpResponseSourceOrigin: true
    };
    if (this.element.hasAttribute('data-credentials')) {
      fetchConfig.credentials = this.element.getAttribute('data-credentials');
    }
    return _srcUrlReplacements.urlReplacementsFor(this.getWin()).expand(remoteConfigUrl).then(function (expandedUrl) {
      remoteConfigUrl = expandedUrl;
      return _srcXhr.xhrFor(_this3.getWin()).fetchJson(remoteConfigUrl, fetchConfig);
    }).then(function (jsonValue) {
      _this3.remoteConfig_ = jsonValue;
      _srcLog.dev.fine(_this3.getName_(), 'Remote config loaded', remoteConfigUrl);
    }, function (err) {
      _srcLog.user.error(_this3.getName_(), 'Error loading remote config: ', remoteConfigUrl, err);
    });
  };

  /**
   * Merges various sources of configs and stores them in a member variable.
   *
   * Order of precedence for configs from highest to lowest:
   * - Remote config: specified through an attribute of the tag.
   * - Inline config: specified insize the tag.
   * - Predefined config: Defined as part of the platform.
   * - Default config: Built-in config shared by all amp-analytics tags.
   *
   * @private
   * @return {!JSONObject}
   */

  AmpAnalytics.prototype.mergeConfigs_ = function mergeConfigs_() {
    var inlineConfig = {};
    try {
      var children = this.element.children;
      if (children.length == 1) {
        var child = children[0];
        if (child.tagName.toUpperCase() == 'SCRIPT' && child.getAttribute('type').toUpperCase() == 'APPLICATION/JSON') {
          inlineConfig = JSON.parse(children[0].textContent);
        } else {
          _srcLog.user.error(this.getName_(), 'The analytics config should ' + 'be put in a <script> tag with type=application/json');
        }
      } else if (children.length > 1) {
        _srcLog.user.error(this.getName_(), 'The tag should contain only one' + ' <script> child.');
      }
    } catch (er) {
      _srcLog.user.error(this.getName_(), 'Analytics config could not be ' + 'parsed. Is it in a valid JSON format?', er);
    }

    // Initialize config with analytics related vars.
    var config = {
      'vars': {
        'requestCount': 0
      }
    };
    var defaultConfig = this.predefinedConfig_['default'] || {};
    var typeConfig = this.predefinedConfig_[this.element.getAttribute('type')] || {};

    this.mergeObjects_(defaultConfig, config);
    this.mergeObjects_(typeConfig, config, /* predefined */true);
    this.mergeObjects_(inlineConfig, config);
    this.mergeObjects_(this.remoteConfig_, config);
    return config;
  };

  /**
   * @return {boolean} true if the user has opted out.
   */

  AmpAnalytics.prototype.hasOptedOut_ = function hasOptedOut_() {
    if (!this.config_['optout']) {
      return false;
    }

    var props = this.config_['optout'].split('.');
    var k = this.getWin();
    for (var i = 0; i < props.length; i++) {
      if (!k) {
        return false;
      }
      k = k[props[i]];
    }
    return k();
  };

  /**
   * Goes through all the requests in predefined vendor config and tag's config
   * and creates a map of request name to request template. These requests can
   * then be used while sending a request to a server.
   *
   * @private
   */

  AmpAnalytics.prototype.generateRequests_ = function generateRequests_() {
    var _this4 = this;

    var requests = {};
    if (!this.config_ || !this.config_['requests']) {
      _srcLog.dev.error(this.getName_(), 'No request strings defined. Analytics data ' + 'will not be sent from this page.');
      return;
    }
    for (var k in this.config_['requests']) {
      if (this.config_['requests'].hasOwnProperty(k)) {
        requests[k] = this.config_['requests'][k];
      }
    }
    this.requests_ = requests;

    // Expand any placeholders. For requests, we expand each string up to 5
    // times to support nested requests. Leave any unresolved placeholders.
    for (var k in this.requests_) {
      this.requests_[k] = _srcString.expandTemplate(this.requests_[k], function (key) {
        return _this4.requests_[key] || '${' + key + '}';
      }, 5);
    }
  };

  /**
   * Callback for events that are registered by the config's triggers. This
   * method generates the request and sends the request out.
   *
   * @param {!JSONObject} trigger JSON config block that resulted in this event.
   * @param {!Object} event Object with details about the event.
   * @return {!Promise.<string|undefined>} The request that was sent out.
   * @private
   */

  AmpAnalytics.prototype.handleEvent_ = function handleEvent_(trigger, event) {
    var _this5 = this;

    var request = this.requests_[trigger['request']];
    if (!request) {
      _srcLog.user.error(this.getName_(), 'Ignoring event. Request string ' + 'not found: ', trigger['request']);
      return Promise.resolve();
    }

    // Add any given extraUrlParams as query string param
    if (this.config_['extraUrlParams']) {
      request = _srcUrl.addParamsToUrl(request, this.config_['extraUrlParams']);
    }

    this.config_['vars']['requestCount']++;
    request = this.expandTemplate_(request, trigger, event);

    // For consistency with amp-pixel we also expand any url replacements.
    return _srcUrlReplacements.urlReplacementsFor(this.getWin()).expand(request).then(function (request) {
      _this5.sendRequest_(request, trigger);
      return request;
    });
  };

  /**
   * @param {!JSONObject} trigger The config to use to determine sampling.
   * @return {!Promise.<boolean>} Whether the request should be sampled in or
   * not based on sampleSpec.
   * @private
   */

  AmpAnalytics.prototype.isSampledIn_ = function isSampledIn_(trigger) {
    var _this6 = this;

    var spec = trigger['sampleSpec'];
    var resolve = Promise.resolve(true);
    if (!spec) {
      return resolve;
    }
    var threshold = spec['threshold'];
    if (!spec['sampleOn'] || Number.isNaN(parseFloat(threshold)) || !Number.isFinite(threshold)) {
      console. /*OK*/error(this.getName_(), 'Invalid sampling spec.');
      return resolve;
    }
    var key = this.expandTemplate_(spec['sampleOn'], trigger);

    return _srcUrlReplacements.urlReplacementsFor(this.getWin()).expand(key).then(function (key) {
      var digest = _this6.sha384_(key);
      if (digest[0] % 100 < spec['threshold']) {
        return resolve;
      }
      return Promise.resolve(false);
    });
  };

  /**
   * @param {string} template The template to expand.
   * @param {!JSONObject} The object to use for variable value lookups.
   * @param {!Object} event Object with details about the event.
   * @return {string} The expanded string.
   * @private
   */

  AmpAnalytics.prototype.expandTemplate_ = function expandTemplate_(template, trigger, event) {
    var _this7 = this;

    // Replace placeholders with URI encoded values.
    // Precedence is event.vars > trigger.vars > config.vars.
    // Nested expansion not supported.
    return _srcString.expandTemplate(template, function (key) {
      var match = key.match(/([^(]*)(\([^)]*\))?/);
      var name = match[1];
      var argList = match[2] || '';
      var raw = event && event['vars'] && event['vars'][name] || trigger['vars'] && trigger['vars'][name] || _this7.config_['vars'] && _this7.config_['vars'][name];
      var val = _this7.encodeVars_(raw != null ? raw : '', name);
      return val + argList;
    });
  };

  /**
   * @param {string} raw The values to URI encode.
   * @param {string} unusedName Name of the variable.
   * @private
   */

  AmpAnalytics.prototype.encodeVars_ = function encodeVars_(raw, unusedName) {
    if (_srcTypes.isArray(raw)) {
      return raw.map(encodeURIComponent).join(',');
    }
    return encodeURIComponent(raw);
  };

  /**
   * @param {string} request The full request string to send.
   * @param {!JSONObject} trigger
   * @private
   */

  AmpAnalytics.prototype.sendRequest_ = function sendRequest_(request, trigger) {
    if (!request) {
      _srcLog.user.error(this.getName_(), 'Request not sent. Contents empty.');
      return;
    }
    if (trigger['iframePing']) {
      _srcLog.user.assert(trigger['on'] == 'visible', 'iframePing is only available on page view requests.');
      _transport.sendRequestUsingIframe(this.getWin(), request);
    } else {
      _transport.sendRequest(this.getWin(), request, this.config_['transport'] || {});
    }
  };

  /**
   * @return {string} Returns a string to identify this tag. May not be unique
   * if the element id is not unique.
   * @private
   */

  AmpAnalytics.prototype.getName_ = function getName_() {
    return 'AmpAnalytics ' + (this.element.getAttribute('id') || '<unknown id>');
  };

  /**
   * Merges two objects. If the value is array or plain object, the values are
   * merged otherwise the value is overwritten.
   *
   * @param {Object|Array} from Object or array to merge from
   * @param {Object|Array} to Object or Array to merge into
   * @param {boolean=} opt_predefinedConfig
   * @private
   */

  AmpAnalytics.prototype.mergeObjects_ = function mergeObjects_(from, to, opt_predefinedConfig) {
    if (to === null || to === undefined) {
      to = {};
    }

    for (var property in from) {
      _srcLog.user.assert(opt_predefinedConfig || property != 'iframePing', 'iframePing config is only available to vendor config.');
      // Only deal with own properties.
      if (from.hasOwnProperty(property)) {
        if (_srcTypes.isArray(from[property])) {
          if (!_srcTypes.isArray(to[property])) {
            to[property] = [];
          }
          to[property] = this.mergeObjects_(from[property], to[property], opt_predefinedConfig);
        } else if (_srcTypes.isObject(from[property])) {
          if (!_srcTypes.isObject(to[property])) {
            to[property] = {};
          }
          to[property] = this.mergeObjects_(from[property], to[property], opt_predefinedConfig);
        } else {
          to[property] = from[property];
        }
      }
    }
    return to;
  };

  return AmpAnalytics;
})(AMP.BaseElement);

exports.AmpAnalytics = AmpAnalytics;

AMP.registerElement('amp-analytics', AmpAnalytics);

},{"../../../src/log":17,"../../../src/string":26,"../../../src/style":27,"../../../src/types":29,"../../../src/url":31,"../../../src/url-replacements":30,"../../../src/user-notification":32,"../../../src/xhr":36,"../../../third_party/closure-library/sha384-generated":37,"./activity-impl":1,"./cid-impl":3,"./instrumentation":4,"./storage-impl":5,"./transport":6,"./vendors":7,"./visibility-impl":8}],3:[function(require,module,exports){
exports.__esModule = true;
exports.getProxySourceOrigin = getProxySourceOrigin;
exports.installCidService = installCidService;
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
 * @fileoverview Provides per AMP document source origin and use case
 * persistent client identifiers for use in analytics and similar use
 * cases.
 *
 * For details, see https://goo.gl/Mwaacs
 */

var _srcCookies = require('../../../src/cookies');

var _srcService = require('../../../src/service');

var _srcUrl = require('../../../src/url');

var _srcTimer = require('../../../src/timer');

var _srcViewer = require('../../../src/viewer');

var _third_partyClosureLibrarySha384Generated = require('../../../third_party/closure-library/sha384-generated');

var _srcLog = require('../../../src/log');

var ONE_DAY_MILLIS = 24 * 3600 * 1000;

/**
 * We ignore base cids that are older than (roughly) one year.
 */
var BASE_CID_MAX_AGE_MILLIS = 365 * ONE_DAY_MILLIS;

/**
 * A base cid string value and the time it was last read / stored.
 * @typedef {{time: time, cid: string}}
 */
var BaseCidInfoDef = undefined;

/**
 * The "get CID" parameters.
 * - createCookieIfNotPresent: Whether CID is allowed to create a cookie when.
 *   Default value is `false`.
 * @typedef {{
 *   scope: string,
 *   createCookieIfNotPresent: (boolean|undefined),
 * }}
 */
var GetCidDef = undefined;

var Cid = (function () {
  /** @param {!Window} win */

  function Cid(win) {
    babelHelpers.classCallCheck(this, Cid);

    /** @const */
    this.win = win;

    /** @private @const Instance for testing. */
    this.sha384Base64_ = _third_partyClosureLibrarySha384Generated.sha384Base64;

    /**
     * Cached base cid once read from storage to avoid repeated
     * reads.
     * @private {?string}
     */
    this.baseCid_ = null;

    /**
     * Cache to store external cids. Scope is used as the key and cookie value
     * is the value.
     * @private {!Object.<string, string>}
     */
    this.externalCidCache_ = Object.create(null);
  }

  /**
   * Returns the "external cid". This is a cid for a specific purpose
   * (Say Analytics provider X). It is unique per user, that purpose
   * and the AMP origin site.
   * @param {!Cid} cid
   * @param {!GetCidDef} getCidStruct
   * @param {!Promise} persistenceConsent
   * @return {!Promise<?string>}
   */

  /**
   * @param {string|!GetCidDef} externalCidScope Name of the fallback cookie
   *     for the case where this doc is not served by an AMP proxy. GetCidDef
   *     structure can also instruct CID to create a cookie if one doesn't yet
   *     exist in a non-proxy case.
   * @param {!Promise} consent Promise for when the user has given consent
   *     (if deemed necessary by the publisher) for use of the client
   *     identifier.
   * @param {!Promise=} opt_persistenceConsent Dedicated promise for when
   *     it is OK to persist a new tracking identifier. This could be
   *     supplied ONLY by the code that supplies the actual consent
   *     cookie.
   *     If this is given, the consent param should be a resolved promise
   *     because this call should be only made in order to get consent.
   *     The consent promise passed to other calls should then itself
   *     depend on the opt_persistenceConsent promise (and the actual
   *     consent, of course).
   * @return {!Promise<?string>} A client identifier that should be used
   *      within the current source origin and externalCidScope. Might be
   *      null if no identifier was found or could be made.
   *      This promise may take a long time to resolve if consent isn't
   *      given.
   */

  Cid.prototype.get = function get(externalCidScope, consent, opt_persistenceConsent) {
    var _this = this;

    /** @type {!GetCidDef} */
    var getCidStruct = undefined;
    if (typeof externalCidScope == 'string') {
      getCidStruct = { scope: externalCidScope };
    } else {
      getCidStruct = /** @type {!GetCidDef} */externalCidScope;
    }
    _srcLog.user.assert(/^[a-zA-Z0-9-_]+$/.test(getCidStruct.scope), 'The client id name must only use the characters ' + '[a-zA-Z0-9-_]+\nInstead found: %s', getCidStruct.scope);
    return consent.then(function () {
      return getExternalCid(_this, getCidStruct, opt_persistenceConsent || consent);
    });
  };

  return Cid;
})();

function getExternalCid(cid, getCidStruct, persistenceConsent) {
  var url = _srcUrl.parseUrl(cid.win.location.href);
  if (!_srcUrl.isProxyOrigin(url)) {
    return getOrCreateCookie(cid, getCidStruct, persistenceConsent);
  }
  return getBaseCid(cid, persistenceConsent).then(function (baseCid) {
    return cid.sha384Base64_(baseCid + getProxySourceOrigin(url) + getCidStruct.scope);
  });
}

/**
 * Sets a new CID cookie for expire 1 year from now.
 * @param {!Window} win
 * @param {string} scope
 * @param {string} cookie
 */
function setCidCookie(win, scope, cookie) {
  var expiration = _srcTimer.timer.now() + BASE_CID_MAX_AGE_MILLIS;
  _srcCookies.setCookie(win, scope, cookie, expiration, {
    highestAvailableDomain: true
  });
}

/**
 * If cookie exists it's returned immediately. Otherwise, if instructed, the
 * new cookie is created.
 *
 * @param {!Cid} cid
 * @param {!GetCidDef} getCidStruct
 * @param {!Promise} persistenceConsent
 * @return {!Promise<?string>}
 */
function getOrCreateCookie(cid, getCidStruct, persistenceConsent) {
  var win = cid.win;
  var scope = getCidStruct.scope;
  var existingCookie = _srcCookies.getCookie(win, scope);

  if (!existingCookie && !getCidStruct.createCookieIfNotPresent) {
    return Promise.resolve(null);
  }

  if (cid.externalCidCache_[scope]) {
    return Promise.resolve(cid.externalCidCache_[scope]);
  }

  if (existingCookie) {
    // If we created the cookie, update it's expiration time.
    if (/^amp-/.test(existingCookie)) {
      setCidCookie(win, scope, existingCookie);
    }
    return Promise.resolve(existingCookie);
  }

  // Create new cookie, always prefixed with "amp-", so that we can see from
  // the value whether we created it.
  var newCookie = 'amp-' + cid.sha384Base64_(getEntropy(win));

  cid.externalCidCache_[scope] = newCookie;
  // Store it as a cookie based on the persistence consent.
  persistenceConsent.then(function () {
    // The initial CID generation is inherently racy. First one that gets
    // consent wins.
    var relookup = _srcCookies.getCookie(win, scope);
    if (!relookup) {
      setCidCookie(win, scope, newCookie);
    }
  });
  return Promise.resolve(newCookie);
}

/**
 * Returns the source origin of an AMP document for documents served
 * on a proxy origin. Throws an error if the doc is not on a proxy origin.
 * @param {!Location} url URL of an AMP document.
 * @return {string} The source origin of the URL.
 * @visibleForTesting BUT if this is needed elsewhere it could be
 *     factored into its own package.
 */

function getProxySourceOrigin(url) {
  _srcLog.user.assert(_srcUrl.isProxyOrigin(url), 'Expected proxy origin %s', url.origin);
  return _srcUrl.getSourceOrigin(url);
}

/**
 * Returns the base cid for the current user. This string must not
 * be exposed to users without hashing with the current source origin
 * and the externalCidScope.
 * On a proxy this value is the same for a user across all source
 * origins.
 * @param {!Cid} cid
 * @param {!Promise} persistenceConsent
 * @return {!Promise<string>}
 */
function getBaseCid(cid, persistenceConsent) {
  if (cid.baseCid_) {
    return Promise.resolve(cid.baseCid_);
  }
  var win = cid.win;
  var stored = read(win);
  // See if we have a stored base cid and whether it is still valid
  // in terms of expiration.
  if (stored && !isExpired(stored)) {
    if (shouldUpdateStoredTime(stored)) {
      // Once per interval we mark the cid as used.
      store(win, stored.cid);
    }
    cid.baseCid_ = stored.cid;
    return Promise.resolve(stored.cid);
  }
  // If we are being embedded, try to get the base cid from the viewer.
  // Note, that we never try to persist to localStorage in this case.
  var viewer = _srcViewer.viewerFor(win);
  if (viewer.isIframed()) {
    return viewer.getBaseCid().then(function (cid) {
      if (!cid) {
        throw new Error('No CID');
      }
      return cid;
    });
  }

  // We need to make a new one.
  var seed = getEntropy(win);
  var newVal = cid.sha384Base64_(seed);

  cid.baseCid_ = newVal;
  // Storing the value may require consent. We wait for the respective
  // promise.
  persistenceConsent.then(function () {
    // The initial CID generation is inherently racy. First one that gets
    // consent wins.
    var relookup = read(win);
    if (!relookup) {
      store(win, newVal);
    }
  });
  return Promise.resolve(newVal);
}

/**
 * Stores a new cidString in localStorage. Adds the current time to the
 * stored value.
 * @param {!Window} win
 * @param {string} cidString Actual cid string to store.
 */
function store(win, cidString) {
  try {
    var item = {
      time: _srcTimer.timer.now(),
      cid: cidString
    };
    var data = JSON.stringify(item);
    win.localStorage.setItem('amp-cid', data);
  } catch (ignore) {
    // Setting localStorage may fail. In practice we don't expect that to
    // happen a lot (since we don't go anywhere near the quota, but
    // in particular in Safari private browsing mode it always fails.
    // In that case we just don't store anything, which is just fine.
  }
}

/**
 * Retrieves a stored cid item from localStorage. Returns undefined if
 * none was found
 * @param {!Window} win
 * @return {!BaseCidInfoDef|undefined}
 */
function read(win) {
  var data = undefined;
  try {
    data = win.localStorage.getItem('amp-cid');
  } catch (ignore) {
    // If reading from localStorage fails, we assume it is empty.
  }
  if (!data) {
    return undefined;
  }
  var item = JSON.parse(data);
  return {
    time: item['time'],
    cid: item['cid']
  };
}

/**
 * Whether the retrieved cid object is expired and should be ignored.
 * @param {!BaseCidInfoDef} storedCidInfo
 * @return {boolean}
 */
function isExpired(storedCidInfo) {
  var createdTime = storedCidInfo.time;
  var now = _srcTimer.timer.now();
  return createdTime + BASE_CID_MAX_AGE_MILLIS < now;
}

/**
 * Whether we should write a new timestamp to the stored cid value.
 * We say yes if it is older than 1 day, so we only do this max once
 * per day to avoid writing to localStorage all the time.
 * @param {!BaseCidInfoDef} storedCidInfo
 * @return {boolean}
 */
function shouldUpdateStoredTime(storedCidInfo) {
  var createdTime = storedCidInfo.time;
  var now = _srcTimer.timer.now();
  return createdTime + ONE_DAY_MILLIS < now;
}

/**
 * Returns an array with a total of 128 of random values based on the
 * `win.crypto.getRandomValues` API. If that is not available concatenates
 * a string of other values that might be hard to guess including
 * `Math.random` and the current time.
 * @param {!Window} win
 * @return {!Array<number>|string} Entropy.
 */
function getEntropy(win) {
  // Widely available in browsers we support:
  // http://caniuse.com/#search=getRandomValues
  if (win.crypto && win.crypto.getRandomValues) {
    var uint8array = new Uint8Array(16); // 128 bit
    win.crypto.getRandomValues(uint8array);
    // While closure's Hash interface would except a Uint8Array
    // sha384 does not in practice, so we copy the values into
    // a plain old array.
    var array = new Array(16);
    for (var i = 0; i < uint8array.length; i++) {
      array[i] = uint8array[i];
    }
    return array;
  }
  // Support for legacy browsers.
  return String(win.location.href + _srcTimer.timer.now() + win.Math.random() + win.screen.width + win.screen.height);
}

/**
 * @param {!Window} window
 * @return {!Cid}
 */

function installCidService(window) {
  return _srcService.getService(window, 'cid', function () {
    return new Cid(window);
  });
}

;

},{"../../../src/cookies":11,"../../../src/log":17,"../../../src/service":25,"../../../src/timer":28,"../../../src/url":31,"../../../src/viewer":33,"../../../third_party/closure-library/sha384-generated":37}],4:[function(require,module,exports){
exports.__esModule = true;
exports.addListener = addListener;
exports.instrumentationServiceFor = instrumentationServiceFor;
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

var _srcExperiments = require('../../../src/experiments');

var _visibilityImpl = require('./visibility-impl');

var _srcObservable = require('../../../src/observable');

var _srcService = require('../../../src/service');

var _srcTimer = require('../../../src/timer');

var _srcLog = require('../../../src/log');

var _srcViewer = require('../../../src/viewer');

var _srcViewport = require('../../../src/viewport');

var _srcVisibility = require('../../../src/visibility');

var MIN_TIMER_INTERVAL_SECONDS_ = 0.5;
var DEFAULT_MAX_TIMER_LENGTH_SECONDS_ = 7200;
var SCROLL_PRECISION_PERCENT = 5;
var VAR_H_SCROLL_BOUNDARY = 'horizontalScrollBoundary';
var VAR_V_SCROLL_BOUNDARY = 'verticalScrollBoundary';

/**
 * Type to define a callback that is called when an instrumented event fires.
 * @typedef {function(!AnalyticsEvent)}
 */
var AnalyticsEventListenerDef = undefined;

/**
 * @param {!Window} window Window object to listen on.
 * @param {!JSONObject} config Configuration for instrumentation.
 * @param {!AnalyticsEventListenerDef} listener Callback to call when the event
 *          fires.
 */

function addListener(window, config, listener) {
  return instrumentationServiceFor(window).addListener(config, listener);
}

/**
 * Events that can result in analytics data to be sent.
 * @const
 * @enum {string}
 */
var AnalyticsEventType = {
  VISIBLE: 'visible',
  CLICK: 'click',
  TIMER: 'timer',
  SCROLL: 'scroll'
};

exports.AnalyticsEventType = AnalyticsEventType;
/**
 * Ignore Most of this class as it has not been thought through yet. It will
 * change completely.
 */

var AnalyticsEvent =

/**
 * @param {!AnalyticsEventType} type The type of event.
 * @param {!Object<string, string>} A map of vars and their values.
 */
function AnalyticsEvent(type, vars) {
  babelHelpers.classCallCheck(this, AnalyticsEvent);

  this.type = type;
  this.vars = vars || Object.create(null);
}

/** @private Visible for testing. */
;

var InstrumentationService = (function () {
  /**
   * @param {!Window} window
   */

  function InstrumentationService(window) {
    var _this = this;

    babelHelpers.classCallCheck(this, InstrumentationService);

    /** @const {!Window} */
    this.win_ = window;

    /** @const {string} */
    this.TAG_ = 'Analytics.Instrumentation';

    /** @const {!Viewer} */
    this.viewer_ = _srcViewer.viewerFor(window);

    /** @const {!Viewport} */
    this.viewport_ = _srcViewport.viewportFor(window);

    /** @private {boolean} */
    this.clickHandlerRegistered_ = false;

    /** @private {!Observable<!Event>} */
    this.clickObservable_ = new _srcObservable.Observable();

    /** @private {boolean} */
    this.scrollHandlerRegistered_ = false;

    /** @private {!Observable<Event>} */
    this.scrollObservable_ = new _srcObservable.Observable();

    /** @private {!Object<string, !Observable<!AnalyticsEvent>>} */
    this.customEventObservers_ = {};

    /**
     * Early events have to be buffered because there's no way to predict
     * how fast all `amp-analytics` elements will be instrumented.
     * @private {!Object<string, !Array<!AnalyticsEvent>>|undefined}
     */
    this.customEventBuffer_ = {};

    // Stop buffering of custom events after 10 seconds. Assumption is that all
    // `amp-analytics` elements will have been instrumented by this time.
    _srcTimer.timer.delay(function () {
      _this.customEventBuffer_ = undefined;
    }, 10000);
  }

  /**
   * @param {!Window} window
   * @return {!InstrumentationService}
   */

  /**
   * @param {!JSONObject} config Configuration for instrumentation.
   * @param {!AnalyticsEventListenerDef} The callback to call when the event
   *   occurs.
   */

  InstrumentationService.prototype.addListener = function addListener(config, listener) {
    var _this2 = this;

    var eventType = config['on'];
    if (eventType === AnalyticsEventType.VISIBLE) {
      this.createVisibilityListener_(listener, config);
    } else if (eventType === AnalyticsEventType.CLICK) {
      if (!config['selector']) {
        _srcLog.user.error(this.TAG_, 'Missing required selector on click trigger');
        return;
      }

      this.ensureClickListener_();
      this.clickObservable_.add(this.createSelectiveListener_(listener, config['selector']));
    } else if (eventType === AnalyticsEventType.SCROLL) {
      if (!config['scrollSpec']) {
        _srcLog.user.error(this.TAG_, 'Missing scrollSpec on scroll trigger.');
        return;
      }
      this.registerScrollTrigger_(config['scrollSpec'], listener);

      // Trigger an event to fire events that might have already happened.
      var size = this.viewport_.getSize();
      this.onScroll_({
        top: this.viewport_.getScrollTop(),
        left: this.viewport_.getScrollLeft(),
        width: size.width,
        height: size.height
      });
    } else if (eventType === AnalyticsEventType.TIMER) {
      if (this.isTimerSpecValid_(config['timerSpec'])) {
        this.createTimerListener_(listener, config['timerSpec']);
      }
    } else {
      var observers = this.customEventObservers_[eventType];
      if (!observers) {
        observers = new _srcObservable.Observable();
        this.customEventObservers_[eventType] = observers;
      }
      observers.add(listener);

      // Push recent events if any.
      if (this.customEventBuffer_) {
        (function () {
          var buffer = _this2.customEventBuffer_[eventType];
          if (buffer) {
            _srcTimer.timer.delay(function () {
              buffer.forEach(function (event) {
                listener(event);
              });
            }, 1);
          }
        })();
      }
    }
  };

  /**
   * Triggers the analytics event with the specified type.
   * @param {string} eventType
   */

  InstrumentationService.prototype.triggerEvent = function triggerEvent(eventType) {
    var event = new AnalyticsEvent(eventType);

    // Enqueue.
    if (this.customEventBuffer_) {
      var buffer = this.customEventBuffer_[event.type];
      if (!buffer) {
        buffer = [];
        this.customEventBuffer_[event.type] = buffer;
      }
      buffer.push(event);
    }

    // If listeners already present - trigger right away.
    var observers = this.customEventObservers_[eventType];
    if (observers) {
      observers.fire(event);
    }
  };

  /**
   * Creates listeners for visibility conditions or calls the callback if all
   * the conditions are met.
   * @param {!AnalyticsEventListenerDef} The callback to call when the event
   *   occurs.
   * @param {!JSONObject} config Configuration for instrumentation.
   * @private
   */

  InstrumentationService.prototype.createVisibilityListener_ = function createVisibilityListener_(callback, config) {
    var _this3 = this;

    if (config['visibilitySpec'] && this.isViewabilityExperimentOn_()) {
      if (!_visibilityImpl.isVisibilitySpecValid(config)) {
        return;
      }

      this.runOrSchedule_(function () {
        _srcVisibility.visibilityFor(_this3.win_).then(function (visibility) {
          visibility.listenOnce(config['visibilitySpec'], function (vars) {
            callback(new AnalyticsEvent(AnalyticsEventType.VISIBLE, vars));
          });
        });
      });
    } else {
      this.runOrSchedule_(function () {
        callback(new AnalyticsEvent(AnalyticsEventType.VISIBLE));
      });
    }
  };

  /** @private {function()} fn function to run or schedule. */

  InstrumentationService.prototype.runOrSchedule_ = function runOrSchedule_(fn) {
    var _this4 = this;

    if (this.viewer_.isVisible()) {
      fn();
    } else {
      this.viewer_.onVisibilityChanged(function () {
        if (_this4.viewer_.isVisible()) {
          fn();
        }
      });
    }
  };

  /**
   * Ensure we have a click listener registered on the document.
   * @private
   */

  InstrumentationService.prototype.ensureClickListener_ = function ensureClickListener_() {
    if (!this.clickHandlerRegistered_) {
      this.clickHandlerRegistered_ = true;
      this.win_.document.documentElement.addEventListener('click', this.onClick_.bind(this));
    }
  };

  /**
   * @param {!Event} e
   * @private
   */

  InstrumentationService.prototype.onClick_ = function onClick_(e) {
    this.clickObservable_.fire(e);
  };

  /**
   * @param {!ViewportChangedEventDef} e
   * @private
   */

  InstrumentationService.prototype.onScroll_ = function onScroll_(e) {
    this.scrollObservable_.fire(e);
  };

  /**
   * @param {!Function} listener
   * @param {string} selector
   * @private
   */

  InstrumentationService.prototype.createSelectiveListener_ = function createSelectiveListener_(listener, selector) {
    var _this5 = this;

    return function (e) {
      // First do the cheap lookups.
      if (selector === '*' || _this5.matchesSelector_(e.target, selector)) {
        listener(new AnalyticsEvent(AnalyticsEventType.CLICK));
      } else {
        // More expensive search.
        var el = e.target;
        while (el.parentElement != null && el.parentElement.tagName != 'BODY') {
          el = el.parentElement;
          if (_this5.matchesSelector_(el, selector)) {
            listener(new AnalyticsEvent(AnalyticsEventType.CLICK));
            // Don't fire the event multiple times even if the more than one
            // ancestor matches the selector.
            return;
          }
        }
      }
    };
  };

  /**
   * Register for a listener to be called when the boundaries specified in
   * config are reached.
   * @param {!JSONObject} config the config that specifies the boundaries.
   * @param {Function} listener
   * @private
   */

  InstrumentationService.prototype.registerScrollTrigger_ = function registerScrollTrigger_(config, listener) {
    var _this6 = this;

    if (!Array.isArray(config['verticalBoundaries']) && !Array.isArray(config['horizontalBoundaries'])) {
      _srcLog.user.error(this.TAG_, 'Boundaries are required for the scroll ' + 'trigger to work.');
      return;
    }

    // Ensure that the scroll events are being listened to.
    if (!this.scrollHandlerRegistered_) {
      this.scrollHandlerRegistered_ = true;
      this.viewport_.onChanged(this.onScroll_.bind(this));
    }

    /**
     * @param {!Object<number, boolean>} bounds.
     * @param {number} scrollPos Number representing the current scroll
     * @param {string} varName variable name to assign to the bound that
     * triggers the event
     * position.
     */
    var triggerScrollEvents = function (bounds, scrollPos, varName) {
      if (!scrollPos) {
        return;
      }
      // Goes through each of the boundaries and fires an event if it has not
      // been fired so far and it should be.
      for (var b in bounds) {
        if (!bounds.hasOwnProperty(b) || b > scrollPos || bounds[b]) {
          continue;
        }
        bounds[b] = true;
        var vars = Object.create(null);
        vars[varName] = b;
        listener(new AnalyticsEvent(AnalyticsEventType.SCROLL, vars));
      }
    };

    var boundsV = this.normalizeBoundaries_(config['verticalBoundaries']);
    var boundsH = this.normalizeBoundaries_(config['horizontalBoundaries']);
    this.scrollObservable_.add(function (e) {
      // Calculates percentage scrolled by adding screen height/width to
      // top/left and dividing by the total scroll height/width.
      triggerScrollEvents(boundsV, (e.top + e.height) * 100 / _this6.viewport_.getScrollHeight(), VAR_V_SCROLL_BOUNDARY);
      triggerScrollEvents(boundsH, (e.left + e.width) * 100 / _this6.viewport_.getScrollWidth(), VAR_H_SCROLL_BOUNDARY);
    });
  };

  /**
   * Rounds the boundaries for scroll trigger to nearest
   * SCROLL_PRECISION_PERCENT and returns an object with normalized boundaries
   * as keys and false as values.
   *
   * @param {!Array<number>} bounds array of bounds.
   * @return {!Object<number,boolean>} Object with normalized bounds as keys
   * and false as value.
   * @private
   */

  InstrumentationService.prototype.normalizeBoundaries_ = function normalizeBoundaries_(bounds) {
    var result = {};
    if (!bounds || !Array.isArray(bounds)) {
      return result;
    }

    for (var b = 0; b < bounds.length; b++) {
      var bound = bounds[b];
      if (typeof bound !== 'number' || !isFinite(bound)) {
        _srcLog.user.error(this.TAG_, 'Scroll trigger boundaries must be finite.');
        return result;
      }

      bound = Math.min(Math.round(bound / SCROLL_PRECISION_PERCENT) * SCROLL_PRECISION_PERCENT, 100);
      result[bound] = false;
    }
    return result;
  };

  /**
   * @param {!Element} el
   * @param {string} selector
   * @return {boolean} True if the given element matches the given selector.
   * @private
   */

  InstrumentationService.prototype.matchesSelector_ = function matchesSelector_(el, selector) {
    try {
      var matcher = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector || el.oMatchesSelector;
      if (matcher) {
        return matcher.call(el, selector);
      }
      var matches = this.win_.document.querySelectorAll(selector);
      var i = matches.length;
      while (i-- > 0 && matches.item(i) != el) {};
      return i > -1;
    } catch (selectorError) {
      _srcLog.user.error(this.TAG_, 'Bad query selector.', selector, selectorError);
    }
    return false;
  };

  /**
   * @param {JSONObject} timerSpec
   * @private
   */

  InstrumentationService.prototype.isTimerSpecValid_ = function isTimerSpecValid_(timerSpec) {
    if (!timerSpec) {
      _srcLog.user.error(this.TAG_, 'Bad timer specification');
      return false;
    } else if (!timerSpec.hasOwnProperty('interval')) {
      _srcLog.user.error(this.TAG_, 'Timer interval specification required');
      return false;
    } else if (typeof timerSpec['interval'] !== 'number' || timerSpec['interval'] < MIN_TIMER_INTERVAL_SECONDS_) {
      _srcLog.user.error(this.TAG_, 'Bad timer interval specification');
      return false;
    } else if (timerSpec.hasOwnProperty('maxTimerLength') && (typeof timerSpec['maxTimerLength'] !== 'number' || timerSpec['maxTimerLength'] <= 0)) {
      _srcLog.user.error(this.TAG_, 'Bad maxTimerLength specification');
      return false;
    } else {
      return true;
    }
  };

  /**
   * @param {!Function} listener
   * @param {JSONObject} timerSpec
   * @private
   */

  InstrumentationService.prototype.createTimerListener_ = function createTimerListener_(listener, timerSpec) {
    var intervalId = this.win_.setInterval(listener.bind(null, new AnalyticsEvent(AnalyticsEventType.TIMER)), timerSpec['interval'] * 1000);
    listener(new AnalyticsEvent(AnalyticsEventType.TIMER));

    var maxTimerLength = timerSpec['maxTimerLength'] || DEFAULT_MAX_TIMER_LENGTH_SECONDS_;
    this.win_.setTimeout(this.win_.clearInterval.bind(this.win_, intervalId), maxTimerLength * 1000);
  };

  /**
   * @return {boolean} True if the experiment is on. False otherwise.
   */

  InstrumentationService.prototype.isViewabilityExperimentOn_ = function isViewabilityExperimentOn_() {
    return _srcExperiments.isExperimentOn(this.win_, 'amp-analytics-viewability');
  };

  return InstrumentationService;
})();

exports.InstrumentationService = InstrumentationService;

function instrumentationServiceFor(window) {
  return _srcService.getService(window, 'amp-analytics-instrumentation', function () {
    return new InstrumentationService(window);
  });
}

},{"../../../src/experiments":15,"../../../src/log":17,"../../../src/observable":19,"../../../src/service":25,"../../../src/timer":28,"../../../src/viewer":33,"../../../src/viewport":34,"../../../src/visibility":35,"./visibility-impl":8}],5:[function(require,module,exports){
exports.__esModule = true;
exports.installStorageService = installStorageService;
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

var _srcService = require('../../../src/service');

var _srcUrl = require('../../../src/url');

var _srcLog = require('../../../src/log');

var _srcJson = require('../../../src/json');

var _srcTimer = require('../../../src/timer');

var _srcViewer = require('../../../src/viewer');

/** @const */
var TAG = 'Storage';

/** @const */
var MAX_VALUES_PER_ORIGIN = 8;

/**
 * The storage API. This is an API equivalent to the Web LocalStorage API but
 * extended to all AMP embedding scenarios.
 *
 * The storage is done per source origin. See `get`, `set` and `remove` methods
 * for more info.
 *
 * @see https://html.spec.whatwg.org/multipage/webstorage.html
 * @private Visible for testing only.
 */

var Storage = (function () {

  /**
   * @param {!Window} win
   * @param {!Viewer} viewer
   * @param {!StorageBindingDef} binding
   */

  function Storage(win, viewer, binding) {
    babelHelpers.classCallCheck(this, Storage);

    /** @const {!Window} */
    this.win = win;

    /** @private @const {!Viewer} */
    this.viewer_ = viewer;

    /** @private @const {!StorageBindingDef} */
    this.binding_ = binding;

    /** @const @private {string} */
    this.origin_ = _srcUrl.getSourceOrigin(this.win.location);

    /** @private {?Promise<!Store>} */
    this.storePromise_ = null;
  }

  /**
   * The implementation of store logic for get, set and remove.
   *
   * The structure of the store is equivalent to the following typedef:
   * ```
   * {
   *   vv: !Object<key(string), !{
   *     v: *,
   *     t: time
   *   }>
   * }
   * ```
   *
   * @private Visible for testing only.
   */

  /**
   * @return {!Storage}
   * @private
   */

  Storage.prototype.start_ = function start_() {
    this.listenToBroadcasts_();
    return this;
  };

  /**
   * Returns the promise that yields the value of the property for the specified
   * key.
   * @param {string} name
   * @return {!Promise<*>}
   * @override
   */

  Storage.prototype.get = function get(name) {
    return this.getStore_().then(function (store) {
      return store.get(name);
    });
  };

  /**
   * Saves the value of the specified property. Returns the promise that's
   * resolved when the operation completes.
   * @param {string} name
   * @param {*} value
   * @return {!Promise}
   * @override
   */

  Storage.prototype.set = function set(name, value) {
    _srcLog.dev.assert(typeof value == 'boolean', 'Only boolean values accepted');
    return this.saveStore_(function (store) {
      return store.set(name, value);
    });
  };

  /**
   * Removes the specified property. Returns the promise that's resolved when
   * the operation completes.
   * @param {string} name
   * @return {!Promise}
   * @override
   */

  Storage.prototype.remove = function remove(name) {
    return this.saveStore_(function (store) {
      return store.remove(name);
    });
  };

  /**
   * @return {!Promise<!Store>}
   * @private
   */

  Storage.prototype.getStore_ = function getStore_() {
    if (!this.storePromise_) {
      this.storePromise_ = this.binding_.loadBlob(this.origin_).then(function (blob) {
        return blob ? JSON.parse(atob(blob)) : {};
      })['catch'](function (reason) {
        _srcLog.dev.error(TAG, 'Failed to load store: ', reason);
        return {};
      }).then(function (obj) {
        return new Store(obj);
      });
    }
    return this.storePromise_;
  };

  /**
   * @param {function(!Store)} mutator
   * @return {!Promise}
   * @private
   */

  Storage.prototype.saveStore_ = function saveStore_(mutator) {
    var _this = this;

    return this.getStore_().then(function (store) {
      mutator(store);
      var blob = btoa(JSON.stringify(store.obj));
      return _this.binding_.saveBlob(_this.origin_, blob);
    }).then(this.broadcastReset_.bind(this));
  };

  /** @private */

  Storage.prototype.listenToBroadcasts_ = function listenToBroadcasts_() {
    var _this2 = this;

    this.viewer_.onBroadcast(function (message) {
      if (message['type'] == 'amp-storage-reset' && message['origin'] == _this2.origin_) {
        _srcLog.dev.fine(TAG, 'Received reset message');
        _this2.storePromise_ = null;
      }
    });
  };

  /** @private */

  Storage.prototype.broadcastReset_ = function broadcastReset_() {
    _srcLog.dev.fine(TAG, 'Broadcasted reset message');
    this.viewer_.broadcast({
      'type': 'amp-storage-reset',
      'origin': this.origin_
    });
  };

  return Storage;
})();

exports.Storage = Storage;

var Store = (function () {
  /**
   * @param {!JSONObject} obj
   * @param {number=} opt_maxValues
   */

  function Store(obj, opt_maxValues) {
    babelHelpers.classCallCheck(this, Store);

    /** @const {!JSONObject} */
    this.obj = _srcJson.recreateNonProtoObject(obj);

    /** @private @const {number} */
    this.maxValues_ = opt_maxValues || MAX_VALUES_PER_ORIGIN;

    /** @private @const {!Object<string, !JSONObject>} */
    this.values_ = this.obj['vv'] || Object.create(null);
    if (!this.obj['vv']) {
      this.obj['vv'] = this.values_;
    }
  }

  /**
   * A binding provides the specific implementation of storage technology.
   * @interface
   */

  /**
   * @param {string} name
   * @return {*|undefined}
   * @private
   */

  Store.prototype.get = function get(name) {
    // The structure is {key: {v: *, t: time}}
    var item = this.values_[name];
    return item ? item['v'] : undefined;
  };

  /**
   * @param {string} name
   * @param {*} value
   * @private
   */

  Store.prototype.set = function set(name, value) {
    _srcLog.dev.assert(name != '__proto__' && name != 'prototype', 'Name is not allowed: %s', name);
    // The structure is {key: {v: *, t: time}}
    if (this.values_[name] !== undefined) {
      var item = this.values_[name];
      item['v'] = value;
      item['t'] = _srcTimer.timer.now();
    } else {
      this.values_[name] = { 'v': value, 't': _srcTimer.timer.now() };
    }

    // Purge old values.
    var keys = Object.keys(this.values_);
    if (keys.length > this.maxValues_) {
      var minTime = Infinity;
      var minKey = null;
      for (var i = 0; i < keys.length; i++) {
        var item = this.values_[keys[i]];
        if (item['t'] < minTime) {
          minKey = keys[i];
          minTime = item['t'];
        }
      }
      if (minKey) {
        delete this.values_[minKey];
      }
    }
  };

  /**
   * @param {string} name
   * @private
   */

  Store.prototype.remove = function remove(name) {
    // The structure is {key: {v: *, t: time}}
    delete this.values_[name];
  };

  return Store;
})();

exports.Store = Store;

var StorageBindingDef = (function () {
  function StorageBindingDef() {
    babelHelpers.classCallCheck(this, StorageBindingDef);
  }

  /**
   * Storage implementation using Web LocalStorage API.
   * @implements {StorageBindingDef}
   * @private Visible for testing only.
   */

  /**
   * Returns the promise that yields the store blob for the specified origin.
   * @param {string} unusedOrigin
   * @return {!Promise<?string>}
   */

  StorageBindingDef.prototype.loadBlob = function loadBlob(unusedOrigin) {};

  /**
   * Saves the store blob for the specified origin and returns the promise
   * that's resolved when the operation completes.
   * @param {string} unusedOrigin
   * @param {string} unusedBlob
   * @return {!Promise}
   */

  StorageBindingDef.prototype.saveBlob = function saveBlob(unusedOrigin, unusedBlob) {};

  return StorageBindingDef;
})();

var LocalStorageBinding = (function () {

  /**
   * @param {!Window} win
   */

  function LocalStorageBinding(win) {
    babelHelpers.classCallCheck(this, LocalStorageBinding);

    /** @const {!Window} */
    this.win = win;
  }

  /**
   * Storage implementation delegated to the Viewer.
   * @implements {StorageBindingDef}
   * @private Visible for testing only.
   */

  /**
   * @param {string} origin
   * @return {string}
   * @private
   */

  LocalStorageBinding.prototype.getKey_ = function getKey_(origin) {
    return 'amp-store:' + origin;
  };

  /** @override */

  LocalStorageBinding.prototype.loadBlob = function loadBlob(origin) {
    var _this3 = this;

    return new Promise(function (resolve) {
      resolve(_this3.win.localStorage.getItem(_this3.getKey_(origin)));
    });
  };

  /** @override */

  LocalStorageBinding.prototype.saveBlob = function saveBlob(origin, blob) {
    var _this4 = this;

    return new Promise(function (resolve) {
      _this4.win.localStorage.setItem(_this4.getKey_(origin), blob);
      resolve();
    });
  };

  return LocalStorageBinding;
})();

exports.LocalStorageBinding = LocalStorageBinding;

var ViewerStorageBinding = (function () {

  /**
   * @param {!Viewer} viewer
   */

  function ViewerStorageBinding(viewer) {
    babelHelpers.classCallCheck(this, ViewerStorageBinding);

    /** @private @const {!Viewer} */
    this.viewer_ = viewer;
  }

  /**
   * @param {!Window} window
   * @return {!Storage}
   */

  /** @override */

  ViewerStorageBinding.prototype.loadBlob = function loadBlob(origin) {
    return this.viewer_.sendMessage('loadStore', {
      'origin': origin
    }, true).then(function (response) {
      return response['blob'];
    });
  };

  /** @override */

  ViewerStorageBinding.prototype.saveBlob = function saveBlob(origin, blob) {
    return this.viewer_.sendMessage('saveStore', {
      'origin': origin,
      'blob': blob
    }, true);
  };

  return ViewerStorageBinding;
})();

exports.ViewerStorageBinding = ViewerStorageBinding;

function installStorageService(window) {
  return _srcService.getService(window, 'storage', function () {
    var viewer = _srcViewer.viewerFor(window);
    var overrideStorage = parseInt(viewer.getParam('storage'), 10);
    var binding = overrideStorage ? new ViewerStorageBinding(viewer) : new LocalStorageBinding(window);
    return new Storage(window, viewer, binding).start_();
  });
}

;

},{"../../../src/json":16,"../../../src/log":17,"../../../src/service":25,"../../../src/timer":28,"../../../src/url":31,"../../../src/viewer":33}],6:[function(require,module,exports){
exports.__esModule = true;
exports.sendRequest = sendRequest;
exports.sendRequestUsingIframe = sendRequestUsingIframe;
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

var _srcUrl = require('../../../src/url');

var _srcLog = require('../../../src/log');

var _srcEventHelper = require('../../../src/event-helper');

var _srcTimer = require('../../../src/timer');

var _srcDom = require('../../../src/dom');

/** @const {string} */
var TAG_ = 'amp-analytics.Transport';

/**
 * @param {!Window} win
 * @param {string} request
 * @param {!Object<string, string>} transportOptions
 */

function sendRequest(win, request, transportOptions) {
  _srcUrl.assertHttpsUrl(request);
  if (transportOptions['beacon'] && Transport.sendRequestUsingBeacon(win, request)) {
    return;
  }
  if (transportOptions['xhrpost'] && Transport.sendRequestUsingXhr(win, request)) {
    return;
  }
  if (transportOptions['image']) {
    Transport.sendRequestUsingImage(win, request);
    return;
  }
  _srcLog.user.warn(TAG_, 'Failed to send request', request, transportOptions);
}

/**
 * @visibleForTesting
 */

var Transport = (function () {
  function Transport() {
    babelHelpers.classCallCheck(this, Transport);
  }

  /**
   * Sends a ping request using an iframe, that is removed 5 seconds after
   * it is loaded.
   * This is not available as a standard transport, but rather used for
   * specific, whitelisted requests.
   * @param {!Window} win
   * @param {string} request The request URL.
   */

  /**
   * @param {!Window} unusedWin
   * @param {string} request
   */

  Transport.sendRequestUsingImage = function sendRequestUsingImage(unusedWin, request) {
    var image = new Image();
    image.src = request;
    image.width = 1;
    image.height = 1;
    _srcEventHelper.loadPromise(image).then(function () {
      _srcLog.dev.fine(TAG_, 'Sent image request', request);
    })['catch'](function () {
      _srcLog.user.warn(TAG_, 'Failed to send image request', request);
    });
  };

  /**
   * @param {!Window} win
   * @param {string} request
   * @return {boolean} True if this browser supports navigator.sendBeacon.
   */

  Transport.sendRequestUsingBeacon = function sendRequestUsingBeacon(win, request) {
    if (!win.navigator.sendBeacon) {
      return false;
    }
    win.navigator.sendBeacon(request, '');
    _srcLog.dev.fine(TAG_, 'Sent beacon request', request);
    return true;
  };

  /**
   * @param {!Window} win
   * @param {string} request
   * @return {boolean} True if this browser supports cross-domain XHR.
   */

  Transport.sendRequestUsingXhr = function sendRequestUsingXhr(win, request) {
    if (!win.XMLHttpRequest) {
      return false;
    }
    var xhr = new win.XMLHttpRequest();
    if (!('withCredentials' in xhr)) {
      return false; // Looks like XHR level 1 - CORS is not supported.
    }
    xhr.open('POST', request, true);
    xhr.withCredentials = true;

    // Prevent pre-flight HEAD request.
    xhr.setRequestHeader('Content-Type', 'text/plain');

    xhr.onreadystatechange = function () {
      if (xhr.readystate == 4) {
        _srcLog.dev.fine(TAG_, 'Sent XHR request', request);
      }
    };

    xhr.send('');
    return true;
  };

  return Transport;
})();

exports.Transport = Transport;

function sendRequestUsingIframe(win, request) {
  _srcUrl.assertHttpsUrl(request);
  var iframe = win.document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.onload = iframe.onerror = function () {
    _srcTimer.timer.delay(function () {
      _srcDom.removeElement(iframe);
    }, 5000);
  };
  _srcLog.user.assert(_srcUrl.parseUrl(request).origin != _srcUrl.parseUrl(win.location.href).origin, 'Origin of iframe request must not be equal to the doc' + 'ument origin. See https://github.com/ampproject/' + 'amphtml/blob/master/spec/amp-iframe-origin-policy.md for details.');
  iframe.setAttribute('amp-analytics', '');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.src = request;
  win.document.body.appendChild(iframe);
  return iframe;
}

},{"../../../src/dom":12,"../../../src/event-helper":14,"../../../src/log":17,"../../../src/timer":28,"../../../src/url":31}],7:[function(require,module,exports){
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
 * @const {!JSONObject}
 */
var ANALYTICS_CONFIG = {

  // Default parent configuration applied to all amp-analytics tags.
  'default': {
    'transport': { 'beacon': true, 'xhrpost': true, 'image': true },
    'vars': {
      'accessReaderId': 'ACCESS_READER_ID',
      'ampdocHost': 'AMPDOC_HOST',
      'ampdocUrl': 'AMPDOC_URL',
      'authdata': 'AUTHDATA',
      'availableScreenHeight': 'AVAILABLE_SCREEN_HEIGHT',
      'availableScreenWidth': 'AVAILABLE_SCREEN_WIDTH',
      'browserLanguage': 'BROWSER_LANGUAGE',
      'canonicalHost': 'CANONICAL_HOST',
      'canonicalPath': 'CANONICAL_PATH',
      'canonicalUrl': 'CANONICAL_URL',
      'clientId': 'CLIENT_ID',
      'contentLoadTime': 'CONTENT_LOAD_TIME',
      'documentCharset': 'DOCUMENT_CHARSET',
      'documentReferrer': 'DOCUMENT_REFERRER',
      'domainLookupTime': 'DOMAIN_LOOKUP_TIME',
      'domInteractiveTime': 'DOM_INTERACTIVE_TIME',
      'navRedirectCount': 'NAV_REDIRECT_COUNT',
      'navTiming': 'NAV_TIMING',
      'navType': 'NAV_TYPE',
      'pageDownloadTime': 'PAGE_DOWNLOAD_TIME',
      'pageLoadTime': 'PAGE_LOAD_TIME',
      'pageViewId': 'PAGE_VIEW_ID',
      'queryParam': 'QUERY_PARAM',
      'random': 'RANDOM',
      'redirectTime': 'REDIRECT_TIME',
      'screenColorDepth': 'SCREEN_COLOR_DEPTH',
      'screenHeight': 'SCREEN_HEIGHT',
      'screenWidth': 'SCREEN_WIDTH',
      'scrollHeight': 'SCROLL_HEIGHT',
      'scrollLeft': 'SCROLL_LEFT',
      'scrollTop': 'SCROLL_TOP',
      'scrollWidth': 'SCROLL_WIDTH',
      'serverResponseTime': 'SERVER_RESPONSE_TIME',
      'sourceUrl': 'SOURCE_URL',
      'sourceHost': 'SOURCE_HOST',
      'sourcePath': 'SOURCE_PATH',
      'tcpConnectTime': 'TCP_CONNECT_TIME',
      'timestamp': 'TIMESTAMP',
      'timezone': 'TIMEZONE',
      'title': 'TITLE',
      'totalEngagedTime': 'TOTAL_ENGAGED_TIME',
      'viewer': 'VIEWER',
      'viewportHeight': 'VIEWPORT_HEIGHT',
      'viewportWidth': 'VIEWPORT_WIDTH'
    }
  },

  'atinternet': {
    'transport': { 'beacon': false, 'xhrpost': false, 'image': true },
    'requests': {
      'base': 'https://${log}${domain}/hit.xiti?s=${site}&ts=${timestamp}&r=${screenWidth}x${screenHeight}x${screenColorDepth}&re=${availableScreenWidth}x${availableScreenHeight}',
      'suffix': '&ref=${documentReferrer}',
      'pageview': '${base}&' + 'p=${title}&' + 's2=${level2}${suffix}',
      'click': '${base}&' + 'pclick=${title}&' + 's2click=${level2}&' + 'p=${label}&' + 's2=${level2Click}&' + 'type=click&click=${type}${suffix}'
    }
  },

  'burt': {
    'vars': {
      'trackingKey': 'ignore',
      'category': '',
      'subCategory': ''
    },
    'requests': {
      'host': '//${trackingKey}.c.richmetrics.com/',
      'base': '${host}imglog?' + 'e=${trackingKey}&' + 'pi=${trackingKey}' + '|${pageViewId}' + '|${canonicalPath}' + '|${clientId(burt-amp-user-id)}&' + 'ui=${clientId(burt-amp-user-id)}&' + 'v=amp&' + 'ts=${timestamp}&' + 'sn=${requestCount}&',
      'pageview': '${base}' + 'type=page&' + 'ca=${category}&' + 'sc=${subCategory}&' + 'ln=${browserLanguage}&' + 'lr=${documentReferrer}&' + 'eu=${sourceUrl}&' + 'tz=${timezone}&' + 'pd=${scrollWidth}x${scrollHeight}&' + 'sd=${screenWidth}x${screenHeight}&' + 'wd=${availableScreenWidth}x${availableScreenHeight}&' + 'ws=${scrollLeft}x${scrollTop}',
      'pageping': '${base}' + 'type=pageping'
    },
    'triggers': {
      'pageview': {
        'on': 'visible',
        'request': 'pageview'
      },
      'pageping': {
        'on': 'timer',
        'timerSpec': {
          'interval': 15,
          'max-timer-length': 1200
        },
        'request': 'pageping'
      }
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'chartbeat': {
    'requests': {
      'host': 'https://ping.chartbeat.net',
      'basePrefix': '/ping?h=${domain}&' + 'p=${canonicalPath}&' + 'u=${clientId(_cb)}&' + 'd=${canonicalHost}&' + 'g=${uid}&' + 'g0=${sections}&' + 'g1=${authors}&' + 'g2=${zone}&' + 'g3=${sponsorName}&' + 'g4=${contentType}&' + 'c=120&' + 'x=${scrollTop}&' + 'y=${scrollHeight}&' + 'j=${decayTime}&' + 'R=1&' + 'W=0&' + 'I=0&' + 'E=${totalEngagedTime}&' + 'r=${documentReferrer}&' + 't=${pageViewId}${clientId(_cb)}&' + 'b=${pageLoadTime}&' + 'i=${title}&' + 'T=${timestamp}&' + 'tz=${timezone}&' + 'C=2',
      'baseSuffix': '&_',
      'interval': '${host}${basePrefix}${baseSuffix}',
      'anchorClick': '${host}${basePrefix}${baseSuffix}'
    },
    'triggers': {
      'trackInterval': {
        'on': 'timer',
        'timerSpec': {
          'interval': 15,
          'maxTimerLength': 7200
        },
        'request': 'interval',
        'vars': {
          'decayTime': 30
        }
      },
      'trackAnchorClick': {
        'on': 'click',
        'selector': 'a',
        'request': 'anchorClick',
        'vars': {
          'decayTime': 30
        }
      }
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'colanalytics': {
    'requests': {
      'host': 'https://ase.clmbtech.com',
      'base': '${host}/message',
      'pageview': '${base}?cid=${id}' + '&val_101=${canonicalPath}' + '&ch=${canonicalHost}' + '&uuid=${uid}' + '&au=${authors}' + '&zo=${zone}' + '&sn=${sponsorName}' + '&ct=${contentType}' + '&st=${scrollTop}' + '&sh=${scrollHeight}' + '&dct=${decayTime}' + '&tet=${totalEngagedTime}' + '&dr=${documentReferrer}' + '&plt=${pageLoadTime}' + '&val_108=${title}'
    },
    'triggers': {
      'defaultPageview': {
        'on': 'visible',
        'request': 'pageview'
      }
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'comscore': {
    'vars': {
      'c2': '1000001'
    },
    'requests': {
      'host': 'https://sb.scorecardresearch.com',
      'base': '${host}/b?',
      'pageview': '${base}c1=2&c2=${c2}&rn=${random}&c8=${title}' + '&c7=${canonicalUrl}&c9=${documentReferrer}&cs_c7amp=${ampdocUrl}'
    },
    'triggers': {
      'defaultPageview': {
        'on': 'visible',
        'request': 'pageview'
      }
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'googleanalytics': {
    'vars': {
      'eventValue': '0',
      'documentLocation': 'SOURCE_URL',
      'clientId': 'CLIENT_ID(AMP_ECID_GOOGLE)'
    },
    'requests': {
      'host': 'https://www.google-analytics.com',
      'basePrefix': 'v=1&_v=a0&aip=true&_s=${requestCount}&' + 'dt=${title}&sr=${screenWidth}x${screenHeight}&_utmht=${timestamp}&' + 'jid=&cid=${clientId}&tid=${account}&dl=${documentLocation}&' + 'dr=${documentReferrer}&sd=${screenColorDepth}&' + 'ul=${browserLanguage}&de=${documentCharset}',
      'baseSuffix': '&a=${pageViewId}&z=${random}',
      'pageview': '${host}/r/collect?${basePrefix}&t=pageview&' + '_r=1${baseSuffix}',
      'event': '${host}/collect?${basePrefix}&t=event&' + 'ec=${eventCategory}&ea=${eventAction}&el=${eventLabel}&' + 'ev=${eventValue}${baseSuffix}',
      'social': '${host}/collect?${basePrefix}&t=social&' + 'sa=${socialAction}&sn=${socialNetwork}&st=${socialTarget}' + '${baseSuffix}',
      'timing': '${host}/collect?${basePrefix}&t=timing&plt=${pageLoadTime}&' + 'dns=${domainLookupTime}&tcp=${tcpConnectTime}&rrt=${redirectTime}&' + 'srt=${serverResponseTime}&pdt=${pageDownloadTime}&' + 'clt=${contentLoadTime}&dit=${domInteractiveTime}${baseSuffix}'
    },
    'extraUrlParamsReplaceMap': {
      'dimension': 'cd',
      'metric': 'cm'
    },
    'optout': '_gaUserPrefs.ioo'
  },

  'krux': {
    'requests': {
      'beaconHost': 'https://beacon.krxd.net',
      'timing': 't_navigation_type=0&' + 't_dns=${domainLookupTime}&' + 't_tcp=${tcpConnectTime}&' + 't_http_request=${serverResponseTime}&' + 't_http_response=${pageDownloadTime}&' + 't_content_ready=${contentLoadTime}&' + 't_window_load=${pageLoadTime}&' + 't_redirect=${redirectTime}',
      'common': 'source=amp&' + 'confid=${confid}&' + '_kpid=${pubid}&' + '_kcp_s=${site}&' + '_kcp_sc=${section}&' + '_kcp_ssc=${subsection}&' + '_kcp_d=${canonicalHost}&' + '_kpref_=${documentReferrer}&' + '_kua_kx_amp_client_id=${clientId(_kuid_)}&' + '_kua_kx_lang=${browserLanguage}&' + '_kua_kx_tech_browser_language=${browserLanguage}&' + '_kua_kx_tz=${timezone}',
      'pageview': '${beaconHost}/pixel.gif?${common}&${timing}',
      'event': '${beaconHost}/event.gif?${common}&${timing}&pageview=false'
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    },
    'extraUrlParamsReplaceMap': {
      'user.': '_kua_',
      'page.': '_kpa_'
    }
  },

  'lotame': {
    'requests': {
      'pageview': 'https://bcp.crwdcntrl.net/amp?c=${account}&pv=y'
    },
    'triggers': {
      'track pageview': {
        'on': 'visible',
        'request': 'pageview'
      }
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'mediametrie': {
    'requests': {
      'host': 'https://prof.estat.com/m/web',
      'pageview': '${host}/${serial}?' + 'c=${level1}' + '&dom=${ampdocUrl}' + '&enc=${documentCharset}' + '&l3=${level3}' + '&l4=${level4}' + '&n=${random}' + '&p=${level2}' + '&r=${documentReferrer}' + '&sch=${screenHeight}' + '&scw=${screenWidth}' + '&tn=amp' + '&v=1' + '&vh=${availableScreenHeight}' + '&vw=${availableScreenWidth}'
    },
    'triggers': {
      'trackPageview': {
        'on': 'visible',
        'request': 'pageview'
      }
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'parsely': {
    'requests': {
      'host': 'https://srv.pixel.parsely.com',
      'basePrefix': '${host}/plogger/?' + 'rand=${timestamp}&' + 'idsite=${apikey}&' + 'url=${ampdocUrl}&' + 'urlref=${documentReferrer}&' + 'screen=${screenWidth}x${screenHeight}%7C' + '${availableScreenWidth}x${availableScreenHeight}%7C' + '${screenColorDepth}&' + 'title=${title}&' + 'date=${timestamp}&' + 'ampid=${clientId(_parsely_visitor)}',
      'pageview': '${basePrefix}&action=pageview'
    },
    // TODO(#1612): client-side session support
    // TODO(#1296): active engaged time support
    // 'heartbeat': '${basePrefix}&action=heartbeat&inc=${engagedTime}'
    'triggers': {
      'defaultPageview': {
        'on': 'visible',
        'request': 'pageview'
      }
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'piano': {
    'requests': {
      'host': 'https://api-v3.tinypass.com',
      'basePrefix': '/api/v3',
      'baseSuffix': '&pageview_id=${pageViewId}&rand=${random}&' + 'amp_client_id=${clientId}&aid=${aid}',
      'pageview': '${host}${basePrefix}/page/track?url=${canonicalUrl}&' + 'referer=${documentReferrer}&content_created=${contentCreated}&' + 'content_author=${contentAuthor}&content_section=${contentSection}&' + 'timezone_offset=${timezone}&tags=${tags}&amp_url=${ampdocUrl}&' + 'screen=${screenWidth}x${screenHeight}${baseSuffix}'
    }
  },

  'quantcast': {
    'vars': {
      'labels': ''
    },
    'requests': {
      'host': 'https://pixel.quantserve.com/pixel',
      'pageview': '${host};r=${random};a=${pcode};labels=${labels};' + 'fpan=;fpa=${clientId(__qca)};ns=0;ce=1;cm=;je=0;' + 'sr=${screenWidth}x${screenHeight}x${screenColorDepth};' + 'enc=n;et=${timestamp};ref=${documentReferrer};url=${canonicalUrl}'
    },
    'triggers': {
      'defaultPageview': {
        'on': 'visible',
        'request': 'pageview'
      }
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'adobeanalytics': {
    'transport': { 'xhrpost': false, 'beacon': false, 'image': true },
    'vars': {
      'pageName': 'TITLE',
      'host': '',
      'reportSuites': '',
      'linkType': 'o',
      'linkUrl': '',
      'linkName': ''
    },
    'requests': {
      'requestPath': '/b/ss/${reportSuites}/0/amp-1.0/s${random}',
      // vid starts with z to work around #2198
      'basePrefix': 'vid=z${clientId(adobe_amp_id)}' + '&ndh=0' + '&ce=${documentCharset}' + '&pageName=${pageName}' + '&g=${ampdocUrl}' + '&r=${documentReferrer}' + '&bh=${availableScreenHeight}' + '&bw=${availableScreenWidth}' + '&c=${screenColorDepth}' + '&j=amp' + '&s=${screenWidth}x${screenHeight}',
      'pageview': 'https://${host}${requestPath}?${basePrefix}',
      'click': 'https://${host}${requestPath}?${basePrefix}&pe=lnk_${linkType}&pev1=${linkUrl}&pev2=${linkName}'
    }
  },

  'adobeanalytics_nativeConfig': {
    'triggers': {
      'pageLoad': {
        'on': 'visible',
        'request': 'iframeMessage'
      }
    }
  },

  'infonline': {
    'vars': {
      'sv': 'ke',
      'ap': '1'
    },
    'transport': { 'beacon': false, 'xhrpost': false, 'image': true },
    'requests': {
      'pageview': '${url}?st=${st}' + '&sv=${sv}' + '&ap=${ap}' + '&co=${co}' + '&cp=${cp}' + '&host=${canonicalHost}' + '&path=${canonicalPath}'
    },
    'triggers': {
      'pageview': {
        'on': 'visible',
        'request': 'pageview'
      }
    }
  },

  'simplereach': {
    'vars': {
      'pid': '',
      'published_at': '',
      'authors': [],
      'channels': [],
      'tags': []
    },
    'requests': {
      'host': 'https://edge.simplereach.com',
      'baseParams': 'amp=true' + '&pid=${pid}' + '&title=${title}' + '&url=${canonicalUrl}' + '&date=${published_at}' + '&authors=${authors}' + '&channels=${categories}' + '&tags=${tags}' + '&referrer=${documentReferrer}' + '&page_url=${sourceUrl}' + '&user_id=${clientId(sr_amp_id)}' + '&domain=${canonicalHost}',
      'visible': '${host}/n?${baseParams}',
      'timer': '${host}/t?${baseParams}' + '&t=5000' + '&e=5000'
    },
    'triggers': {
      'visible': {
        'on': 'visible',
        'request': 'visible'
      },
      'timer': {
        'on': 'timer',
        'timerSpec': {
          'interval': 5,
          'max-timer-length': 1200
        },
        'request': 'timer'
      }
    }
  },

  'snowplow': {
    'requests': {
      'aaVersion': 'amp-0.1',
      'basePrefix': 'https://${collectorHost}/i?url=${canonicalUrl}&page=${title}&' + 'res=${screenWidth}x${screenHeight}&stm=${timestamp}&' + 'tz=${timezone}&aid=${appId}&p=web&tv=${aaVersion}',
      'pageView': '${basePrefix}&e=pv',
      'structEvent': '${basePrefix}&e=se&' + 'se_ca=${structEventCategory}&se_ac=${structEventAction}&' + 'se_la=${structEventLabel}&se_pr=${structEventProperty}&' + 'se_va=${structEventValue}'
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'webtrekk': {
    'requests': {
      'trackURL': 'https://${trackDomain}/${trackId}/wt',
      'parameterPrefix': '?p=431,${contentId},1,' + '${screenWidth}x${screenHeight},${screenColorDepth},' + '${documentReferrer},${timestamp},0,,0&tz=${timezone}' + '&eid=${clientId(amp-wt3-eid)}&la=${browserLanguage}',
      'parameterSuffix': '&pu=${canonicalUrl}',
      'pageParameter': '&cp1=${pageParameter1}' + '&cp2=${pageParameter2}&cp3=${pageParameter3}' + '&cp4=${pageParameter4}&cp5=${pageParameter5}' + '&cp6=${pageParameter6}&cp7=${pageParameter7}' + '&cp8=${pageParameter8}&cp9=${pageParameter9}' + '&cp10=${pageParameter10}',
      'pageCategories': '&cg1=${pageCategory1}' + '&cg2=${pageCategory2}&cg3=${pageCategory3}' + '&cg4=${pageCategory4}&cg5=${pageCategory5}' + '&cg6=${pageCategory6}&cg7=${pageCategory7}' + '&cg8=${pageCategory8}&cg9=${pageCategory9}' + '&cg10=${pageCategory10}',
      'pageview': '${trackURL}${parameterPrefix}${pageParameter}' + '${pageCategories}${parameterSuffix}',
      'actionParameter': '&ck1=${actionParameter1}' + '&ck2=${actionParameter2}&ck3=${actionParameter3}' + '&ck4=${actionParameter4}&ck5=${actionParameter5}',
      'event': '${trackURL}${parameterPrefix}&ct=${actionName}' + '${actionParameter}${parameterSuffix}'
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  },

  'mpulse': {
    'requests': {
      'onvisible': 'https://${beacon_url}?' + 'h.d=${h.d}' + '&h.key=${h.key}' + '&h.t=${h.t}' + '&h.cr=${h.cr}' + '&rt.start=navigation' + '&rt.si=${clientId(amp_mpulse)}' + '&rt.ss=${timestamp}' + '&rt.end=${timestamp}' + '&t_resp=${navTiming(navigationStart,responseStart)}' + '&t_page=${navTiming(responseStart,loadEventStart)}' + '&t_done=${navTiming(navigationStart,loadEventStart)}' + '&nt_nav_type=${navType}' + '&nt_red_cnt=${navRedirectCount}' + '&nt_nav_st=${navTiming(navigationStart)}' + '&nt_red_st=${navTiming(redirectStart)}' + '&nt_red_end=${navTiming(redirectEnd)}' + '&nt_fet_st=${navTiming(fetchStart)}' + '&nt_dns_st=${navTiming(domainLookupStart)}' + '&nt_dns_end=${navTiming(domainLookupEnd)}' + '&nt_con_st=${navTiming(connectStart)}' + '&nt_ssl_st=${navTiming(secureConnectionStart)}' + '&nt_con_end=${navTiming(connectEnd)}' + '&nt_req_st=${navTiming(requestStart)}' + '&nt_res_st=${navTiming(responseStart)}' + '&nt_unload_st=${navTiming(unloadEventStart)}' + '&nt_unload_end=${navTiming(unloadEventEnd)}' + '&nt_domloading=${navTiming(domLoading)}' + '&nt_res_end=${navTiming(responseEnd)}' + '&nt_domint=${navTiming(domInteractive)}' + '&nt_domcontloaded_st=${navTiming(domContentLoadedEventStart)}' + '&nt_domcontloaded_end=${navTiming(domContentLoadedEventEnd)}' + '&nt_domcomp=${navTiming(domComplete)}' + '&nt_load_st=${navTiming(loadEventStart)}' + '&nt_load_end=${navTiming(loadEventEnd)}' + '&v=1' + '&http.initiator=amp' + '&u=${sourceUrl}' + '&amp.u=${ampdocUrl}' + '&r2=${documentReferrer}' + '&scr.xy=${screenWidth}x${screenHeight}'
    },

    'triggers': {
      'onvisible': {
        'on': 'visible',
        'request': 'onvisible'
      }
    },

    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    },

    'extraUrlParamsReplaceMap': {
      'ab_test': 'h.ab',
      'page_group': 'h.pg',
      'custom_dimension.': 'cdim.',
      'custom_metric.': 'cmet.'
    }
  },

  'linkpulse': {
    'vars': {
      'id': '',
      'pageUrl': 'CANONICAL_URL',
      'title': 'TITLE',
      'section': '',
      'channel': 'amp',
      'type': '',
      'host': 'pp.lp4.io',
      'empty': ''
    },
    'requests': {
      'base': 'https://${host}',
      'pageview': '${base}/p?i=${id}' + '&r=${documentReferrer}' + '&p=${pageUrl}' + '&s=${section}' + '&t=${type}' + '&c=${channel}' + '&mt=${title}' + '&_t=amp' + '&_r=${random}',
      'pageload': '${base}/pl?i=${id}' + '&ct=${domInteractiveTime}' + '&rt=${pageDownloadTime}' + '&pt=${pageLoadTime}' + '&p=${pageUrl}' + '&c=${channel}' + '&t=${type}' + '&s=${section}' + '&_t=amp' + '&_r=${random}',
      'ping': '${base}/u?i=${id}' + '&u=${clientId(_lp4_u)}' + '&p=${pageUrl}' + '&uActive=true' + '&isPing=yes' + '&c=${channel}' + '&t=${type}' + '&s=${section}' + '&_t=amp' + '&_r=${random}'
    },
    'triggers': {
      'pageview': {
        'on': 'visible',
        'request': 'pageview'
      },
      'pageload': {
        'on': 'visible',
        'request': 'pageload'
      },
      'ping': {
        'on': 'timer',
        'timerSpec': {
          'interval': 30,
          'maxTimerLength': 7200
        },
        'request': 'ping'

      }
    },
    'transport': {
      'beacon': false,
      'xhrpost': false,
      'image': true
    }
  }
};
exports.ANALYTICS_CONFIG = ANALYTICS_CONFIG;
ANALYTICS_CONFIG['infonline']['triggers']['pageview']['iframe' +
/* TEMPORARY EXCEPTION */'Ping'] = true;

ANALYTICS_CONFIG['adobeanalytics_nativeConfig']['triggers']['pageLoad']['iframe' +
/* TEMPORARY EXCEPTION */'Ping'] = true;

},{}],8:[function(require,module,exports){
exports.__esModule = true;
exports.isPositiveNumber_ = isPositiveNumber_;
exports.isValidPercentage_ = isValidPercentage_;
exports.isVisibilitySpecValid = isVisibilitySpecValid;
exports.installVisibilityService = installVisibilityService;
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

var _srcLog = require('../../../src/log');

var _srcService = require('../../../src/service');

var _srcResources = require('../../../src/resources');

var _srcTimer = require('../../../src/timer');

var _srcViewport = require('../../../src/viewport');

/** @const {number} */
var LISTENER_INITIAL_RUN_DELAY_ = 20;

// Variables that are passed to the callback.
var MAX_CONTINUOUS_TIME = 'maxContinuousTime';
var TOTAL_TIME = 'totalVisibleTime';
var FIRST_SEEN_TIME = 'firstSeenTime';
var LAST_SEEN_TIME = 'lastSeenTime';
var FIRST_VISIBLE_TIME = 'fistVisibleTime';
var LAST_VISIBLE_TIME = 'lastVisibleTime';
var MIN_VISIBLE = 'minVisiblePercentage';
var MAX_VISIBLE = 'maxVisiblePercentage';

// Variables that are not exposed outside this class.
var CONTINUOUS_TIME = 'cT';
var LAST_UPDATE = 'lU';
var IN_VIEWPORT = 'iV';
var TIME_LOADED = 'tL';

// Keys used in VisibilitySpec
var CONTINUOUS_TIME_MAX = 'continuousTimeMax';
var CONTINUOUS_TIME_MIN = 'continuousTimeMin';
var TOTAL_TIME_MAX = 'totalTimeMax';
var TOTAL_TIME_MIN = 'totalTimeMin';
var VISIBLE_PERCENTAGE_MIN = 'visiblePercentageMin';
var VISIBLE_PERCENTAGE_MAX = 'visiblePercentageMax';

/**
 * Checks if the value is undefined or positive number like.
 * "", 1, 0, undefined, 100, 101 are positive. -1, NaN are not.
 *
 * Visible for testing.
 *
 * @param {number} num The number to verify.
 * @return {boolean}
 * @private
 */

function isPositiveNumber_(num) {
  return num === undefined || Math.sign(num) >= 0;
}

/**
 * Checks if the value is undefined or a number between 0 and 100.
 * "", 1, 0, undefined, 100 return true. -1, NaN and 101 return false.
 *
 * Visible for testing.
 *
 * @param {number} num The number to verify.
 * @return {boolean}
 */

function isValidPercentage_(num) {
  return num === undefined || Math.sign(num) >= 0 && num <= 100;
}

/**
 * Checks and outputs information about visibilitySpecValidation.
 * @param {!JSONObject} config Configuration for instrumentation.
 * @return {boolean} True if the spec is valid.
 * @private
 */

function isVisibilitySpecValid(config) {
  if (!config['visibilitySpec']) {
    return true;
  }

  var spec = config['visibilitySpec'];
  if (!spec['selector'] || spec['selector'][0] != '#') {
    _srcLog.user.error('Visibility spec requires an id selector');
    return false;
  }

  var ctMax = spec[CONTINUOUS_TIME_MAX];
  var ctMin = spec[CONTINUOUS_TIME_MIN];
  var ttMax = spec[TOTAL_TIME_MAX];
  var ttMin = spec[TOTAL_TIME_MIN];

  if (!isPositiveNumber_(ctMin) || !isPositiveNumber_(ctMax) || !isPositiveNumber_(ttMin) || !isPositiveNumber_(ttMax)) {
    _srcLog.user.error('Timing conditions should be positive integers when specified.');
    return false;
  }

  if ((ctMax || ttMax) && !spec['unload']) {
    _srcLog.user.warn('Unload condition should be used when using ' + ' totalTimeMax or continuousTimeMax');
    return false;
  }

  if (ctMax < ctMin || ttMax < ttMin) {
    _srcLog.user.warn('Max value in timing conditions should be more ' + 'than the min value.');
    return false;
  }

  if (!isValidPercentage_(spec[VISIBLE_PERCENTAGE_MAX]) || !isValidPercentage_(spec[VISIBLE_PERCENTAGE_MIN])) {
    _srcLog.user.error('visiblePercentage conditions should be between 0 and 100.');
    return false;
  }

  if (spec[VISIBLE_PERCENTAGE_MAX] < spec[VISIBLE_PERCENTAGE_MIN]) {
    _srcLog.user.error('visiblePercentageMax should be greater than ' + 'visiblePercentageMin');
    return false;
  }
  return true;
}

/**
 * This type signifies a callback that gets called when visibility conditions
 * are met.
 * @typedef {function()}
 */
var VisibilityListenerCallbackDef = undefined;

/**
 * @typedef {Object<string, JSONObject|VisibilityListenerCallbackDef|Object>}
 */
var VisibilityListenerDef = undefined;

/**
 * Allows tracking of AMP elements in the viewport.
 *
 * This class allows a caller to specify conditions to evaluate when an element
 * is in viewport and for how long. If the conditions are satisfied, a provided
 * callback is called.
 */

var Visibility = (function () {

  /** @param {!Window} */

  function Visibility(win) {
    babelHelpers.classCallCheck(this, Visibility);

    this.win_ = win;

    /**
     * key: resource id.
     * value: [{ config: <config>, callback: <callback>, state: <state>}]
     * @type {Object<string, Array.<VisibilityListenerDef>>}
     * @private
     */
    this.listeners_ = Object.create(null);

    /** @private {Array<!Resource>} */
    this.resources_ = [];

    /** @private @const {function} */
    this.boundScrollListener_ = this.scrollListener_.bind(this);

    /** @private {boolean} */
    this.scrollListenerRegistered_ = false;

    /** @private {!Resources} */
    this.resourcesService_ = _srcResources.resourcesFor(this.win_);

    /** @private {number|string} */
    this.scheduledRunId_ = null;

    /** @private {number} Amount of time to wait for next calculation. */
    this.timeToWait_ = Infinity;

    /** @private {boolean} */
    this.scheduledLoadedPromises_ = false;
  }

  /**
   * @param  {!Window} win
   * @return {!Visibility}
   */

  /** @private */

  Visibility.prototype.registerForViewportEvents_ = function registerForViewportEvents_() {
    if (!this.scrollListenerRegistered__) {
      var viewport = _srcViewport.viewportFor(this.win_);

      // Currently unlistens are not being used. In the event that no resources
      // are actively being monitored, the scrollListener should be very cheap.
      viewport.onScroll(this.boundScrollListener_);
      viewport.onChanged(this.boundScrollListener_);
      this.scrollListenerRegistered_ = true;
    }
  };

  /**
   * @param {!JSONObject} config
   * @param {!VisibilityListenerCallbackDef} callback
   */

  Visibility.prototype.listenOnce = function listenOnce(config, callback) {
    var _state,
        _this = this;

    var element = this.win_.document.getElementById(config['selector'].slice(1));
    var res = this.resourcesService_.getResourceForElement(element);
    var resId = res.getId();

    this.registerForViewportEvents_();

    this.listeners_[resId] = this.listeners_[resId] || [];
    this.listeners_[resId].push({
      config: config,
      callback: callback,
      state: (_state = {}, _state[TIME_LOADED] = Date.now(), _state)
    });
    this.resources_.push(res);

    if (this.scheduledRunId_ == null) {
      this.scheduledRunId_ = _srcTimer.timer.delay(function () {
        _this.scrollListener_();
      }, LISTENER_INITIAL_RUN_DELAY_);
    }
  };

  /** @private */

  Visibility.prototype.scrollListener_ = function scrollListener_() {
    var _this2 = this;

    if (this.scheduledRunId_ != null) {
      _srcTimer.timer.cancel(this.scheduledRunId_);
      this.scheduledRunId_ = null;
    }

    this.timeToWait = Infinity;
    var loadedPromises = [];

    for (var r = this.resources_.length - 1; r >= 0; r--) {
      var res = this.resources_[r];
      if (res.isLayoutPending()) {
        loadedPromises.push(res.loaded());
        continue;
      }

      var change = res.element.getIntersectionChangeEntry();
      var ir = change.intersectionRect;
      var br = change.boundingClientRect;
      var visible = ir.width * ir.height * 100 / (br.height * br.width);

      var listeners = this.listeners_[res.getId()];
      for (var c = listeners.length - 1; c >= 0; c--) {
        if (this.updateCounters_(visible, listeners[c])) {

          // Remove the state that need not be public and call callback.
          delete listeners[c]['state'][CONTINUOUS_TIME];
          delete listeners[c]['state'][LAST_UPDATE];
          delete listeners[c]['state'][IN_VIEWPORT];
          listeners[c].callback(listeners[c]['state']);
          listeners.splice(c, 1);
        }
      }

      // Remove resources that have no listeners.
      if (listeners.length == 0) {
        this.resources_.splice(r, 1);
      }
    }

    // Schedule a calculation for the time when one of the conditions is
    // expected to be satisfied.
    if (this.scheduledRunId_ == null && this.timeToWait_ < Infinity && this.timeToWait_ > 0) {
      this.scheduledRunId_ = _srcTimer.timer.delay(function () {
        _this2.scrollListener_();
      }, this.timeToWait_);
    }

    // Schedule a calculation for when a resource gets loaded.
    if (loadedPromises.length > 0 && !this.scheduledLoadedPromises_) {
      Promise.race(loadedPromises).then(function () {
        _this2.scheduledLoadedPromises_ = false;
        _this2.scrollListener_();
      });
      this.scheduledLoadedPromises_ = true;
    }
  };

  /**
   * Updates counters for a given listener.
   * @return {boolean} true if all visibility conditions are satisfied
   * @private
   */

  Visibility.prototype.updateCounters_ = function updateCounters_(visible, listener) {
    var config = listener['config'];
    var state = listener['state'] || {};

    if (visible > 0) {
      state[FIRST_SEEN_TIME] = state[FIRST_SEEN_TIME] || Date.now() - state[TIME_LOADED];
      state[LAST_SEEN_TIME] = Date.now() - state[TIME_LOADED];
    }

    var wasInViewport = state[IN_VIEWPORT];
    var timeSinceLastUpdate = Date.now() - state[LAST_UPDATE];
    state[IN_VIEWPORT] = this.isInViewport_(visible, config[VISIBLE_PERCENTAGE_MIN], config[VISIBLE_PERCENTAGE_MAX]);

    if (!state[IN_VIEWPORT] && !wasInViewport) {
      return; // Nothing changed.
    } else if (!state[IN_VIEWPORT] && wasInViewport) {
        // The resource went out of view. Do final calculations and reset state.
        _srcLog.dev.assert(state[LAST_UPDATE] > 0, 'lastUpdated time in weird state.');

        state[MAX_CONTINUOUS_TIME] = Math.max(state[MAX_CONTINUOUS_TIME], state[CONTINUOUS_TIME] + timeSinceLastUpdate);

        state[LAST_UPDATE] = -1;
        state[TOTAL_TIME] += timeSinceLastUpdate;
        state[CONTINUOUS_TIME] = 0; // Clear only after max is calculated above.
        state[LAST_VISIBLE_TIME] = Date.now() - state[TIME_LOADED];
      } else if (state[IN_VIEWPORT] && !wasInViewport) {
        // The resource came into view. start counting.
        _srcLog.dev.assert(state[LAST_UPDATE] == undefined || state[LAST_UPDATE] == -1, 'lastUpdated time in weird state.');
        state[FIRST_VISIBLE_TIME] = state[FIRST_VISIBLE_TIME] || Date.now() - state[TIME_LOADED];
        this.setState_(state, visible, 0);
      } else {
        // Keep counting.
        this.setState_(state, visible, timeSinceLastUpdate);
      }

    var waitForContinuousTime = config[CONTINUOUS_TIME_MIN] ? config[CONTINUOUS_TIME_MIN] - state[CONTINUOUS_TIME] : Infinity;
    var waitForTotalTime = config[TOTAL_TIME_MIN] ? config[TOTAL_TIME_MIN] - state[TOTAL_TIME] : Infinity;

    // Wait for minimum of (previous timeToWait, positive values of
    // waitForContinuousTime and waitForTotalTime).
    this.timeToWait_ = Math.min(this.timeToWait, waitForContinuousTime > 0 ? waitForContinuousTime : Infinity, waitForTotalTime > 0 ? waitForTotalTime : Infinity);
    listener['state'] = state;
    return state[IN_VIEWPORT] && (config[TOTAL_TIME_MIN] === undefined || state[TOTAL_TIME] >= config[TOTAL_TIME_MIN]) && (config[TOTAL_TIME_MAX] === undefined || state[TOTAL_TIME] <= config[TOTAL_TIME_MAX]) && (config[CONTINUOUS_TIME_MIN] === undefined || state[CONTINUOUS_TIME] >= config[CONTINUOUS_TIME_MIN]) && (config[CONTINUOUS_TIME_MAX] === undefined || state[CONTINUOUS_TIME] <= config[CONTINUOUS_TIME_MAX]);
  };

  /**
   * For the purposes of these calculations, a resource is in viewport if the
   * visbility conditions are satisfied or they are not defined.
   * @param {!number} visible Percentage of element visible
   * @param {number} min Lower bound of visibility condition. Not inclusive
   * @param {number} max Upper bound of visibility condition. Inclusive.
   * @return {boolean} true if the conditions are satisfied.
   * @private
   */

  Visibility.prototype.isInViewport_ = function isInViewport_(visible, min, max) {
    if (min === undefined && max === undefined) {
      return true;
    }

    if (visible > (min || 0) && visible <= (max || 100)) {
      // (Min, Max]
      return true;
    }
    return false;
  };

  /** @private */

  Visibility.prototype.setState_ = function setState_(s, visible, sinceLast) {
    s[LAST_UPDATE] = Date.now();
    s[TOTAL_TIME] = s[TOTAL_TIME] !== undefined ? s[TOTAL_TIME] + sinceLast : 0;
    s[CONTINUOUS_TIME] = s[CONTINUOUS_TIME] !== undefined ? s[CONTINUOUS_TIME] + sinceLast : 0;
    s[MAX_CONTINUOUS_TIME] = s[MAX_CONTINUOUS_TIME] !== undefined ? Math.max(s[MAX_CONTINUOUS_TIME], s[CONTINUOUS_TIME]) : 0;
    s[MIN_VISIBLE] = s[MIN_VISIBLE] ? Math.min(s[MIN_VISIBLE], visible) : 101;
    s[MAX_VISIBLE] = s[MAX_VISIBLE] ? Math.max(s[MAX_VISIBLE], visible) : -1;
    s[LAST_VISIBLE_TIME] = Date.now() - s[TIME_LOADED];
  };

  return Visibility;
})();

exports.Visibility = Visibility;

function installVisibilityService(win) {
  return _srcService.getService(win, 'visibility', function () {
    return new Visibility(win);
  });
}

;

},{"../../../src/log":17,"../../../src/resources":24,"../../../src/service":25,"../../../src/timer":28,"../../../src/viewport":34}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
exports.__esModule = true;
exports.getCookie = getCookie;
exports.setCookie = setCookie;
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
 * Returns the value of the cookie. The cookie access is restricted and must
 * go through the privacy review. Before using this method please file a
 * GitHub issue with "Privacy Review" label.
 *
 * Returns the cookie's value or `null`.
 *
 * @param {!Window} win
 * @param {string} name
 * @return {?string}
 */

function getCookie(win, name) {
  var cookieString = undefined;
  try {
    cookieString = win.document.cookie;
  } catch (ignore) {
    // Act as if no cookie is available. Exceptions can be thrown when
    // AMP docs are opened on origins that do not allow setting
    // cookies such as null origins.
  }
  if (!cookieString) {
    return null;
  }
  var cookies = cookieString.split(';');
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    var eq = cookie.indexOf('=');
    if (eq == -1) {
      continue;
    }
    if (decodeURIComponent(cookie.substring(0, eq).trim()) == name) {
      return decodeURIComponent(cookie.substring(eq + 1).trim());
    }
  }
  return null;
}

/**
 * Sets the value of the cookie. The cookie access is restricted and must
 * go through the privacy review. Before using this method please file a
 * GitHub issue with "Privacy Review" label.
 *
 * @param {!Window} win
 * @param {string} name
 * @param {string} value
 * @param {time} expirationTime
 * @param {{highestAvailableDomain:boolean}=} opt_options
 *     - highestAvailableDomain: If true, set the cookie at the widest domain
 *       scope allowed by the browser. E.g. on example.com if we are currently
 *       on www.example.com.
 */

function setCookie(win, name, value, expirationTime, opt_options) {
  if (opt_options && opt_options.highestAvailableDomain) {
    var parts = win.location.hostname.split('.');
    var domain = parts[parts.length - 1];
    for (var i = parts.length - 2; i >= 0; i--) {
      domain = parts[i] + '.' + domain;
      trySetCookie(win, name, value, expirationTime, domain);
      if (getCookie(win, name) == value) {
        return;
      }
    }
  }
  trySetCookie(win, name, value, expirationTime, undefined);
}

/**
 * Attempt to set a cookie with the given params.
 *
 * @param {!Window} win
 * @param {string} name
 * @param {string} value
 * @param {time} expirationTime
 * @param {string|undefined} domain
 */
function trySetCookie(win, name, value, expirationTime, domain) {
  // We do not allow setting cookies on the domain that contains both
  // the cdn. and www. hosts.
  if (domain == 'ampproject.org') {
    // Actively delete them.
    value = 'delete';
    expirationTime = 0;
  }
  var cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + '; path=/' + (domain ? '; domain=' + domain : '') + '; expires=' + new Date(expirationTime).toUTCString();
  try {
    win.document.cookie = cookie;
  } catch (ignore) {
    // Do not throw if setting the cookie failed Exceptions can be thrown
    // when AMP docs are opened on origins that do not allow setting
    // cookies such as null origins.
  };
}

},{}],12:[function(require,module,exports){
exports.__esModule = true;
exports.waitForChild = waitForChild;
exports.waitForBody = waitForBody;
exports.waitForBodyPromise = waitForBodyPromise;
exports.documentContains = documentContains;
exports.documentContainsPolyfillInternal_ = documentContainsPolyfillInternal_;
exports.removeElement = removeElement;
exports.removeChildren = removeChildren;
exports.copyChildren = copyChildren;
exports.closest = closest;
exports.closestByTag = closestByTag;
exports.elementByTag = elementByTag;
exports.childElement = childElement;
exports.childElements = childElements;
exports.lastChildElement = lastChildElement;
exports.childNodes = childNodes;
exports.setScopeSelectorSupportedForTesting = setScopeSelectorSupportedForTesting;
exports.childElementByAttr = childElementByAttr;
exports.lastChildElementByAttr = lastChildElementByAttr;
exports.childElementsByAttr = childElementsByAttr;
exports.childElementByTag = childElementByTag;
exports.getDataParamsFromAttributes = getDataParamsFromAttributes;
exports.hasNextNodeInDocumentOrder = hasNextNodeInDocumentOrder;
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

var _string = require('./string');

/**
 * Waits until the child element is constructed. Once the child is found, the
 * callback is executed.
 * @param {!Element} parent
 * @param {function(!Element):boolean} checkFunc
 * @param {function()} callback
 */

function waitForChild(parent, checkFunc, callback) {
  if (checkFunc(parent)) {
    callback();
    return;
  }
  var win = parent.ownerDocument.defaultView;
  if (win.MutationObserver) {
    (function () {
      var observer = new win.MutationObserver(function () {
        if (checkFunc(parent)) {
          observer.disconnect();
          callback();
        }
      });
      observer.observe(parent, { childList: true });
    })();
  } else {
    (function () {
      var interval = win.setInterval(function () {
        if (checkFunc(parent)) {
          win.clearInterval(interval);
          callback();
        }
      }, /* milliseconds */5);
    })();
  }
}

/**
 * Waits for document's body to be available.
 * @param {!Document} doc
 * @param {function()} callback
 */

function waitForBody(doc, callback) {
  waitForChild(doc.documentElement, function () {
    return !!doc.body;
  }, callback);
}

/**
 * Waits for document's body to be available.
 * @param {!Document} doc
 * @return {!Promise}
 */

function waitForBodyPromise(doc) {
  return new Promise(function (resolve) {
    waitForBody(doc, resolve);
  });
}

/**
 * Whether the element is currently contained in the DOM. Polyfills
 * `document.contains()` method when necessary. Notice that according to spec
 * `document.contains` is inclusionary.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
 * @param {!Document} doc
 * @param {!Element} element
 * @return {boolean}
 */

function documentContains(doc, element) {
  if (!doc.contains) {
    return documentContainsPolyfillInternal_(doc, element);
  }
  return doc.contains(element);
}

/**
 * Polyfill for `document.contains()` method.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
 * @param {!Document} doc
 * @param {!Element} element
 * @return {boolean}
 * @private Visible for testing only.
 */

function documentContainsPolyfillInternal_(doc, element) {
  // Per spec, "contains" method is inclusionary
  // i.e. `node.contains(node) == true`. However, we still need to test
  // equality to the document itself.
  return element == doc || doc.documentElement.contains(element);
}

/**
 * Removes the element.
 * @param {!Element} element
 */

function removeElement(element) {
  if (element.parentElement) {
    element.parentElement.removeChild(element);
  }
}

/**
 * Removes all child nodes of the specified element.
 * @param {!Element} parent
 */

function removeChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

/**
 * Copies all children nodes of element "from" to element "to". Child nodes
 * are deeply cloned. Notice, that this method should be used with care and
 * preferably on smaller subtrees.
 * @param {!Element} from
 * @param {!Element} to
 */

function copyChildren(from, to) {
  var frag = to.ownerDocument.createDocumentFragment();
  for (var n = from.firstChild; n; n = n.nextSibling) {
    frag.appendChild(n.cloneNode(true));
  }
  to.appendChild(frag);
}

/**
 * Finds the closest element that satisfies the callback from this element
 * up the DOM subtree.
 * @param {!Element} element
 * @param {function(!Element):boolean} callback
 * @return {?Element}
 */

function closest(element, callback) {
  for (var el = element; el; el = el.parentElement) {
    if (callback(el)) {
      return el;
    }
  }
  return null;
}

/**
 * Finds the closest element with the specified name from this element
 * up the DOM subtree.
 * @param {!Element} element
 * @param {string} tagName
 * @return {?Element}
 */

function closestByTag(element, tagName) {
  if (element.closest) {
    return element.closest(tagName);
  }
  tagName = tagName.toUpperCase();
  return closest(element, function (el) {
    return el.tagName == tagName;
  });
}

/**
 * Finds the first descendant element with the specified name.
 * @param {!Element} element
 * @param {string} tagName
 * @return {?Element}
 */

function elementByTag(element, tagName) {
  var elements = element.getElementsByTagName(tagName);
  return elements[0] || null;
}

/**
 * Finds the first child element that satisfies the callback.
 * @param {!Element} parent
 * @param {function(!Element):boolean} callback
 * @return {?Element}
 */

function childElement(parent, callback) {
  for (var child = parent.firstElementChild; child; child = child.nextElementSibling) {
    if (callback(child)) {
      return child;
    }
  }
  return null;
}

/**
 * Finds all child elements that satisfies the callback.
 * @param {!Element} parent
 * @param {function(!Element):boolean} callback
 * @return {!Array.<!Element>}
 */

function childElements(parent, callback) {
  var children = [];
  for (var child = parent.firstElementChild; child; child = child.nextElementSibling) {
    if (callback(child)) {
      children.push(child);
    }
  }
  return children;
}

/**
 * Finds the last child element that satisfies the callback.
 * @param {!Element} parent
 * @param {function(!Element):boolean} callback
 * @return {?Element}
 */

function lastChildElement(parent, callback) {
  for (var child = parent.lastElementChild; child; child = child.previousElementSibling) {
    if (callback(child)) {
      return child;
    }
  }
  return null;
}

/**
 * Finds all child nodes that satisfies the callback.
 * These nodes can include Text, Comment and other child nodes.
 * @param {!Node} parent
 * @param {function(!Node):boolean} callback
 * @return {!Array<!Node>}
 */

function childNodes(parent, callback) {
  var nodes = [];
  for (var child = parent.firstChild; child; child = child.nextSibling) {
    if (callback(child)) {
      nodes.push(child);
    }
  }
  return nodes;
}

/**
 * @type {boolean|undefined}
 * @visiblefortesting
 */
var scopeSelectorSupported = undefined;

/**
 * @param {boolean|undefined} val
 * @visiblefortesting
 */

function setScopeSelectorSupportedForTesting(val) {
  scopeSelectorSupported = val;
}

/**
 * @param {!Element} parent
 * @return {boolean}
 */
function isScopeSelectorSupported(parent) {
  try {
    parent.ownerDocument.querySelector(':scope');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Finds the first child element that has the specified attribute.
 * @param {!Element} parent
 * @param {string} attr
 * @return {?Element}
 */

function childElementByAttr(parent, attr) {
  if (scopeSelectorSupported == null) {
    scopeSelectorSupported = isScopeSelectorSupported(parent);
  }
  if (scopeSelectorSupported) {
    return parent.querySelector(':scope > [' + attr + ']');
  }
  return childElement(parent, function (el) {
    return el.hasAttribute(attr);
  });
}

/**
 * Finds the last child element that has the specified attribute.
 * @param {!Element} parent
 * @param {string} attr
 * @return {?Element}
 */

function lastChildElementByAttr(parent, attr) {
  return lastChildElement(parent, function (el) {
    return el.hasAttribute(attr);
  });
}

/**
 * Finds all child elements that has the specified attribute.
 * @param {!Element} parent
 * @param {string} attr
 * @return {!Array.<!Element>}
 */

function childElementsByAttr(parent, attr) {
  if (scopeSelectorSupported == null) {
    scopeSelectorSupported = isScopeSelectorSupported(parent);
  }
  if (scopeSelectorSupported) {
    var nodeList = parent.querySelectorAll(':scope > [' + attr + ']');
    // Convert NodeList into Array.<Element>.
    var children = [];
    for (var i = 0; i < nodeList.length; i++) {
      children.push(nodeList[i]);
    }
    return children;
  }
  return childElements(parent, function (el) {
    return el.hasAttribute(attr);
  });
}

/**
 * Finds the first child element that has the specified tag name.
 * @param {!Element} parent
 * @param {string} tagName
 * @return {?Element}
 */

function childElementByTag(parent, tagName) {
  if (scopeSelectorSupported == null) {
    scopeSelectorSupported = isScopeSelectorSupported(parent);
  }
  if (scopeSelectorSupported) {
    return parent.querySelector(':scope > ' + tagName);
  }
  tagName = tagName.toUpperCase();
  return childElement(parent, function (el) {
    return el.tagName == tagName;
  });
}

/**
 * Returns element data-param- attributes as url parameters key-value pairs.
 * e.g. data-param-some-attr=value -> {someAttr: value}.
 * @param {!Element} element
 * @param {function(string):string} opt_computeParamNameFunc to compute the parameter
 *    name, get passed the camel-case parameter name.
 * @return {!Object<string, string>}
 */

function getDataParamsFromAttributes(element, opt_computeParamNameFunc) {
  var computeParamNameFunc = opt_computeParamNameFunc || function (key) {
    return key;
  };
  var attributes = element.attributes;
  var params = Object.create(null);
  for (var i = 0; i < attributes.length; i++) {
    var attr = attributes[i];
    var matches = attr.name.match(/^data-param-(.+)/);
    if (matches) {
      var param = _string.dashToCamelCase(matches[1]);
      params[computeParamNameFunc(param)] = attr.value;
    }
  }
  return params;
}

/**
 * Whether the element have a next node in the document order.
 * This means either:
 *  a. The element itself has a nextSibling.
 *  b. Any of the element ancestors has a nextSibling.
 * @param {!Element} element
 * @return {boolean}
 */

function hasNextNodeInDocumentOrder(element) {
  var currentElement = element;
  do {
    if (currentElement.nextSibling) {
      return true;
    }
  } while (currentElement = element.parentNode);
  return false;
}

},{"./string":26}],13:[function(require,module,exports){
exports.__esModule = true;
exports.getElementService = getElementService;
exports.getElementServiceIfAvailable = getElementServiceIfAvailable;
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

var _service = require('./service');

var _log = require('./log');

var _dom = require('./dom');

var dom = babelHelpers.interopRequireWildcard(_dom);

/**
 * Returns a promise for a service for the given id and window. Also expects
 * an element that has the actual implementation. The promise resolves when
 * the implementation loaded.
 * Users should typically wrap this as a special purpose function (e.g.
 * viewportFor(win)) for type safety and because the factory should not be
 * passed around.
 * @param {!Window} win
 * @param {string} id of the service.
 * @param {string} provideByElement Name of the custom element that provides
 *     the implementation of this service.
 * @return {!Promise<*>}
 */

function getElementService(win, id, providedByElement) {
  return getElementServiceIfAvailable(win, id, providedByElement).then(function (service) {
    return _log.user.assert(service, 'Service %s was requested to be provided through %s, ' + 'but %s is not loaded in the current page. To fix this ' + 'problem load the JavaScript file for %s in this page.', id, providedByElement, providedByElement, providedByElement);
  });
}

/**
 * Same as getElementService but produces null if the given element is not
 * actually available on the current page.
 * @param {!Window} win
 * @param {string} id of the service.
 * @param {string} provideByElement Name of the custom element that provides
 *     the implementation of this service.
 * @return {!Promise<*>}
 */

function getElementServiceIfAvailable(win, id, providedByElement) {
  var s = _service.getServicePromiseOrNull(win, id);
  if (s) {
    return s;
  }
  // Microtask is necessary to ensure that window.ampExtendedElements has been
  // initialized.
  return Promise.resolve().then(function () {
    if (isElementScheduled(win, providedByElement)) {
      return _service.getServicePromise(win, id);
    }
    // Wait for HEAD to fully form before denying access to the service.
    return dom.waitForBodyPromise(win.document).then(function () {
      if (isElementScheduled(win, providedByElement)) {
        return _service.getServicePromise(win, id);
      }
      return null;
    });
  });
}

/**
 * @param {!Window} win
 * @param {string} elementName Name of an extended custom element.
 * @return {boolean} Whether this element is scheduled to be loaded.
 */
function isElementScheduled(win, elementName) {
  // Set in custom-element.js
  _log.dev.assert(win.ampExtendedElements, 'win.ampExtendedElements not created yet');
  return !!win.ampExtendedElements[elementName];
}

},{"./dom":12,"./log":17,"./service":25}],14:[function(require,module,exports){
exports.__esModule = true;
exports.listen = listen;
exports.listenOnce = listenOnce;
exports.listenOncePromise = listenOncePromise;
exports.isLoaded = isLoaded;
exports.loadPromise = loadPromise;
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

var _log = require('./log');

/**
 * Listens for the specified event on the element.
 * @param {!EventTarget} element
 * @param {string} eventType
 * @param {function(Event)} listener
 * @param {boolean=} opt_capture
 * @return {!UnlistenDef}
 */

function listen(element, eventType, listener, opt_capture) {
  var capture = opt_capture || false;
  element.addEventListener(eventType, listener, capture);
  return function () {
    if (element) {
      element.removeEventListener(eventType, listener, capture);
    }
    listener = null;
    element = null;
  };
}

/**
 * Listens for the specified event on the element and removes the listener
 * as soon as event has been received.
 * @param {!EventTarget} element
 * @param {string} eventType
 * @param {function(Event)} listener
 * @param {boolean=} opt_capture
 * @return {!UnlistenDef}
 */

function listenOnce(element, eventType, listener, opt_capture) {
  var capture = opt_capture || false;
  var unlisten = undefined;
  var proxy = function (event) {
    listener(event);
    unlisten();
  };
  unlisten = function () {
    if (element) {
      element.removeEventListener(eventType, proxy, capture);
    }
    element = null;
    proxy = null;
  };
  element.addEventListener(eventType, proxy, capture);
  return unlisten;
}

/**
 * Returns  a promise that will resolve as soon as the specified event has
 * fired on the element. Optionally, opt_timeout can be specified that will
 * reject the promise if the event has not fired by then.
 * @param {!EventTarget} element
 * @param {string} eventType
 * @param {boolean=} opt_capture
 * @param {number=} opt_timeout
 * @return {!Promise<!Event>}
 */

function listenOncePromise(element, eventType, opt_capture, opt_timeout) {
  var unlisten = undefined;
  var eventPromise = new Promise(function (resolve, unusedReject) {
    unlisten = listenOnce(element, eventType, resolve, opt_capture);
  });
  return racePromise_(eventPromise, unlisten, opt_timeout);
}

/**
 * Whether the specified element has been loaded already.
 * @param {!Element} element
 * @return {boolean}
 */

function isLoaded(element) {
  return element.complete || element.readyState == 'complete';
}

/**
 * Returns a promise that will resolve or fail based on the element's 'load'
 * and 'error' events. Optionally this method takes a timeout, which will reject
 * the promise if the resource has not loaded by then.
 * @param {!Element} element
 * @param {number=} opt_timeout
 * @return {!Promise<!Element>}
 */

function loadPromise(element, opt_timeout) {
  var unlistenLoad = undefined;
  var unlistenError = undefined;
  var loadingPromise = new Promise(function (resolve, reject) {
    if (isLoaded(element)) {
      resolve(element);
    } else {
      // Listen once since IE 5/6/7 fire the onload event continuously for
      // animated GIFs.
      if (element.tagName === 'AUDIO' || element.tagName === 'VIDEO') {
        unlistenLoad = listenOnce(element, 'loadstart', function () {
          return resolve(element);
        });
      } else {
        unlistenLoad = listenOnce(element, 'load', function () {
          return resolve(element);
        });
      }
      unlistenError = listenOnce(element, 'error', function () {
        // Report failed loads as asserts so that they automatically go into
        // the "document error" bucket.
        reject(_log.user.createError('Failed HTTP request for %s.', element));
      });
    }
  });
  return racePromise_(loadingPromise, function () {
    // It's critical that all listeners are removed.
    if (unlistenLoad) {
      unlistenLoad();
    }
    if (unlistenError) {
      unlistenError();
    }
  }, opt_timeout);
}

/**
 * @param {!Promise<TYPE>} promise
 * @param {Unlisten|undefined} unlisten
 * @param {number|undefined} timeout
 * @return {!Promise<TYPE>}
 * @template TYPE
 */
function racePromise_(promise, unlisten, timeout) {
  var racePromise = undefined;
  if (timeout === undefined) {
    // Timeout is not specified: return promise.
    racePromise = promise;
  } else {
    // Timeout has been specified: add a timeout condition.
    racePromise = _timer.timer.timeoutPromise(timeout || 0, promise);
  }
  if (!unlisten) {
    return racePromise;
  }
  return racePromise.then(function (result) {
    unlisten();
    return result;
  }, function (reason) {
    unlisten();
    throw reason;
  });
}

},{"./log":17,"./timer":28}],15:[function(require,module,exports){
exports.__esModule = true;
exports.isDevChannel = isDevChannel;
exports.isDevChannelVersionDoNotUse_ = isDevChannelVersionDoNotUse_;
exports.isExperimentOn = isExperimentOn;
exports.toggleExperiment = toggleExperiment;
exports.resetExperimentToggles_ = resetExperimentToggles_;
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
 * @fileoverview Experiments system allows a developer to opt-in to test
 * features that are not yet fully tested.
 *
 * Experiments page: https://cdn.ampproject.org/experiments.html *
 */

var _cookies = require('./cookies');

var _timer = require('./timer');

/** @const {string} */
var COOKIE_NAME = 'AMP_EXP';

/** @const {number} */
var COOKIE_MAX_AGE_DAYS = 180; // 6 month

/** @const {time} */
var COOKIE_EXPIRATION_INTERVAL = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

/** @const {string} */
var CANARY_EXPERIMENT_ID = 'dev-channel';

/** @const {!Object<string, boolean>} */
var EXPERIMENT_TOGGLES = Object.create(null);

/**
 * Whether the scripts come from a dev channel.
 * @param {!Window} win
 * @return {boolean}
 */

function isDevChannel(win) {
  if (isExperimentOn(win, CANARY_EXPERIMENT_ID)) {
    return true;
  }
  if (isDevChannelVersionDoNotUse_(win)) {
    return true;
  }
  return false;
}

/**
 * Whether the version corresponds to the dev-channel binary.
 * @param {!Window} win
 * @param {string} version
 * @return {boolean}
 * @private Visible for testing only!
 */

function isDevChannelVersionDoNotUse_(win) {
  return !!win.AMP_CONFIG && win.AMP_CONFIG.canary;
}

/**
 * Whether the specified experiment is on or off.
 * @param {!Window} win
 * @param {string} experimentId
 * @return {boolean}
 */

function isExperimentOn(win, experimentId) {
  if (experimentId in EXPERIMENT_TOGGLES) {
    return EXPERIMENT_TOGGLES[experimentId];
  }
  return EXPERIMENT_TOGGLES[experimentId] = calcExperimentOn(win, experimentId);
}

/**
 * Calculate whether the specified experiment is on or off based off of the
 * cookieFlag or the global config frequency given.
 * @param {!Window} win
 * @param {string} experimentId
 * @return {boolean}
 */
function calcExperimentOn(win, experimentId) {
  var cookieFlag = getExperimentIds(win).indexOf(experimentId) != -1;
  if (cookieFlag) {
    return true;
  }

  if (win.AMP_CONFIG && win.AMP_CONFIG.hasOwnProperty(experimentId)) {
    var frequency = win.AMP_CONFIG[experimentId];
    return Math.random() < frequency;
  }
  return false;
}

/**
 * Toggles the experiment on or off. Returns the actual value of the experiment
 * after toggling is done.
 * @param {!Window} win
 * @param {string} experimentId
 * @param {boolean=} opt_on
 * @param {boolean=} opt_transientExperiment  Whether to toggle the
 *     experiment state "transiently" (i.e., for this page load only) or
 *     durably (by saving the experiment IDs to the cookie after toggling).
 *     Default: false (save durably).
 * @return {boolean} New state for experimentId.
 */

function toggleExperiment(win, experimentId, opt_on, opt_transientExperiment) {
  var experimentIds = getExperimentIds(win);
  var currentlyOn = experimentIds.indexOf(experimentId) != -1 || experimentId in EXPERIMENT_TOGGLES && EXPERIMENT_TOGGLES[experimentId];
  var on = opt_on !== undefined ? opt_on : !currentlyOn;
  if (on != currentlyOn) {
    if (on) {
      experimentIds.push(experimentId);
      EXPERIMENT_TOGGLES[experimentId] = true;
    } else {
      experimentIds.splice(experimentIds.indexOf(experimentId), 1);
      EXPERIMENT_TOGGLES[experimentId] = false;
    }
    if (!opt_transientExperiment) {
      saveExperimentIds(win, experimentIds);
    }
  }
  return on;
}

/**
 * Returns a set of experiment IDs currently on.
 * @param {!Window} win
 * @return {!Array<string>}
 */
function getExperimentIds(win) {
  var experimentCookie = _cookies.getCookie(win, COOKIE_NAME);
  return experimentCookie ? experimentCookie.split(/\s*,\s*/g) : [];
}

/**
 * Saves a set of experiment IDs currently on.
 * @param {!Window} win
 * @param {!Array<string>} experimentIds
 */
function saveExperimentIds(win, experimentIds) {
  _cookies.setCookie(win, COOKIE_NAME, experimentIds.join(','), _timer.timer.now() + COOKIE_EXPIRATION_INTERVAL);
}

/**
 * Resets the experimentsToggle cache for testing purposes.
 * @visibleForTesting
 */

function resetExperimentToggles_() {
  Object.keys(EXPERIMENT_TOGGLES).forEach(function (key) {
    delete EXPERIMENT_TOGGLES[key];
  });
}

},{"./cookies":11,"./timer":28}],16:[function(require,module,exports){
exports.__esModule = true;
exports.recreateNonProtoObject = recreateNonProtoObject;
exports.getValueForExpr = getValueForExpr;
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
 * @fileoverview This module declares JSON types as defined in the
 * {@link http://json.org/}.
 */

var _types = require('./types');

/**
 * JSON scalar. It's either string, number or boolean.
 * @typedef {string|number|boolean}
 */
var JSONScalarDef = undefined;

/**
 * JSON object. It's a map with string keys and JSON values.
 * @typedef {!Object<string, ?JSONValueDef>}
 */
var JSONObjectDef = undefined;

/**
 * JSON array. It's an array with JSON values.
 * @typedef {!Array<?JSONValueDef>}
 */
var JSONArrayDef = undefined;

/**
 * JSON value. It's either a scalar, an object or an array.
 * @typedef {!JSONScalarDef|!JSONObjectDef|!JSONArrayDef}
 */
var JSONValueDef = undefined;

/**
 * Recreates objects with prototype-less copies.
 * @param {!JSONObjectDef} obj
 * @return {!JSONObjectDef}
 */

function recreateNonProtoObject(obj) {
  var copy = Object.create(null);
  for (var k in obj) {
    if (!obj.hasOwnProperty(k)) {
      continue;
    }
    var v = obj[k];
    copy[k] = _types.isObject(v) ? recreateNonProtoObject(v) : v;
  }
  return copy;
}

/**
 * Returns a value from an object for a field-based expression. The expression
 * is a simple nested dot-notation of fields, such as `field1.field2`. If any
 * field in a chain does not exist or is not an object, the returned value will
 * be `undefined`.
 *
 * @param {!JSONObjectDef} obj
 * @param {string} expr
 * @return {?JSONValueDef|undefined}
 */

function getValueForExpr(obj, expr) {
  var parts = expr.split('.');
  var value = obj;
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (!part) {
      value = undefined;
      break;
    }
    if (!_types.isObject(value) || value[part] === undefined || value.hasOwnProperty && !value.hasOwnProperty(part)) {
      value = undefined;
      break;
    }
    value = value[part];
  }
  return value;
}

},{"./types":29}],17:[function(require,module,exports){
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

},{"./mode":18}],18:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{"./polyfills/math-sign":21,"./polyfills/object-assign":22,"./polyfills/promise":23,"document-register-element/build/document-register-element.max":9}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
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

},{"promise-pjs/promise":10}],24:[function(require,module,exports){
exports.__esModule = true;
exports.resourcesFor = resourcesFor;
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
 * @return {!Resources}
 */

function resourcesFor(window) {
  return _service.getService(window, 'resources');
}

;

},{"./service":25}],25:[function(require,module,exports){
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

},{"./log":17,"./polyfills":20}],26:[function(require,module,exports){
exports.__esModule = true;
exports.dashToCamelCase = dashToCamelCase;
exports.endsWith = endsWith;
exports.expandTemplate = expandTemplate;
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
 * @param {string} name Attribute name with dashes
 * @return {string} Dashes removed and character after to upper case.
 * visibleForTesting
 */

function dashToCamelCase(name) {
  return name.replace(/-([a-z])/g, function (_all, character) {
    return character.toUpperCase();
  });
}

/**
 * Polyfill for String.prototype. endsWith.
 * @param {string} string
 * @param {string} suffix
 * @return {boolean}
 */

function endsWith(string, suffix) {
  if (suffix.length > string.length) {
    return false;
  }
  var index = string.length - suffix.length;
  return string.indexOf(suffix, index) == index;
}

/**
 * Expands placeholders in a given template string with values.
 *
 * Placeholders use ${key-name} syntax and are replaced with the value
 * returned from the given getter function.
 *
 * @param {string} template The template string to expand.
 * @param {!function(string):*} getter Function used to retrieve a value for a
 *   placeholder. Returns values will be coerced into strings.
 * @param {number=1} optMaxIterations Number of times to expand the template.
 *   Defaults to 1, but should be set to a larger value your placeholder tokens
 *   can be expanded to other placeholder tokens. Take caution with large values
 *   as recursively expanding a string can be exponentially expensive.
 */

function expandTemplate(template, getter, opt_maxIterations) {
  var maxIterations = opt_maxIterations || 1;

  var _loop = function (i) {
    var matches = 0;
    template = template.replace(/\${([^}]*)}/g, function (_a, b) {
      matches++;
      return getter(b);
    });
    if (!matches) {
      return "break";
    }
  };

  for (var i = 0; i < maxIterations; i++) {
    var _ret = _loop(i);

    if (_ret === "break") break;
  }
  return template;
}

},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{"./log":17,"./polyfills":20}],29:[function(require,module,exports){
exports.__esModule = true;
exports.isArray = isArray;
exports.isObject = isObject;
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

/* @const */
var toString_ = Object.prototype.toString;

/**
 * Returns the ECMA [[Class]] of a value
 * @param {*} value
 * @return {string}
 */
function toString(value) {
  return toString_.call(value);
}

/**
 * Determines if value is actually an Array.
 * @param {*} value
 * @return {boolean}
 */

function isArray(value) {
  return Array.isArray(value);
}

/**
 * Determines if value is actually an Object.
 * @param {*} value
 * @return {boolean}
 */

function isObject(value) {
  return toString(value) === '[object Object]';
}

},{}],30:[function(require,module,exports){
exports.__esModule = true;
exports.urlReplacementsFor = urlReplacementsFor;
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
 * @return {!UrlReplacements}
 */

function urlReplacementsFor(window) {
  return _service.getService(window, 'url-replace');
}

;

},{"./service":25}],31:[function(require,module,exports){
exports.__esModule = true;
exports.parseUrl = parseUrl;
exports.addParamToUrl = addParamToUrl;
exports.addParamsToUrl = addParamsToUrl;
exports.assertHttpsUrl = assertHttpsUrl;
exports.assertAbsoluteHttpOrHttpsUrl = assertAbsoluteHttpOrHttpsUrl;
exports.parseQueryString = parseQueryString;
exports.getOrigin = getOrigin;
exports.removeFragment = removeFragment;
exports.isProxyOrigin = isProxyOrigin;
exports.getSourceUrl = getSourceUrl;
exports.getSourceOrigin = getSourceOrigin;
exports.resolveRelativeUrl = resolveRelativeUrl;
exports.resolveRelativeUrlFallback_ = resolveRelativeUrlFallback_;
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

var _string = require('./string');

var _log = require('./log');

// Cached a-tag to avoid memory allocation during URL parsing.
var a = window.document.createElement('a');

// We cached all parsed URLs. As of now there are no use cases
// of AMP docs that would ever parse an actual large number of URLs,
// but we often parse the same one over and over again.
var cache = Object.create(null);

/** @private @const Matches amp_js_* paramters in query string. */
var AMP_JS_PARAMS_REGEX = /[?&]amp_js[^&]*/;

/**
 * Returns a Location-like object for the given URL. If it is relative,
 * the URL gets resolved.
 * Consider the returned object immutable. This is enforced during
 * testing by freezing the object.
 * @param {string} url
 * @return {!Location}
 */

function parseUrl(url) {
  var fromCache = cache[url];
  if (fromCache) {
    return fromCache;
  }
  a.href = url;
  var info = {
    href: a.href,
    protocol: a.protocol,
    host: a.host,
    hostname: a.hostname,
    port: a.port == '0' ? '' : a.port,
    pathname: a.pathname,
    search: a.search,
    hash: a.hash
  };
  // For data URI a.origin is equal to the string 'null' which is not useful.
  // We instead return the actual origin which is the full URL.
  info.origin = a.origin && a.origin != 'null' ? a.origin : getOrigin(info);
  _log.user.assert(info.origin, 'Origin must exist');
  // Freeze during testing to avoid accidental mutation.
  cache[url] = window.AMP_TEST && Object.freeze ? Object.freeze(info) : info;
  return info;
}

/**
 * Appends the string just before the fragment part (or optionally
 * to the front of the query string) of the URL.
 * @param {string} url
 * @param {string} paramString
 * @param {boolean=} opt_addToFront
 * @return {string}
 */
function appendParamStringToUrl(url, paramString, opt_addToFront) {
  if (!paramString) {
    return url;
  }
  var mainAndFragment = url.split('#', 2);
  var mainAndQuery = mainAndFragment[0].split('?', 2);

  var newUrl = mainAndQuery[0] + (mainAndQuery[1] ? opt_addToFront ? '?' + paramString + '&' + mainAndQuery[1] : '?' + mainAndQuery[1] + '&' + paramString : '?' + paramString);
  newUrl += mainAndFragment[1] ? '#' + mainAndFragment[1] : '';
  return newUrl;
}
/**
 * Appends a query string field and value to a url. `key` and `value`
 * will be ran through `encodeURIComponent` before appending.
 * @param {string} url
 * @param {string} key
 * @param {string} value
 * @param {boolean=} opt_addToFront
 * @return {string}
 */

function addParamToUrl(url, key, value, opt_addToFront) {
  var field = encodeURIComponent(key) + '=' + encodeURIComponent(value);
  return appendParamStringToUrl(url, field, opt_addToFront);
}

/**
 * Appends query string fields and values to a url. The `params` objects'
 * `key`s and `value`s will be transformed into query string keys/values.
 * @param {string} url
 * @param {!Object<string, string>} params
 * @return {string}
 */

function addParamsToUrl(url, params) {
  var paramsString = Object.keys(params).reduce(function (paramsString, key) {
    return paramsString + ('&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
  }, '');
  return appendParamStringToUrl(url, paramsString.substring(1));
}

/**
 * Asserts that a given url is HTTPS or protocol relative. It's a user-level
 * assert.
 *
 * Provides an exception for localhost.
 *
 * @param {?string|undefined} urlString
 * @param {!Element|string} elementContext Element where the url was found.
 * @return {string}
 */

function assertHttpsUrl(urlString, elementContext) {
  _log.user.assert(urlString != null, '%s source must be available', elementContext);
  var url = parseUrl(urlString);
  _log.user.assert(url.protocol == 'https:' || /^(\/\/)/.test(urlString) || url.hostname == 'localhost' || _string.endsWith(url.hostname, '.localhost'), '%s source must start with ' + '"https://" or "//" or be relative and served from ' + 'either https or from localhost. Invalid value: %s', elementContext, urlString);
  return urlString;
}

/**
 * Asserts that a given url is an absolute HTTP or HTTPS URL.
 * @param {string} urlString
 * @return {string}
 */

function assertAbsoluteHttpOrHttpsUrl(urlString) {
  _log.user.assert(/^https?\:/i.test(urlString), 'URL must start with "http://" or "https://". Invalid value: %s', urlString);
  return parseUrl(urlString).href;
}

/**
 * Parses the query string of an URL. This method returns a simple key/value
 * map. If there are duplicate keys the latest value is returned.
 * @param {string} queryString
 * @return {!Object<string, string>}
 */

function parseQueryString(queryString) {
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
 * Don't use this directly, only exported for testing. The value
 * is available via the origin property of the object returned by
 * parseUrl.
 * @param {string|!Location} url
 * @return {string}
 * @visibleForTesting
 */

function getOrigin(url) {
  if (typeof url == 'string') {
    url = parseUrl(url);
  }
  if (url.protocol == 'data:' || !url.host) {
    return url.href;
  }
  return url.protocol + '//' + url.host;
}

/**
 * Returns the URL without fragment. If URL doesn't contain fragment, the same
 * string is returned.
 * @param {string} url
 * @return {string}
 */

function removeFragment(url) {
  var index = url.indexOf('#');
  if (index == -1) {
    return url;
  }
  return url.substring(0, index);
}

/**
 * Returns whether the URL has the origin of a proxy.
 * @param {string|!Location} url URL of an AMP document.
 * @return {boolean}
 */

function isProxyOrigin(url) {
  if (typeof url == 'string') {
    url = parseUrl(url);
  }
  var path = url.pathname.split('/');
  var prefix = path[1];
  // List of well known proxy hosts. New proxies must be added here.
  return url.origin == 'https://cdn.ampproject.org' || url.origin.indexOf('http://localhost:') == 0 && (prefix == 'c' || prefix == 'v');
}

/**
 * Removes parameters that start with amp js parameter pattern and returns the new
 * search string.
 * @param {string} urlSearch
 * @return {string}
 */
function removeAmpJsParams(urlSearch) {
  if (!urlSearch || urlSearch == '?') {
    return '';
  }
  var search = urlSearch.replace(AMP_JS_PARAMS_REGEX, '').replace(/^[?&]/, ''); // Removes first ? or &.
  return search ? '?' + search : '';
}

/**
 * Returns the source URL of an AMP document for documents served
 * on a proxy origin or directly.
 * @param {string|!Location} url URL of an AMP document.
 * @return {string}
 */

function getSourceUrl(url) {
  if (typeof url == 'string') {
    url = parseUrl(url);
  }

  // Not a proxy URL - return the URL itself.
  if (!isProxyOrigin(url)) {
    return url.href;
  }

  // A proxy URL.
  // Example path that is being matched here.
  // https://cdn.ampproject.org/c/s/www.origin.com/foo/
  // The /s/ is optional and signals a secure origin.
  var path = url.pathname.split('/');
  var prefix = path[1];
  _log.user.assert(prefix == 'c' || prefix == 'v', 'Unknown path prefix in url %s', url.href);
  var domainOrHttpsSignal = path[2];
  var origin = domainOrHttpsSignal == 's' ? 'https://' + decodeURIComponent(path[3]) : 'http://' + decodeURIComponent(domainOrHttpsSignal);
  // Sanity test that what we found looks like a domain.
  _log.user.assert(origin.indexOf('.') > 0, 'Expected a . in origin %s', origin);
  path.splice(1, domainOrHttpsSignal == 's' ? 3 : 2);
  return origin + path.join('/') + removeAmpJsParams(url.search) + (url.hash || '');
}

/**
 * Returns the source origin of an AMP document for documents served
 * on a proxy origin or directly.
 * @param {string|!Location} url URL of an AMP document.
 * @return {string} The source origin of the URL.
 */

function getSourceOrigin(url) {
  return getOrigin(getSourceUrl(url));
}

/**
 * Returns absolute URL resolved based on the relative URL and the base.
 * @param {string} relativeUrlString
 * @param {string|!Location} baseUrl
 * @return {string}
 */

function resolveRelativeUrl(relativeUrlString, baseUrl) {
  if (typeof baseUrl == 'string') {
    baseUrl = parseUrl(baseUrl);
  }
  if (typeof URL == 'function') {
    return new URL(relativeUrlString, baseUrl.href).toString();
  }
  return resolveRelativeUrlFallback_(relativeUrlString, baseUrl);
}

/**
 * Fallback for URL resolver when URL class is not available.
 * @param {string} relativeUrlString
 * @param {string|!Location} baseUrl
 * @return {string}
 * @private Visible for testing.
 */

function resolveRelativeUrlFallback_(relativeUrlString, baseUrl) {
  if (typeof baseUrl == 'string') {
    baseUrl = parseUrl(baseUrl);
  }
  relativeUrlString = relativeUrlString.replace(/\\/g, '/');
  var relativeUrl = parseUrl(relativeUrlString);

  // Absolute URL.
  if (relativeUrlString.toLowerCase().indexOf(relativeUrl.protocol) == 0) {
    return relativeUrl.href;
  }

  // Protocol-relative URL.
  if (relativeUrlString.indexOf('//') == 0) {
    return baseUrl.protocol + relativeUrlString;
  }

  // Absolute path.
  if (relativeUrlString.indexOf('/') == 0) {
    return baseUrl.origin + relativeUrlString;
  }

  // Relative path.
  var basePath = baseUrl.pathname.split('/');
  return baseUrl.origin + (basePath.length > 1 ? basePath.slice(0, basePath.length - 1).join('/') : '') + '/' + relativeUrlString;
}

},{"./log":17,"./string":26}],32:[function(require,module,exports){
exports.__esModule = true;
exports.userNotificationManagerFor = userNotificationManagerFor;
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
 * @fileoverview Factory for amp-user-notification
 */

var _elementService = require('./element-service');

/**
 * @param {!Window} window
 * @return {!Promise<!UserNotificationManager>}
 */

function userNotificationManagerFor(window) {
  return _elementService.getElementService(window, 'userNotificationManager', 'amp-user-notification');
}

},{"./element-service":13}],33:[function(require,module,exports){
exports.__esModule = true;
exports.viewerFor = viewerFor;
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
 * @return {!Viewer}
 */

function viewerFor(window) {
  return _service.getService(window, 'viewer');
}

;

},{"./service":25}],34:[function(require,module,exports){
exports.__esModule = true;
exports.viewportFor = viewportFor;
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
 * @return {!Viewport}
 */

function viewportFor(window) {
  return _service.getService(window, 'viewport');
}

;

},{"./service":25}],35:[function(require,module,exports){
exports.__esModule = true;
exports.visibilityFor = visibilityFor;
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

var _elementService = require('./element-service');

/**
 * @param {!Window} win
 * @return {!Promise<!Visibility>}
 */

function visibilityFor(win) {
  return _elementService.getElementService(win, 'visibility', 'amp-analytics');
}

;

},{"./element-service":13}],36:[function(require,module,exports){
exports.__esModule = true;
exports.xhrFor = xhrFor;
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
 * @return {!Xhr}
 */

function xhrFor(window) {
  return _service.getService(window, 'xhr');
}

;

},{"./service":25}],37:[function(require,module,exports){
exports.__esModule = true;
exports.sha384Base64 = sha384Base64;
exports.sha384 = sha384;
/* Generated from closure library commit 4fa3f37e090d73374825faec334b2deb2c902c47 */var m = this;function p(a, b) {
  var d = a.split("."),
      c = window || m;d[0] in c || !c.execScript || c.execScript("var " + d[0]);for (var e; d.length && (e = d.shift());) d.length || void 0 === b ? c[e] ? c = c[e] : c = c[e] = {} : c[e] = b;
}
function aa(a) {
  var b = typeof a;if ("object" == b) if (a) {
    if (a instanceof Array) return "array";if (a instanceof Object) return b;var d = Object.prototype.toString.call(a);if ("[object Window]" == d) return "object";if ("[object Array]" == d || "number" == typeof a.length && "undefined" != typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice")) return "array";if ("[object Function]" == d || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call")) return "function";
  } else return "null";else if ("function" == b && "undefined" == typeof a.call) return "object";return b;
}function r(a, b) {
  function d() {}d.prototype = b.prototype;a.v = b.prototype;a.prototype = new d();a.prototype.constructor = a;a.u = function (a, d, f) {
    for (var g = Array(arguments.length - 2), l = 2; l < arguments.length; l++) g[l - 2] = arguments[l];return b.prototype[d].apply(a, g);
  };
};function ba() {
  this.g = -1;
};function t(a, b) {
  this.b = a | 0;this.a = b | 0;
}var u = {},
    w = {};function y(a) {
  if (-128 <= a && 128 > a) {
    var b = u[a];if (b) return b;
  }b = new t(a | 0, 0 > a ? -1 : 0);-128 <= a && 128 > a && (u[a] = b);return b;
}function z(a) {
  isNaN(a) || !isFinite(a) ? a = A() : a <= -B ? a = C() : a + 1 >= B ? (w[D] || (w[D] = new t(-1, 2147483647)), a = w[D]) : a = 0 > a ? E(z(-a)) : new t(a % F | 0, a / F | 0);return a;
}var F = 4294967296,
    B = F * F / 2;function A() {
  w[G] || (w[G] = y(0));return w[G];
}function H() {
  w[I] || (w[I] = y(1));return w[I];
}function ca() {
  w[J] || (w[J] = y(-1));return w[J];
}
function C() {
  w[K] || (w[K] = new t(0, -2147483648));return w[K];
}t.prototype.toString = function (a) {
  a = a || 10;if (2 > a || 36 < a) throw Error("radix out of range: " + a);if (L(this)) return "0";if (0 > this.a) {
    if (M(this, C())) {
      var b = z(a),
          d = N(this, b),
          b = O(P(d, b), this);return d.toString(a) + b.b.toString(a);
    }return "-" + E(this).toString(a);
  }for (var d = z(Math.pow(a, 6)), b = this, c = "";;) {
    var e = N(b, d),
        f = (O(b, P(e, d)).b >>> 0).toString(a),
        b = e;if (L(b)) return f + c;for (; 6 > f.length;) f = "0" + f;c = "" + f + c;
  }
};function Q(a) {
  return 0 <= a.b ? a.b : F + a.b;
}
function L(a) {
  return 0 == a.a && 0 == a.b;
}function M(a, b) {
  return a.a == b.a && a.b == b.b;
}function da(a) {
  w[R] || (w[R] = y(16777216));return 0 > S(a, w[R]);
}function S(a, b) {
  if (M(a, b)) return 0;var d = 0 > a.a,
      c = 0 > b.a;return d && !c ? -1 : !d && c ? 1 : 0 > O(a, b).a ? -1 : 1;
}function E(a) {
  return M(a, C()) ? C() : T(new t(~a.b, ~a.a), H());
}
function T(a, b) {
  var d = a.a >>> 16,
      c = a.a & 65535,
      e = a.b >>> 16,
      f = b.a >>> 16,
      g = b.a & 65535,
      l = b.b >>> 16,
      n,
      q;q = 0 + ((a.b & 65535) + (b.b & 65535));n = 0 + (q >>> 16);n += e + l;e = 0 + (n >>> 16);e += c + g;c = 0 + (e >>> 16);c = c + (d + f) & 65535;return new t((n & 65535) << 16 | q & 65535, c << 16 | e & 65535);
}function O(a, b) {
  return T(a, E(b));
}
function P(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var a = _x,
        b = _x2;
    _again = false;
    if (L(a) || L(b)) return A();if (M(a, C())) return 1 == (b.b & 1) ? C() : A();if (M(b, C())) return 1 == (a.b & 1) ? C() : A();if (0 > a.a) {
      if (0 > b.a) {
        _x = E(a);
        _x2 = E(b);
        _again = true;
        continue _function;
      } else {
        return E(P(E(a), b));
      }
    }if (0 > b.a) return E(P(a, E(b)));if (da(a) && da(b)) return z((a.a * F + Q(a)) * (b.a * F + Q(b)));var d = a.a >>> 16,
        c = a.a & 65535,
        e = a.b >>> 16,
        f = a.b & 65535,
        g = b.a >>> 16,
        l = b.a & 65535,
        n = b.b >>> 16,
        q = b.b & 65535,
        v,
        k,
        h,
        x;x = 0 + f * q;h = 0 + (x >>> 16);h += e * q;k = 0 + (h >>> 16);h = (h & 65535) + f * n;k += h >>> 16;h &= 65535;k += c * q;v = 0 + (k >>> 16);k = (k & 65535) + e * n;v += k >>> 16;k &= 65535;k += f * l;v += k >>> 16;k &= 65535;v = v + (d * q + c * n + e * l + f * g) & 65535;return new t(h << 16 | x & 65535, v << 16 | k);
  }
}
function N(_x3, _x4) {
  var _again2 = true;

  _function2: while (_again2) {
    var a = _x3,
        b = _x4;
    _again2 = false;
    if (L(b)) throw Error("division by zero");if (L(a)) return A();if (M(a, C())) {
      if (M(b, H()) || M(b, ca())) return C();if (M(b, C())) return H();var d;d = 1;if (0 == d) d = a;else {
        var c = a.a;d = 32 > d ? new t(a.b >>> d | c << 32 - d, c >> d) : new t(c >> d - 32, 0 <= c ? 0 : -1);
      }d = N(d, b);c = 1;if (0 != c) {
        var e = d.b;d = 32 > c ? new t(e << c, d.a << c | e >>> 32 - c) : new t(0, e << c - 32);
      }if (M(d, A())) return 0 > b.a ? H() : ca();c = O(a, P(b, d));return T(d, N(c, b));
    }if (M(b, C())) return A();if (0 > a.a) {
      if (0 > b.a) {
        _x3 = E(a);
        _x4 = E(b);
        _again2 = true;
        d = c = e = undefined;
        continue _function2;
      } else {
        return E(N(E(a), b));
      }
    }if (0 > b.a) return E(N(a, E(b)));e = A();for (c = a; 0 <= S(c, b);) {
      d = Math.max(1, Math.floor((c.a * F + Q(c)) / (b.a * F + Q(b))));for (var f = Math.ceil(Math.log(d) / Math.LN2), f = 48 >= f ? 1 : Math.pow(2, f - 48), g = z(d), l = P(g, b); 0 > l.a || 0 < S(l, c);) d -= f, g = z(d), l = P(g, b);L(g) && (g = H());e = T(e, g);c = O(c, l);
    }return e;
  }
}var D = 1,
    K = 2,
    G = 3,
    I = 4,
    J = 5,
    R = 6;var U = null,
    V = null;function W(a, b) {
  this.g = -1;this.g = 128;this.h = void 0 !== m.Uint8Array ? new Uint8Array(128) : Array(128);this.j = this.f = 0;this.c = [];this.l = a;this.s = [];this.o = ea(b);this.i = !1;this.j = this.f = 0;var d;d = this.o;var c = d.length;if (0 < c) {
    for (var e = Array(c), f = 0; f < c; f++) e[f] = d[f];d = e;
  } else d = [];this.c = d;this.i = !1;
}r(W, ba);for (var ha = [], X = 0; 127 > X; X++) ha[X] = 0;var ia = (function (a) {
  return Array.prototype.concat.apply(Array.prototype, arguments);
})([128], ha);
function Y(a, b, d) {
  d = void 0 !== d ? d : b.length;if (a.i) throw Error("this hasher needs to be reset");var c = a.f;if ("string" == typeof b) for (var e = 0; e < d; e++) {
    var f = b.charCodeAt(e);if (255 < f) throw Error("Characters must be in range [0,255]");a.h[c++] = f;c == a.g && (Z(a), c = 0);
  } else if ("array" == aa(b)) for (e = 0; e < d; e++) {
    f = b[e];if ("number" != typeof f || 0 > f || 255 < f || f != (f | 0)) throw Error("message must be a byte array");a.h[c++] = f;c == a.g && (Z(a), c = 0);
  } else throw Error("message must be string or array");a.f = c;a.j += d;
}
function Z(a) {
  for (var b = a.h, d = a.s, c = 0; 16 > c; c++) {
    var e = 8 * c;d[c] = new t(b[e + 4] << 24 | b[e + 5] << 16 | b[e + 6] << 8 | b[e + 7], b[e] << 24 | b[e + 1] << 16 | b[e + 2] << 8 | b[e + 3]);
  }for (c = 16; 80 > c; c++) {
    var e = d[c - 15],
        b = e.b,
        e = e.a,
        f = d[c - 2],
        g = f.b,
        f = f.a;d[c] = a.m(d[c - 16], d[c - 7], new t(b >>> 1 ^ e << 31 ^ b >>> 8 ^ e << 24 ^ b >>> 7 ^ e << 25, e >>> 1 ^ b << 31 ^ e >>> 8 ^ b << 24 ^ e >>> 7), new t(g >>> 19 ^ f << 13 ^ f >>> 29 ^ g << 3 ^ g >>> 6 ^ f << 26, f >>> 19 ^ g << 13 ^ g >>> 29 ^ f << 3 ^ f >>> 6));
  }for (var b = a.c[0], e = a.c[1], g = a.c[2], f = a.c[3], l = a.c[4], n = a.c[5], q = a.c[6], v = a.c[7], c = 0; 80 > c; c++) var k = b.b, h = b.a, k = T(new t(k >>> 28 ^ h << 4 ^ h >>> 2 ^ k << 30 ^ h >>> 7 ^ k << 25, h >>> 28 ^ k << 4 ^ k >>> 2 ^ h << 30 ^ k >>> 7 ^ h << 25), new t(b.b & e.b | e.b & g.b | b.b & g.b, b.a & e.a | e.a & g.a | b.a & g.a)), h = l.b, x = l.a, fa = l.b, ga = l.a, h = a.m(v, new t(h >>> 14 ^ x << 18 ^ h >>> 18 ^ x << 14 ^ x >>> 9 ^ h << 23, x >>> 14 ^ h << 18 ^ x >>> 18 ^ h << 14 ^ h >>> 9 ^ x << 23), new t(fa & n.b | ~fa & q.b, ga & n.a | ~ga & q.a), ja[c], d[c]), v = q, q = n, n = l, l = T(f, h), f = g, g = e, e = b, b = T(h, k);a.c[0] = T(a.c[0], b);a.c[1] = T(a.c[1], e);a.c[2] = T(a.c[2], g);a.c[3] = T(a.c[3], f);a.c[4] = T(a.c[4], l);a.c[5] = T(a.c[5], n);a.c[6] = T(a.c[6], q);a.c[7] = T(a.c[7], v);
}
W.prototype.m = function (a, b, d) {
  for (var c = (a.b ^ 2147483648) + (b.b ^ 2147483648), e = a.a + b.a, f = arguments.length - 1; 2 <= f; --f) c += arguments[f].b ^ 2147483648, e += arguments[f].a;arguments.length & 1 && (c += 2147483648);e += arguments.length >> 1;e += Math.floor(c / 4294967296);return new t(c, e);
};function ea(a) {
  for (var b = [], d = 0; d < a.length; d += 2) b.push(new t(a[d + 1], a[d]));return b;
}
var ja = ea([1116352408, 3609767458, 1899447441, 602891725, 3049323471, 3964484399, 3921009573, 2173295548, 961987163, 4081628472, 1508970993, 3053834265, 2453635748, 2937671579, 2870763221, 3664609560, 3624381080, 2734883394, 310598401, 1164996542, 607225278, 1323610764, 1426881987, 3590304994, 1925078388, 4068182383, 2162078206, 991336113, 2614888103, 633803317, 3248222580, 3479774868, 3835390401, 2666613458, 4022224774, 944711139, 264347078, 2341262773, 604807628, 2007800933, 770255983, 1495990901, 1249150122, 1856431235, 1555081692, 3175218132, 1996064986, 2198950837, 2554220882, 3999719339, 2821834349, 766784016, 2952996808, 2566594879, 3210313671, 3203337956, 3336571891, 1034457026, 3584528711, 2466948901, 113926993, 3758326383, 338241895, 168717936, 666307205, 1188179964, 773529912, 1546045734, 1294757372, 1522805485, 1396182291, 2643833823, 1695183700, 2343527390, 1986661051, 1014477480, 2177026350, 1206759142, 2456956037, 344077627, 2730485921, 1290863460, 2820302411, 3158454273, 3259730800, 3505952657, 3345764771, 106217008, 3516065817, 3606008344, 3600352804, 1432725776, 4094571909, 1467031594, 275423344, 851169720, 430227734, 3100823752, 506948616, 1363258195, 659060556, 3750685593, 883997877, 3785050280, 958139571, 3318307427, 1322822218, 3812723403, 1537002063, 2003034995, 1747873779, 3602036899, 1955562222, 1575990012, 2024104815, 1125592928, 2227730452, 2716904306, 2361852424, 442776044, 2428436474, 593698344, 2756734187, 3733110249, 3204031479, 2999351573, 3329325298, 3815920427, 3391569614, 3928383900, 3515267271, 566280711, 3940187606, 3454069534, 4118630271, 4000239992, 116418474, 1914138554, 174292421, 2731055270, 289380356, 3203993006, 460393269, 320620315, 685471733, 587496836, 852142971, 1086792851, 1017036298, 365543100, 1126000580, 2618297676, 1288033470, 3409855158, 1501505948, 4234509866, 1607167915, 987167468, 1816402316, 1246189591]);function ka() {
  W.call(this, 6, la);
}r(ka, W);var la = [3418070365, 3238371032, 1654270250, 914150663, 2438529370, 812702999, 355462360, 4144912697, 1731405415, 4290775857, 2394180231, 1750603025, 3675008525, 1694076839, 1203062813, 3204075428];function ma(a) {
  var b = new ka();Y(b, a);if (b.i) throw Error("this hasher needs to be reset");var d = 8 * b.j;112 > b.f ? Y(b, ia, 112 - b.f) : Y(b, ia, b.g - b.f + 112);for (a = 127; 112 <= a; a--) b.h[a] = d & 255, d /= 256;Z(b);var d = 0,
      c = Array(8 * b.l);for (a = 0; a < b.l; a++) {
    for (var e = b.c[a], f = e.a, e = e.b, g = 24; 0 <= g; g -= 8) c[d++] = f >> g & 255;for (g = 24; 0 <= g; g -= 8) c[d++] = e >> g & 255;
  }b.i = !0;return c;
}
p("ampSha384", function (a) {
  a = ma(a);if (!U) {
    U = {};V = {};for (var b = 0; 65 > b; b++) U[b] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(b), V[b] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(b);
  }for (var b = V, d = [], c = 0; c < a.length; c += 3) {
    var e = a[c],
        f = c + 1 < a.length,
        g = f ? a[c + 1] : 0,
        l = c + 2 < a.length,
        n = l ? a[c + 2] : 0,
        q = e >> 2,
        e = (e & 3) << 4 | g >> 4,
        g = (g & 15) << 2 | n >> 6,
        n = n & 63;l || (n = 64, f || (g = 64));d.push(b[q], b[e], b[g], b[n]);
  }return d.join("");
});p("ampSha384Digest", ma);;
function sha384Base64(input) {
  return ampSha384(input);
}

;
function sha384(input) {
  return ampSha384Digest(input);
}

;

},{}]},{},[2])


});
//# sourceMappingURL=amp-analytics-0.1.max.js.map