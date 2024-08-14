import { execSync } from 'child_process';
import { inject, injectable } from 'inversify';

import { InjectionTokens } from '../configuration/injection-tokens.enum';
import { ProjectSourceType } from '../models/configuration/project-source-type.enum';
import { SkwidConfiguration } from '../models/configuration/skwid-configuration.model';
import { FileSystemService } from '../models/node/file-system.service';
import { PathService } from '../models/node/path.service';
import { SkwidProjectSourceProvider } from '../models/skwid-project-source.provider';
import { SkwidProject } from '../models/skwid-project.model';
import { ConfigurationService } from './configuration.service';

interface LernaPackageInfo {
  location: string;
  name: string;
  version: string;
  private: boolean;
}

@injectable()
export class YarnWorkspaceProjectProvider extends SkwidProjectSourceProvider {
  public get type(): string {
    return ProjectSourceType.YarnWorkspace;
  }

  //#region Ctor
  public constructor(
    @inject(InjectionTokens.PathService) protected readonly _pathService: PathService,
    @inject(InjectionTokens.FileSystemService) protected readonly _fileSystemService: FileSystemService,
    @inject(ConfigurationService) protected readonly _configurationService: ConfigurationService) {
    super(_pathService, _configurationService);
  }
  //#endregion

  public async getProjects(configLocation: string, config: SkwidConfiguration): Promise<SkwidProject[]> {
    const yarnBinary = 'yarn';
    const packageInfos = this.loadProjectInfos(yarnBinary);

    return Promise.all(
      Object.values(packageInfos).map(({ location }) =>
        this.parseProject(
          configLocation,
          location
        )));
  }

  private loadProjectInfos(yarnBinary: string): LernaPackageInfo[] {
    const lernaDeps = execSync(
      `${yarnBinary} -s workspaces info`, {
        stdio: []
      })
      .toString();

    return JSON.parse(lernaDeps);
  }
}