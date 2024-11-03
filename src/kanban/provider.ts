import { MetadataCache, TFile } from 'obsidian';
import { ObsidianVault } from 'src/types';
import AutoTasks from '..';
import { ISettings } from '../settings';
import { KanbanBoard } from './board';
import { KanbanBoardManager } from './board-manager';
import { KanbanSynchroniser } from './synchroniser';
import { Watcher } from './watcher';

export class KanbanProvider {
  private plugin: AutoTasks;
  private boardManager: KanbanBoardManager;
  private synchroniser: KanbanSynchroniser;
  private watcher: Watcher;
  
  constructor(
    plugin: AutoTasks,
    vault: ObsidianVault,
    metadataCache: MetadataCache,
    boardManager?: KanbanBoardManager,
    synchroniser?: KanbanSynchroniser,
    watcher?: Watcher
  ) {
    this.plugin = plugin;
    this.boardManager = boardManager || new KanbanBoardManager(vault, metadataCache);
    this.synchroniser = synchroniser || new KanbanSynchroniser(vault);
    this.watcher = watcher || new Watcher(this);
  }

  async resolveSettings(settings: ISettings): Promise<ISettings> {
    if (!settings.kanbanSync) {
      return settings;
    }

    if (settings.kanbanFile === '') {
      settings.kanbanFile = await this.boardManager.create();
      return settings;
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

  async getBoard(): Promise<KanbanBoard | undefined> {
    const settings: ISettings = this.plugin.getSettings();

    if (!settings.kanbanSync) {
      return undefined;
    }

    return await this.boardManager.get(settings.kanbanFile);
  }

  getWatcher(): Watcher {
    return this.watcher;
  }
}
