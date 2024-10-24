import { moment, TAbstractFile, Vault } from 'obsidian';
import Note from 'src/notes';
import DailyNote from 'src/notes/daily-note';
import WeeklyNote from 'src/notes/weekly-note';
import { IPeriodicitySettings, ISettings } from 'src/settings';
import { TaskCollection } from './collection';
import { Task } from './task';
import { KanbanProvider } from 'src/kanban/provider';
import { DUE, PROGRESS, UPCOMING } from 'src/kanban/board';

export class TasksProvider {
  private vault: Vault;
  private kanban: KanbanProvider;

  constructor(vault: Vault, kanban: KanbanProvider) {
    this.vault = vault;
    this.kanban = kanban;
  }

  async checkAndCopyTasks(settings: ISettings, file: TAbstractFile): Promise<void> {
    await this.checkAndCreateForSingleNote(settings.weekly, file, new WeeklyNote());
    await this.checkAndCreateForSingleNote(settings.daily, file, new DailyNote());
  }

  private async checkAndCreateForSingleNote(setting: IPeriodicitySettings, file: TAbstractFile, cls: Note): Promise<void> {
    if (setting.available && setting.carryOver && cls.isValid(file)) {
      
      // Get the previous entry
      const previousEntryContents: string = await this.vault.read(cls.getPrevious());
      const tasks: Task[] = (new TaskCollection(previousEntryContents)).getTasksFromLists(setting.searchHeaders);
      let tasksToAdd: Task[] = tasks.filter(task => !task.isComplete());

      // Find any tasks that are due elsewhere in other files, pull these from the central board
      if (setting.addDue) {
        const board = await this.kanban.getBoard();
        if (board !== undefined) {
          const boardTasks = board.getTaskCollection();
          for (const task of boardTasks.getTasksFromLists([UPCOMING, DUE, PROGRESS])) {
            const dueDate = task.getDueDate();
            if (dueDate && moment(dueDate).isBefore(cls.getNextDate())) {
              tasksToAdd.push(task);
            }
          }
        }
      }
      
      // Add them into the new entry
      const newEntry = cls.getCurrent();
      const newEntryContents: string = await this.vault.read(newEntry);

      // Save and refresh any views
      await this.vault.modify(newEntry, `${newEntryContents}\n\n${setting.header}\n\n${tasksToAdd.join('\n')}`);
    }
  }
}
