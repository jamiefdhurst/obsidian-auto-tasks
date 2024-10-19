import { MetadataCache, TFile, Vault } from 'obsidian';
import AutoTasks from 'src';
import { ISettings } from 'src/settings';
import { KanbanBoardManager } from './board-manager';
import { KanbanSynchroniser } from './synchroniser';
import { KanbanBoard } from './board';
import { Watcher } from './watcher';

export class KanbanProvider {
  private plugin: AutoTasks;
  private boardManager: KanbanBoardManager;
  private synchroniser: KanbanSynchroniser;
  private watcher: Watcher;
  
  constructor(plugin: AutoTasks, vault: Vault, metadataCache: MetadataCache) {
    this.plugin = plugin;
    this.boardManager = new KanbanBoardManager(vault, metadataCache);
    this.synchroniser = new KanbanSynchroniser(vault);
    this.watcher = new Watcher(this);
  }

  async resolveSettings(settings?: ISettings): Promise<ISettings> {
    if (!settings) {
      settings = this.plugin.getSettings();
    }

    if (!settings.kanbanSync) {
      return settings;
    }

    if (settings.kanbanFile === '') {
      settings.kanbanFile = await this.boardManager.create();
    }

    if (!this.boardManager.isValid(settings.kanbanFile)) {
      try {
        settings.kanbanFile = this.boardManager.resolve();
      } catch (err) {
        settings.kanbanFile = await this.boardManager.create();
      }
    }

    return settings;
  }

  async synchroniseTasks(files?: TFile[]): Promise<void> {
    const settings: ISettings = this.plugin.getSettings();

    if (!settings.kanbanSync) {
      return;
    }

    try {
      const board: KanbanBoard = await this.boardManager.get(settings.kanbanFile);

      return this.synchroniser.process(board, files);
    } catch (err) {
      return;
    }
  }

  getWatcher(): Watcher {
    return this.watcher;
  }
}
