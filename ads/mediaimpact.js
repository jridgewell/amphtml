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

import {loadScript} from '../3p/3p';

/* global asmi: true */

/**
 * @param {!Window} global
 * @param {!Object} data
 */

export function mediaimpact(global, data) {
  global.fif = false;
  /* eslint google-camelcase/google-camelcase: 0 */
  global.sas_loadHandler = function(f) {
    if (f.hasAd) {
      f.crea1 || (f.crea1 = {
        width: 300,
        height: 250,
      });
      global.context.renderStart({
        width: f.crea1.width,
        height: f.crea1.height,
      });
    } else {
      global.context.noContentAvailable();
    }
  };
  global.addEventListener('load', function() {
    asmi.sas.call(data.site + '/(' + data.page + ')',
        data.format,
        data.target + ';googleAMP=1;',
        '',
        'sas_' + data.slot.replace('sas_',''),
        1);
  }, false);
  /* global asmiSetup: true */
  /* eslint no-unused-vars: 0 */
  asmiSetup = {
    view: 'm',
    async: true,
  };
  loadScript(global, 'https://ec-ns.sascdn.com/diff/251/pages/amp_default.js',
      () => {
        const id = 'sas_' + data.slot.replace('sas_','');
        if (!global.document.getElementById(id)) {
          const adContainer = global.document.createElement('div');
          adContainer.id = id;
          global.document.body.appendChild(adContainer);
        }
      });
}
