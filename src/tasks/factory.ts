import { TasksPluginAdapter } from '../plugins/tasks';
import { TaskCollection } from './collection';
import { DataViewTaskCollection } from './data-view-collection';
import { DataViewTask } from './data-view-task';
import { EmojiTaskCollection } from './emoji-collection';
import { EmojiTask } from './emoji-task';
import { Task } from './task';

export class TaskFactory {
  private dataView?: boolean;
  private pluginAdapter: TasksPluginAdapter;

  constructor(pluginAdapter: TasksPluginAdapter) {
    this.pluginAdapter = pluginAdapter;
    this.checkDataViewStatus();
  }

  private async checkDataViewStatus() {
    console.log('CHECKING DATAVIEW');
    this.dataView = await this.pluginAdapter.isDataViewFormat();
    console.log('Dataview is ' + (this.dataView ? 'YES' : 'NO'));
  }

  newCollection(contents: string, addBoardHeaders?: boolean): TaskCollection {
    console.log('About to check dataview...');
    this.checkDataViewStatus();
    console.log('Checked dataview, returning collection');
    return this.dataView
      ? new DataViewTaskCollection(contents, addBoardHeaders)
      : new EmojiTaskCollection(contents, addBoardHeaders);
  }

  newTask(line: string): Task {
    this.checkDataViewStatus();
    return this.dataView ? new DataViewTask(line) : new EmojiTask(line);
  }
}
