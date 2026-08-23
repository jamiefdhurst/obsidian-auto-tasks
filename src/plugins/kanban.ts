import type { Plugin } from 'obsidian';
import type { ObsidianAppWithPlugins } from '../types';

const PLUGIN_NAME: string = 'obsidian-kanban';

export type IKanbanPlugin = Plugin;

export class KanbanPluginAdapter {
  private app: ObsidianAppWithPlugins;

  constructor(app: ObsidianAppWithPlugins) {
    this.app = app;
  }

  isEnabled(): boolean {
    return this.app.plugins.enabledPlugins.has(PLUGIN_NAME);
  }
}
