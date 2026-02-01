import { MetadataCache, TFile } from 'obsidian';
import AutoTasks from '..';
import debug from '../log';
import { ISettings } from '../settings';
import { Task } from '../tasks/task';
import { ObsidianVault } from '../types';
import { KanbanBoard } from './board';
import { KanbanBoardManager } from './board-manager';
import { TaskOriginIndex } from './origin-index';
import { ReverseKanbanSynchroniser } from './reverse-synchroniser';
import { KanbanSynchroniser } from './synchroniser';
import { Watcher } from './watcher';
import { TaskFactory } from 'src/tasks/factory';

export class KanbanProvider {
  private plugin: AutoTasks;
  private vault: ObsidianVault;
  private boardManager: KanbanBoardManager;
  private synchroniser: KanbanSynchroniser;
  private reverseSynchroniser: ReverseKanbanSynchroniser;
  private watcher: Watcher;
  private originIndex: TaskOriginIndex;
  private taskFactory: TaskFactory;
  private previousBoardTasks: Task[] = [];

  constructor(
    plugin: AutoTasks,
    vault: ObsidianVault,
    metadataCache: MetadataCache,
    taskFactory: TaskFactory,
    boardManager?: KanbanBoardManager,
    synchroniser?: KanbanSynchroniser,
    watcher?: Watcher,
    originIndex?: TaskOriginIndex,
    reverseSynchroniser?: ReverseKanbanSynchroniser
  ) {
    this.plugin = plugin;
    this.vault = vault;
    this.taskFactory = taskFactory;
    this.originIndex = originIndex || new TaskOriginIndex();
    this.boardManager = boardManager || new KanbanBoardManager(vault, metadataCache, taskFactory);
    this.synchroniser =
      synchroniser || new KanbanSynchroniser(plugin, vault, taskFactory, this.originIndex);
    this.reverseSynchroniser =
      reverseSynchroniser || new ReverseKanbanSynchroniser(vault, this.originIndex);
    this.watcher = watcher || new Watcher(this);
  }

  async synchroniseTasks(files?: TFile[]): Promise<void> {
    const settings: ISettings = this.plugin.getSettings();

    if (!settings.kanbanSync) {
      return;
    }

    try {
      this.watcher.setForwardSyncInProgress(true);

      const board: KanbanBoard = await this.boardManager.get(settings.kanbanFile);

      await this.synchroniser.process(board, files);

      this.previousBoardTasks = this.cloneTasks(board.getTaskCollection().getAllTasks());
    } catch {
      // Silently handle errors
    } finally {
      setTimeout(() => {
        this.watcher.setForwardSyncInProgress(false);
      }, 100);
    }
  }

  async reverseSynchroniseTasks(): Promise<void> {
    const settings: ISettings = this.plugin.getSettings();

    if (!settings.kanbanSync) {
      return;
    }

    try {
      const board: KanbanBoard = await this.boardManager.get(settings.kanbanFile);
      const currentTasks = board.getTaskCollection().getAllTasks();

      const changes = ReverseKanbanSynchroniser.findCompletionChanges(
        this.previousBoardTasks,
        currentTasks
      );

      if (changes.length > 0) {
        debug(`Found ${changes.length} completion changes to reverse sync`);
        await this.reverseSynchroniser.process(changes);
      }

      this.previousBoardTasks = this.cloneTasks(currentTasks);
    } catch (error) {
      debug(`Error during reverse sync: ${error}`);
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

  getOriginIndex(): TaskOriginIndex {
    return this.originIndex;
  }

  async migrateOrigins(): Promise<void> {
    const settings: ISettings = this.plugin.getSettings();

    if (!settings.kanbanSync) {
      debug('Skipping origin migration - kanban sync disabled');
      return;
    }

    if (settings.kanbanOriginsMigrated) {
      debug('Origin migration already completed');
      return;
    }

    debug('Starting origin migration');

    try {
      const board: KanbanBoard = await this.boardManager.get(settings.kanbanFile);
      const boardTasks = board.getTaskCollection().getAllTasks();

      const boardTaskMap = new Map<string, Task>();
      for (const task of boardTasks) {
        boardTaskMap.set(task.getName(), task);
      }

      const files = this.vault.getFiles().filter((file) => {
        if (file.name === settings.kanbanFile) {
          return false;
        }
        for (const folder of settings.kanbanIgnoreFolders) {
          if (file.path.startsWith(folder + '/')) {
            return false;
          }
        }
        return true;
      });

      debug(`Scanning ${files.length} files for origin migration`);

      for (const file of files) {
        try {
          const content = await this.vault.read(file);
          const fileTasks = this.taskFactory.newCollection(content, false).getAllTasks();

          for (const fileTask of fileTasks) {
            const boardTask = boardTaskMap.get(fileTask.getName());
            if (boardTask) {
              boardTask.addOrigin(file.path);
              this.originIndex.addOrigin(fileTask.getName(), file.path);
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }

      const boardFile = this.vault.getFileByPath(settings.kanbanFile);
      if (boardFile instanceof TFile) {
        await this.vault.modify(boardFile, board.toString());
      }

      settings.kanbanOriginsMigrated = true;
      await this.plugin.updateSettings(settings);

      debug('Origin migration completed');

      this.previousBoardTasks = this.cloneTasks(boardTasks);
    } catch (error) {
      debug(`Error during origin migration: ${error}`);
    }
  }

  async initialize(): Promise<void> {
    const settings: ISettings = this.plugin.getSettings();

    if (!settings.kanbanSync) {
      return;
    }

    try {
      const board: KanbanBoard = await this.boardManager.get(settings.kanbanFile);
      const tasks = board.getTaskCollection().getAllTasks();

      this.originIndex.buildFromTasks(tasks);

      this.previousBoardTasks = this.cloneTasks(tasks);

      debug(`Initialized Kanban with ${tasks.length} tasks`);
    } catch {
      debug('Could not load board during initialization');
    }
  }

  private cloneTasks(tasks: Task[]): Task[] {
    return tasks.map((task) => {
      const clone = this.taskFactory.newTask(
        `- [${task.isComplete() ? 'x' : ' '}] ${task.getName()}`
      );
      clone.setOrigins(task.getOrigins());
      return clone;
    });
  }
}
