import { SkwidJobResult } from '..';
import { IContext } from '../contracts/icontext.interface';
import { SkwidJobHandlerUtils } from '../contracts/skwid-job-handler-utils';
import { SkwidJob } from '../contracts/skwid-job.model';

export interface SkwidJobHandler<T extends SkwidJob> {
  readonly type: string;
  utils: SkwidJobHandlerUtils;

  verify(configuration: T): void;
  handleJob(configuration: T, context: IContext): Promise<SkwidJobResult | void>;
}
