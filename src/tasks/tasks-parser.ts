import { Moment } from 'moment';

export class TasksParser {

  private HEADER_LINE: RegExp = /^#{1,6}/;
  private TASK_LINE: RegExp = /^-\s\[[x\s]\]/;
  private TASK_COMPLETE: RegExp = /^-\s\[x\]/;
  private TASK_DUE_DATE: RegExp = /\s📅\s(\d{4}-\d{2}-\d{2})/;

  extractAllTasks(note: string, searchHeaders: string[]): string[] {
    const lines = note.split('\n');
    const tasks: Map<string, string[]> = new Map();
    let currentHeader = '';
    for (const line of lines) {
      if (line.match(this.HEADER_LINE)) {
        currentHeader = line;
      }
      if (line.match(this.TASK_LINE)) {
        const headerTasks = tasks.get(currentHeader) ?? [];
        headerTasks.push(line);
        tasks.set(currentHeader, headerTasks);
      }
    }

    const returnTasks: string[] = [];
    tasks.forEach((value, key) => {
      if (!searchHeaders || searchHeaders[0] === '' || searchHeaders.contains(key)) {
        returnTasks.push(...value);
      }
    });

    return returnTasks;
  }

  isComplete(task: string) {
    return task.match(this.TASK_COMPLETE);
  }

  setDueDate(task: string, date: Moment): string {
    if (task.match(this.TASK_DUE_DATE)) {
      task = task.replace(this.TASK_DUE_DATE, '');
    }

    return `${task} 📅 ${date.format('YYYY-MM-DD')}`;
  }
}
