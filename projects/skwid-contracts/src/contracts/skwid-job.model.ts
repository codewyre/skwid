export interface SkwidJob {
  /**
   * Human readable caption for a command. Will be logged and shown to the user.
   */
  name?: string;

  /**
  * Type of this job
  */
  type: string;

  /**
   * Define a variable name to store the result in.
   */
  storeResultAs: string;

  /**
   * Declares if job errors should be ignored.
   */
  continueOnError: boolean | string;

  /**
   * Declares wether this job is silent, printing only it's caption
   */
  silent: boolean | string;
}