import type { Plugin } from 'obsidian';
import type { ObsidianAppWithPlugins } from '../types';

export const KANBAN_NAME: string = 'obsidian-kanban';

export interface IKanbanPlugin extends Plugin {}

export class Kanban {
  private app: ObsidianAppWithPlugins;

  constructor(app: ObsidianAppWithPlugins) {
    this.app = app;
  }

  isKanbanPluginEnabled(): boolean {
    return this.app.plugins.enabledPlugins.has(KANBAN_NAME);
  }
}
