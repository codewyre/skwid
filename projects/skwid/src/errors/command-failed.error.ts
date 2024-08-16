interface OutputMap {
  [name: string]: string
}

export class CommandFailedError extends Error {

  private _exitCode!: number;
  public get exitCode(): number {
    return this._exitCode;
  }
  private set exitCode(v: number) {
    this._exitCode = v;
  }

  private _outputs!: OutputMap;
  public get outputs(): OutputMap {
    return this._outputs;
  }
  public set outputs(v: OutputMap) {
    this._outputs = v;
  }


  public constructor(message: string, exitCode: number, outputs: OutputMap = {}) {
    super(message);

    this.exitCode = exitCode;
    this.outputs = outputs;
  }
}