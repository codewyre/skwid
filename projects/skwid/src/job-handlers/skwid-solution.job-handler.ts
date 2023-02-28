import { inject, injectable } from 'inversify';
import { SolutionManager } from '../services/solution-manager';

@injectable()
export class SkwidSolutionJobHandler {
  //#region Ctor
  public constructor(@inject(SolutionManager) private readonly _solutionManager: SolutionManager) {

  }
  //#endregion

  //#region Public Methods
  public async handleJob(command: 'run'|'info', ...args: any[]): Promise<void> {
    const solution = await this._solutionManager.getSolution();
    console.log(JSON.stringify(solution, null, 2));
  }
  //#endregion
}