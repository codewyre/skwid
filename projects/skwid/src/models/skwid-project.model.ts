import { SkwidConfiguration } from './configuration/skwid-configuration.model';

export interface SkwidProject {
  config: SkwidConfiguration;
  location: string;
}