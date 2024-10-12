import { ISettings } from 'src/settings';
import { KanbanManager } from './kanban-manager';
import { TFile } from 'obsidian';

const DEFAULT_TIMEOUT = 5000;

export class TaskWatcher {

  private kanbanManager: KanbanManager;
  private settings: ISettings;
  private timeouts: Map<string, number> = new Map();

  constructor(kanbanManager: KanbanManager, settings: ISettings) {
    this.kanbanManager = kanbanManager;
  }

  notifyCreate(file: TFile) {
    this.timeouts.set(file.name, window.setTimeout(this.run.bind(this, file), DEFAULT_TIMEOUT));
  }

  notifyModify(file: TFile) {
    if (this.timeouts.has(file.name)) {
      console.log('Clearing timeout for ' + file.name);
      window.clearTimeout(this.timeouts.get(file.name));
    }
    console.log('Setting timeout for ' + file.name);
    this.timeouts.set(file.name, window.setTimeout(this.run.bind(this, file), DEFAULT_TIMEOUT));
  }

  notifyRename(file: TFile, oldFileName: string) {
    if (this.timeouts.has(oldFileName)) {
      window.clearTimeout(this.timeouts.get(oldFileName));
    }
    this.timeouts.set(file.name, window.setTimeout(this.run.bind(this, file), DEFAULT_TIMEOUT));
  }

  notifyDelete(file: TFile) {
    if (this.timeouts.has(file.name)) {
      window.clearTimeout(this.timeouts.get(file.name));
    }
  }

  run(file: TFile) {
    console.log('Processing files from watcher...',file);
    this.kanbanManager.processFiles([file]);
  }
}
