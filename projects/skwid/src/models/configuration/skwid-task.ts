import { SkwidJob } from '@codewyre/skwid-contracts';
import { SkwidTaskRegistry } from './skwid-task-registry.model';

/**
 * Command definition
 */
export interface SkwidTask {
  /**
   * Gets or sets a description.
   */
  description?: string;

  /**
   * Jobs to run when the command is run.
   */
  jobs?: SkwidJob[];

  /**
   * Register children for this task
   */
  children?: SkwidTaskRegistry;

  /**
   * Causes skwid to calculate a hash of the task and compare it to the last time it was run.
   * If the hash is the same, skwid will skip running this task unless --skwid-ignore-clean is specified.
   */
  cached: boolean;
}