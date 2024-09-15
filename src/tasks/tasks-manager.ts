import { moment, TAbstractFile, Vault } from 'obsidian';
import Note from 'src/notes';
import DailyNote from 'src/notes/daily-note';
import WeeklyNote from 'src/notes/weekly-note';
import { IPeriodicitySettings, ISettings } from 'src/settings';
import { TasksParser } from './tasks-parser';

export class TasksManager {

  private vault: Vault;
  private parser: TasksParser;

  constructor(vault: Vault, parser: TasksParser) {
    this.vault = vault;
    this.parser = parser;
  }

  async checkAndCopyTasks(settings: ISettings, file: TAbstractFile): Promise<void> {
    await this.checkAndCreateForSingleNote(settings.weekly, file, new WeeklyNote());
    await this.checkAndCreateForSingleNote(settings.daily, file, new DailyNote());
  }

  private async checkAndCreateForSingleNote(setting: IPeriodicitySettings, file: TAbstractFile, cls: Note): Promise<void> {
    if (setting.available && setting.carryOver && cls.isValid(file)) {
      
      // Get the previous entry
      const previousEntryContents: string = await this.vault.read(cls.getPrevious());
      const tasks: string[] = this.parser.extractAllTasks(previousEntryContents);
      let incompleteTasks: string[] = tasks.filter(task => !this.parser.isComplete(task));

      if (setting.setDueDate) {
        incompleteTasks = incompleteTasks.map(task => this.parser.setDueDate(task, moment()));
      }
      
      // Add them into the new entry
      const newEntry = cls.getCurrent();
      const newEntryContents: string = await this.vault.read(newEntry);

      // Save and refresh any views
      await this.vault.modify(newEntry, `${newEntryContents}\n\n## TODO\n\n${incompleteTasks.join('\n')}`);
    }
  }
}
