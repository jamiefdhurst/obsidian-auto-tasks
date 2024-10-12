import { Moment } from 'moment';
import { moment } from 'obsidian';

export class TasksParser {

  private HEADER_LINE: RegExp = /^#{1,6}/;
  private TASK_LINE: RegExp = /^-\s\[[x\s]\]/;
  private TASK_COMPLETE: RegExp = /^-\s\[x\]/;
  private TASK_DUE_DATE: RegExp = /\s📅\s(\d{4}-\d{2}-\d{2})/;
  private TASK_NAME: RegExp = /^-\s\[[x\s]\]\s(.*?)(\s[📅🛫⏳⏫🔼🔽🔺⏬🆔⛔🔁➕✅]|$)/;

  extractAllTasks(note: string, searchHeaders: string[]): string[] {
    const tasks = this.extractAllTasksIntoHeadings(note, false);

    const returnTasks: string[] = [];
    tasks.forEach((value, key) => {
      if (!searchHeaders || searchHeaders[0] === '' || searchHeaders.contains(key)) {
        returnTasks.push(...value);
      }
    });

    return returnTasks;
  }

  extractAllTasksIntoHeadings(note: string, includeEmptyHeadings: boolean): Map<string, string[]> {
    const lines = note.split('\n');
    const tasks: Map<string, string[]> = new Map();
    let currentHeader = '';
    for (const line of lines) {
      if (line.match(this.HEADER_LINE)) {
        currentHeader = line;
        if (includeEmptyHeadings) {
          tasks.set(currentHeader, []);
        }
      }
      if (line.match(this.TASK_LINE)) {
        const headerTasks = tasks.get(currentHeader) ?? [];
        headerTasks.push(line);
        tasks.set(currentHeader, headerTasks);
      }
    }

    return tasks;
  }

  getName(task: string) {
    const matched = task.match(this.TASK_NAME);
    if (matched) {
      return matched[1];
    }
    
    return '';
  }

  isComplete(task: string): boolean {
    return !!task.match(this.TASK_COMPLETE);
  }

  isDue(task: string): boolean {
    const matched = task.match(this.TASK_DUE_DATE);
    if (matched) {
      const date = moment(matched[1]);
      if (date.isSameOrAfter(moment('yesterday'))) {
        return true;
      }
    }

    return false;
  }

  setDueDate(task: string, date: Moment): string {
    if (task.match(this.TASK_DUE_DATE)) {
      task = task.replace(this.TASK_DUE_DATE, '');
    }

    return `${task} 📅 ${date.format('YYYY-MM-DD')}`;
  }
}
