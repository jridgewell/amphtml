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
'use strict';

module.exports = {
  meta: {
    fixable: 'code',
  },

  create(context) {
    function equalFactory(name, fix) {
      return {
        [`MemberExpression[property.name=${name}] CallExpression[callee.name=expect]`](
          node
        ) {
          const ancestors = context.getAncestors().slice().reverse();

          let ret;
          let fn;
          let prop;
          for (const ancestor of ancestors) {
            if (/Function/.test(ancestor.type)) {
              fn = ancestor;
              break;
            }

            if (ancestor.type === 'ReturnStatement') {
              ret = ancestor;
            }

            if (
              ancestor.type === 'MemberExpression' &&
              ancestor.property.name === name
            ) {
              prop = ancestor;
            }
          }

          if (!prop) return;

          context.report({
            node,
            message: 'hello',

            fix: fix(node, prop, ret, fn),
          });
        },
      };
    }
    function equalFixerFactory(name, replacement) {
      return function (node, prop, ret, fn) {
        return function (fixer) {
          if (!node.arguments[0]) {
            return null;
          }

          const start = prop.property.start - 1;
          const fixes = [
            fixer.insertTextBefore(node.arguments[0], 'await '),
            fixer.replaceTextRange(
              [start, start + name.length + 1],
              replacement
            ),
          ];
          if (ret) {
            fixes.push(
              fixer.removeRange([ret.start, ret.start + 'return '.length])
            );
          }

          if (!fn.async) {
            fixes.push(fixer.insertTextBefore(fn, 'async '));
          }

          return fixes;
        };
      };
    }

    function tryCatchFactory(name, fix) {
      return {
        [`MemberExpression[property.name=${name}] CallExpression[callee.name=expect]`](
          node
        ) {
          const ancestors = context.getAncestors().slice().reverse();

          let ret;
          let fn;
          let prop;
          let not = false;
          for (const ancestor of ancestors) {
            if (/Function/.test(ancestor.type)) {
              fn = ancestor;
              break;
            }

            if (ancestor.type === 'ReturnStatement') {
              ret = ancestor;
            }

            if (ancestor.type === 'MemberExpression') {
              const {property} = ancestor;
              if (property.name === name) {
                prop = ancestor;
              }
              if (property.name === 'not' && !prop) {
                not = !not;
              }
            }
          }

          if (!prop) return;

          context.report({
            node,
            message: 'hello',

            fix: fix(node, prop, ret, fn, not),
          });
        },
      };
    }
    function tryCatchFixerFactory(needsCatch) {
      const negate = !needsCatch;

      return function (node, prop, ret, fn, not) {
        return function (fixer) {
          if (!node.arguments[0]) {
            return null;
          }

          const fixes = [];
          const expect = context.getSource(node.arguments[0]);
          if (negate) {
            not = !not;
          }

          const {parent} = prop;
          let args = '';
          if (parent && parent.type === 'CallExpression') {
            prop = parent;
            args = prop.arguments.map((a) => context.getSource(a)).join(', ');
          }
          fixes.push(
            fixer.replaceText(
              prop,
              `(await expect(() => ${expect}).${
                not ? 'not.' : ''
              }to.asyncThrow(${args}))`
            )
          );

          if (ret) {
            fixes.push(
              fixer.removeRange([ret.start, ret.start + 'return '.length])
            );
          }

          if (!fn.async) {
            fixes.push(fixer.insertTextBefore(fn, 'async '));
          }

          return fixes;
        };
      };
    }

    return {
      ...equalFactory('eventually', equalFixerFactory('eventually', '')),
      ...equalFactory('become', equalFixerFactory('become', '.to.deep.equal')),
      ...tryCatchFactory('fulfilled', tryCatchFixerFactory(false)),
      ...tryCatchFactory('rejected', tryCatchFixerFactory(true)),
      ...tryCatchFactory('rejectedWith', tryCatchFixerFactory(true)),

      'MemberExpression[property.name=asyncThrow] CallExpression[callee.name=expect]': function (
        node
      ) {
        const ancestors = context.getAncestors().slice().reverse();

        let last = node;
        let ancestor = node;
        let i = 0;
        let found = false;
        for (; i < ancestors.length; i++) {
          last = ancestor;
          ancestor = ancestors[i];
          if (ancestor.type === 'CallExpression' && ancestor.callee === last) {
            continue;
          }
          if (ancestor.type === 'MemberExpression') {
            if (ancestor.property.name === 'asyncThrow') {
              found = true;
            }
            if (ancestor.object === last) {
              continue;
            }
          }
          break;
        }

        if (!found) {
          return;
        }

        if (last.type !== 'CallExpression') {
          return context.report({
            node,
            message: 'asyncThrow must be called!',

            fix(fixer) {
              return fixer.insertTextAfter(last, '()');
            },
          });
        }

        if (ancestor.type === 'AwaitExpression') {
          return;
        }

        context.report({
          node,
          message: 'bad',

          fix(fixer) {
            return fixer.insertTextBefore(last, 'await ');
          },
        });
      },
    };
  },
};
