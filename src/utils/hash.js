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
 * Hash function djb2a
 * This is intended to be a simple, fast hashing function using minimal code.
 * It does *not* have good cryptographic properties.
 * @param {string} str
 * @return {string} 32-bit unsigned hash of the string
 */
export function djb2a(str) {
  const {length} = str;
  let hash = 5381;
  for (let i = 0; i < length; i++) {
    hash = hash * 33 ^ str.charCodeAt(i);
  }
  // Convert from 32-bit signed to unsigned.
  return String(hash >>> 0);
}


/**
 * Read length bytes into an int using little endian encoding.
 *
 * @param {string} str
 * @param {number} offset
 * @param {number} length
 * @return {number}
 */
function read(str, offset, length) {
  let read = 0;
  while (length--) {
    read |= (str.charCodeAt(offset + length) & 0xff) << (length * 8);
  }
  return read;
}

/**
 * MurmurHash 2 algorithm
 * This is a high quality hashing function. It is not suitable for
 * cryptography.
 *
 * @param {string} str
 * @param {number=} opt_seed
 */
export function murmur2(str, opt_seed) {
  const m = 0x5bd1e995;
  const {length} = str;
  let h = (opt_seed | 0) ^ length;

  const l = length & ~0b11;
  for (let i = 0; i < l; i += 4) {
    let k = read(str, i, 4);

    k = Math.imul(k, m);
    k ^= k >>> 24;
    k = Math.imul(k, m);

    h = Math.imul(h, m) ^ k;
  }

  const remainder = length & 0b11;
  if (remainder) {
    h ^= read(str, length - remainder, remainder);
    h = Math.imul(h, m);
  }

  h ^= h >>> 13;
  h = Math.imul(h, m);
  h ^= h >>> 15;

  return h >>> 0;
}

/**
 * Hashes str into a number in the range of [0, 1].
 *
 * @param {string} str
 * @param {number=} opt_seed
 * @return {number}
 */
export function percentage(str, opt_seed = 0xe27f66a7) {
  const range = Math.pow(2, -32);
  return murmur2(str, opt_seed) * range;
}
