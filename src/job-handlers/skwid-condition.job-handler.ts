import { IContext, SkwidJobHandler } from '@codewyre/skwid-contracts';
import { SkwidConditionJob } from '../models/configuration/job-types/skwid-condition-job';
import { injectable } from 'inversify';
import { SkwidJobHandlerUtils } from '@codewyre/skwid-contracts';

@injectable()
export class SkwidConditionJobHandler implements SkwidJobHandler<SkwidConditionJob> {
  //#region Public Constants
  public readonly type: string = 'condition';
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
  public verify(): void { }

  public async handleJob(configuration: SkwidConditionJob, context: IContext): Promise<void> {
    let condition: boolean|string = configuration.condition;
    if (typeof condition !== 'string' && !condition) {
      return;
    }

    if (typeof condition === 'string' && !this.utils.evaluateCondition(condition, context)) {
      return;
    }

    await this.utils.runChildJobs(configuration.jobs, context.createChild({ variables: { } }));
  }
  //#endregion
}