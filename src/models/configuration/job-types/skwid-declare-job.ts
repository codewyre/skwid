import { SkwidJob } from '@codewyre/skwid-contracts';
import { SkwidVariables } from '@codewyre/skwid-contracts';

export interface SkwidDeclareJob extends SkwidJob {
  variables: SkwidVariables;
}