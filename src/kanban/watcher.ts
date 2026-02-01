import { TFile } from 'obsidian';
import debug from '../log';
import { KanbanProvider } from './provider';

const DEFAULT_TIMEOUT = 5000;
const BOARD_WATCHER_KEY = '__kanban_board__';

export class Watcher {
  private kanban: KanbanProvider;
  private timeouts: Map<string, number> = new Map();
  private timeoutValue: number;
  private forwardSyncInProgress: boolean = false;

  constructor(kanban: KanbanProvider, timeoutValue?: number) {
    this.kanban = kanban;
    this.timeoutValue = timeoutValue || DEFAULT_TIMEOUT;
  }

  notifyCreate(file: TFile) {
    this.timeouts.set(file.name, window.setTimeout(this.run.bind(this, file), this.timeoutValue));
  }

  notifyModify(file: TFile) {
    if (this.timeouts.has(file.name)) {
      window.clearTimeout(this.timeouts.get(file.name));
    }
    this.timeouts.set(file.name, window.setTimeout(this.run.bind(this, file), this.timeoutValue));
  }

  notifyRename(file: TFile, oldFileName: string) {
    if (this.timeouts.has(oldFileName)) {
      window.clearTimeout(this.timeouts.get(oldFileName));
    }
    this.timeouts.set(file.name, window.setTimeout(this.run.bind(this, file), this.timeoutValue));
  }

  notifyDelete(file: TFile) {
    if (this.timeouts.has(file.name)) {
      window.clearTimeout(this.timeouts.get(file.name));
    }
  }

  notifyBoardModify(): void {
    if (this.forwardSyncInProgress) {
      debug('Skipping reverse sync - forward sync in progress');
      return;
    }

    if (this.timeouts.has(BOARD_WATCHER_KEY)) {
      window.clearTimeout(this.timeouts.get(BOARD_WATCHER_KEY));
    }
    this.timeouts.set(
      BOARD_WATCHER_KEY,
      window.setTimeout(this.runReverseSync.bind(this), this.timeoutValue)
    );
  }

  setForwardSyncInProgress(inProgress: boolean): void {
    this.forwardSyncInProgress = inProgress;
  }

  isForwardSyncInProgress(): boolean {
    return this.forwardSyncInProgress;
  }

  run(file: TFile) {
    this.kanban.synchroniseTasks([file]);
  }

  private runReverseSync(): void {
    debug('Running reverse sync from board change');
    this.kanban.reverseSynchroniseTasks();
  }
}
