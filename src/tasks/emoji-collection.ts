import { TaskCollection } from './collection';
import { EmojiTask } from './emoji-task';
import { Task } from './task';

export class EmojiTaskCollection extends TaskCollection {
  protected parseTask(line: string): Task {
    return new EmojiTask(line);
  }
}
