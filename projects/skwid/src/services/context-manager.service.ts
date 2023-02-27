import { injectable } from 'inversify';
import { Context } from '../models/context';

@injectable()
export class ContextManagerService {
  //#region Private Variables
  private readonly _context = new Context({ variables: {}});
  //#endregion

  //#region Public Methods
  public getRoot(): Context {
    return this._context;
  }
  //#endregion
}