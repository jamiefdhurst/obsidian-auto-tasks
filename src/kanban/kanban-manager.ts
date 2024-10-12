import { FrontMatterCache, MetadataCache, TFile, Vault } from 'obsidian';
import AutoTasks from 'src';
import { ISettings } from 'src/settings';
import { TasksParser } from 'src/tasks/tasks-parser';

const UPCOMING = '## Upcoming';
const DUE = '## Due';
const PROGRESS = '## In progress';
const DONE = '## Done';
const KANBAN_BOARD_PROPERTY_NAME: string = 'auto-tasks';
const KANBAN_BOARD_PROPERTY_VALUE: string = 'default-board'
const KANBAN_BOARD_NAME: string = 'All Tasks';
const KANBAN_BOARD_HEADER: string = `
---

kanban-plugin: board
${KANBAN_BOARD_PROPERTY_NAME}: ${KANBAN_BOARD_PROPERTY_VALUE}

---
`.trim();
const KANBAN_BOARD_FOOTER: string = `
%% kanban:settings
\`\`\`
{"kanban-plugin":"board","list-collapse":[false,false,false,false]}
\`\`\`
%%
`.trim();

export class KanbanManager {

  private plugin: AutoTasks;
  private vault: Vault;
  private metadataCache: MetadataCache;
  private tasksParser: TasksParser;

  constructor(plugin: AutoTasks, vault: Vault, metadataCache: MetadataCache, tasksParser: TasksParser) {
    this.plugin = plugin;
    this.vault = vault;
    this.metadataCache = metadataCache;
    this.tasksParser = tasksParser;
  }

  async resolveSettings(settings: ISettings): Promise<ISettings> {
    if (!settings.kanbanSync) {
      return settings;
    }

    let dirty: boolean = false;
    let fileObj: TFile | undefined = undefined;

    // Check if the file object is set, if not, load it from the current file
    if (settings.kanbanFile !== '' && fileObj === undefined) {
      const resolvedFile = this.vault.getFileByPath(settings.kanbanFile)
      if (resolvedFile !== null) {
        fileObj = resolvedFile;
        dirty = true;
      }
    }

    // If the current file is not available, create one
    if (settings.kanbanFile === '') {
      const newBoard = await this.createBoard();
      settings.kanbanFile = newBoard.name;
      fileObj = newBoard;
      dirty = true;
    }

    // Validate any file object found
    if (!dirty && fileObj !== undefined) {
      const cachedMetadata = this.metadataCache.getFileCache(fileObj);
      if (cachedMetadata === null || !this.isDefaultBoard(cachedMetadata.frontmatter)) {
        console.log('File object is not valid, removing it so it can be resolved...');
        fileObj = undefined;
      }
    }

    // File object not set, file needs to be located
    if (!dirty && fileObj === undefined) {
      try {
        const resolvedFile = this.resolveBoard();
        settings.kanbanFile = resolvedFile.name;
        fileObj = resolvedFile;
      } catch (err) {
        const newBoard = await this.createBoard();
        settings.kanbanFile = newBoard.name;
        fileObj = newBoard;
      }
    }

    return settings;
  }

  private isDefaultBoard(frontmatter: FrontMatterCache | undefined): boolean {
    if (frontmatter === undefined) {
      return false;
    }
    if (typeof frontmatter[KANBAN_BOARD_PROPERTY_NAME] === 'undefined') {
      return false;
    }
    if (frontmatter[KANBAN_BOARD_PROPERTY_NAME] !== KANBAN_BOARD_PROPERTY_VALUE) {
      return false;
    }
    return true;
  }

  private resolveBoard(): TFile {
    for (const file of this.vault.getFiles()) {
      const fileCache = this.metadataCache.getFileCache(file);
      if (fileCache !== null && this.isDefaultBoard(fileCache.frontmatter)) {
        return file;
      }
    }

    throw new KanbanBoardResolveError();
  };
  
  async createBoard(): Promise<TFile> {
    const map = new Map<string, string[]>();
    map.set(UPCOMING, []);
    map.set(DUE, []);
    map.set(PROGRESS, []);
    map.set(DONE, []);
    return this.vault.create(`${KANBAN_BOARD_NAME}.md`, this.writeBoard(map));
  }

  async processFiles(files: TFile[]): Promise<void> {
    if (!this.plugin.settings.kanbanSync) {
      return;
    }
    if (!files.length) {
      files = this.vault.getFiles();
    }

    // Load the Kanban board and get the current tasks as a flat list, regardless of status
    const kanbanFile = this.vault.getFileByPath(this.plugin.settings.kanbanFile);
    if (kanbanFile === null) {
      return;
    }
    let kanbanContents: string = await this.vault.read(kanbanFile);

    for (const file of files) {
      if (file.name !== this.plugin.settings.kanbanFile) {
        kanbanContents = await this.processFile(kanbanContents, file);
      }
    }

    await this.vault.modify(kanbanFile, kanbanContents);
  }

  private async processFile(kanbanContents: string, file: TFile): Promise<string> {
    const kanbanTasks = this.tasksParser.extractAllTasksIntoHeadings(kanbanContents, true);

    // Discover any tasks within the current file
    const contents = await this.vault.read(file);
    const tasks: string[] = Array.from(this.tasksParser.extractAllTasksIntoHeadings(contents, false).values()).flat();
    console.log('Discovered ' + tasks.length + ' tasks in file ' + file.name);

    for (const task of tasks) {

      console.log('Checking task ' + task);
      if (!this.isOnBoard(kanbanTasks, task)) {
        console.log('Task ' + task + ' is not present and needs to be added');
        
        // Task is new
        if (this.tasksParser.isComplete(task)) {
          kanbanTasks.get(DONE)?.push(task);
        } else {
          kanbanTasks.get(this.tasksParser.isDue(task) ? DUE : UPCOMING)?.push(task);  
        }

      } else {

        // If task is due and not on due list, move it
        if (this.tasksParser.isDue(task)) {
          const dueTaskList = this.getBoard(kanbanTasks, task);
          if (dueTaskList !== DUE) {
            kanbanTasks.get(dueTaskList)?.remove(this.getKanbanTaskFromTask(kanbanTasks, task));
            kanbanTasks.get(DUE)?.push(task);
          }
        }

        if (!this.tasksParser.isComplete(task) && this.getBoard(kanbanTasks, task) === DONE) {
          kanbanTasks.get(DONE)?.remove(this.getKanbanTaskFromTask(kanbanTasks, task));
          kanbanTasks.get(this.tasksParser.isDue(task) ? DUE : UPCOMING)?.push(task);
        } else if (this.tasksParser.isComplete(task)) {
          const doneTaskList = this.getBoard(kanbanTasks, task);
          if (doneTaskList !== DONE) {
            kanbanTasks.get(doneTaskList)?.remove(this.getKanbanTaskFromTask(kanbanTasks, task));
            kanbanTasks.get(DONE)?.push(task);
          }
        }

      }
    }

    return this.writeBoard(kanbanTasks);
  }

  private isOnBoard(allTasks: Map<string, string[]>, checkTask: string): boolean {
    const checkTaskName = this.tasksParser.getName(checkTask);
    console.log('Parsed name as ' + checkTaskName);
    for (const tasksList of allTasks.values()) {
      for (const existingTask of tasksList) {
        if (checkTaskName === this.tasksParser.getName(existingTask)) {
          return true;
        }
      } 
    }

    return false;
  }

  private getBoard(allTasks: Map<string, string[]>, checkTask: string): string {
    const checkTaskName = this.tasksParser.getName(checkTask);
    for (let [listName, tasksList] of allTasks) {
      for (const existingTask of tasksList) {
        if (checkTaskName === this.tasksParser.getName(existingTask)) {
          return listName;
        }
      } 
    }

    return '';
  }

  private getKanbanTaskFromTask(allTasks: Map<string, string[]>, checkTask: string): string {
    const checkTaskName = this.tasksParser.getName(checkTask);
    for (const tasksList of allTasks.values()) {
      for (const existingTask of tasksList) {
        if (checkTaskName === this.tasksParser.getName(existingTask)) {
          return existingTask;
        }
      } 
    }

    return '';
  }

  private writeBoard(allTasks: Map<string, string[]>): string {
    let content = `${KANBAN_BOARD_HEADER}\n\n`;
    for (let [listName, tasksList] of allTasks) {
      content = `${content}\n${listName}\n\n${tasksList.join('\n')}\n\n`;
    }

    return `${content}\n\n\n${KANBAN_BOARD_FOOTER}`;
  }
}

class KanbanBoardResolveError extends Error {}
