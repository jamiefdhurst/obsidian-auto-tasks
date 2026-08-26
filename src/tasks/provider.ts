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

// How long after a note is created a startup catch-up will still act on it.
// The create event is the normal route in; this only covers notes made before
// the listener was registered, which is a matter of seconds
const CATCH_UP_WINDOW_MS: number = 60000;

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

  async checkAndCopyTasks(settings: ISettings, file: TAbstractFile): Promise<boolean> {
    const weekly = await this.checkAndCreateForSingleNote(
      settings,
      settings.weekly,
      file,
      this.weeklyNote
    );
    const daily = await this.checkAndCreateForSingleNote(
      settings,
      settings.daily,
      file,
      this.dailyNote
    );

    return weekly || daily;
  }

  /**
   * Carries tasks over into a note that was created before the create listener
   * was registered.
   *
   * Obsidian's own Daily Notes plugin can create today's note while the
   * workspace is still loading, which is before onLayoutReady runs and so
   * before anything is listening for it. Without this the note is simply
   * missed and no tasks are carried over until the following day.
   */
  async catchUpOnStartup(settings: ISettings): Promise<boolean> {
    const weekly = await this.checkAndCreateForSingleNote(
      settings,
      settings.weekly,
      undefined,
      this.weeklyNote
    );
    const daily = await this.checkAndCreateForSingleNote(
      settings,
      settings.daily,
      undefined,
      this.dailyNote
    );

    return weekly || daily;
  }

  // `file` is the file from a create event, or undefined for a startup catch-up
  private async checkAndCreateForSingleNote(
    settings: ISettings,
    periodicitySetting: IPeriodicitySettings,
    file: TAbstractFile | undefined,
    cls: PeriodicNote
  ): Promise<boolean> {
    if (periodicitySetting.available && periodicitySetting.carryOver) {
      // The periodic note lookup is typed as returning TFile | undefined but
      // actually returns null when there is no note for the period, so every
      // result from it has to be checked for both
      const newNote = cls.getCurrent();
      if (!newNote) {
        debug('No current note to copy tasks into, skipping');
        return false;
      }

      // Never carry into the same note twice - the create event can fire more
      // than once, and a catch-up must not repeat what the event already did.
      // The creation time is part of the comparison so that deleting a note and
      // making it again is treated as a new note rather than one already done
      if (this.hasAlreadyCarriedOver(periodicitySetting, newNote)) {
        debug(`Tasks have already been carried over into ${newNote.path}, skipping`);
        return false;
      }

      if (file !== undefined) {
        if (!cls.isValid(file)) {
          return false;
        }
      } else if (!this.wasCreatedRecently(newNote)) {
        debug('Current note was not created recently enough to catch up on, skipping');
        return false;
      }

      // Get the previous entry - there may not be one, in which case there is
      // nothing to carry over, though due tasks can still apply below
      const previousEntry = cls.getPrevious();
      if (!previousEntry) {
        debug(
          `No previous note found to carry tasks from - the ${periodicitySetting.header} header will be added empty`
        );
      } else {
        debug(`Carrying tasks from ${previousEntry.path} into ${newNote.path}`);
      }

      const previousEntryContents: string = previousEntry
        ? await this.vault.read(previousEntry)
        : '';
      const tasks: Task[] = this.factory
        .newCollection(previousEntryContents)
        .getTasksFromLists(periodicitySetting.searchHeaders);
      if (previousEntry) {
        const headers = periodicitySetting.searchHeaders.length
          ? `header(s) ${periodicitySetting.searchHeaders.toString()}`
          : 'the whole note';
        debug(`Found ${tasks.length} task(s) in ${previousEntry.path} searching ${headers}`);
      }

      // Only plain open checkboxes carry over, then recursively filter children
      let tasksToAdd: Task[] = tasks.filter((task) => task.isOpen());
      if (tasks.length && !tasksToAdd.length) {
        debug(
          `None of the ${tasks.length} task(s) are open - only a plain "- [ ]" checkbox is carried over`
        );
      }
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

      debug(`Carrying ${tasksToAdd.length} task(s) over into ${newNote.path}`);

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
      if (previousEntry) {
        await this.markCarriedOverTasks(settings, previousEntry, carriedOverLines);
      }

      periodicitySetting.lastCarriedOver = newNote.path;
      periodicitySetting.lastCarriedOverAt = newNote.stat?.ctime ?? 0;

      return true;
    }

    return false;
  }

  private hasAlreadyCarriedOver(periodicitySetting: IPeriodicitySettings, note: TFile): boolean {
    if (!note.path || periodicitySetting.lastCarriedOver !== note.path) {
      return false;
    }

    // A note with no creation time cannot be told apart from a replacement, so
    // fall back to the path alone rather than carrying over repeatedly
    const created = note.stat?.ctime;
    if (created === undefined) {
      return true;
    }

    return periodicitySetting.lastCarriedOverAt === created;
  }

  private wasCreatedRecently(note: TFile): boolean {
    // stat is absent on some mocked and remote files - treat an unknown
    // creation time as too old to act on rather than risk a duplicate
    const created = note.stat?.ctime;
    return created !== undefined && created > Date.now() - CATCH_UP_WINDOW_MS;
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
