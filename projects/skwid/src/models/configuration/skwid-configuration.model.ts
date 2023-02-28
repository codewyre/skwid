import { SkwidSolution } from './skwid-solution.model';
import { SkwidTaskRegistry } from './skwid-task-registry.model';

/**
 * A schema for the `/skwid.ya?ml/` file.
 */
export interface SkwidConfiguration {
  /**
   * Gets or sets a display name for this project
   */
  name?: string;

  /**
   * Globally defined variables
   */
  variables?: { [name: string]: any };

  /**
   * Key value based configuration of commands.
   */
  tasks?: SkwidTaskRegistry;

  /**
   *
   */
  solution?: SkwidSolution;
}