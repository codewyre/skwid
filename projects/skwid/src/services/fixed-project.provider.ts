import { inject, injectable } from 'inversify';
import { ProjectSourceType } from '../models/configuration/project-source-type.enum';
import { SkwidConfiguration } from '../models/configuration/skwid-configuration.model';
import { SkwidSolutionProjectSource } from '../models/configuration/skwid-solution-project-source.model';
import { SkwidProjectSourceProvider } from '../models/skwid-project-source.provider';
import { SkwidProject } from '../models/skwid-project.model';

export interface FixedProjectProviderConfig extends SkwidSolutionProjectSource{
  projects: string[];
}

@injectable()
export class FixedProjectProvider extends SkwidProjectSourceProvider {
  public get type(): string {
    return ProjectSourceType.Fixed;
  }

  public async getProjects(configLocation: string, config: SkwidConfiguration): Promise<SkwidProject[]> {
    const fixedProjectSources = (config.solution?.sources || [])
      .filter(source => source.type === ProjectSourceType.Fixed)
      .map(source => source as FixedProjectProviderConfig)

    if (fixedProjectSources.some(source => !Array.isArray(source.projects))) {
      throw new Error(`Invalid project source configuration for provider 'fixed'. Property 'projects' must be existing and of type Array<string>.`);
    }

    return fixedProjectSources
      .map(source => source.projects)
      .map(projects => projects.map(project =>
        this.parseProject(configLocation, project)))
      .reduce((prev, cur) => [...prev, ...cur], []);
  }
}