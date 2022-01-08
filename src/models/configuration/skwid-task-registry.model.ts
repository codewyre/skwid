import { SkwidTask } from './skwid-task';

export interface SkwidTaskRegistry {
  /**
   * Name is the commands name. May not contain "."
   */
  [name: string]: SkwidTask;
}