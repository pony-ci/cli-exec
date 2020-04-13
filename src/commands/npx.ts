import {exec} from '../index';

export const npx = (...args) => exec('npx', ...args);
