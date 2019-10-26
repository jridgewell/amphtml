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

const fs = require('fs');
const path = require('path');
const {parse: parser} = require('babel-eslint');

const force = process.env.FORCE === 'true';
const pureImports = new Map();

module.exports = function(context) {
  function isInsideFunction(node) {
    while (node) {
      const {type} = node;

      if (
        type === 'ArrowFunctionExpression' ||
        type === 'FunctionDeclaration' ||
        type === 'FunctionExpression' ||
        type === 'MethodDefinition'
      ) {
        return true;
      }

      node = node.parent;
    }

    return false;
  }

  function isPure(node) {
    const {type} = node;

    if (
      type === 'ArrayExpression' ||
      type === 'ArrowFunctionExpression' ||
      type === 'AssignmentExpression' ||
      type === 'BinaryExpression' ||
      type === 'FunctionExpression' ||
      type === 'Identifier' ||
      type === 'Literal' ||
      type === 'LogicalExpression' ||
      type === 'MemberExpression' ||
      type === 'ObjectExpression' ||
      type === 'TemplateLiteral' ||
      type === 'UnaryExpression'
    ) {
      return true;
    }

    return false;
  }

  function isPureCall(node) {
    const callee = MemberToString(node.callee);

    if (
      callee === 'dict' ||
      callee === 'map' ||
      callee === 'Math.log' ||
      callee === 'Math.pow' ||
      callee === 'Math.round'
    ) {
      return true;
    }

    return false;
  }

  function MemberToString(node) {
    const parts = [];

    while (node) {
      const {type} = node;
      if (type === 'MemberExpression') {
        const {computed, property} = node;
        if (computed && property.type !== 'Literal') {
          return '';
        }

        parts.push(property.name || property.value);
        node = node.object;
        continue;
      }

      if (type === 'Identifier') {
        parts.push(node.name);
        break;
      }

      return '';
    }

    return parts.reverse().join('.');
  }

  function hasPureDirective(program) {
    const {body} = program;

    for (let i = 0; i < body.length; i++) {
      const statement = body[i];
      if (statement.type !== 'ExpressionStatement') {
        break;
      }

      const {expression} = statement;
      if (expression.type !== 'Literal') {
        break;
      }

      const {value} = expression;
      if (typeof value !== 'string') {
        break;
      }

      if (value === 'pure module') {
        return true;
      }
    }

    return false;
  }

  function isPureImport(filepath) {
    if (pureImports.has(filepath)) {
      return pureImports.get(filepath);
    }

    const contents = fs.readFileSync(filepath, 'utf8');
    const ast = parser(contents);

    const isPure = hasPureDirective(ast);
    pureImports.set(filepath, isPure);
    return isPure;
  }

  let isPureModule = false;
  return {
    Program(program) {
      isPureModule = hasPureDirective(program);
    },

    'Program :expression': function(node) {
      if (!force && !isPureModule) {
        return;
      }
      if (isPure(node) || isInsideFunction(node)) {
        return;
      }

      if (node.type === 'CallExpression' && isPureCall(node)) {
        return;
      }

      context.report({
        node,
        message: `"${node.type}" is not pure`,
      });
    },

    ImportDeclaration(node) {
      if (!force && !isPureModule) {
        return;
      }

      const fileName = context.getFilename();
      const {value} = node.source;
      const filepath = path
        .resolve(path.dirname(fileName), value)
        .replace(/(\.js)?$/, '.js');

      if (isPureImport(filepath)) {
        return;
      }

      context.report({
        node,
        message: `"${value}" is an impure import`,
      });
    },
  };
};
