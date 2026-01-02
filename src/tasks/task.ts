import { Moment } from 'moment';
import { moment } from 'obsidian';

export const DUE_DATE_FORMAT: string = 'YYYY-MM-DD';

export abstract class Task {
  protected carriedOver: boolean = false;
  protected complete?: boolean;
  protected dueDate?: Moment;
  protected line: string;
  protected metadata: string = '';
  protected name: string = '';

  constructor(line: string) {
    this.line = line;

    this.parse();
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

  abstract isDue(): boolean;

  markCarriedOver(): Task {
    this.carriedOver = true;
    return this;
  }

  protected abstract parse(): void;

  abstract toString(): string;
}
