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

import '../amp-jwplayer';
import {htmlFor} from '../../../../src/static-template';

describes.realWin(
  'amp-jwplayer',
  {
    amp: {
      extensions: ['amp-jwplayer'],
    },
  },
  (env) => {
    let win, doc;

    beforeEach(() => {
      win = env.win;
      doc = win.document;
    });

    function getjwplayer(attributes) {
      const jw = doc.createElement('amp-jwplayer');
      for (const key in attributes) {
        jw.setAttribute(key, attributes[key]);
      }
      jw.setAttribute('width', '320');
      jw.setAttribute('height', '180');
      jw.setAttribute('layout', 'responsive');
      const html = htmlFor(env.win.document);
      env.sandbox
        .stub(env.ampdoc.getHeadNode(), 'querySelector')
        .withArgs('meta[property="og:title"]')
        .returns(html` <meta property="og:title" content="title_tag" /> `);
      doc.body.appendChild(jw);
      return jw.build().then(() => {
        jw.layoutCallback();
        return jw;
      });
    }

    it('renders', async () => {
      const jw = await getjwplayer({
        'data-media-id': 'Wferorsv',
        'data-player-id': 'sDZEo0ea',
      });
      const iframe = jw.querySelector('iframe');
      expect(iframe).to.not.be.null;
      expect(iframe.tagName).to.equal('IFRAME');
      expect(iframe.src).to.equal(
        'https://content.jwplatform.com/players/Wferorsv-sDZEo0ea.html'
      );
      expect(iframe.className).to.match(/i-amphtml-fill-content/);
    });

    it('renders with a playlist', async () => {
      const jw = await getjwplayer({
        'data-playlist-id': '482jsTAr',
        'data-player-id': 'sDZEo0ea',
      });
      const iframe = jw.querySelector('iframe');
      expect(iframe).to.not.be.null;
      expect(iframe.tagName).to.equal('IFRAME');
      expect(iframe.src).to.equal(
        'https://content.jwplatform.com/players/482jsTAr-sDZEo0ea.html'
      );
    });
    it('renders with a playlist and parses contextual parameter', async () => {
      const jw = await getjwplayer({
        'data-playlist-id': '482jsTAr',
        'data-player-id': 'sDZEo0ea',
        'data-content-search': '__CONTEXTUAL__',
      });
      const iframe = jw.querySelector('iframe');
      expect(iframe).to.not.be.null;
      expect(iframe.tagName).to.equal('IFRAME');
      expect(iframe.src).to.equal(
        'https://content.jwplatform.com/players/482jsTAr-sDZEo0ea.html?search=title_tag'
      );
    });
    it('renders with a playlist and all parameters', async () => {
      const jw = await getjwplayer({
        'data-playlist-id': '482jsTAr',
        'data-player-id': 'sDZEo0ea',
        'data-content-search': 'dog',
        'data-content-backfill': true,
      });
      const iframe = jw.querySelector('iframe');
      expect(iframe).to.not.be.null;
      expect(iframe.tagName).to.equal('IFRAME');
      expect(iframe.src).to.equal(
        'https://content.jwplatform.com/players/482jsTAr-sDZEo0ea.html?search=dog&backfill=true'
      );
    });
    it('fails if no media is specified', () => {
      return allowConsoleError(() => {
        return expect(
          getjwplayer({
            'data-player-id': 'sDZEo0ea',
          })
        ).to.eventually.be.rejectedWith(
          /Either the data-media-id or the data-playlist-id attributes must be/
        );
      });
    });

    it('fails if no player is specified', () => {
      return allowConsoleError(() => {
        return expect(
          getjwplayer({
            'data-media-id': 'Wferorsv',
          })
        ).to.eventually.be.rejectedWith(
          /The data-player-id attribute is required for/
        );
      });
    });

    it('renders with a bad playlist', () => {
      return getjwplayer({
        'data-playlist-id': 'zzz',
        'data-player-id': 'sDZEo0ea',
      }).then((jw) => {
        const iframe = jw.querySelector('iframe');
        expect(iframe).to.not.be.null;
        expect(iframe.tagName).to.equal('IFRAME');
        expect(iframe.src).to.equal(
          'https://content.jwplatform.com/players/zzz-sDZEo0ea.html'
        );
      });
    });

    describe('createPlaceholderCallback', () => {
      it('should create a placeholder image', async () => {
        const jw = await getjwplayer({
          'data-media-id': 'Wferorsv',
          'data-player-id': 'sDZEo0ea',
        });
        const img = jw.querySelector('amp-img');
        expect(img).to.not.be.null;
        expect(img.getAttribute('src')).to.equal(
          'https://content.jwplatform.com/thumbs/Wferorsv-720.jpg'
        );
        expect(img.getAttribute('layout')).to.equal('fill');
        expect(img.hasAttribute('placeholder')).to.be.true;
        expect(img.getAttribute('referrerpolicy')).to.equal('origin');
        expect(img.getAttribute('alt')).to.equal('Loading video');
      });
      it('should propagate aria-label to placeholder', async () => {
        const jw = await getjwplayer({
          'data-media-id': 'Wferorsv',
          'data-player-id': 'sDZEo0ea',
          'aria-label': 'interesting video',
        });
        const img = jw.querySelector('amp-img');
        expect(img).to.not.be.null;
        expect(img.getAttribute('aria-label')).to.equal('interesting video');
        expect(img.getAttribute('alt')).to.equal(
          'Loading video - interesting video'
        );
      });
      it('should not create a placeholder for playlists', async () => {
        const jw = await getjwplayer({
          'data-playlist-id': 'Wferorsv',
          'data-player-id': 'sDZEo0ea',
        });
        const img = jw.querySelector('amp-img');
        expect(img).to.be.null;
      });
    });
  }
);
