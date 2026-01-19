import { Moment } from 'moment';
import { moment } from 'obsidian';
import AutoTasks from '..';

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

  protected getCompleteChar(): string {
    if (this.notNeeded) {
      return 'n';
    }
    return this.complete ? 'x' : ' ';
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

  isArchivable(): boolean {
    if (this.isComplete() && this.getCompletedDate()) {
      return moment(this.getCompletedDate()).isBefore(moment().subtract(2, 'weeks'));
    }
    return false;
  }

  isComplete(): boolean {
    return !!this.complete;
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

  filterIncompleteChildren(): void {
    this.children = this.children.filter((child) => !child.isComplete());
    // Recursively filter grandchildren
    for (const child of this.children) {
      child.filterIncompleteChildren();
    }
  }

  filterNotNeededChildren(): void {
    this.children = this.children.filter((child) => !child.isNotNeeded());
    // Recursively filter grandchildren
    for (const child of this.children) {
      child.filterNotNeededChildren();
    }
  }

  protected abstract parse(): void;

  abstract toString(): string;
}
