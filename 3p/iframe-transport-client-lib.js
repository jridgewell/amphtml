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

// src/polyfills.js must be the first import.
import './polyfills.js'; // eslint-disable-line sort-imports-es6-autofix/sort-imports-es6

import {IframeTransportClient} from './iframe-transport-client.js';
import {initLogConstructor, setReportError} from '../src/log.js';

initLogConstructor();
// TODO(alanorozco): Refactor src/error.reportError so it does not contain big
// transitive dependencies and can be included here.
setReportError(() => {});

/**
 *  Instantiate IframeTransportClient, to provide the creative with
 *  all the required functionality.
 */
try {
  new IframeTransportClient(window);
} catch (err) {
  // do nothing with error
}
