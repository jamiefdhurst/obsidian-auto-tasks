import { MetadataCache, TFile } from 'obsidian';
import { KANBAN_PROPERTY_NAME, KANBAN_PROPERTY_VALUE, KanbanBoard } from './board';
import { ObsidianVault } from 'src/types';

export class KanbanBoardManager {

  private vault: ObsidianVault;
  private metadataCache: MetadataCache;

  constructor(vault: ObsidianVault, metadataCache: MetadataCache) {
    this.vault = vault;
    this.metadataCache = metadataCache;
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

    return new KanbanBoard(fileName, await this.vault.read(file));
  }
}

export class KanbanBoardOpenError extends Error {}
