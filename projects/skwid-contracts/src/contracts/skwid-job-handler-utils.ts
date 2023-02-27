import { IContext } from './icontext.interface';
import { SkwidJobResult } from './skwid-job-result.model';
import { SkwidJob } from './skwid-job.model';

export interface SkwidJobHandlerUtils {
  runChildJobs(jobs: SkwidJob[], context: IContext): Promise<SkwidJobResult[] | void>;
  interpolate<T>(input: string, context: IContext): T;
  resolveVariable<T>(name: string, context: IContext): T;
  setSkwidExitCode(exitCode: number): void;
  getBreadcrumbs(context: IContext): string[];
  print(data: any, context: IContext, outputChannel?: 'stdout'|'stderr'): void;
  evaluateCondition(condition: string, context: IContext): boolean;
}