import { TaskCollection } from './collection';
import { DataViewTask } from './data-view-task';
import { Task } from './task';

export class DataViewTaskCollection extends TaskCollection {
  protected parseTask(line: string): Task {
    return new DataViewTask(line);
  }
}
