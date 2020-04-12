import {expect} from 'chai';
import {build, buildArgs, cmd, exec} from '../lib';

describe('build, buildArgs and cmd', () => {
    it('build', async () => {
        const result = await build('docker', 'run', {rm: true}, 'hello-world');
        expect(result).to.eq('docker run --rm hello-world');
    });

    it('build from array', async () => {
        const result = await build('docker', ['run', {h: true}, {name: 'value'}, {n: 'v'}, 'hello-world']);
        expect(result).to.eq('docker run -h --name value -n v hello-world');
    });

    it('build multiple options', async () => {
        const result = await build('docker', 'run', {h: true, name: 'value', n: 'v'}, 'hello-world');
        expect(result).to.contain('docker run ');
        expect(result).to.contain(' -h ');
        expect(result).to.contain(' --name value ');
        expect(result).to.contain(' -n v ');
        expect(result).to.contain(' hello-world');
    });

    it('build args', async () => {
        const result = buildArgs('run', {rm: true}, 'hello-world');
        expect(result.length).to.eq(3);
        expect(result[0]).to.eq('run');
        expect(result[1]).to.eq('--rm');
        expect(result[2]).to.eq('hello-world');
    });

    it('cmd.build', async () => {
        const docker = cmd('docker');
        const result = await docker.build('run', {rm: true}, 'hello-world');
        expect(result).to.eq('docker run --rm hello-world');
    });

    it('cmd.build with transform', async () => {
        const myCmd = cmd('mycmd', {
            quiet: true
        });
        const transform = myCmd.transform;
        myCmd.transform = (opt) => {
            const args = [];
            Object.entries(opt).forEach(([name, value]) => {
                if (value && typeof value === 'string') {
                    args.push(`--${name}=${value}`);
                } else {
                    args.push(...transform({[name]: value}));
                }
            });
            return args;
        };
        const result = myCmd.build({name: 'value'});
        expect(result).to.eq('mycmd --name=value');
    });

    it('options', async () => {
        const npm = cmd('npm', {
            cwd: '/home/user/workspace/my-npm-project',
            printCommand: false
        });
        const result = npm.build({printCommand: true, quiet: true, cwd: '/some/path'}, 'install');
        expect(result).to.eq('npm install');
        const result2 = npm.build('install', {printCommand: true});
        expect(result2).to.eq('npm install --printCommand');
    });

    it('non existing cwd', async () => {
        try {
            await exec('npm', {
                cwd: '/home/user/workspace/my-npm-project'
            }, 'install');
            throw Error('exception expected');
        } catch (e) {
            expect(e).to.eq('The specified cwd does not exist: /home/user/workspace/my-npm-project');
        }
    });

    it('non existing cwd on cmd instance', async () => {
        const npm = cmd('npm', {
            cwd: '/home/user/workspace/my-npm-project'
        });
        try {
            await npm.exec('install');
            throw Error('exception expected');
        } catch (e) {
            expect(e).to.eq('The specified cwd does not exist: /home/user/workspace/my-npm-project');
        }
    });

    it('override cwd', async () => {
        const npm = cmd('npm', {
            cwd: '/home/user/npm-project'
        });
        try {
            await npm.exec({
                cwd: '/home/user/another-project'
            }, 'install');
            throw Error('exception expected');
        } catch (e) {
            expect(e).to.eq('The specified cwd does not exist: /home/user/another-project');
        }
    });
});
