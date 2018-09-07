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

/**
 * Performs a 32bit multiplication of a and b, modulo 2^32.
 *
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
function imul(a, b) {
  const aHi = (a >>> 16) & 0xffff;
  const bHi = (b >>> 16) & 0xffff;
  const aLow = a & 0xffff;
  const bLow = b & 0xffff;

  // The 16 low bits can't overflow a 32bit int.
  const low = aLow * bLow;
  // The shift by 0 fixes the sign on the high part
  const high = ((aHi * bLow + aLow * bHi) << 16) >>> 0;
  // the bitwise OR converts the unsigned value into a signed value
  return (high + low) | 0;
}


/**
 * Sets the Math.imul polyfill if it does not exist.
 * @param {!Window} win
 */
export function install(win) {
  if (!win.Math.imul) {
    win.Object.defineProperty(win.Math, 'imul', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: imul,
    });
  }
}
