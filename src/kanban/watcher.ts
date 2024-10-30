import { TFile } from 'obsidian';
import { KanbanProvider } from './provider';

const DEFAULT_TIMEOUT = 5000;

export class Watcher {

  private kanban: KanbanProvider;
  private timeouts: Map<string, number> = new Map();
  private timeoutValue: number;

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

  run(file: TFile) {
    this.kanban.synchroniseTasks([file]);
  }
}
