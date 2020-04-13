import {cmd} from '../index';

export const npm: any = cmd('npm');

npm.bin = (...args) => npm.exec('bin', ...args);
npm.install = (...args) => npm.exec('install', ...args);
npm.link = (...args) => npm.exec('link', ...args);
npm.list = (...args) => npm.exec('list', ...args);
npm.login = (...args) => npm.exec('login', ...args);
npm.logout = (...args) => npm.exec('logout', ...args);
npm.pack = (...args) => npm.exec('pack', ...args);
npm.prune = (...args) => npm.exec('prune', ...args);
npm.publish = (...args) => npm.exec('publish', ...args);
npm.run = (...args) => npm.exec('run', ...args);
npm.test = (...args) => npm.exec('test', ...args);
npm.uninstall = (...args) => npm.exec('uninstall', ...args);
npm.unpublish = (...args) => npm.exec('unpublish', ...args);
npm.update = (...args) => npm.exec('update', ...args);
npm.version = (...args) => npm.exec('version', ...args);
npm.whoami = (...args) => npm.exec('whoami', ...args);
