import { SkwidJob } from '@codewyre/skwid-contracts';

export interface SkwidCommandJob extends SkwidJob {
  /**
   * Command to execute
   */
  command: string;

  /**
   * Directory where to execute the command in.
   * Defaults to the configuration directory of Skwid.
   */
  workingDirectory?: string;

  /**
   * Shell to run the command in. Defaults to `/bin/sh`.
   */
  shell: string;
}