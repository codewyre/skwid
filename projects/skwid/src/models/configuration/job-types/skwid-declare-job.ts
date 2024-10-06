import { SkwidJob, SkwidVariables } from '@codewyre/skwid-contracts';

export interface SkwidDeclareJob extends SkwidJob {
  variables: SkwidVariables;
  level: 'global' | number;
}