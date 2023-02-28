import * as path from 'path';
import { inject, injectable } from 'inversify';
import { SkwidConfiguration } from './configuration/skwid-configuration.model';
import { SkwidProject } from './skwid-project.model';
import { ConfigurationService } from '../services/configuration.service';
import { PathService } from './node/path.service';
import { InjectionTokens } from '../configuration/injection-tokens.enum';


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
    } catch {
      throw new Error(`Error reading configuration for project at ${projectPath}.`);
    }
  }
}