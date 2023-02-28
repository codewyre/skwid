import { SkwidConfiguration } from './configuration/skwid-configuration.model';
import { SkwidProject } from './skwid-project.model';

export interface SkwidSolutionInformation {
  config: SkwidConfiguration;
  location: string;
  projects: SkwidProject[];
}