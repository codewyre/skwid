import { SkwidJob } from '@codewyre/skwid-contracts';

export interface SkwidRepeatJob extends SkwidJob {
  /**
   * Set the name of the variable that contains one loop item of the list given in `of`
   * Cannot be used together with `from` or `while`
   * Must be used with `of`.
   */
  forEach: string;

  /**
   * Get or set index variable name
   */
  index: string;

  /**
   * Set the number the loop should start with
   * Cannot be used together with `while` or `forEach`.
   * Must be used with `to`.
   */
  from: number | string;

  /**
   * Set the number the loop should end with
   * Must be used with `from`.
   */
  to: number | string;

  /**
   * Set the step that should be made after each iteration. Defaults to `1`.
   * May contain negative values.
   * Must be used with `from`
   */
  step: number | string;

  /**
   * The list to iterate through.
   * Must be used with `forEach`
   */
  of: string | any[];

  /**
   * Condition that indicates wether the loop should continue iterating.
   * Cannot be used together with `from` or `forEach`
   */
  while: string;

  /**
   * Sub-jobs to run on each iteration.
   */
  jobs: SkwidJob[];
}