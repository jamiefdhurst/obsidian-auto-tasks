import { moment, TAbstractFile, Vault } from 'obsidian';
import Note from 'src/notes';
import DailyNote from 'src/notes/daily-note';
import WeeklyNote from 'src/notes/weekly-note';
import { IPeriodicitySettings, ISettings } from 'src/settings';
import { TaskCollection } from './collection';
import { Task } from './task';

export class TasksProvider {
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
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

      if (setting.setDueDate) {
        tasksToAdd = tasksToAdd.map(task => {
          task.setDueDate(moment());

          return task;
        });
      }
      
      // Add them into the new entry
      const newEntry = cls.getCurrent();
      const newEntryContents: string = await this.vault.read(newEntry);

      // Save and refresh any views
      await this.vault.modify(newEntry, `${newEntryContents}\n\n${setting.header}\n\n${tasksToAdd.join('\n')}`);
    }
  }
}
