import { Moment } from 'moment';

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

  abstract getDueDate(): string | undefined;

  getName(): string {
    return this.name;
  }

  isComplete(): boolean {
    return !!this.complete;
  }

  abstract isDue(): boolean;

  markCarriedOver(): Task {
    this.carriedOver = true;
    return this;
  }

  protected abstract parse() : void;

  abstract toString(): string;
}
