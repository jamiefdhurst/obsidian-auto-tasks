import { TFile } from 'obsidian';
import AutoTasks from '..';
import { TaskCollection } from '../tasks/collection';
import { TaskFactory } from '../tasks/factory';
import { Task } from '../tasks/task';
import { ObsidianVault } from '../types';
import { ARCHIVE, DONE, DUE, KanbanBoard, UPCOMING } from './board';

export class KanbanSynchroniser {
  private plugin: AutoTasks;
  private vault: ObsidianVault;
  private taskFactory: TaskFactory;

  constructor(plugin: AutoTasks, vault: ObsidianVault, taskFactory: TaskFactory) {
    this.plugin = plugin;
    this.vault = vault;
    this.taskFactory = taskFactory;
  }

  async process(board: KanbanBoard, files?: TFile[]): Promise<void> {
    if (!files || !files.length) {
      files = this.vault.getFiles();
    }

    // Filter out the ignored files
    files = files.filter((file) => {
      let valid = true;
      this.plugin.getSettings().kanbanIgnoreFolders.forEach((folder) => {
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

    // Archive any tasks that are older than 2 weeks
    await this.archiveOldTasks(board);

    const boardFile = this.vault.getFileByPath(board.getFileName());
    if (boardFile instanceof TFile) {
      await this.vault.modify(boardFile, board.toString());
    }
  }

  private async processSingle(board: KanbanBoard, file: TFile) {
    const kanbanTasks: TaskCollection = board.getTaskCollection();

    // Discover any tasks within the current file
    const fileTasks: Task[] = this.taskFactory
      .newCollection(await this.vault.read(file), true)
      .getAllTasks();

    for (const task of fileTasks) {
      // Skip not-needed tasks
      if (task.isNotNeeded()) {
        continue;
      }

      // Ignore matched tasks
      if (
        this.plugin
          .getSettings()
          .kanbanIgnoreMatches.filter((ignore) => task.getName().match(ignore)).length > 0
      ) {
        continue;
      }

      const existingTask = kanbanTasks.getTask(task);
      if (!existingTask) {
        kanbanTasks.add(task);
      } else {
        if (!task.isComplete() && kanbanTasks.getList(task) === DONE) {
          kanbanTasks.move(task, task.isDue() ? DUE : UPCOMING);
        } else if (task.isDue() && !task.isComplete()) {
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

  private async archiveOldTasks(board: KanbanBoard) {
    const currentTasks: TaskCollection = board.getTaskCollection();
    const archivedTasks: TaskCollection = board.getArchive();
    for (const doneTask of currentTasks.getTasksFromLists([DONE])) {
      if (doneTask.isArchivable()) {
        archivedTasks.add(doneTask, ARCHIVE);
        currentTasks.remove(doneTask);
      }
    }
  }
}
