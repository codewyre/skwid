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
}