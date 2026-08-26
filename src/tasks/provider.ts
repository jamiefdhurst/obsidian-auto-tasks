import { moment, TAbstractFile, TFile } from 'obsidian';
import { DailyNote, PeriodicNote, WeeklyNote } from 'obsidian-periodic-notes-provider';
import { DUE, PROGRESS, UPCOMING } from '../kanban/board';
import { KanbanProvider } from '../kanban/provider';
import debug from '../log';
import { IPeriodicitySettings, ISettings } from '../settings';
import { ObsidianVault } from '../types';
import { TaskFactory } from './factory';
import { TASK_CHECKBOX, VALID_STATUS } from './status';
import { Task } from './task';

export class TasksProvider {
  private vault: ObsidianVault;
  private kanban: KanbanProvider;
  private dailyNote: DailyNote;
  private weeklyNote: WeeklyNote;
  private factory: TaskFactory;

  constructor(
    vault: ObsidianVault,
    kanban: KanbanProvider,
    taskFactory: TaskFactory,
    dailyNote?: DailyNote,
    weeklyNote?: WeeklyNote
  ) {
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

  private async checkAndCreateForSingleNote(
    settings: ISettings,
    periodicitySetting: IPeriodicitySettings,
    file: TAbstractFile,
    cls: PeriodicNote
  ): Promise<void> {
    if (periodicitySetting.available && periodicitySetting.carryOver && cls.isValid(file)) {
      const newNote = cls.getCurrent();
      if (newNote === undefined) {
        debug('No current note to copy tasks into, skipping');
        return;
      }

      // Get the previous entry - there may not be one, in which case there is
      // nothing to carry over, though due tasks can still apply below
      const previousEntry = cls.getPrevious();
      const previousEntryContents: string =
        previousEntry !== undefined ? await this.vault.read(previousEntry) : '';
      const tasks: Task[] = this.factory
        .newCollection(previousEntryContents)
        .getTasksFromLists(periodicitySetting.searchHeaders);
      // Only plain open checkboxes carry over, then recursively filter children
      let tasksToAdd: Task[] = tasks.filter((task) => task.isOpen());
      for (const task of tasksToAdd) {
        task.filterNonOpenChildren();
        // Reset indent levels to start from 0 for carried over tasks
        task.setIndentLevel(0);
      }

      // Record the original lines now, before any tasks pulled in from the
      // Kanban board are added below - those live in other files and must not
      // be touched when the previous note is marked up
      const carriedOverLines: Set<string> = this.collectLines(tasksToAdd);

      // Find any tasks that are due elsewhere in other files, pull these from the central board
      if (settings.tasksAvailable && settings.kanbanSync && periodicitySetting.addDue) {
        const board = await this.kanban.getBoard();
        if (board !== undefined) {
          const boardTasks = board.getTaskCollection();
          for (const task of boardTasks.getTasksFromLists([UPCOMING, DUE, PROGRESS])) {
            const dueDate = task.getDueDate();
            if (
              dueDate &&
              moment(dueDate).isBefore(cls.getNextDate()) &&
              tasksToAdd.find((t) => t.equals(task)) === undefined
            ) {
              tasksToAdd.push(task);
            }
          }
        }
      }

      // Add the carry over prefix if its set
      if (settings.carryOverPrefix) {
        tasksToAdd = tasksToAdd.map((task) => task.markCarriedOver());
      }

      // Add them into the new entry
      await this.vault.process(newNote, (contents) => {
        if (contents.indexOf(periodicitySetting.header + '\n') > -1) {
          return contents.replace(
            periodicitySetting.header + '\n',
            `${periodicitySetting.header}\n\n${tasksToAdd.join('\n')}\n`
          );
        }

        return `${contents}\n\n${periodicitySetting.header}\n\n${tasksToAdd.join('\n')}`;
      });

      // Mark the tasks that have just been carried forward in the note they
      // came from, so they stop reading as outstanding in queries elsewhere
      if (previousEntry !== undefined) {
        await this.markCarriedOverTasks(settings, previousEntry, carriedOverLines);
      }
    }
  }

  // The raw source line of every task being carried over, including the nested
  // children that survived filtering - these are matched verbatim so that only
  // the status character of a line is ever rewritten
  private collectLines(tasks: Task[]): Set<string> {
    const lines: Set<string> = new Set();
    for (const task of tasks) {
      lines.add(task.getLine());
      for (const line of this.collectLines(task.getChildren())) {
        lines.add(line);
      }
    }

    return lines;
  }

  private async markCarriedOverTasks(
    settings: ISettings,
    previousEntry: TFile,
    carriedOverLines: Set<string>
  ): Promise<void> {
    if (!settings.carryOverStatus.trim() || carriedOverLines.size === 0) {
      return;
    }

    const status = settings.carryOverStatus.trim().charAt(0);
    if (!VALID_STATUS.test(status)) {
      debug(`Ignoring invalid carry over status "${settings.carryOverStatus}"`);
      return;
    }

    debug(
      `Marking ${carriedOverLines.size} carried over tasks as [${status}] in the previous note`
    );
    await this.vault.process(previousEntry, (contents) =>
      contents
        .split('\n')
        .map((line) =>
          carriedOverLines.has(line) ? line.replace(TASK_CHECKBOX, `$1[${status}]`) : line
        )
        .join('\n')
    );
  }
}
