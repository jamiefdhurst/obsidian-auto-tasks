import { MetadataCache, TFile } from 'obsidian';
import { TaskFactory } from '../tasks/factory';
import { ObsidianVault } from '../types';
import { ARCHIVE_DIVIDER, KANBAN_PROPERTY_NAME, KANBAN_PROPERTY_VALUE, KanbanBoard } from './board';

export class KanbanBoardManager {
  private vault: ObsidianVault;
  private metadataCache: MetadataCache;
  private taskFactory: TaskFactory;

  constructor(vault: ObsidianVault, metadataCache: MetadataCache, taskFactory: TaskFactory) {
    this.vault = vault;
    this.metadataCache = metadataCache;
    this.taskFactory = taskFactory;
  }

  getAllBoards(): TFile[] {
    const boards: TFile[] = [];
    for (const file of this.vault.getFiles()) {
      if (this.isBoard(file)) {
        boards.push(file);
      }
    }

    return boards;
  }

  private isBoard(file: TFile): boolean {
    const fileCache = this.metadataCache.getFileCache(file);

    if (fileCache === null) {
      return false;
    }
    if (fileCache.frontmatter === undefined) {
      return false;
    }
    if (typeof fileCache.frontmatter[KANBAN_PROPERTY_NAME] === 'undefined') {
      return false;
    }

    return fileCache.frontmatter[KANBAN_PROPERTY_NAME] === KANBAN_PROPERTY_VALUE;
  }

  async get(fileName: string): Promise<KanbanBoard> {
    const file = this.vault.getFileByPath(fileName);
    if (file === null) {
      throw new KanbanBoardOpenError();
    }

    const boardContents = (await this.vault.read(file)).split(ARCHIVE_DIVIDER);
    return new KanbanBoard(
      this.taskFactory,
      fileName,
      boardContents[0],
      boardContents.length > 1 ? boardContents[1] : ''
    );
  }
}

export class KanbanBoardOpenError extends Error {}
