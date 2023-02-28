import chalk from 'chalk';
import { Command } from 'commander';
import { inject, injectable } from 'inversify';
import { InjectionTokens } from '../configuration/injection-tokens.enum';
import { SkwidSolutionJobHandler } from '../job-handlers/skwid-solution.job-handler';
import { SkwidConfiguration } from '../models/configuration/skwid-configuration.model';
import { SkwidTask } from '../models/configuration/skwid-task';
import { SkwidTaskRegistry } from '../models/configuration/skwid-task-registry.model';
import { Context } from '../models/context';
import { SkwidTaskProcessor } from './skwid-task-processor';

type ParsedSkwidTask = { parent: ParsedSkwidTask, command: Command };

@injectable()
export class CommanderFactory {

  //#region Ctor
  public constructor(
    @inject(Command) private _program: Command,
    @inject(InjectionTokens.PackageInfo) private _package: { version: string },
    @inject(SkwidTaskProcessor) private _taskProcessor: SkwidTaskProcessor,
    @inject(SkwidSolutionJobHandler) private _solutionJobHandler: SkwidSolutionJobHandler,
    @inject(InjectionTokens.ProcessInfo) private readonly _processInfo: NodeJS.Process) {

    this._program
      .option('--debug', 'Enable detailed debug.')
      .version(this._package.version);
  }
  //#endregion

  //#region Public Methods
  public prepareCli(config: SkwidConfiguration, rootContext: Context): Command {
    if (config.solution) {
      this.prepareCliForSolution(config);
    }

    if (!config?.tasks) {
      return this._program;
    }

    this.createCommand(config.tasks, rootContext);

    return this._program;
  }

  public prepareCliForSolution(config: SkwidConfiguration): void {
    const command = this._program
      .command('run -- [args]')
      .description('Runs the specified command per each project found in a dependency-aware order.');

    command
      .action(async (...args) => {
        const { processedArgs: runArgs }  = args.at(-1);
        this._solutionJobHandler.handleJob('run', ...runArgs);
      });
  }
  //#endregion

  //#region Private Methods
  private createCommand(tasks: SkwidTaskRegistry, context: Context, parent?: ParsedSkwidTask) {
    for (const task in tasks) {
      const childContext = context.createChild({ variables: { } });

      const configuration = tasks[task];
      if (!parent) {
        parent = {
          command: this._program,
          parent: null as any,
        }
      }
      const command = this.parseCommandConfiguration(task, configuration, parent as ParsedSkwidTask, context);
      const thisCommand: ParsedSkwidTask = {
        command,
        parent: parent as ParsedSkwidTask
      };

      if (configuration.children) {
        this.createCommand(
          configuration.children,
          childContext, {
            parent: thisCommand,
            command
          });
      }
    }
  }

  private parseCommandConfiguration(name: string, configuration: SkwidTask, parent: ParsedSkwidTask, context: Context): Command {
    const subCommand = new Command(name);

    if (configuration.description) {
      subCommand.description(configuration.description);
    }

    parent.command.addCommand(subCommand);

    const allParents: string[] = [];
    let current: Command|null = parent.command;
    while (current) {
      allParents.push(current.name());
      current = current.parent;
    }

    if (!configuration.jobs) {
      return subCommand;
    }

    this._taskProcessor
      .verifyConfiguration(configuration);

    subCommand.action(async () => {
      try {
        await this.processSkwidTask(configuration, context);
      } catch (error) {
        const isDebug = this._processInfo.argv.includes('--debug');
        console.log(chalk.red(`An error occurred when running task "${allParents.join(' ').trim()} ${name}":

        ${(error as Error).toString()}`));

        if (isDebug) {
          console.log((error as Error).stack);
          let currentError = (error as any).innerError;
          while (currentError) {
            console.log(
              (error as Error).toString(),
              (error as Error).stack);
            currentError = (error as any).innerError
          }
        }

      }
    });


    return subCommand;
  }

  private processSkwidTask(configuration: SkwidTask, context: Context): Promise<void> {
    return this._taskProcessor.processTask(configuration, context);
  }
  //#endregion
}