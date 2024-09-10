import type { Plugin } from 'obsidian';
import type { ObsidianAppWithPlugins } from './types';

export const TASKS_NAME: string = 'obsidian-tasks-plugin';

export interface ITasksPlugin extends Plugin {}

export class Tasks {
  private app: ObsidianAppWithPlugins;

  constructor(app: ObsidianAppWithPlugins) {
    this.app = app;
  }

  isTasksNotesPluginEnabled(): boolean {
    return this.app.plugins.enabledPlugins.has(TASKS_NAME);
  }

  private getTasksPlugin(): ITasksPlugin {
    return this.app.plugins.getPlugin(TASKS_NAME) as ITasksPlugin;
  }
}
