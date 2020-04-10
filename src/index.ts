import {spawn, SpawnOptions} from 'child_process';

export interface ObjectOption {
    [key: string]: string | boolean | number | undefined | null;
}

export type Option = ObjectOption | string;

export type Options = Option | Option[];

export type TransformOption = (opt: ObjectOption) => string[];

export interface ArgsObject {
    args: string[];
    cwd?: string;
    printCommand?: boolean;
    quiet?: boolean;
}

/**
 * Global command options.
 * Used for every execution on the command instance.
 * Can be overridden with first exec option.
 *
 * @see {Option}
 */
export interface CommandOptions {
    cwd?: string;
    printCommand?: boolean;
    quiet?: boolean;
}

/**
 * Create a new command.
 *
 * @param name of the command
 * @param options the command options
 */
export function cmd(name: string, options: CommandOptions = {}): Command {
    return new Command(name, options);
}

/**
 * Build a command as a string without executing it.
 *
 * First option can contains values to override command behaviour.
 * <ul>
 *  <li>cwd - (default, process.cwd()), the current working directory</li>
 *  <li>printCommand - (default: true), print command before execution,
 *  command is not printed if quiet is set to true </li>
 *  <li>quiet - (default: false), suppress stdout and stderr</li>
 * </ul>
 *
 * Examples
 *
 * exec('npm', {v: true});
 *
 * exec('npm', {version: true});
 *
 * exec('java', ['-version']);
 *
 * exec('npm', {quiet: true}, 'install'); // stdout and stderr suppressed
 *
 * @param name of the command
 * @param options the command options
 */
export function build(name: string, ...options: Options[]): string {
    return cmd(name).build(...options);
}

/**
 * Execute a command.
 *
 * First option can contains values to override command behaviour.
 * <ul>
 *  <li>cwd - (default, process.cwd()), the current working directory</li>
 *  <li>printCommand - (default: true), print command before execution,
 *  command is not printed if quiet is set to true </li>
 *  <li>quiet - (default: false), suppress stdout and stderr</li>
 * </ul>
 *
 * Examples
 *
 * exec('npm', {v: true});
 *
 * exec('npm', {version: true});
 *
 * exec('java', ['-version']);
 *
 * exec('npm', {quiet: true}, 'install'); // stdout and stderr suppressed
 *
 * @param name of the command
 * @param options the command options
 */
export async function exec(name: string, ...options: Options[]): Promise<any> {
    return cmd(name).exec(...options);
}

/**
 * The command class.
 *
 * Includes methods build and exec.
 */
class Command {

    public transform: TransformOption = defaultTransform;
    private readonly name: string;
    private options: CommandOptions;

    constructor(name: string, options: CommandOptions = {}) {
        this.name = name;
        this.options = {
            cwd: process.cwd(),
            printCommand: true,
            quiet: false,
            ...options
        };
    }

    /**
     * Build the command as a string without executing it.
     *
     * First option can contains values to override command behaviour.
     * <ul>
     *  <li>cwd - (default, process.cwd()), the current working directory</li>
     *  <li>printCommand - (default: true), print command before execution,
     *  command is not printed if quiet is set to true </li>
     *  <li>quiet - (default: false), suppress stdout and stderr</li>
     * </ul>
     *
     * Examples
     *
     * exec('npm', {v: true});
     *
     * exec('npm', {version: true});
     *
     * exec('java', ['-version']);
     *
     * exec('npm', {quiet: true}, 'install'); // stdout and stderr suppressed
     *
     * @param options the command options
     */
    public build(...options: Options[]): string {
        const argsObj: ArgsObject = transformOptions(options, this.transform);
        return `${this.name} ${argsObj.args.join(' ')}`;
    }

    /**
     * Execute the command.
     *
     * First option can contains values to override command behaviour.
     * <ul>
     *  <li>cwd - (default, process.cwd()), the current working directory</li>
     *  <li>printCommand - (default: true), print command before execution,
     *  command is not printed if quiet is set to true </li>
     *  <li>quiet - (default: false), suppress stdout and stderr</li>
     * </ul>
     *
     * Examples
     *
     * cmd('npm').exec({v: true});
     *
     * cmd('npm').exec({version: true});
     *
     * cmd('java').exec(['-version']);
     *
     * cmd('npm').exec({quiet: true}, 'install'); // stdout and stderr suppressed
     *
     * @param options the command options
     */
    public async exec(...options: Options[]): Promise<any> {
        const argsObj: ArgsObject = transformOptions(options, this.transform);
        const quiet = isBoolean(argsObj.quiet) ? argsObj.quiet : this.options.quiet;
        const printCommand = isBoolean(argsObj.printCommand) ? argsObj.printCommand : this.options.printCommand;
        const cwd = argsObj.cwd ? argsObj.cwd : this.options.cwd;
        const execCommand = `${this.name} ${argsObj.args.join(' ')}`;
        if (!quiet && printCommand) {
            console.log(`$ ${execCommand}`);
        }
        return spawnProcess(this.name, argsObj.args, quiet, cwd);
    }
}

const isBoolean = (it: any) => [true, false].includes(it);

function isPlainObject(o: any): boolean {
    return typeof o === 'object' && o.constructor === Object;
}

async function spawnProcess(bin: string, args: string[], quiet: boolean, cwd: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const spawnOptions: SpawnOptions = {
            cwd
        };
        if (!quiet) {
            spawnOptions.stdio = 'inherit';
        }
        const spawned = spawn(bin, args, spawnOptions);
        spawned.on('exit', (exitCode) => {
            exitCode === 0 ? resolve() : reject(new Error(`Exit with code: ${exitCode}`));
        });
    });
}

function transformOptions(options: Options[], transform: TransformOption): ArgsObject {
    const argsObj: ArgsObject = {
        args: [],
    };
    options.forEach((opt: Options, idx: number) => {
        if (Array.isArray(opt)) {
            opt.forEach((it: Option) => {
                if (isPlainObject(it)) {
                    argsObj.args.push(...defaultTransform(it as ObjectOption));
                } else if (typeof it === 'string') {
                    argsObj.args.push(it);
                }
            });
        } else if (isPlainObject(opt)) {
            if (idx === 0) {
                const transformed: ArgsObject = transformFirstOption(opt as ObjectOption, transform);
                argsObj.args.push(...transformed.args);
                argsObj.cwd = transformed.cwd;
                argsObj.printCommand = transformed.printCommand;
                argsObj.quiet = transformed.quiet;
            } else {
                argsObj.args.push(...defaultTransform(opt as ObjectOption));
            }
        } else if (typeof opt === 'string') {
            argsObj.args.push(opt);
        }
    });
    return argsObj;
}

function transformFirstOption(opt: ObjectOption, transform: TransformOption): ArgsObject {
    const argsObj: ArgsObject = {
        args: [],
    };
    const filteredOption: Option = {};
    Object.keys(opt).forEach((flagName) => {
        const flagValue = opt[flagName];
        if (flagName === 'quiet') {
            argsObj.quiet = flagValue === true;
        } else if (flagName === 'printCommand') {
            argsObj.printCommand = flagValue === true;
        } else if (flagName === 'cwd') {
            argsObj.cwd = flagValue.toString();
        } else {
            filteredOption[flagName] = flagValue;
        }
    });
    argsObj.args.push(...transform(filteredOption));
    return argsObj;
}

function defaultTransform(opt: ObjectOption): string[] {
    const args: string[] = [];
    Object.keys(opt).forEach((flagName) => {
        const flagValue = opt[flagName];
        if (isBoolean(flagValue) && flagValue === true) {
            if (flagName.length === 1) {
                args.push(`-${flagName}`);
            } else {
                args.push(`--${flagName}`);
            }
        } else if (!isBoolean(flagValue) && flagValue) {
            args.push(`--${flagName}`, `${flagValue}`);
        }
    });
    return args;
}
