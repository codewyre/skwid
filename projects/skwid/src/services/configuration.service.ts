import { inject, injectable } from 'inversify';
import { InjectionTokens } from '../configuration/injection-tokens.enum';
import { SkwidConfiguration } from '../models/configuration/skwid-configuration.model';
import { FileSystemService } from '../models/node/file-system.service';
import { PathService } from '../models/node/path.service';
import { YamlService } from '../models/node/yaml.service';

@injectable()
export class ConfigurationService {
  //#region Ctor
  public constructor(
    @inject(InjectionTokens.PathService) private readonly _pathService: PathService,
    @inject(InjectionTokens.FileSystemService) private readonly _fileSystem: FileSystemService,
    @inject(InjectionTokens.YamlService) private readonly _yamlService: YamlService,
    @inject(InjectionTokens.ProcessInfo) private readonly _processInfo: NodeJS.Process) { }
  //#endregion

  //#region Public Methods
  public readConfiguration() {
  }
  //#endregion

  //#region Private Methods
  public getConfiguration(): { config: SkwidConfiguration, path: string } {
    const configFilePath = this.resolveConfigFilePath();
    const configFile = this._fileSystem
      .readFileSync(configFilePath)
      .toString();

    const config: SkwidConfiguration = this._yamlService
      .parse(configFile);

    this._processInfo
      .chdir(this._pathService.dirname(configFilePath));

    return { config, path: configFilePath };
  }

  private resolveConfigFilePath(): string {
    let possiblePath = process.cwd();
    while (possiblePath) {
      let configPath = this._pathService.join(possiblePath, 'skwid.yaml');
      if (this._fileSystem.existsSync(configPath)) {
        return configPath;
      }

      configPath = this._pathService.join(possiblePath, 'skwid.yml');
      if (this._fileSystem.existsSync(configPath)) {
        return configPath;
      }

      possiblePath = this._pathService.dirname(possiblePath);
    }

    throw new Error('Could not find valid configuration file in current working directory or one of its parents.');
  }
  //#endregion
}