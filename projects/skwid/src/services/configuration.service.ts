import { inject, injectable } from 'inversify';
import mergeDeep from 'merge-deep';
import path from 'path';

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

  //#region Private Methods
  public getConfiguration(location?: string): { config: SkwidConfiguration, path: string } {
    const configFilePath = location || this.resolveConfigFilePath();
    const configFile = this._fileSystem
      .readFileSync(configFilePath)
      .toString();

    let config: SkwidConfiguration = this._yamlService
      .parse(configFile);
    if (Array.isArray(config.extends)) {
      for (const filePath of config.extends) {
        const resolvedPath = this._pathService.join(
          this._pathService.dirname(configFilePath),
          filePath);
        const { config: extendingConfig } = this.getConfiguration(resolvedPath);
        config = mergeDeep(config, extendingConfig);
      }
    }

    if (!location) {
      this._processInfo
        .chdir(this._pathService.dirname(configFilePath));
    }

    return { config, path: configFilePath };
  }

  private resolveConfigFilePath(): string {
    let possiblePath = process.cwd();
    while (possiblePath && possiblePath !== '/') {
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