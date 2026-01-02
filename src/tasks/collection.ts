import { DONE, DUE, PROGRESS, UPCOMING } from '../kanban/board';
import { Task } from './task';

const HEADER_LINE: RegExp = /^#{1,6}/;
const TASK_LINE: RegExp = /^-\s\[[x\s]\]/;

export abstract class TaskCollection {
  private tasks: Map<string, Task[]>;

  constructor(contents: string, addBoardHeaders?: boolean) {
    const lines = contents.split('\n');
    this.tasks = new Map<string, Task[]>();

    let currentHeader = '';
    for (const line of lines) {
      if (line.match(HEADER_LINE)) {
        currentHeader = line;
        this.tasks.set(currentHeader, []);
      }
      if (line.match(TASK_LINE)) {
        const existingTasks = this.tasks.get(currentHeader) || [];
        existingTasks.push(this.parseTask(line));
        this.tasks.set(currentHeader, existingTasks);
      }
    }

    if (addBoardHeaders) {
      if (!this.tasks.has(UPCOMING)) {
        this.tasks.set(UPCOMING, []);
      }
      if (!this.tasks.has(DUE)) {
        this.tasks.set(DUE, []);
      }
      if (!this.tasks.has(PROGRESS)) {
        this.tasks.set(PROGRESS, []);
      }
      if (!this.tasks.has(DONE)) {
        this.tasks.set(DONE, []);
      }
    }
  }

  add(task: Task, header?: string) {
    if (!header) {
      header = task.isComplete() ? DONE : task.isDue() ? DUE : UPCOMING;
    }
    const headerObj = this.tasks.get(header);
    if (headerObj !== undefined && headerObj.findIndex((t) => t.equals(task)) > -1) {
      return;
    }
    headerObj?.push(task);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values()).flat();
  }

  getList(task: Task): string {
    for (let [list, tasks] of this.tasks) {
      for (const existingTask of tasks) {
        if (task.equals(existingTask)) {
          return list;
        }
      }
    }

    return '';
  }

  getTask(task: Task): Task | undefined {
    for (const tasksList of this.tasks.values()) {
      for (const existingTask of tasksList) {
        if (existingTask.equals(task)) {
          return existingTask;
        }
      }
    }
  }

  getTasksFromLists(lists: string[]): Task[] {
    const returnTasks: Task[] = [];
    this.tasks.forEach((value, list) => {
      if (!lists.length || lists[0] === '' || lists.indexOf(list) > -1) {
        returnTasks.push(...value);
      }
    });

    return returnTasks;
  }

  move(task: Task, newList: string) {
    const oldList = this.getList(task);
    const index = this.tasks.get(oldList)?.findIndex((t) => t.equals(task));
    if (index !== undefined && index > -1) {
      this.tasks.get(oldList)?.splice(index, 1);
    }

    this.tasks.get(newList)?.push(task);
  }

  protected abstract parseTask(line: string): Task;

  remove(task: Task) {
    for (const tasksList of this.tasks.values()) {
      for (const existingTask of tasksList.values()) {
        if (task.equals(existingTask)) {
          tasksList.remove(existingTask);
        }
      }
    }
  }

  replace(task: Task) {
    const list = this.getList(task);
    const existingTask = this.tasks.get(list)?.find((t) => t.equals(task));
    if (existingTask) {
      Object.assign(existingTask, task);
    }
  }

  toString(headerSeparator?: string): string {
    headerSeparator = headerSeparator || '\n';

    let content: string = '';
    for (let [list, tasks] of this.tasks) {
      content = `${content}${list}\n\n`;
      for (const task of tasks) {
        content = `${content}${task.toString()}\n`;
      }
      content = `${content}${headerSeparator}`;
    }

    return content;
  }
}
