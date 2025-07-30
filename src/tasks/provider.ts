import { moment, TAbstractFile } from 'obsidian';
import { DailyNote, Note, WeeklyNote } from 'obsidian-periodic-notes-provider';
import { DUE, PROGRESS, UPCOMING } from '../kanban/board';
import { KanbanProvider } from '../kanban/provider';
import { IPeriodicitySettings, ISettings } from '../settings';
import { ObsidianVault } from '../types';
import { TaskFactory } from './factory';
import { Task } from './task';

export class TasksProvider {
  private vault: ObsidianVault;
  private kanban: KanbanProvider;
  private dailyNote: DailyNote;
  private weeklyNote: WeeklyNote;
  private factory: TaskFactory;

  constructor(vault: ObsidianVault, kanban: KanbanProvider, taskFactory: TaskFactory, dailyNote?: DailyNote, weeklyNote?: WeeklyNote) {
    this.vault = vault;
    this.kanban = kanban;
    this.factory = taskFactory;
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
      const tasks: Task[] = (this.factory.newCollection(previousEntryContents)).getTasksFromLists(periodicitySetting.searchHeaders);
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

      // Add the carry over prefix if its set
      if (settings.carryOverPrefix) {
        tasksToAdd = tasksToAdd.map(task => task.markCarriedOver());
      }
      
      // Add them into the new entry
      await this.vault.process(cls.getCurrent(), (contents) => {
        if (contents.indexOf(periodicitySetting.header + '\n') > -1) {
          return contents.replace(periodicitySetting.header + '\n', `${periodicitySetting.header}\n\n${tasksToAdd.join('\n')}\n`);
        }

        return `${contents}\n\n${periodicitySetting.header}\n\n${tasksToAdd.join('\n')}`;
      });
    }
  }
}
