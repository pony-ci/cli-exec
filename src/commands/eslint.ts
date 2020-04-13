import {npx} from './npx';

export const eslint = (...args) => npx('eslint', ...args);
