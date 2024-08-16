import { SkwidJobHandlerUtils } from '@codewyre/skwid-contracts';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { inject, injectable } from 'inversify';

import { InjectionTokens } from '../configuration/injection-tokens.enum';
import { CommandFailedError } from '../errors/command-failed.error';
import { PathService } from '../models/node/path.service';
import { SkwidSolutionInformation } from '../models/skwid-solution-information';
import { ConfigurationService } from '../services/configuration.service';
import { SolutionManager } from '../services/solution-manager';

type SolutionCommand = 'run'|'info'|'execute';

type SolutionCommandHandlers = {
  [command in SolutionCommand]: () => Promise<void>;
}

interface CommandResult {
  status: number,
  value: string;
  [outputChannel: string]: any;
}
@injectable()
export class SkwidSolutionJobHandler {
  //#region Properties
  private _utils: SkwidJobHandlerUtils|null = null;
  public get utils(): SkwidJobHandlerUtils {
    return this._utils!;
  }
  public set utils(v: SkwidJobHandlerUtils) {
    this._utils = v;
  }
  //#endregion

  //#region Ctor
  public constructor(
    @inject(InjectionTokens.PathService)
    private readonly _pathService: PathService,

    @inject(ConfigurationService)
    private readonly _configurationService: ConfigurationService,

    @inject(SolutionManager)
    private readonly _solutionManager: SolutionManager) { }
  //#endregion

  //#region Public Methods
  public async handleJob(command: SolutionCommand, silent: boolean, ...args: any[]): Promise<void> {
    const solution = await this._solutionManager.getSolution();

    const handlers: SolutionCommandHandlers = {
      execute: () => this.runCommand(solution, args, silent),
      run: () => this.runCommand(solution, ['skwid', ...args], silent),
      info: () => this.printSolutionInfo(solution)
    };

    await handlers[command]();
  }
  //#endregion

  //#region Private Methods
  private async runCommand(solution: SkwidSolutionInformation, args: any[], silent: boolean): Promise<void> {
    console.log('');

    const breadcrumbsList = [solution.config.solution?.name || 'Solution'];
    const breadcrumbsJoin = ' 〉';
    const printBreadcrumbs = () => {
      const content = breadcrumbsList
        .map(x => `${chalk.bgHex('#0e3559')(chalk.white(` ${x} `))}`)
        .join(chalk.bgHex('#ffc400')(chalk.black(breadcrumbsJoin)));

      process.stdout.write(`${chalk.bgHex('#ffc400')(chalk.black(' 〉'))}${content}\n\n`);
    }

    printBreadcrumbs();

    const { path: solutionConfig } = this._configurationService.getConfiguration();

    for (const project of solution.projects) {
      breadcrumbsList.push(project.config?.name || this._pathService.relative(
        this._pathService.dirname(solutionConfig),
        project.location));

      printBreadcrumbs();
      console.log(chalk.cyan(`${chalk.underline(chalk.bold('sh $'))} ${args.join(' ')}\n`));
      try {
        const result = await this.executeCommand(
          silent,
          'sh', ['-c', args.join(' ')],
          project.location);
        breadcrumbsList.pop();
        console.log('');
      } catch (error) {
        if (Object.getPrototypeOf(error).constructor !== CommandFailedError) {
          throw error;
        }
        const commandFailedError = error as CommandFailedError;
        console.error(commandFailedError.message);
        process.exit(commandFailedError.exitCode);
      }
    }
  }

  private async executeCommand(
    silent: boolean,
    command: string,
    args: string[] = [],
    cwd: string = process.cwd()) {

    return await new Promise<CommandResult>((resolve, reject) => {
      let outputs: { [name: string]: string } = {
        stdout: '',
        stderr: ''
      };

      const childProcess = spawn(
        command,
        args, {
          cwd,
          stdio: undefined
        });

      const inputStreams = (childProcess as any as { [name: string]: NodeJS.ReadStream })

      for (const outputStream in outputs) {
        inputStreams[outputStream].setEncoding('utf8');
        inputStreams[outputStream].on('data', (data: Buffer) => {
          outputs[outputStream] += data.toString();
          if (silent) {
            return;
          }

          (process as any)[outputStream as 'stdout'|'stderr'].write(data);
        });
      }

      childProcess.on('close', (code) => {
        if (code !== 0) {
          const error = new CommandFailedError(
            `The command "${command}" resulted in an error:\n${outputs.stderr}`,
            code!,
            outputs);

          reject(error);
          return;
        }

        resolve({
          status: code,
          ...outputs,
          value: outputs.stdout.replace(/\n$/, '')
        });
      });
    });
  }

  private async printSolutionInfo(solution: SkwidSolutionInformation): Promise<void> {

  }
  //#endregion
}