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

module.exports = function(context) {
  function stripComments(text) {
    // Multi-line comments
    text = text.replace(/\/\*(?!.*\*\/)(.|\n)*?\*\//g, function(match) {
      // Preserve the newlines
      const newlines = [];
      for (let i = 0; i < match.length; i++) {
        if (match[i] === '\n') {
          newlines.push('\n');
        }
      }
      return newlines.join('');
    });
    // Single line comments either on its own line or following a space,
    // semi-colon, or closing brace
    return text.replace(/( |}|;|^) *\/\/.*/g, '$1');
  }

  return {
    MemberExpression(node) {
      if (/\btest\b/.test(context.getFilename())) {
        return;
      }

      const {property} = node;
      if (property.type !== 'Identifier') {
        return;
      }

      const {name} = property;

      if (!name.endsWith('_')) {
        return;
      }

      const comments = context.getCommentsBefore(node);
      const testing = comments.some(comment => {
        return /@override\b/.test(comment.value);
      });
      if (testing) {
        return;
      }

      const ancestors = context.getAncestors(node);
      const body = ancestors.reverse().find(node => node.type === 'ClassBody');

      if (!body) {
        context.report(node, 'Using private field outside of class scope.' +
            ` This is incompatible with TC39's proposed private field` +
            ' semantics. That means this field is really public, and should' +
            ' declared as such.');
        return;
      }

      const methods = body.body;
      let constructor;
      for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        if (method.type === 'MethodDefinition' && !method.computed) {
          if (method.key.name === name) {
            return;
          }

          if (method.key.name === 'constructor') {
            constructor = method;
          }
        }
      }

      // Yah, I know, we're not using the AST anymore.
      // But there's no good way to do inner traversals, so this is all we got.
      const source = context.getSourceCode();
      const constructorText = stripComments(source.getText(constructor));
      debugger

      const regex = new RegExp(`\\bthis\\.${name}\\s*=`);
      if (regex.test(constructorText)) {
        return;
      }

      context.report(node, 'This private field is not declared in this class' +
        ` scope. Likely, you are using another class' private field, which is` +
        ' illegal.');
    },
  };
};
