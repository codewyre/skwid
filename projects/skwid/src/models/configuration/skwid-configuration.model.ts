import { SkwidSolution } from './skwid-solution.model';
import { SkwidTaskRegistry } from './skwid-task-registry.model';

/**
 * A schema for the `/skwid.ya?ml/` file.
 */
export interface SkwidConfiguration {
  /**
   * Globally defined variables
   */
  variables: { [name: string]: any };

  /**
   * Key value based configuration of commands.
   */
  tasks?: SkwidTaskRegistry;

  /**
   *
   */
  solution?: SkwidSolution;
}