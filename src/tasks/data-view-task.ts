import { moment } from 'obsidian';
import { DUE_DATE_FORMAT, Task } from './task';

const METADATA_SETS: string[] = [
  'due',
  'created',
  'scheduled',
  'start',
  'completion',
  'cancelled',
  'priority',
  'repeat',
  'onCompletion',
  'id',
  'dependsOn',
];
const TASK_COMPLETE: RegExp = /^\s*-\s\[x\]/;
const TASK_DUE_DATE: RegExp = /\s\[due::\s(\d{4}-\d{2}-\d{2})\]/;
const TASK_NAME: RegExp = /^\s*(-\s\[[x\s]\]\s)(.*?)(?:\s\[[A-Za-z]+::|$)/;

export class DataViewTask extends Task {
  getCompletedDate(): string | undefined {
    const meta = this.getMetadata();
    return meta.get('completion');
  }

  getDueDate(): string | undefined {
    const meta = this.getMetadata();
    return meta.get('due');
  }

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
      // Remove indentation and task prefix from metadata calculation
      const lineWithoutIndent = this.line.replace(/^\s*/, '');
      this.metadata = lineWithoutIndent.replace(matched[1] + matched[2], '');
    }

    this.complete = !!this.line.match(TASK_COMPLETE);
    this.parseCarriedOver();
  }

  toString(): string {
    const indent = this.buildIndent(this.indentLevel);
    let metadata = this.metadata;
    if (this.dueDate) {
      metadata = metadata.replace(
        TASK_DUE_DATE,
        ` [due:: ${this.dueDate.format(DUE_DATE_FORMAT)}]`
      );
    }

    return `${indent}- [${this.getCompleteChar()}] ${this.getCarriedOverPrefix()}${this.name}${metadata}${this.buildChildrenString()}`;
  }
}
