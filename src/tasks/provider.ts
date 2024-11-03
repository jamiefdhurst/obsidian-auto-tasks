import { moment, TAbstractFile } from 'obsidian';
import { DUE, PROGRESS, UPCOMING } from '../kanban/board';
import { KanbanProvider } from '../kanban/provider';
import Note from '../notes';
import DailyNote from '../notes/daily-note';
import WeeklyNote from '../notes/weekly-note';
import { IPeriodicitySettings, ISettings } from '../settings';
import { ObsidianVault } from '../types';
import { TaskCollection } from './collection';
import { Task } from './task';

export class TasksProvider {
  private vault: ObsidianVault;
  private kanban: KanbanProvider;
  private dailyNote: DailyNote;
  private weeklyNote: WeeklyNote;

  constructor(vault: ObsidianVault, kanban: KanbanProvider, dailyNote?: DailyNote, weeklyNote?: WeeklyNote) {
    this.vault = vault;
    this.kanban = kanban;
    this.dailyNote = dailyNote || new DailyNote();
    this.weeklyNote = weeklyNote || new WeeklyNote();
  }

  async checkAndCopyTasks(settings: ISettings, file: TAbstractFile): Promise<void> {
    await this.checkAndCreateForSingleNote(settings, settings.weekly, file, this.weeklyNote);
    await this.checkAndCreateForSingleNote(settings, settings.daily, file, this.dailyNote);
  }

  private async checkAndCreateForSingleNote(settings: ISettings, periodicitySetting: IPeriodicitySettings, file: TAbstractFile, cls: Note): Promise<void> {
    if (periodicitySetting.available && periodicitySetting.carryOver && cls.isValid(file)) {
      
      // Get the previous entry
      const previousEntryContents: string = await this.vault.read(cls.getPrevious());
      const tasks: Task[] = (new TaskCollection(previousEntryContents)).getTasksFromLists(periodicitySetting.searchHeaders);
      let tasksToAdd: Task[] = tasks.filter(task => !task.isComplete());

      // Find any tasks that are due elsewhere in other files, pull these from the central board
      if (settings.tasksAvailable && settings.kanbanSync && periodicitySetting.addDue) {
        const board = await this.kanban.getBoard();
        if (board !== undefined) {
          const boardTasks = board.getTaskCollection();
          for (const task of boardTasks.getTasksFromLists([UPCOMING, DUE, PROGRESS])) {
            const dueDate = task.getDueDate();
            if (dueDate && moment(dueDate).isBefore(cls.getNextDate()) && tasksToAdd.find(t => t.equals(task)) === undefined) {
              tasksToAdd.push(task);
            }
          }
        }
      }
      
      // Add them into the new entry
      const newEntry = cls.getCurrent();
      const newEntryContents: string = await this.vault.read(newEntry);

      // Save and refresh any views
      await this.vault.modify(newEntry, `${newEntryContents}\n\n${periodicitySetting.header}\n\n${tasksToAdd.join('\n')}`);
    }
  }
}
