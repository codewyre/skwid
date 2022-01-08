import chalk from 'chalk';
import { SkwidConfiguration } from '../models/configuration/skwid-configuration.model';
import { Context } from '../models/context';
import { ContextManagerService } from '../services/context-manager.service';
import { inject, injectable } from 'inversify';
import { ConfigurationService } from '../services/configuration.service';
import { CommanderFactory } from '../services/commander-factory';
import { InjectionTokens } from '../configuration/injection-tokens.enum';
import { PathService } from '../models/node/path.service';

@injectable()
export class Application {
  //#region Ctor
  public constructor(
    @inject(ContextManagerService) private readonly _contextManager: ContextManagerService,
    @inject(ConfigurationService) private readonly _configurationService: ConfigurationService,
    @inject(CommanderFactory) private readonly _commanderFactory: CommanderFactory,
    @inject(InjectionTokens.PathService) private readonly _pathService: PathService,
    @inject(InjectionTokens.ProcessInfo) private readonly _processInfo: NodeJS.Process) { }
  //#endregion

  //#region Public Method
  public async run(): Promise<void> {
    try {
      const { config, path } = this._configurationService.getConfiguration();
      const runtimeContext = this.setupContext(config, path);

      const program = this._commanderFactory
        .prepareCli(config, runtimeContext);

      program
        .name('skwid')
        .parse(this._processInfo.argv);

      const args = process.argv.filter(x => !x.startsWith('--'));
      if (args.length === 2) {
        console.log(program.helpInformation());
      }
    } catch(error) {
      console.log(chalk.red(`An error occurred: ${(error as Error).toString()}`));
      if (this._processInfo.argv.includes('--debug')) {
        let currentError = (error as any).innerError;
        while (currentError) {
          console.log(currentError.toString());
          currentError = (error as any).innerError
        }
      }
    }
  }
  //#endregion

  //#region Private Methods
  private setupContext(config: SkwidConfiguration, path: string): Context {
    const rootContext = this._contextManager
      .getRoot();

    return rootContext
      .createChild({
        variables: Object.assign({}, process.env, {
          skwid$: {
            configurationDirectory: this._pathService.dirname(path),
            configurationFile: path
          }
        })
      })
      .createChild({ variables: config?.variables || {} });
  }
  //#endregion
}
