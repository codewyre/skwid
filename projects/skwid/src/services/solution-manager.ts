import { inject, injectable, multiInject } from 'inversify';
import { SkwidConfiguration } from '../models/configuration/skwid-configuration.model';
import { SkwidSolutionProjectSource } from '../models/configuration/skwid-solution-project-source.model';
import { SkwidProjectSourceProvider } from '../models/skwid-project-source.provider';
import { SkwidSolutionInformation } from '../models/skwid-solution-information';
import { ConfigurationService } from './configuration.service';

@injectable()
export class SolutionManager {
  //#region Ctor
  public constructor(
    @inject(ConfigurationService) private readonly _configService: ConfigurationService,
    @multiInject(SkwidProjectSourceProvider as any) private readonly _projectSourceProvider: SkwidProjectSourceProvider[]) {
  }
  //#endregion

  //#region Public Methods
  public async getSolution(): Promise<SkwidSolutionInformation> {
    const configurationInfo = this._configService.getConfiguration();
    const { config, path } = configurationInfo;

    if (!config.solution) {
      throw new Error(`Invalid Operation: The given confguration at ${path} does not provide a solution configuration.`);
    }

    const sources = config.solution.sources

    return {
      config: config,
      location: path,
      projects: await this.getProjects(path, config, sources)
    };
  }

  private async getProjects(configLocation: string, config: SkwidConfiguration, sources: SkwidSolutionProjectSource[]) {
    const providerTypes = this._projectSourceProvider.map(provider => provider.type);
    const unavailableProvider = sources.find(source => !providerTypes.includes(source.type))?.type;
    if (unavailableProvider) {
      throw new Error(`Could not find project provider for requested source '${unavailableProvider}'.`);
    }

    const projectsPerSource = await Promise.all(
      sources.map(source =>
        this._projectSourceProvider
          .find(x => x.type === source.type)!
          .getProjects(configLocation, config)))

    return projectsPerSource
      .reduce((prev, cur) => [...prev, ...cur], [])
  }
  //#endregion
}