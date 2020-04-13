# cli-exec

[![npm version](https://badge.fury.io/js/%40pony-ci%2Fcli-exec.svg)](https://badge.fury.io/js/%40pony-ci%2Fcli-exec)
[![pony-ci](https://circleci.com/gh/pony-ci/cli-exec.svg?style=shield)](https://circleci.com/gh/pony-ci/cli-exec)

Execute CLI commands in node.

## Usage
```javascript
await exec('docker', 'run', {rm: true}, 'hello-world');
// executes 'docker run --rm hello-world'

console.log(build('docker', 'run', {rm: true}, 'hello-world'));
// prints 'docker run --rm hello-world'

// you can also pass options in array
console.log(build('docker', ['run', {rm: true}, 'hello-world']));

const args = buildArgs('run', {rm: true}, 'hello-world');
// [ 'run', '--rm', 'hello-world' ]

await exec('docker', 'images', {filter: 'dangling=true'});
// executes 'docker images --filter dangling=true'

await exec('npm', {quiet: true, cwd: '/home/user/workspace/my-npm-project'}, 'install');
// executes 'npm install' in specified cwd with suppressed stdout and stderr

// cmd instance also contains methods exec, build and buildArgs
const docker = cmd('docker');
await docker.exec('run', {rm: true}, 'hello-world');
// executes 'docker run --rm hello-world'

const myCmd = cmd('mycmd');
// overriding transform function
const transform = myCmd.transform;
myCmd.transform = (opt) => {
    const args = [];
    Object.entries(opt).forEach(([name, value]) => {
        if (shouldJoinWithSign(name, value)) {
            args.push(`--${name}=${value}`);
        } else {
            args.push(...transform({[name]: value}));
        }
    });
    return args;
};
console.log(myCmd.build({name: 'value'}));
// prints 'mycmd --name=value'
```

## Special options
Special options modify the command execution.
#### Examples
```javascript
// options for every command executed on npm instance
const npm = cmd('npm', {
    cwd: '/home/user/workspace/my-npm-project',
    printCommand: false
});
// the command options can be overridden during execution
// they must be passed as first option
await npm.exec({printCommand: true}, 'install');
// executes 'npm install' without printing the command
await npm.exec('install', {printCommand: true});
// executes 'npm install --printCommand' with printing the command
```

#### Options overview
| name         | description                              | default       |
|--------------|------------------------------------------|---------------|
| cwd          | current working directory                | process.cwd() |
| printCommand | print command being executed             | true          |
| quiet        | suppress printCommand, stdout and stderr | false         |

## Default implementations
This module includes some common commands.

#### eslint
```javascript
await eslint('src/**/*.js');
```

#### npm
```javascript
await npm.install();
await npm.test();
await npm.publish('--dry-run');
```

#### npx
```javascript
await npx('eslint', 'src/**/*.js');
```

## License
This software is released under the [MIT License](https://github.com/pony-ci/cli-exec/blob/master/LICENSE).

