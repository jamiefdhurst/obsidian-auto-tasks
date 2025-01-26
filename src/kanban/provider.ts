import { MetadataCache, TFile } from 'obsidian';
import AutoTasks from '..';
import { ISettings } from '../settings';
import { ObsidianVault } from '../types';
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

  getBoardManager(): KanbanBoardManager {
    return this.boardManager;
  }

  getWatcher(): Watcher {
    return this.watcher;
  }
}
