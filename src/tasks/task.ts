import { Moment } from 'moment';
import { moment } from 'obsidian';

const METADATA_CHARS: string = '📅🛫⏳⏫🔼🔽🔺⏬🆔⛔🔁➕✅';
const TASK_COMPLETE: RegExp = /^-\s\[x\]/;
const TASK_DUE_DATE: RegExp = /\s📅\s(\d{4}-\d{2}-\d{2})/;
const TASK_NAME: RegExp = /^(-\s\[[x\s]\]\s)(.*?)(?:\s[📅🛫⏳⏫🔼🔽🔺⏬🆔⛔🔁➕✅]|$)/;
const TOMORROW: Moment = moment().add(1, 'day');

export class Task {
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
      if (this.metadata.contains(char)) {
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

    return !!(this.dueDate && this.dueDate.isBefore(TOMORROW));
  }

  private parse() {
    const matched = this.line.match(TASK_NAME);
    if (matched) {
      this.name = matched[2];
      this.metadata = this.line.replace(matched[1] + matched[2], '');
    }

    this.complete = !!this.line.match(TASK_COMPLETE);
  }

  setDueDate(date: Moment) {
    this.dueDate = date;
  }

  toString(): string {
    const complete = this.complete ? 'x' : ' ';
    let metadata = this.metadata;
    if (this.dueDate) {
      metadata = metadata.replace(TASK_DUE_DATE, ` 📅 ${this.dueDate.format('YYYY-MM-DD')}`);
    }

    return `- [${complete}] ${this.name}${metadata}`;
  }
}
