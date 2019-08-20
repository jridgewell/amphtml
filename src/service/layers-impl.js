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

import {registerServiceBuilderForDoc} from '../service';

/**
 * The Size of an element.
 *
 * @struct
 * @typedef {{
 *   height: number,
 *   width: number,
 * }}
 */
export let SizeDef;

/**
 * The offset Position of an element.
 *
 * @struct
 * @typedef {{
 *   left: number,
 *   top: number,
 * }}
 */
export let PositionDef;

/**
 * @typedef {Object<string, *>}
 */
let AncestryStateDef;

/**
 * Creates a Size.
 *
 * @param {number} width
 * @param {number} height
 * @return {!SizeDef}
 */
function sizeWh(width, height) {
  return {
    height,
    width,
  };
}

/**
 * Creates a Position.
 *
 * @param {number} left
 * @param {number} top
 * @return {!PositionDef}
 */
function positionLt(left, top) {
  return {
    left,
    top,
  };
}

/**
 * The core class behind the Layers system, this controls layer creation and
 * management.
 * @implements {../service.Disposable}
 */
export class LayoutLayers {
  /**
   */
  constructor() {}

  /** @override */
  dispose() {}

  /**
   * Creates a layout for the element (if one doesn't exist for it already) and
   * tracks the layout.
   *
   * This method may be called multiple times to ensure the element has a
   * layout (and can therefore use the layout's instance methods) and that the
   * layout will be remasured when necessary.
   *
   */
  add() {}

  /**
   * Removes the element's layout from tracking.
   * This also "dirties" the layout, so if's being reparented it will lazily
   * update appropriately.
   *
   */
  remove() {}

  /**
   * Returns the current scrolled position of the element relative to the layer
   * represented by opt_ancestor (or opt_ancestor's parent layer, if it is not
   * a layer itself). This takes into account the scrolled position of every
   * layer in between.
   *
   * @param {!Element} element
   * @param {Element=} opt_ancestor
   * @return {!PositionDef}
   */
  getScrolledPosition(element, opt_ancestor) {
    const pos = element.getBoundingClientRect();
    return positionLt(Math.round(pos.left), Math.round(pos.top));
  }

  /**
   * Returns the absolute offset position of the element relative to the layer
   * represented by opt_ancestor (or opt_ancestor's parent layer, if it is not
   * a layer itself). This remains constant, regardless of the scrolled
   * position of any layer in between.
   *
   * @param {!Element} element
   * @return {!PositionDef}
   */
  getOffsetPosition(element) {
    return this.getScrolledPosition(element);
  }

  /**
   * Returns the size of the element.
   *
   * @param {!Element} element
   * @return {!SizeDef}
   */
  getSize(element) {
    return sizeWh(element./*OK*/ clientWidth, element./*OK*/ clientHeight);
  }

  /**
   * Remeasures (now, not lazily) the element, and any other elements who's
   * cached rects may have been altered by this element's mutation. This
   * optimizes to also remeasure any higher up layers that are also marked as
   * dirty, so that only 1 measure phase is needed.
   *
   * This is meant to be called after any element mutation happens (eg.
   * #buildCallback, #layoutCallback, viewport changes size).
   */
  remeasure() {}

  /**
   * Eagerly creates a Layer for the element. Doing so helps the scheduling
   * algorithm better score nested components, and saves a few cycles.
   */
  declareLayer() {}

  /**
   * Dirties the element's parent layer, so remeasures will happen.
   *
   */
  dirty() {}

  /**
   * Registers the scroll listener.
   *
   */
  onScroll() {
    throw new Error('unimplemented');
  }

  /**
   * Returns the most recently scrolled layer.
   *
   */
  getActiveLayer() {
    throw new Error('unimplemented');
  }

  /**
   * Iterates the layout's parent layer ancestry, starting from the root down
   * to the layout.
   *
   * This sets a whether the layer isActive during that layer's iteration. Any
   * attempts to access #isActiveUnsafe outside of the iterator call will fail.
   *
   */
  iterateAncestry() {
    throw new Error('unimplemented');
  }
}

/**
 * @param {!./ampdoc-impl.AmpDoc} ampdoc
 * @param {!Element} scrollingElement
 * @param {boolean} scrollingElementScrollsLikeViewport
 */
export function installLayersServiceForDoc(
  ampdoc,
  scrollingElement,
  scrollingElementScrollsLikeViewport
) {
  registerServiceBuilderForDoc(
    ampdoc,
    'layers',
    function(ampdoc) {
      return new LayoutLayers(
        ampdoc,
        scrollingElement,
        scrollingElementScrollsLikeViewport
      );
    },
    /* opt_instantiate */ true
  );
}
