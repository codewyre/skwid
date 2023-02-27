import { SkwidJob } from '@codewyre/skwid-contracts';

export interface SkwidConditionJob extends SkwidJob {
  condition: string | boolean;
  jobs: SkwidJob[];
}