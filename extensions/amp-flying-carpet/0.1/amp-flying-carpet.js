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

import {CSS} from '../../../build/amp-flying-carpet-0.1.css';
import {Layout} from '../../../src/layout';
import {isExperimentOn} from '../../../src/experiments';
import {dev, user} from '../../../src/log';

/** @const */
const EXPERIMENT = 'amp-flying-carpet';

/** @const */
const TAG = 'amp-flying-carpet';


class AmpFlyingCarpet extends AMP.BaseElement {

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.FIXED_HEIGHT;
  }

  /** @override */
  buildCallback() {
    this.isExperimentOn_ = isExperimentOn(this.getWin(), EXPERIMENT);
    if (!this.isExperimentOn_) {
      dev.warn(TAG, `Experiment ${EXPERIMENT} disabled`);
      return;
    }
  }

  assertPosition() {
    const layoutBox = this.element.getLayoutBox();
    const viewport = this.getViewport();
    const viewportHeight = viewport.getHeight();
    const docHeight = viewport.getScrollHeight();
    // Hmm, can the page height change and affect us?
    user.assert(
      layoutBox.top >= viewportHeight,
      '<amp-flying-carpet> elements must be positioned after the first ' +
      'viewport: %s Current position: %s. Min: %s',
      this.element,
      layoutBox.top,
      viewportHeight
    );
    user.assert(
      layoutBox.bottom <= docHeight - viewportHeight,
      '<amp-flying-carpet> elements must be positioned before the last ' +
      'viewport: %s Current position: %s. Min: %s',
      this.element,
      layoutBox.bottom,
      docHeight - viewportHeight
    );
  }

  // REVIEW(@dima) How will Resources handle my wrapping elements?
  layoutCallback() {
    if (!this.isExperimentOn_) {
      return Promise.resolve();
    }

    this.assertPosition();

    const children = this.getRealChildNodes();
    const doc = this.element.ownerDocument;

    const clip = doc.createElement('div');
    clip.setAttribute('class', '-amp-flying-carpet-clip');
    const container = doc.createElement('div');
    container.setAttribute('class', '-amp-flying-carpet-container');

    for (var i = 0; i < children.length; i++) {
      container.appendChild(children[i]);
    }
    clip.appendChild(container);

    this.element.appendChild(clip);
    return Promise.resolve();
  }
}

AMP.registerElement('amp-flying-carpet', AmpFlyingCarpet, CSS);
