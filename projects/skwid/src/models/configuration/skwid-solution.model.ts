import { SkwidSolutionProjectSource } from './skwid-solution-project-source.model';

export interface SkwidSolution {
  name?: string;
  sources: SkwidSolutionProjectSource[];
}