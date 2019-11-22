/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
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

import {requireExternal} from '../module';

let AmpContext;

/**
 * The external context given to React components to control whether they can
 * render/play/etc.
 *
 * - renderable: whether this vDOM area is renderable. Analogous to
 *   `display-locking` CSS.
 * - playable: whether the playback is allowed in this vDOM area. If playback
 *   is not allow, the component must immediately stop the playback.
 *
 * @return {*}
 */
export function getAmpContext() {
  if (AmpContext) {
    return AmpContext;
  }

  const preact = requireExternal('preact');
  return (AmpContext = preact.createContext({
    renderable: true,
    playable: true,
  }));
}

/**
 * A wrapper-component that recalculates and propagates AmpContext properties.
 *
 * @param {!Object} props
 * @return {*}
 */
export function withAmpContext(props) {
  const preact = requireExternal('preact');
  const parent = preact.useContext(AmpContext);
  const current = {
    renderable: parent.renderable && props.renderable,
    playable: parent.playable && props.playable,
  };

  return preact.createElement(
    getAmpContext().Provider,
    Object.assign({}, props, {value: current})
  );
}
