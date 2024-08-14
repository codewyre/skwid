import { inject, injectable } from 'inversify';
import * as path from 'path';

import { InjectionTokens } from '../configuration/injection-tokens.enum';
import { ConfigurationService } from '../services/configuration.service';
import { SkwidConfiguration } from './configuration/skwid-configuration.model';
import { PathService } from './node/path.service';
import { SkwidProject } from './skwid-project.model';


@injectable()
export abstract class SkwidProjectSourceProvider {
  abstract readonly type: string;
  abstract getProjects(configLocation: string, config: SkwidConfiguration): Promise<SkwidProject[]>;


  //#region Ctor
  public constructor(
    @inject(InjectionTokens.PathService) protected readonly _pathService: PathService,
    @inject(ConfigurationService) protected readonly _configurationService: ConfigurationService) { }
  //#endregion

  protected parseProject(configPath: string, projectPath: string): SkwidProject {
    const location = this._pathService.resolve(path.dirname(configPath), projectPath);
    try {
      const { config } = this._configurationService.getConfiguration(this._pathService.join(location, 'skwid.yaml'));

      return {
        location,
        config
      };
    } catch (err) {
      throw new Error(`Error reading configuration for project at ${projectPath}: ` + (err as Error).message);
    }
  }
}