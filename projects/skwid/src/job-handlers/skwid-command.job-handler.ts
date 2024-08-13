import { SkwidJobHandler, SkwidJobHandlerUtils, SkwidJobResult } from '@codewyre/skwid-contracts';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { injectable } from 'inversify';

import { SkwidCommandJob } from '../models/configuration/job-types/skwid-command-job';
import { Context } from '../models/context';

@injectable()
export class SkwidCommandJobHandler implements SkwidJobHandler<SkwidCommandJob> {
  //#region Public Constants
  public readonly type: string = 'command';
  //#endregion

  //#region Properties
  private _utils: SkwidJobHandlerUtils|null = null;
  public get utils(): SkwidJobHandlerUtils {
    return this._utils!;
  }
  public set utils(v: SkwidJobHandlerUtils) {
    this._utils = v;
  }
  //#endregion

  //#region Public Methods
  public verify(configuration: SkwidCommandJob): void {
    if (!configuration.command) {
      throw new Error(`Command for job of type 'command' not set: ${JSON.stringify(configuration, null, 2)}`);
    }
  }

  public async handleJob(configuration: SkwidCommandJob, context: Context): Promise<SkwidJobResult> {
    const continueOnError: boolean = configuration.continueOnError
      ? this.utils.interpolate(configuration.continueOnError as string, context)
      : false;
    const silent: boolean = configuration.silent
      ? this.utils.interpolate(configuration.silent as string, context)
      : false;
    const command = this.utils.interpolate(configuration.command, context);
    const shell: string = this.utils
      .interpolate(configuration.shell || 'sh', context);

    const workingDirectory = configuration.workingDirectory
      ? this.utils.interpolate<string>(configuration.workingDirectory, context)
      : this.utils.interpolate<string>('${skwid$.configurationDirectory}', context);

    let outputs: { [name: string]: string } = {
      stdout: '',
      stderr: ''
    };

    const childProcess = spawn(
      shell,
      ['-c', `${command}`], {
        stdio: undefined,
        cwd: workingDirectory
      });

    const exitCondition = this.getExitCondition(childProcess, continueOnError, command, outputs);
    const inputStreams = (childProcess as any as { [name: string]: NodeJS.ReadStream })

    for (const outputStream in outputs) {
      inputStreams[outputStream].setEncoding('utf8');
      inputStreams[outputStream].on('data', (data: Buffer) => {
        outputs[outputStream] += data.toString();

        if (silent) {
          return;
        }

        this.utils.print(data, context.createChild({ variables: {} }), outputStream as 'stdout'|'stderr');
      });
    }

    return exitCondition;
  }

  private getExitCondition(childProcess: ChildProcessWithoutNullStreams, continueOnError: boolean, command: unknown, outputs: { [name: string]: string; }): SkwidJobResult | PromiseLike<SkwidJobResult> {
    return new Promise((resolve, reject) => childProcess.on('close', (code: number) => {
      if (!continueOnError && code !== 0) {
        const error = new Error(`The command "${command}" resulted in an error:\n${outputs.stderr}`);
        (error as any).statusCode = code;
        (error as any).stderr = outputs.stderr;
        (error as any).stdout = outputs.stdout;
        this.utils.setSkwidExitCode(code);
        reject(error);
        return;
      }

      resolve({
        result: {
          status: code,
          ...outputs,
          value: outputs.stdout.replace(/\n$/, '')
        },
        cancelFlow: false
      });
    }));
  }
  //#endregion
}