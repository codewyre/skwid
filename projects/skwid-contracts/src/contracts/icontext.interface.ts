import { ContextOptions } from './context-options.model';
import { SkwidVariables } from './skwid-variables.model';

export interface IContext {
  //#region Properties
  readonly parent: IContext|undefined;

  readonly variables: SkwidVariables;
  readonly children: IContext[];
  //#endregion

  //#region Public Methods
  createChild(options: ContextOptions): IContext;
  //#endregion
}