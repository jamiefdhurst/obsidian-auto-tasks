import { moment } from 'obsidian';
import { DUE_DATE_FORMAT, Task } from './task';

const METADATA_CHARS: string = '📅🛫⏳⏫🔼🔽🔺⏬🆔⛔🔁➕✅';
const TASK_COMPLETE: RegExp = /^\s*-\s\[x\]/;
const TASK_NOT_NEEDED: RegExp = /^\s*-\s\[n\]/;
const TASK_DUE_DATE: RegExp = /\s📅\s(\d{4}-\d{2}-\d{2})/;
const TASK_NAME: RegExp = /^\s*(-\s\[[xn\s]\]\s)(.*?)(?:\s[📅🛫⏳⏫🔼🔽🔺⏬🆔⛔🔁➕✅]|$)/u;

export class EmojiTask extends Task {
  getCompletedDate(): string | undefined {
    const meta = this.getMetadata();
    return meta.get('✅');
  }

  getDueDate(): string | undefined {
    const meta = this.getMetadata();
    return meta.get('📅');
  }

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
    this.notNeeded = !!this.line.match(TASK_NOT_NEEDED);
    this.parseCarriedOver();
  }

  toString(): string {
    const indent = this.buildIndent(this.indentLevel);
    let metadata = this.metadata;
    if (this.dueDate) {
      metadata = metadata.replace(TASK_DUE_DATE, ` 📅 ${this.dueDate.format(DUE_DATE_FORMAT)}`);
    }

    return `${indent}- [${this.getCompleteChar()}] ${this.getCarriedOverPrefix()}${this.name}${metadata}${this.buildChildrenString()}`;
  }
}
