import { ContextOptions, SkwidVariables, IContext } from '@codewyre/skwid-contracts';

export class Context implements IContext {
  //#region Properties
  public get parent(): Context|undefined {
    return this._parent;
  }

  private _variables: SkwidVariables;
  public get variables(): SkwidVariables {
    return this._variables;
  }

  private readonly _children: Context[] = [];
  public get children(): Context[] {
    return this._children;
  }

  public get level(): number {
    let context: Context|undefined = this;
    let level;
    for (level = 0; !!context; level++) {
      context = context.parent;
    }

    return level;
  }
  //#endregion

  //#region Ctor
  public constructor(
    options: ContextOptions,
    private readonly _parent?: Context) {

    this._variables = {...options.variables }
  }
  //#endregion

  //#region Public Methods
  public createChild(options: ContextOptions): Context {
    const child = new Context(options, this);
    this._children.push(child);
    return child;
  }

  public mergeDown(): Context {
    let variables: SkwidVariables = {};

    let context: Context|undefined = this;
    while (context) {
      variables = Object.assign({}, context!.variables, variables);
      context = context.parent;
    }

    return new Context({ variables });
  }
  //#endregion
}