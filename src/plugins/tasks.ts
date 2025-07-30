import type { Plugin } from 'obsidian';
import type { ObsidianAppWithPlugins } from '../types';

const PLUGIN_NAME: string = 'obsidian-tasks-plugin';

export type TasksPluginTaskFormat = 'tasksEmojiFormat' | 'dataview';

export interface ITasksPluginSettings {
  taskFormat: TasksPluginTaskFormat;
}

export interface ITasksPlugin extends Plugin {
  settings: ITasksPluginSettings;
}

export class TasksPluginAdapter {
  private app: ObsidianAppWithPlugins;

  constructor(app: ObsidianAppWithPlugins) {
    this.app = app;
  }

  async isDataViewFormat(): Promise<boolean> {
    const settings = await this.loadSettings();

    return settings.taskFormat === 'dataview';
  }

  isEnabled(): boolean {
    return this.app.plugins.enabledPlugins.has(PLUGIN_NAME);
  }

  private getPlugin(): ITasksPlugin {
    return this.app.plugins.getPlugin(PLUGIN_NAME) as ITasksPlugin;
  }

  private async loadSettings(): Promise<ITasksPluginSettings> {
    return this.getPlugin().loadData();
  }
}
