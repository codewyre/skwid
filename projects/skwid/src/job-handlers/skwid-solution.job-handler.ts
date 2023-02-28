import chalk from 'chalk';
import { spawnSync } from 'child_process';
import { inject, injectable } from 'inversify';
import { InjectionTokens } from '../configuration/injection-tokens.enum';
import { PathService } from '../models/node/path.service';
import { SkwidSolutionInformation } from '../models/skwid-solution-information';
import { ConfigurationService } from '../services/configuration.service';
import { SolutionManager } from '../services/solution-manager';

type SolutionCommand = 'run'|'info';

type SolutionCommandHandlers = {
  [command in SolutionCommand]: () => Promise<void>;
}

@injectable()
export class SkwidSolutionJobHandler {
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
  public async handleJob(command: SolutionCommand, ...args: any[]): Promise<void> {

    const solution = await this._solutionManager.getSolution();

    const handlers: SolutionCommandHandlers = {
      run: () => this.runCommand(solution, args),
      info: () => this.printSolutionInfo(solution)
    };

    await handlers[command]();
  }
  //#endregion

  //#region Private Methods
  private async runCommand(solution: SkwidSolutionInformation, args: any[]): Promise<void> {
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
      spawnSync(
        'sh',
        ['-c', args.join(' ')], {
          stdio: [0, 1, 2],
          cwd: project.location
        });

      breadcrumbsList.pop();
    }
  }

  private async printSolutionInfo(solution: SkwidSolutionInformation): Promise<void> {

  }
  //#endregion
}