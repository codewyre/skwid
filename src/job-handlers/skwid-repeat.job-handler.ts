import { IContext, SkwidJobHandler, SkwidJobHandlerUtils, SkwidVariables } from '@codewyre/skwid-contracts';
import { SkwidRepeatJob } from '../models/configuration/job-types/skwid-repeat-job';
import { injectable } from 'inversify';

@injectable()
export class SkwidRepeatJobHandler implements SkwidJobHandler<SkwidRepeatJob> {
  //#region Public Constants
  public readonly type: string = 'repeat';
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
  public verify(configuration: SkwidRepeatJob): void {
    const { forEach, from, of, to, while: whileCondition } = configuration;
    if ([forEach, from, whileCondition].filter(x => !!x).length !== 1) {
      throw new Error(`Misconfigured 'repeat' job detected:
        A repeat job must contain at least and at maximum one of the following properties:
          forEach, from, while`);
    }

    if (forEach && !of) {
      throw new Error(`Misconfigured 'repeat' job detected:
        A repeat job with a "forEach" property must contain a "of" property, setting the list to iterate over`);
    }

    if (from && !to) {
      throw new Error(`Misconfigured 'repeat' job detected:
        A repeat job with a "from" property must contain a "to" property, setting the target to iterate to`);
    }
  }

  public async handleJob(configuration: SkwidRepeatJob, context: IContext): Promise<void> {
    const handlers: { [key: string]: (configuration: SkwidRepeatJob, context: IContext) => Promise<void> } = {
      forEach: (configuration, context) => this.handleForEachJob(configuration, context),
      while: (configuration, context) => this.handleWhileJob(configuration, context),
      from: (configuration, context) => this.handleForJob(configuration, context)
    };

    const { value: handler } = Object
      .keys(configuration)
      .map(key => ({ key, value: handlers[key] }))
      .find(({ key }) => handlers[key])!;

    await handler(configuration, context);
  }
  //#endregion

  //#region Private Methods
  private async handleForEachJob(configuration: SkwidRepeatJob, context: IContext): Promise<void> {
    let index = 0;

    let inputList = configuration.of as any[];
    if (typeof configuration.of === 'string') {
      inputList = this.utils.interpolate<any[]>(configuration.of, context);
    }

    for (const item of inputList) {
      const itemVariableName: string = this.utils
        .interpolate(configuration.forEach, context);

      const indexVariableName: string = this.utils
        .interpolate(configuration.index, context);

      const variables: SkwidVariables = {
        [itemVariableName]: item,
        [indexVariableName]: index
      };

      await this.handleJobsForIteration(configuration, context, variables);
      index++;
    }
  }

  private async handleForJob(configuration: SkwidRepeatJob, context: IContext): Promise<void> {
    const from = this.interpolateToNumber(configuration.from, context);
    const to = this.interpolateToNumber(configuration.to, context);
    const step = configuration.step
      ? this.interpolateToNumber(configuration.step, context)
      : 1;

    const check = (index: number, to: number, from: number ) => {
      return to > from
        ? index <= to
        : index >= to
    }

    if (step === 0) {
      throw new Error(
        `Endless loop detected. Iteration target "${to}", starting from "${from}", while increasing index by "${step}" can never be reached!\n("Step" is zero)`)
    }

    if (step < 0 && to > from) {
      throw new Error(
        `Endless loop detected. Iteration target "${to}", starting from "${from}", while increasing index by "${step}" can never be reached!\n("Step" is negative, while "to" is greater than "from")`)
    }


    if (step > 0 && to < from) {
      throw new Error(
        `Endless loop detected. Iteration target "${to}", starting from "${from}", while increasing index by "${step}" can never be reached!\n("Step" is a positive value, while "to" is less than "from")`)
    }


    for (let index = from; check(index, to, from); index += step) {
      const indexVariableName: string = this.utils
        .interpolate(configuration.index, context);

      const variables: SkwidVariables = {
        [indexVariableName]: index
      };

      await this.handleJobsForIteration(configuration, context, variables);
    }
  }

  private interpolateToNumber(value: string|number, context: IContext) {
    let numberValue: number = value as number;
    if (typeof numberValue === 'string') {
      numberValue = this.utils.interpolate(numberValue, context);
    }

    return numberValue;
  }

  private async handleWhileJob(configuration: SkwidRepeatJob, context: IContext): Promise<void> {
    while (this.utils.evaluateCondition(configuration.while, context)) {
      const variables: SkwidVariables = { };

      await this.handleJobsForIteration(configuration, context, variables);
    }
  }

  private async handleJobsForIteration(configuration: SkwidRepeatJob, context: IContext, variables: SkwidVariables) {
    await this.utils.runChildJobs(
      configuration.jobs,
      context.createChild({ variables }));
  }
  //#endregion
}