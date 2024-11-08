import { FrontMatterCache, MetadataCache, TFile } from 'obsidian';
import { KanbanBoard, NAME, PROPERTY_NAME, PROPERTY_VALUE } from './board';
import { ObsidianVault } from 'src/types';

export class KanbanBoardManager {

  private vault: ObsidianVault;
  private metadataCache: MetadataCache;

  constructor(vault: ObsidianVault, metadataCache: MetadataCache) {
    this.vault = vault;
    this.metadataCache = metadataCache;
  }

  resolve(): string {
    for (const file of this.vault.getFiles()) {
      if (this.isValid(file.name)) {
        return file.name;
      }
    }

    throw new KanbanBoardResolveError();
  }

  isValid(fileName: string): boolean {
    const file = this.vault.getFileByPath(fileName);
    if (file !== null) {
      return this.isValidByFile(file);
    }

    return false;
  }

  private isValidByFile(file: TFile): boolean {
    const fileCache = this.metadataCache.getFileCache(file);
    
    return fileCache !== null && this.isDefaultBoard(fileCache.frontmatter);
  }

  private isDefaultBoard(frontmatter: FrontMatterCache | undefined): boolean {
    if (frontmatter === undefined) {
      return false;
    }
    if (typeof frontmatter[PROPERTY_NAME] === 'undefined') {
      return false;
    }
    if (frontmatter[PROPERTY_NAME] !== PROPERTY_VALUE) {
      return false;
    }
    return true;
  }

  async create(): Promise<string> {
    const fileName = `${NAME}.md`;
    const file = await this.vault.create(fileName, (new KanbanBoard(fileName)).toString());

    return file.name;
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
export class KanbanBoardResolveError extends Error {}
