/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

const regexpTree = require('regexp-tree');

module.exports = function (context) {
  function check(node, raw) {
    const ast = regexpTree.parse(raw);
    const {flags} = ast;
    if (flags.includes('y')) {
      context.report({
        node,
        message: 'Sticky regexes are not allowed',
      });
    }
    if (flags.includes('s')) {
      context.report({
        node,
        message: 'dotAll regexes are not allowed',
      });
    }
    if (flags.includes('u')) {
      context.report({
        node,
        message: 'Unicode regexes are not allowed',
      });
    }

    regexpTree.traverse(ast, {
      Assertion(path) {
        if (path.node.kind !== 'Lookbehind') {
          return;
        }

        context.report({
          node,
          message: 'Lookbehinds in regexes are not allowed',
        });
      },

      Group(path) {
        if (!path.node.name) {
          return;
        }

        context.report({
          node,
          message: 'Named capture groups in regexes are not allowed',
        });
      },
    });
  }

  const defaultPattern = {
    type: 'Literal',
    value: '(?:)',
  };
  const defaultFlags = {
    type: 'Literal',
    value: '',
  };

  return {
    'Literal[regex]': function (node) {
      check(node, node.raw);
    },

    'CallExpression[callee.name=RegExp], NewExpression[callee.name=RegExp]': function (
      node
    ) {
      const comments = context.getCommentsBefore(node.callee);
      const ok = comments.some((comment) => comment.value === 'OK');
      if (ok) {
        return;
      }

      const [pattern = defaultPattern, flags = defaultFlags] = node.arguments;

      if (!pattern || pattern.type !== 'Literal') {
        return context.report({
          node,
          message: 'Dynamic RegExp detected, cannot verify its features',
        });
      }

      if (flags.type !== 'Literal') {
        return context.report({
          node,
          message: 'Dynamic RegExp detected, cannot verify its features',
        });
      }

      const p = String(pattern.value).replace(/\//g, '\\/');
      check(node, `/${p}/${flags.value}`);
    },
  };
};
