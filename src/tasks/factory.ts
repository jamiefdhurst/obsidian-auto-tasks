import { TasksPluginAdapter } from '../plugins/tasks';
import { TaskCollection } from './collection';
import { DataViewTaskCollection } from './data-view-collection';
import { DataViewTask } from './data-view-task';
import { EmojiTaskCollection } from './emoji-collection';
import { EmojiTask } from './emoji-task';
import { Task } from './task';

export class TaskFactory {
  private dataView: boolean = false;

  constructor(pluginAdapter: TasksPluginAdapter) {
    const t = this;
    pluginAdapter.isDataViewFormat().then((dataView) => {
      t.dataView = dataView;
    });
  }

  newCollection(contents: string, addBoardHeaders?: boolean): TaskCollection {
    return this.dataView
      ? new DataViewTaskCollection(contents, addBoardHeaders)
      : new EmojiTaskCollection(contents, addBoardHeaders);
  }
  
  newTask(line: string): Task {
    return this.dataView
      ? new DataViewTask(line)
      : new EmojiTask(line);
  }
}
