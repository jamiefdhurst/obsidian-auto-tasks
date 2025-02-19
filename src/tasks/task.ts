import { Moment } from 'moment';
import { moment } from 'obsidian';
import AutoTasks from '..';

const METADATA_CHARS: string = '📅🛫⏳⏫🔼🔽🔺⏬🆔⛔🔁➕✅';
const TASK_COMPLETE: RegExp = /^-\s\[x\]/;
const TASK_DUE_DATE: RegExp = /\s📅\s(\d{4}-\d{2}-\d{2})/;
const TASK_NAME: RegExp = /^(-\s\[[x\s]\]\s)(.*?)(?:\s[📅🛫⏳⏫🔼🔽🔺⏬🆔⛔🔁➕✅]|$)/;

export const DUE_DATE_FORMAT: string = 'YYYY-MM-DD';

export class Task {
  private carriedOver: boolean = false;
  private complete?: boolean;
  private dueDate?: Moment;
  private line: string;
  private metadata: string = '';
  private name: string = '';

  constructor(line: string) {
    this.line = line;

    this.parse();
  }

  equals(task: Task) {
    return this.name === task.getName();
  }

  getDueDate(): string | undefined {
    const meta = this.getMetadata();
    return meta.get('📅');
  };

  getMetadata(): Map<string, string> {
    const map = new Map<string, string>();
    for (const char of METADATA_CHARS) {
      if (this.metadata.includes(char)) {
        const matched = this.metadata.match(new RegExp(String.raw`\s${char}\s(.*?)(?:\s|$)`));
        if (matched) {
          map.set(char, matched[1]);
        }
      }
    }

    return map;
  }

  getName(): string {
    return this.name;
  }

  isComplete(): boolean {
    return !!this.complete;
  }

  isDue(): boolean {
    if (this.dueDate === undefined) {
      const matched = this.line.match(TASK_DUE_DATE);
      if (matched) {
        this.dueDate = moment(matched[1]);
      }
    }

    return !!(this.dueDate && this.dueDate.isBefore(moment().add(1, 'day')));
  }

  markCarriedOver(): Task {
    this.carriedOver = true;
    return this;
  }

  private parse() {
    const matched = this.line.match(TASK_NAME);
    if (matched) {
      this.name = matched[2];
      this.metadata = this.line.replace(matched[1] + matched[2], '');
    }

    this.complete = !!this.line.match(TASK_COMPLETE);

    const carriedOverPrefix = AutoTasks.getSettings().carryOverPrefix;
    if (carriedOverPrefix && this.name.startsWith(carriedOverPrefix)) {
      this.carriedOver = true;
      this.name = this.name.replace(carriedOverPrefix + ' ', '');
    }
  }

  toString(): string {
    const carriedOver = this.carriedOver ? AutoTasks.getSettings().carryOverPrefix + ' ' : '';
    const complete = this.complete ? 'x' : ' ';
    let metadata = this.metadata;
    if (this.dueDate) {
      metadata = metadata.replace(TASK_DUE_DATE, ` 📅 ${this.dueDate.format(DUE_DATE_FORMAT)}`);
    }

    return `- [${complete}] ${carriedOver}${this.name}${metadata}`;
  }
}
