import { TFile } from 'obsidian';
import { TaskCollection } from '../tasks/collection';
import { Task } from '../tasks/task';
import { ObsidianVault } from '../types';
import { DONE, DUE, KanbanBoard, UPCOMING } from './board';
import AutoTasks from 'src';
import { ISettings } from 'src/settings';

export class KanbanSynchroniser {
  private plugin: AutoTasks;
  private vault: ObsidianVault;

  constructor(plugin: AutoTasks, vault: ObsidianVault) {
    this.plugin = plugin;
    this.vault = vault;
  }

  async process(board: KanbanBoard, files?: TFile[]): Promise<void> {
    
    if (!files || !files.length) {
      files = this.vault.getFiles();
    }

    // Filter out the ignored files
    const settings: ISettings = this.plugin.getSettings();
    files = files.filter(file => {
      let valid = true;
      settings.kanbanIgnoreFolders.forEach(folder => {
        if (file.path.startsWith(folder + '/')) {
          valid = false;
        }
      });
      return valid;
    });

    for (const file of files) {
      if (file.name !== board.getFileName()) {
        await this.processSingle(board, file);
      }
    }

    const boardFile = this.vault.getFileByPath(board.getFileName());
    if (boardFile instanceof TFile) {
      await this.vault.modify(boardFile, board.toString());
    }
  }

  private async processSingle(board: KanbanBoard, file: TFile) {
    const kanbanTasks: TaskCollection = board.getTaskCollection();

    // Discover any tasks within the current file
    const fileTasks: Task[] = (new TaskCollection(await this.vault.read(file), true)).getAllTasks();

    for (const task of fileTasks) {

      const existingTask = kanbanTasks.getTask(task);
      if (!existingTask) {
        kanbanTasks.add(task);
      } else {
        if (!task.isComplete() && kanbanTasks.getList(task) === DONE) {
          kanbanTasks.move(task, task.isDue() ? DUE : UPCOMING);
        } else  if (task.isDue() && !task.isComplete()) {
          if (kanbanTasks.getList(task) !== DUE) {
            kanbanTasks.move(task, DUE);
          }
        } else if (task.isComplete() && kanbanTasks.getList(task) !== DONE) {
          kanbanTasks.move(task, DONE);
        } else {
          kanbanTasks.replace(task);
        }
      }
    }
  }
}
