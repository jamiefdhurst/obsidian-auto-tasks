import { Moment } from 'moment';

export class TasksParser {

  private TASK_LINE: RegExp = /^-\s\[[x\s]\]/;
  private TASK_COMPLETE: RegExp = /^-\s\[x\]/;
  private TASK_DUE_DATE: RegExp = /\s📅\s(\d{4}-\d{2}-\d{2})/;

  extractAllTasks(note: string): string[] {
    const lines = note.split('\n');
    const tasks: string[] = [];
    for (const line of lines) {
      if (line.match(this.TASK_LINE)) {
        tasks.push(line);
      }
    }

    return tasks;
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
