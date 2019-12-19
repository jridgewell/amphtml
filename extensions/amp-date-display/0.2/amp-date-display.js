/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
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

import {AmpEvents} from '../../../src/amp-events';
import {Fragment, createElement} from 'preact';
import {PreactBaseElement} from '../../../src/preact-base-element';
import {Services} from '../../../src/services';
import {createCustomEvent} from '../../../src/event-helper';
import {dev, devAssert, userAssert} from '../../../src/log';
import {isExperimentOn} from '../../../src/experiments';
import {isLayoutSizeDefined} from '../../../src/layout';
import {removeChildren} from '../../../src/dom';
import {useResourcesNotify} from '../../../src/preact/utils';
import {useState} from 'preact/hooks';

/** @const {string} */
const TAG = 'amp-date-display';

/** @const {string} */
const DEFAULT_LOCALE = 'en';

/** @const {number} */
const DEFAULT_OFFSET_SECONDS = 0;

/** @typedef {{
  year: number,
  month: number,
  monthName: string,
  monthNameShort: string,
  day: number,
  dayName: string,
  dayNameShort: string,
  hour: number,
  minute: number,
  second: number,
  iso: string,
}} */
let VariablesV2Def;

/** @typedef {{
  year: number,
  month: number,
  monthName: string,
  monthNameShort: string,
  day: number,
  dayName: string,
  dayNameShort: string,
  hour: number,
  minute: number,
  second: number,
  iso: string,
  yearTwoDigit: string,
  monthTwoDigit: string,
  dayTwoDigit: string,
  hourTwoDigit: string,
  hour12: string,
  hour12TwoDigit: string,
  minuteTwoDigit: string,
  secondTwoDigit: string,
  dayPeriod: string,
 }} */
let EnhancedVariablesV2Def;

/**
 * @param {!JsonObject} props
 * @return {*} TODO
 */
function AmpDateDisplayComponent(props) {
  const render = props['render'];
  const data = /** @type {!JsonObject} */ (getDataForTemplate(props));
  useResourcesNotify();

  return render(data, props['children']);
}

/**
 * Renders the children prop, waiting for it to resolve if it is a promise.
 *
 * @param {!JsonObject} props
 * @return {*} TODO
 */
function AsyncRender(props) {
  const children = props['children'];
  const {0: state, 1: set} = useState(children);

  if (state && state.then) {
    Promise.resolve(children).then(set);
    return null;
  }

  return state;
}

/**
 * @param {!JsonObject} props
 * @return {*} TODO
 */
function RenderDomTree(props) {
  const {'dom': dom, 'host': host} = props;
  useResourcesNotify();

  removeChildren(dev().assertElement(host));
  if (dom) {
    host.appendChild(dom);
  }

  const event = createCustomEvent(
    devAssert(host.ownerDocument.defaultView),
    AmpEvents.DOM_UPDATE,
    /* detail */ null,
    {bubbles: true}
  );
  host.dispatchEvent(event);

  return null;
}

const AmpDateDisplay = PreactBaseElement(AmpDateDisplayComponent, {
  passthrough: true,

  props: {
    'displayIn': {attr: 'display-in'},
    'offsetSeconds': {attr: 'offset-seconds', type: 'number'},
    'locale': {attr: 'locale'},
    'datetime': {attr: 'datetime'},
    'timestampMs': {attr: 'timestamp-ms', type: 'number'},
    'timestampSeconds': {attr: 'timestamp-seconds', type: 'number'},
  },

  /** @override */
  init() {
    const templates = Services.templatesFor(this.win);
    let rendered = false;

    return {
      /**
       * @param {!JsonObject} data
       * @param {*} children
       * @return {*}
       */
      'render': (data, children) => {
        // We only render once in AMP mode, but React mode may rerender
        // serveral times.
        if (rendered) {
          return children;
        }
        rendered = true;

        const host = this.element;
        const domPromise = templates
          .findAndRenderTemplate(host, data)
          .then(rendered => {
            const container = document.createElement('div');
            container.appendChild(rendered);

            return createElement(RenderDomTree, {
              'dom': container,
              'host': host,
            });
          });
        const asyncRender = createElement(AsyncRender, null, domPromise);
        return createElement(Fragment, null, children, asyncRender);
      },
    };
  },

  /** @override */
  isLayoutSupported(layout) {
    userAssert(
      isExperimentOn(this.win, 'amp-date-display-v2'),
      'expected amp-date-display-v2 experiment to be enabled'
    );
    return isLayoutSizeDefined(layout);
  },
});

/**
 * @param {!JsonObject} props
 * @return {!EnhancedVariablesV2Def}
 */
function getDataForTemplate(props) {
  const {
    'displayIn': displayIn = '',
    'locale': locale = DEFAULT_LOCALE,
    'offsetSeconds': offsetSeconds = DEFAULT_OFFSET_SECONDS,
  } = props;

  const epoch = getEpoch(props);
  const offset = offsetSeconds * 1000;
  const date = new Date(epoch + offset);

  const basicData =
    displayIn.toLowerCase() === 'utc'
      ? getVariablesInUTC(date, locale)
      : getVariablesInLocal(date, locale);

  return enhanceBasicVariables(basicData);
}

/**
 * @param {!JsonObject} props
 * @return {number|undefined}
 */
function getEpoch(props) {
  const {
    'datetime': datetime = '',
    'timestampMs': timestampMs = 0,
    'timestampSeconds': timestampSeconds = 0,
  } = props;

  let epoch;
  if (datetime.toLowerCase() === 'now') {
    epoch = Date.now();
  } else if (datetime) {
    epoch = Date.parse(datetime);
    userAssert(!isNaN(epoch), 'Invalid date: %s', datetime);
  } else if (timestampMs) {
    epoch = timestampMs;
  } else if (timestampSeconds) {
    epoch = timestampSeconds * 1000;
  }

  userAssert(
    epoch !== undefined,
    'One of datetime, timestamp-ms, or timestamp-seconds is required'
  );

  return epoch;
}

/**
 * @param {number} input
 * @return {string}
 */
function padStart(input) {
  if (input > 9) {
    return input.toString();
  }

  return '0' + input;
}

/**
 * @param {!VariablesV2Def} data
 * @return {!EnhancedVariablesV2Def}
 */
function enhanceBasicVariables(data) {
  const hour12 = data.hour % 12 || 12;

  // Override type since Object.assign is not understood
  return /** @type {!EnhancedVariablesV2Def} */ ({
    ...data,
    yearTwoDigit: padStart(data.year % 100),
    monthTwoDigit: padStart(data.month),
    dayTwoDigit: padStart(data.day),
    hourTwoDigit: padStart(data.hour),
    hour12,
    hour12TwoDigit: padStart(hour12),
    minuteTwoDigit: padStart(data.minute),
    secondTwoDigit: padStart(data.second),
    dayPeriod: data.hour < 12 ? 'am' : 'pm',
  });
}

/**
 * @param {!Date} date
 * @param {string} locale
 * @return {!VariablesV2Def}
 */
function getVariablesInLocal(date, locale) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    monthName: date.toLocaleDateString(locale, {month: 'long'}),
    monthNameShort: date.toLocaleDateString(locale, {
      month: 'short',
    }),
    day: date.getDate(),
    dayName: date.toLocaleDateString(locale, {weekday: 'long'}),
    dayNameShort: date.toLocaleDateString(locale, {
      weekday: 'short',
    }),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    iso: date.toISOString(),
  };
}

/**
 * @param {!Date} date
 * @param {string} locale
 * @return {!VariablesV2Def}
 */
function getVariablesInUTC(date, locale) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    monthName: date.toLocaleDateString(locale, {
      month: 'long',
      timeZone: 'UTC',
    }),
    monthNameShort: date.toLocaleDateString(locale, {
      month: 'short',
      timeZone: 'UTC',
    }),
    day: date.getUTCDate(),
    dayName: date.toLocaleDateString(locale, {
      weekday: 'long',
      timeZone: 'UTC',
    }),
    dayNameShort: date.toLocaleDateString(locale, {
      weekday: 'short',
      timeZone: 'UTC',
    }),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    iso: date.toISOString(),
  };
}

AMP.extension(TAG, '0.2', AMP => {
  AMP.registerElement(TAG, AmpDateDisplay);
});
