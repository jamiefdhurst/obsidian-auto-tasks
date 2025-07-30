import { moment } from 'obsidian';
import AutoTasks from '..';
import { Task } from './task';

const METADATA_SETS: string[] = [
  'due', 'created', 'scheduled', 'start', 'completion', 'cancelled',
  'priority', 'repeat', 'onCompletion', 'id', 'dependsOn',
];
const TASK_COMPLETE: RegExp = /^-\s\[x\]/;
const TASK_DUE_DATE: RegExp = /\s\[due::\s(\d{4}-\d{2}-\d{2})\]/;
const TASK_NAME: RegExp = /^(-\s\[[x\s]\]\s)(.*?)(?:\s\[[A-Za-z]+::|$)/;

export const DUE_DATE_FORMAT: string = 'YYYY-MM-DD';

export class DataViewTask extends Task {

  getDueDate(): string | undefined {
    const meta = this.getMetadata();
    return meta.get('due');
  };

  getMetadata(): Map<string, string> {
    const map = new Map<string, string>();
    for (const metadata of METADATA_SETS) {
      if (this.metadata.includes(`[${metadata}::`)) {
        const matched = this.metadata.match(new RegExp(String.raw`\s\[${metadata}::\s(.*?)\]`));
        if (matched) {
          map.set(metadata, matched[1]);
        }
      }
    }

    return map;
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

  protected parse() {
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
      metadata = metadata.replace(TASK_DUE_DATE, ` [due:: ${this.dueDate.format(DUE_DATE_FORMAT)}]`);
    }

    return `- [${complete}] ${carriedOver}${this.name}${metadata}`;
  }
}
