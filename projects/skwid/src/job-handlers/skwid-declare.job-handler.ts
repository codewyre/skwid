import { IContext, SkwidJobHandler, SkwidJobHandlerUtils, SkwidVariables } from '@codewyre/skwid-contracts';
import { injectable } from 'inversify';

import { SkwidDeclareJob } from '../models/configuration/job-types/skwid-declare-job';

@injectable()
export class SkwidDeclareJobHandler implements SkwidJobHandler<SkwidDeclareJob> {
  //#region Public Constants
  public readonly type: string = 'declare';
  //#endregion

  //#region Properties
  private _utils: SkwidJobHandlerUtils | null = null;
  public get utils(): SkwidJobHandlerUtils {
    return this._utils!;
  }
  public set utils(v: SkwidJobHandlerUtils) {
    this._utils = v;
  }
  //#endregion

  //#region Public Methods
  public verify(): void { }

  public async handleJob(configuration: SkwidDeclareJob, context: IContext): Promise<void> {
    const deeplyInterpolatedConfiguration = this.interpolate(configuration.variables, context);
    let assignedContext = context;
    if (configuration.level) {
      if (configuration.level === 'global') {
        while (assignedContext.parent) {
          assignedContext = assignedContext.parent;
        }
      } else {
        for (let level = 0; level < configuration.level; level++) {
          assignedContext = assignedContext.parent!;
        }
      }
    }

    Object.assign(assignedContext.variables, deeplyInterpolatedConfiguration);
  }
  //#endregion

  //#region Private Methods
  private interpolate(container: SkwidVariables, context: IContext): SkwidVariables {
    const newObject: SkwidVariables = { ...container };
    for (const variable in newObject) {
      const value = newObject[variable];

      if (Array.isArray(value)) {
        newObject[variable] = value.map(x => this.interpolate(x, context));
        continue;
      }

      if (typeof value === 'object') {
        newObject[variable] = this.interpolate(value, context);
        continue;
      }

      if (typeof value !== 'string') {
        continue;
      }

      newObject[variable] = this.utils.interpolate(value, context);
    }

    return newObject;
  }
  //#endregion
}