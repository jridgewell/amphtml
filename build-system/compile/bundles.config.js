/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
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
'use strict';

const colors = require('ansi-colors');
const log = require('fancy-log');

const {VERSION: internalRuntimeVersion} = require('./internal-version');

/**
 * @enum {string}
 */
const TYPES = (exports.TYPES = {
  AD: '_base_ad',
  MEDIA: '_base_media',
  MISC: '_base_misc',
});

/**
 * Used to generate top-level JS build targets
 */
exports.jsBundles = {
  'polyfills.js': {
    srcDir: './src/',
    srcFilename: 'polyfills.js',
    destDir: './build/',
    minifiedDestDir: './build/',
  },
  'alp.max.js': {
    srcDir: './ads/alp/',
    srcFilename: 'install-alp.js',
    destDir: './dist',
    minifiedDestDir: './dist',
    options: {
      toName: 'alp.max.js',
      includePolyfills: true,
      minifiedName: 'alp.js',
    },
  },
  'examiner.max.js': {
    srcDir: './src/examiner/',
    srcFilename: 'examiner.js',
    destDir: './dist',
    minifiedDestDir: './dist',
    options: {
      toName: 'examiner.max.js',
      includePolyfills: true,
      minifiedName: 'examiner.js',
    },
  },
  'ww.max.js': {
    srcDir: './src/web-worker/',
    srcFilename: 'web-worker.js',
    destDir: './dist',
    minifiedDestDir: './dist',
    options: {
      toName: 'ww.max.js',
      minifiedName: 'ww.js',
      includePolyfills: true,
    },
  },
  'integration.js': {
    srcDir: './3p/',
    srcFilename: 'integration.js',
    destDir: './dist.3p/current',
    minifiedDestDir: './dist.3p/' + internalRuntimeVersion,
    options: {
      minifiedName: 'f.js',
      externs: ['./ads/ads.extern.js'],
      include3pDirectories: true,
      includePolyfills: true,
    },
  },
  'ampcontext-lib.js': {
    srcDir: './3p/',
    srcFilename: 'ampcontext-lib.js',
    destDir: './dist.3p/current',
    minifiedDestDir: './dist.3p/' + internalRuntimeVersion,
    options: {
      minifiedName: 'ampcontext-v0.js',
      externs: ['./ads/ads.extern.js'],
      include3pDirectories: true,
      includePolyfills: false,
    },
  },
  'iframe-transport-client-lib.js': {
    srcDir: './3p/',
    srcFilename: 'iframe-transport-client-lib.js',
    destDir: './dist.3p/current',
    minifiedDestDir: './dist.3p/' + internalRuntimeVersion,
    options: {
      minifiedName: 'iframe-transport-client-v0.js',
      externs: ['./ads/ads.extern.js'],
      include3pDirectories: true,
      includePolyfills: false,
    },
  },
  'recaptcha.js': {
    srcDir: './3p/',
    srcFilename: 'recaptcha.js',
    destDir: './dist.3p/current',
    minifiedDestDir: './dist.3p/' + internalRuntimeVersion,
    options: {
      minifiedName: 'recaptcha.js',
      externs: [],
      include3pDirectories: true,
      includePolyfills: true,
    },
  },
  'amp-viewer-host.max.js': {
    srcDir: './extensions/amp-viewer-integration/0.1/examples/',
    srcFilename: 'amp-viewer-host.js',
    destDir: './dist/v0/examples',
    minifiedDestDir: './dist/v0/examples',
    options: {
      toName: 'amp-viewer-host.max.js',
      minifiedName: 'amp-viewer-host.js',
      incudePolyfills: true,
      extraGlobs: ['extensions/amp-viewer-integration/**/*.js'],
      compilationLevel: 'WHITESPACE_ONLY',
      skipUnknownDepsCheck: true,
    },
  },
  'video-iframe-integration.js': {
    srcDir: './src/',
    srcFilename: 'video-iframe-integration.js',
    destDir: './dist',
    minifiedDestDir: './dist',
    options: {
      minifiedName: 'video-iframe-integration-v0.js',
      includePolyfills: false,
    },
  },
  'amp-story-player.js': {
    srcDir: './src/',
    srcFilename: 'amp-story-player.js',
    destDir: './dist',
    minifiedDestDir: './dist',
    options: {
      minifiedName: 'amp-story-player-v0.js',
      includePolyfills: false,
    },
  },
  'amp-inabox-host.js': {
    srcDir: './ads/inabox/',
    srcFilename: 'inabox-host.js',
    destDir: './dist',
    minifiedDestDir: './dist',
    options: {
      toName: 'amp-inabox-host.js',
      minifiedName: 'amp4ads-host-v0.js',
      includePolyfills: false,
    },
  },
  'amp.js': {
    srcDir: './src/',
    srcFilename: 'amp.js',
    destDir: './dist',
    minifiedDestDir: './dist',
    options: {
      minifiedName: 'v0.js',
      includePolyfills: true,
    },
  },
  'amp-shadow.js': {
    srcDir: './src/',
    srcFilename: 'amp-shadow.js',
    destDir: './dist',
    minifiedDestDir: './dist',
    options: {
      minifiedName: 'shadow-v0.js',
      includePolyfills: true,
    },
  },
  'amp-inabox.js': {
    srcDir: './src/inabox/',
    srcFilename: 'amp-inabox.js',
    destDir: './dist',
    minifiedDestDir: './dist',
    options: {
      toName: 'amp-inabox.js',
      minifiedName: 'amp4ads-v0.js',
      includePolyfills: true,
      extraGlobs: ['src/inabox/*.js', '3p/iframe-messaging-client.js'],
    },
  },
};

/**
 * Used to generate extension build targets
 */
exports.extensionBundles = [
  {
    name: 'amp-date-display',
    version: ['0.1', '0.2'],
    latestVersion: '0.1',
    type: TYPES.MISC,
  },
];

/**
 * Used to alias a version of an extension to an older deprecated version.
 */
exports.extensionAliasBundles = {
};

/**
 * Used to generate alternative JS build targets
 */
exports.altMainBundles = [
  {
    path: 'src/amp-shadow.js',
    name: 'shadow-v0',
    version: '0.1',
    latestVersion: '0.1',
  },
  {
    path: 'src/inabox/amp-inabox.js',
    name: 'amp4ads-v0',
    version: '0.1',
    latestVersion: '0.1',
  },
];

/**
 * @param {boolean} condition
 * @param {string} field
 * @param {string} message
 * @param {string} name
 * @param {string} found
 */
function verifyBundle_(condition, field, message, name, found) {
  if (!condition) {
    log(
      colors.red('ERROR:'),
      colors.cyan(field),
      message,
      colors.cyan(name),
      '\n' + found
    );
    process.exit(1);
  }
}

exports.verifyExtensionBundles = function() {
  exports.extensionBundles.forEach(bundle => {
    const bundleString = JSON.stringify(bundle, null, 2);
    verifyBundle_(
      'name' in bundle,
      'name',
      'is missing from',
      '',
      bundleString
    );
    verifyBundle_(
      'version' in bundle,
      'version',
      'is missing from',
      bundle.name,
      bundleString
    );
    verifyBundle_(
      'latestVersion' in bundle,
      'latestVersion',
      'is missing from',
      bundle.name,
      bundleString
    );
    const duplicates = exports.extensionBundles.filter(
      duplicate => duplicate.name === bundle.name
    );
    verifyBundle_(
      duplicates.every(
        duplicate => duplicate.latestVersion === bundle.latestVersion
      ),
      'latestVersion',
      'is not the same for all versions of',
      bundle.name,
      JSON.stringify(duplicates, null, 2)
    );
    verifyBundle_(
      'type' in bundle,
      'type',
      'is missing from',
      bundle.name,
      bundleString
    );
    const validTypes = Object.keys(TYPES).map(x => TYPES[x]);
    verifyBundle_(
      validTypes.some(validType => validType === bundle.type),
      'type',
      `is not one of ${validTypes.join(',')} in`,
      bundle.name,
      bundleString
    );
  });
};
