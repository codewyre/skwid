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
export class LernaProjectProvider extends SkwidProjectSourceProvider {
  public get type(): string {
    return ProjectSourceType.Lerna;
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
    const lernaBinary = this.getLernaBinaryPath();
    const packageInfos = this.loadProjectInfos(lernaBinary);

    return Promise.all(packageInfos.map(({ location }) =>
      this.parseProject(
        configLocation,
        location
      )));
  }

  private loadProjectInfos(lernaBinary: string): LernaPackageInfo[] {
    const lernaDeps = execSync(
      `${lernaBinary} ls --json`, {
        stdio: []
      })
      .toString();

    return JSON.parse(lernaDeps);
  }

  private getLernaBinaryPath(): string {
    let dir = process.cwd();

    let lastDir = null;

    while (lastDir !== dir && !this._fileSystemService.existsSync(
      this._pathService.join(dir, 'node_modules', '.bin', 'lerna'))) {
      lastDir = dir;
      dir = this._pathService.dirname(dir);
    }

    if (lastDir === dir) {
      throw new Error('Could not find lerna.')
    }

    return this._pathService.join(dir, 'node_modules', '.bin', 'lerna');
  }
}