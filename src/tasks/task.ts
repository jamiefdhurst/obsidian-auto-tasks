import type { Moment } from 'moment';
import { moment } from 'obsidian';
import AutoTasks from '..';
import { STATUS_COMPLETE, STATUS_NOT_NEEDED, STATUS_OPEN, TASK_STATUS } from './status';

export const DUE_DATE_FORMAT: string = 'YYYY-MM-DD';
export const DEFAULT_INDENT: string = '\t';

export abstract class Task {
  protected carriedOver: boolean = false;
  protected children: Task[] = [];
  protected complete?: boolean;
  protected dueDate?: Moment;
  protected notNeeded?: boolean;
  protected indent: string = '';
  protected indentLevel: number = 0;
  protected line: string;
  protected metadata: string = '';
  protected name: string = '';
  protected status: string = STATUS_OPEN;
  protected origins: string[] = [];

  constructor(line: string) {
    this.line = line;
    this.parseIndent();
    this.parse();
  }

  addChild(task: Task): void {
    this.children.push(task);
  }

  getChildren(): Task[] {
    return this.children;
  }

  getIndentLevel(): number {
    return this.indentLevel;
  }

  hasChildren(): boolean {
    return this.children.length > 0;
  }

  protected parseIndent(): void {
    const match = this.line.match(/^(\s*)/);
    if (match && match[1]) {
      this.indent = match[1];
      // Calculate indent level: count tabs as 1, or spaces as levels
      if (this.indent.includes('\t')) {
        this.indentLevel = (this.indent.match(/\t/g) || []).length;
      } else {
        // Any non-zero indentation is at least level 1, then add levels for every 2 spaces
        this.indentLevel = Math.max(1, Math.floor(this.indent.length / 2));
      }
    }
  }

  protected buildIndent(level: number): string {
    // Use tab if original used tabs, otherwise use the original indent pattern or default
    if (this.indent.includes('\t')) {
      return '\t'.repeat(level);
    } else if (this.indent.length > 0 && this.indentLevel > 0) {
      const singleIndent = this.indent.substring(0, this.indent.length / this.indentLevel);
      return singleIndent.repeat(level);
    }
    return DEFAULT_INDENT.repeat(level);
  }

  protected buildChildrenString(): string {
    if (!this.hasChildren()) {
      return '';
    }
    return '\n' + this.children.map((child) => child.toString()).join('\n');
  }

  protected getCarriedOverPrefix(): string {
    return this.carriedOver ? AutoTasks.getSettings().carryOverPrefix + ' ' : '';
  }

  protected getStatusChar(): string {
    return this.status;
  }

  protected parseStatus(): void {
    const matched = this.line.match(TASK_STATUS);
    this.status = matched ? matched[1] : STATUS_OPEN;
    this.complete = this.status === STATUS_COMPLETE;
    this.notNeeded = this.status === STATUS_NOT_NEEDED;
  }

  protected parseCarriedOver(): void {
    const carriedOverPrefix = AutoTasks.getSettings().carryOverPrefix;
    if (carriedOverPrefix && this.name.startsWith(carriedOverPrefix)) {
      this.carriedOver = true;
      this.name = this.name.replace(carriedOverPrefix + ' ', '');
    }
  }

  equals(task: Task) {
    return this.name === task.getName();
  }

  abstract getCompletedDate(): string | undefined;

  abstract getDueDate(): string | undefined;

  getName(): string {
    return this.name;
  }

  getOrigins(): string[] {
    return this.origins;
  }

  addOrigin(origin: string): void {
    if (!this.origins.includes(origin)) {
      this.origins.push(origin);
    }
  }

  setOrigins(origins: string[]): void {
    this.origins = [...origins];
  }

  hasOrigin(origin: string): boolean {
    return this.origins.includes(origin);
  }

  isArchivable(): boolean {
    if (this.isComplete() && this.getCompletedDate()) {
      return moment(this.getCompletedDate()).isBefore(moment().subtract(2, 'weeks'));
    }
    return false;
  }

  isComplete(): boolean {
    return !!this.complete;
  }

  // Only a plain, untouched checkbox is eligible to be carried over - anything
  // with a custom status has been deliberately marked by the user (or by a
  // previous carry over) and should stay where it is
  isOpen(): boolean {
    return this.status === STATUS_OPEN;
  }

  getLine(): string {
    return this.line;
  }

  getStatus(): string {
    return this.status;
  }

  isNotNeeded(): boolean {
    return !!this.notNeeded;
  }

  abstract isDue(): boolean;

  markCarriedOver(): Task {
    this.carriedOver = true;
    // Also mark children as carried over
    for (const child of this.children) {
      child.markCarriedOver();
    }
    return this;
  }

  setIndentLevel(level: number): void {
    this.indentLevel = level;
    // Update children to be one level deeper
    for (const child of this.children) {
      child.setIndentLevel(level + 1);
    }
  }

  // Drops every child that is not a plain open checkbox - complete, not needed
  // and custom statuses are all left behind rather than carried over
  filterNonOpenChildren(): void {
    this.children = this.children.filter((child) => child.isOpen());
    // Recursively filter grandchildren
    for (const child of this.children) {
      child.filterNonOpenChildren();
    }
  }

  protected abstract parse(): void;

  abstract toString(): string;
}
