import type { Plugin } from 'obsidian';
import type { ObsidianAppWithPlugins } from '../types';

const PLUGIN_NAME: string = 'obsidian-tasks-plugin';

export interface ITasksPlugin extends Plugin {}

export class TasksPluginAdapter {
  private app: ObsidianAppWithPlugins;

  constructor(app: ObsidianAppWithPlugins) {
    this.app = app;
  }

  isEnabled(): boolean {
    return this.app.plugins.enabledPlugins.has(PLUGIN_NAME);
  }
}
