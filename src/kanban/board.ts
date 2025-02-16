import { TaskCollection } from '../tasks/collection';

export const UPCOMING = '## Upcoming';
export const DUE = '## Due';
export const PROGRESS = '## In progress';
export const DONE = '## Done';
export const KANBAN_PROPERTY_NAME: string = 'kanban-plugin';
export const KANBAN_PROPERTY_VALUE: string = 'board';
export const NAME: string = 'All Tasks';
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
  private fileName: string;
  private contents: string;
  private tasks: TaskCollection;

  constructor(fileName: string, contents?: string) {
    this.fileName = fileName;
    if (!contents) {
      contents = `${UPCOMING}\n\n\n\n${DUE}\n\n\n\n${PROGRESS}\n\n\n\n${DONE}\n\n\n\n`;
    }
    this.contents = contents;
  }

  getFileName(): string {
    return this.fileName;
  }

  getTaskCollection(): TaskCollection {
    if (!this.tasks) {
      this.tasks = new TaskCollection(this.contents, true);
    }
    return this.tasks;
  }

  toString(): string {
    return `${HEADER}\n\n${this.getTaskCollection().toString('\n\n\n\n')}\n\n\n${FOOTER}`;
  }
}
