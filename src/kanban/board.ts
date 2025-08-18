import { TaskCollection } from '../tasks/collection';
import { TaskFactory } from '../tasks/factory';

export const UPCOMING = '## Upcoming';
export const DUE = '## Due';
export const PROGRESS = '## In progress';
export const DONE = '## Done';
export const COMPLETE = '**Complete**';
export const KANBAN_PROPERTY_NAME: string = 'kanban-plugin';
export const KANBAN_PROPERTY_VALUE: string = 'board';
export const NAME: string = 'All Tasks';
export const ARCHIVE: string = '## Archive';
export const ARCHIVE_DIVIDER = '\n***\n';
const HEADER: string = `
---

${KANBAN_PROPERTY_NAME}: ${KANBAN_PROPERTY_VALUE}

---
`.trim();
const FOOTER: string = `
%% kanban:settings
\`\`\`
{"kanban-plugin":"board","list-collapse":[false,false,false,false]}
\`\`\`
%%
`.trim();

export class KanbanBoard {
  private taskFactory: TaskFactory;
  private fileName: string;
  private contents: string;
  private archiveContents: string;
  private tasks: TaskCollection;
  private tasksArchive: TaskCollection;

  constructor(taskFactory: TaskFactory, fileName: string, contents?: string, archiveContents?: string) {
    this.taskFactory = taskFactory;
    this.fileName = fileName;
    if (!contents) {
      contents = `${UPCOMING}\n\n\n\n${DUE}\n\n\n\n${PROGRESS}\n\n\n\n${DONE}\n\n\n\n`;
    }
    if (!archiveContents) {
      archiveContents = `${ARCHIVE}\n\n\n\n`;
    }
    this.contents = contents;
    this.archiveContents = archiveContents;
  }

  getArchive(): TaskCollection {
    if (!this.tasksArchive) {
      this.tasksArchive = this.taskFactory.newCollection(this.archiveContents, false);
    }
    return this.tasksArchive;
  }

  getFileName(): string {
    return this.fileName;
  }

  getTaskCollection(): TaskCollection {
    if (!this.tasks) {
      this.tasks = this.taskFactory.newCollection(this.contents, true);
    }
    return this.tasks;
  }

  toString(): string {

    // Add complete marker needed in Kanban board for done list
    let tasks: string = this.getTaskCollection().toString('\n\n\n\n');
    tasks = tasks.replace(`${DONE}\n`, `${DONE}\n\n${COMPLETE}`);

    if (this.getArchive().getAllTasks().length) {
      return `${HEADER}\n\n${tasks}\n${ARCHIVE_DIVIDER}\n${this.getArchive().toString()}\n\n${FOOTER}`;
    }

    return `${HEADER}\n\n${tasks}\n\n${FOOTER}`;
  }
}
