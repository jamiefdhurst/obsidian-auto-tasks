import { TFile } from 'obsidian';
import debug from '../log';
import { Task } from '../tasks/task';
import { ObsidianVault } from '../types';
import { TaskOriginIndex } from './origin-index';

const TASK_CHECKBOX_INCOMPLETE: RegExp = /^(\s*-\s)\[ \]/;
const TASK_CHECKBOX_COMPLETE: RegExp = /^(\s*-\s)\[x\]/;

export interface TaskCompletionChange {
  taskName: string;
  isComplete: boolean;
  origins: string[];
}

export class ReverseKanbanSynchroniser {
  private vault: ObsidianVault;
  private originIndex: TaskOriginIndex;

  constructor(vault: ObsidianVault, originIndex: TaskOriginIndex) {
    this.vault = vault;
    this.originIndex = originIndex;
  }

  async process(changes: TaskCompletionChange[]): Promise<void> {
    debug(`Processing ${changes.length} completion changes for reverse sync`);

    const changesByFile = new Map<string, TaskCompletionChange[]>();

    for (const change of changes) {
      let origins = change.origins;
      if (!origins.length) {
        origins = this.originIndex.getOrigins(change.taskName);
      }

      for (const origin of origins) {
        if (!changesByFile.has(origin)) {
          changesByFile.set(origin, []);
        }
        changesByFile.get(origin)!.push(change);
      }
    }

    debug(`Changes affect ${changesByFile.size} files`);

    for (const [filePath, fileChanges] of changesByFile) {
      await this.processFile(filePath, fileChanges);
    }
  }

  private async processFile(filePath: string, changes: TaskCompletionChange[]): Promise<void> {
    const file = this.vault.getFileByPath(filePath);
    if (!(file instanceof TFile)) {
      debug(`File not found for reverse sync: ${filePath}`);
      return;
    }

    try {
      const content = await this.vault.read(file);
      const lines = content.split('\n');
      let modified = false;

      for (const change of changes) {
        const lineIndex = this.findTaskLine(lines, change.taskName);
        if (lineIndex === -1) {
          debug(`Task not found in file ${filePath}: ${change.taskName}`);
          continue;
        }

        const newLine = this.updateTaskLine(lines[lineIndex], change.isComplete);
        if (newLine !== lines[lineIndex]) {
          lines[lineIndex] = newLine;
          modified = true;
          debug(
            `Updated task "${change.taskName}" in ${filePath} to ${change.isComplete ? 'complete' : 'incomplete'}`
          );
        }
      }

      if (modified) {
        await this.vault.modify(file, lines.join('\n'));
        debug(`Saved changes to ${filePath}`);
      }
    } catch (error) {
      debug(`Error processing file ${filePath}: ${error}`);
    }
  }

  private findTaskLine(lines: string[], taskName: string): number {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if this is a task line and contains the task name
      if (line.match(/^\s*-\s\[[x\s]\]/) && line.includes(taskName)) {
        // Extract the task name from the line to do an exact match
        // The name is between the checkbox and any metadata
        const nameMatch = line.match(
          /^\s*-\s\[[x\s]\]\s+(.*?)(?:\s[📅🛫⏳⏫🔼🔽🔺⏬🆔⛔🔁➕✅]|\s\[[A-Za-z]+::|%%origin:|$)/u
        );
        if (nameMatch && nameMatch[1].trim() === taskName) {
          return i;
        }
      }
    }
    return -1;
  }

  private updateTaskLine(line: string, isComplete: boolean): string {
    if (isComplete) {
      return line.replace(TASK_CHECKBOX_INCOMPLETE, '$1[x]');
    } else {
      return line.replace(TASK_CHECKBOX_COMPLETE, '$1[ ]');
    }
  }

  static findCompletionChanges(
    previousTasks: Task[],
    currentTasks: Task[]
  ): TaskCompletionChange[] {
    const changes: TaskCompletionChange[] = [];

    const currentTaskMap = new Map<string, Task>();
    for (const task of currentTasks) {
      currentTaskMap.set(task.getName(), task);
    }

    const previousTaskMap = new Map<string, Task>();
    for (const task of previousTasks) {
      previousTaskMap.set(task.getName(), task);
    }

    for (const [name, currentTask] of currentTaskMap) {
      const previousTask = previousTaskMap.get(name);
      if (previousTask && previousTask.isComplete() !== currentTask.isComplete()) {
        changes.push({
          taskName: name,
          isComplete: currentTask.isComplete(),
          origins: currentTask.getOrigins(),
        });
      }
    }

    return changes;
  }
}
