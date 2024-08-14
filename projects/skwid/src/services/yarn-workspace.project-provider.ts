import { execSync } from 'child_process';
import { inject, injectable } from 'inversify';
import { array as toposort } from 'toposort';

import { InjectionTokens } from '../configuration/injection-tokens.enum';
import { ProjectSourceType } from '../models/configuration/project-source-type.enum';
import { SkwidConfiguration } from '../models/configuration/skwid-configuration.model';
import { FileSystemService } from '../models/node/file-system.service';
import { PathService } from '../models/node/path.service';
import { SkwidProjectSourceProvider } from '../models/skwid-project-source.provider';
import { SkwidProject } from '../models/skwid-project.model';
import { ConfigurationService } from './configuration.service';

interface YarnWorkspace {
  workspaceDependencies: string[];
  location: string;
  mismatchedWorkspaceDependencies: string[];
}
interface YarnWorkspaceInfo {
  [packageName: string]: YarnWorkspace;
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
    const workspaceInfo = this.loadProjectInfos(yarnBinary);
    const sortedWorkspaces = this.getWorkspacesInTopologicalOrder(workspaceInfo);

    return Promise.all(
      sortedWorkspaces.map(({ location }) =>
        this.parseProject(
          configLocation,
          location
        )));
  }

  private getWorkspacesInTopologicalOrder(workspaceInfo: YarnWorkspaceInfo) {
    const topologicalInput: {
      nodes: Array<string>
      edges: Array<[string, string]>
    } = { nodes: [], edges: [] };

    for (const [packageName, { workspaceDependencies }] of Object.entries(workspaceInfo)) {
      topologicalInput.nodes.push(packageName);
      if (workspaceDependencies?.length) {
        topologicalInput.edges.push(
          ...workspaceDependencies.map(dependency => [
            packageName,
            dependency
          ] as [string, string]));
      }
    }

    let sortedPackages: string[];
    try {
      sortedPackages = toposort(
        topologicalInput.nodes,
        topologicalInput.edges);
      sortedPackages.reverse();
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }

    return sortedPackages
      .map(workspaceName => workspaceInfo[workspaceName]);
  }

  private loadProjectInfos(yarnBinary: string): YarnWorkspaceInfo {
    const workspaces = execSync(
      `${yarnBinary} -s workspaces info`, {
        stdio: []
      })
      .toString();

    return JSON.parse(workspaces);
  }
}