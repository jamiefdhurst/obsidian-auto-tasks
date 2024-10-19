import { TFile, Vault } from 'obsidian';
import { TaskCollection } from '../tasks/collection';
import { Task } from '../tasks/task';
import { DONE, DUE, KanbanBoard, UPCOMING } from './board';

export class KanbanSynchroniser {
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  async process(board: KanbanBoard, files?: TFile[]): Promise<void> {
    
    if (!files || !files.length) {
      files = this.vault.getFiles();
    }

    for (const file of files) {
      if (file.name !== board.getFileName()) {
        await this.processSingle(board, file);
      }
    }

    await this.vault.modify(this.vault.getFileByPath(board.getFileName()) as TFile, board.toString());
  }

  private async processSingle(board: KanbanBoard, file: TFile) {
    const kanbanTasks: TaskCollection = board.getTaskCollection();

    // Discover any tasks within the current file
    const fileTasks: Task[] = (new TaskCollection(await this.vault.read(file), true)).getAllTasks();
    console.log('Discovered ' + fileTasks.length + ' tasks in file ' + file.name);

    for (const task of fileTasks) {

      console.log('Checking task ' + task);
      const existingTask = kanbanTasks.getTask(task);
      if (!existingTask) {
      
        console.log('Task ' + task + ' is not present and needs to be added');        
        kanbanTasks.add(task);

      } else {

        if (task.isDue() && !task.isComplete()) {
          if (kanbanTasks.getList(task) !== DUE) {
            kanbanTasks.move(task, DUE);
          }
        } else if (!task.isComplete() && kanbanTasks.getList(task) === DONE) {
          kanbanTasks.move(task, task.isDue() ? DUE : UPCOMING);
        } else if (task.isComplete() && kanbanTasks.getList(task) !== DONE) {
          kanbanTasks.move(task, DONE);
        } else {
          kanbanTasks.replace(task);
        }
      }
    }
  }
}
