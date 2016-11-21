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

/**
 * Holds the x-y coordinates of the top-left corner of an element.
 *
 * @typedef {{
 *   left: number,
 *   top: number,
 * }}
 */
export let PositionDef;

/**
 * @param {number} left
 * @param {number} top
 * @return {!PositionDef}
 */
export function positionLt(left, top) {
  return {
    left,
    top,
  };
}

/**
 * Moves the position's coordinates using dx and dy.
 * @param {!PositionDef} position Original position.
 * @param {number} dx Move horizontally with this value.
 * @param {number} dy Move vertically with this value.
 * @return {!PositionDef}
 */
export function movePosition(position, dx, dy) {
  if (dx == 0 && dy == 0) {
    return position;
  }
  return positionLt(position.left + dx, position.top + dy);
}
