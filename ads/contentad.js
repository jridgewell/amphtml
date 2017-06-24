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

import {writeScript, validateData} from '../3p/3p';
import {parseUrl} from '../src/url';

/**
 * @param {!Window} global
 * @param {!Object} data
 */
export function contentad(global, data) {
  validateData(data, [], ['id', 'd', 'wid', 'url']);
  global.id = data.id;
  global.d = data.d;
  global.wid = data.wid;
  global.url = data.url;

  /* Create div for ad to target */
  const cadDiv = global.document.createElement('div');
  cadDiv.id = 'contentad' + global.wid;
  global.document.body.appendChild(cadDiv);

  /* Pass Source URL */
  let sourceUrl = global.context.sourceUrl;
  if (data.url) {
    const domain = data.url || atob(data.d);
    sourceUrl = sourceUrl.replace(parseUrl(sourceUrl).host, domain);
  }

  /* Build API URL */
  const cadApi = 'https://api.content-ad.net/Scripts/widget2.aspx'
    + '?id=' + encodeURIComponent(global.id)
    + '&d=' + encodeURIComponent(global.d)
    + '&wid=' + global.wid
    + '&url=' + encodeURIComponent(sourceUrl)
    + '&cb=' + Date.now();

  /* Call Content.ad Widget */
  writeScript(global, cadApi);
}
