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
 * The entry point for AMP Runtime (v0.js) when AMP Runtime = AMP Doc.
 */

// src/polyfills.js must be the first import.
import './polyfills.js'; // eslint-disable-line sort-imports-es6-autofix/sort-imports-es6

import {Services} from './services.js';
import {adoptWithMultidocDeps} from './runtime.js';
import {cssText as ampDocCss} from '../build/ampdoc.css.js';
import {cssText as ampSharedCss} from '../build/ampshared.css.js';
import {fontStylesheetTimeout} from './font-stylesheet-timeout.js';
import {getMode} from './mode.js';
import {
  installAmpdocServices,
  installBuiltinElements,
  installRuntimeServices,
} from './service/core-services.js';
import {installAutoLightboxExtension} from './auto-lightbox.js';
import {installDocService} from './service/ampdoc-impl.js';
import {installErrorReporting} from './error.js';
import {installPerformanceService} from './service/performance-impl.js';
import {installPlatformService} from './service/platform-impl.js';
import {installPullToRefreshBlocker} from './pull-to-refresh.js';
import {installStandaloneExtension} from './standalone.js';
import {
  installStylesForDoc,
  makeBodyVisible,
  makeBodyVisibleRecovery,
} from './style-installer.js';
import {internalRuntimeVersion} from './internal-version.js';
import {maybeTrackImpression} from './impression.js';
import {maybeValidate} from './validator-integration.js';
import {preconnectToOrigin} from './preconnect.js';
import {startupChunk} from './chunk.js';
import {stubElementsForDoc} from './service/custom-element-registry.js';

/**
 * self.IS_AMP_ALT (is AMP alternative binary) is undefined by default in the
 * main v0.js since it is the "main" js.
 * This global boolean is set by alternative binaries like amp-inabox and
 * amp-shadow which has their own bootstrapping sequence.
 * With how single pass works these alternative binaries cannot be generated
 * easily because we can only do a "single pass" so we treat these alternative
 * main binaries as "extensions" and we concatenate their code with the main
 * v0.js code.
 * @type {boolean|undefined}
 */
const shouldMainBootstrapRun = !self.IS_AMP_ALT;

/**
 * Execute the bootstrap
 * @param {!./service/ampdoc-impl.AmpDoc} ampdoc
 * @param {!./service/performance-impl.Performance} perf
 */
function bootstrap(ampdoc, perf) {
  startupChunk(self.document, function services() {
    // Core services.
    installRuntimeServices(self);
    installAmpdocServices(ampdoc);
    // We need the core services (viewer/resources) to start instrumenting
    perf.coreServicesAvailable();
    maybeTrackImpression(self);
  });
  startupChunk(self.document, function adoptWindow() {
    adoptWithMultidocDeps(self);
  });
  startupChunk(self.document, function builtins() {
    // Builtins.
    installBuiltinElements(self);
  });
  startupChunk(self.document, function stub() {
    // Pre-stub already known elements.
    stubElementsForDoc(ampdoc);
  });
  startupChunk(
    self.document,
    function final() {
      installPullToRefreshBlocker(self);
      installAutoLightboxExtension(ampdoc);
      installStandaloneExtension(ampdoc);
      maybeValidate(self);
      makeBodyVisible(self.document);
      preconnectToOrigin(self.document);
    },
    /* makes the body visible */ true
  );
  startupChunk(self.document, function finalTick() {
    perf.tick('e_is');
    Services.resourcesForDoc(ampdoc).ampInitComplete();
    // TODO(erwinm): move invocation of the `flush` method when we have the
    // new ticks in place to batch the ticks properly.
    perf.flush();
  });
}

if (shouldMainBootstrapRun) {
  // Store the originalHash as early as possible. Trying to debug:
  // https://github.com/ampproject/amphtml/issues/6070
  if (self.location) {
    self.location.originalHash = self.location.hash;
  }

  /** @type {!./service/ampdoc-impl.AmpDocService} */
  let ampdocService;
  // We must under all circumstances call makeBodyVisible.
  // It is much better to have AMP tags not rendered than having
  // a completely blank page.
  try {
    // Should happen first.
    installErrorReporting(self); // Also calls makeBodyVisibleRecovery on errors.

    // Declare that this runtime will support a single root doc. Should happen
    // as early as possible.
    installDocService(self, /* isSingleDoc */ true);
    ampdocService = Services.ampdocServiceFor(self);
  } catch (e) {
    // In case of an error call this.
    makeBodyVisibleRecovery(self.document);
    throw e;
  }
  startupChunk(self.document, function initial() {
    /** @const {!./service/ampdoc-impl.AmpDoc} */
    const ampdoc = ampdocService.getAmpDoc(self.document);
    installPlatformService(self);
    installPerformanceService(self);
    /** @const {!./service/performance-impl.Performance} */
    const perf = Services.performanceFor(self);
    if (
      self.document.documentElement.hasAttribute('i-amphtml-no-boilerplate')
    ) {
      perf.addEnabledExperiment('no-boilerplate');
    }
    if (getMode().esm) {
      perf.addEnabledExperiment('esm');
    }
    fontStylesheetTimeout(self);
    perf.tick('is');
    if (IS_ESM) {
      bootstrap(ampdoc, perf);
    } else {
      installStylesForDoc(
        ampdoc,
        ampDocCss + ampSharedCss,
        () => bootstrap(ampdoc, perf),
        /* opt_isRuntimeCss */ true,
        /* opt_ext */ 'amp-runtime'
      );
    }
  });

  // Output a message to the console and add an attribute to the <html>
  // tag to give some information that can be used in error reports.
  // (At least by sophisticated users).
  if (self.console) {
    (console.info || console.log).call(
      console,
      `Powered by AMP ⚡ HTML – Version ${internalRuntimeVersion()}`,
      self.location.href
    );
  }
  self.document.documentElement.setAttribute(
    'amp-version',
    internalRuntimeVersion()
  );
}
