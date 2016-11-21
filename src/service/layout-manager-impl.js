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
 * @implements {../service.Disposable}
 * @package Visible for type.
 */
export class LayoutManager {
  /**
   * @param {!./ampdoc-impl.AmpDoc} ampdoc
   */
  constructor(ampdoc) {
  }

  dispose() {}
}

class Layer {
  /**
   * @param {?Element} root
   * @param {number} priorityPenalty
   */
  constructor(root, priorityPenalty) {
    this.root = root;

    this.priorityPenalty_ = priorityPenalty;
  }
}

/**
 * @param {!./ampdoc-impl.AmpDoc} ampdoc
 * @return {!Viewport}
 */
export function installLayoutManagerServiceForDoc(ampdoc) {
  return /** @type {!Viewport} */ (getServiceForDoc(ampdoc, 'layout-manager',
      ampdoc => new LayoutManager(ampdoc)));
}
