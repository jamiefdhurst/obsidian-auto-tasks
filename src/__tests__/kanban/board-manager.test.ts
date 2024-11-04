import { CachedMetadata, FrontMatterCache, MetadataCache, TFile, Vault } from 'obsidian';
import { KanbanBoardManager, KanbanBoardOpenError, KanbanBoardResolveError } from '../../kanban/board-manager';
import { ObsidianVault } from '../../types';
import { PROPERTY_NAME, PROPERTY_VALUE } from '../../kanban/board';

describe('kanban board-manager', () => {

  let dummyFile: TFile;

  let metadataCache: MetadataCache;
  let vault: ObsidianVault;

  let sut: KanbanBoardManager;

  beforeEach(() => {
    vault = jest.fn() as unknown as ObsidianVault;
    metadataCache = jest.fn() as unknown as MetadataCache;

    dummyFile = new TFile();
    dummyFile.basename = 'example';
    dummyFile.name = 'example.md';

    sut = new KanbanBoardManager(vault, metadataCache);
  });

  it('throws error when it cannot resolve a board', () => {
    vault.getFiles = jest.fn();
    jest.spyOn(vault, 'getFiles').mockImplementation(() => {
      return [];
    });

    expect(() => {
      sut.resolve();
    }).toThrow(KanbanBoardResolveError);
  });

  it('resolves the default board correctly', () => {
    vault.getFiles = jest.fn();
    jest.spyOn(vault, 'getFiles').mockImplementation(() => {
      return [dummyFile];
    });
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => dummyFile);

    const frontmatter: FrontMatterCache = [];
    frontmatter[`${PROPERTY_NAME}`] = PROPERTY_VALUE;
    const metadata: CachedMetadata = {frontmatter};
    metadataCache.getFileCache = jest.fn();
    jest.spyOn(metadataCache, 'getFileCache').mockImplementation((_) => metadata);

    const board = sut.resolve();
    
    expect(board).toEqual('example.md');
  });

  it('returns invalid for a file that cannot be loaded', () => {
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => null);

    expect(sut.isValid('example.md')).toBe(false);
  });

  it('returns invalid for a file that has no file cache', () => {
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => dummyFile);
    metadataCache.getFileCache = jest.fn();
    jest.spyOn(metadataCache, 'getFileCache').mockImplementation((_) => null);

    expect(sut.isValid('example.md')).toBe(false);
  });

  it('returns invalid for a file that has no frontmatter cache', () => {
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => dummyFile);
    const metadata: CachedMetadata = {frontmatter: undefined};
    metadataCache.getFileCache = jest.fn();
    jest.spyOn(metadataCache, 'getFileCache').mockImplementation((_) => metadata);

    expect(sut.isValid('example.md')).toBe(false);
  });

  it('returns invalid for a file that does not have the correct metadata property', () => {
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => dummyFile);
    const frontmatter: FrontMatterCache = [];
    const metadata: CachedMetadata = {frontmatter};
    metadataCache.getFileCache = jest.fn();
    jest.spyOn(metadataCache, 'getFileCache').mockImplementation((_) => metadata);

    expect(sut.isValid('example.md')).toBe(false);
  });

  it('returns invalid for a file that has the wrong metadata property', () => {
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => dummyFile);
    const frontmatter: FrontMatterCache = [];
    frontmatter[`${PROPERTY_NAME}`] = 'foo';
    const metadata: CachedMetadata = {frontmatter};
    metadataCache.getFileCache = jest.fn();
    jest.spyOn(metadataCache, 'getFileCache').mockImplementation((_) => metadata);

    expect(sut.isValid('example.md')).toBe(false);
  });

  it('returns valid for the default board', () => {
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => dummyFile);
    const frontmatter: FrontMatterCache = [];
    frontmatter[`${PROPERTY_NAME}`] = PROPERTY_VALUE;
    const metadata: CachedMetadata = {frontmatter};
    metadataCache.getFileCache = jest.fn();
    jest.spyOn(metadataCache, 'getFileCache').mockImplementation((_) => metadata);

    expect(sut.isValid('example.md')).toBe(true);
  });

  it('creates a new board', async () => {
    vault.create = jest.fn();
    jest.spyOn(vault, 'create').mockImplementation(async (path, data, _) => dummyFile);

    const board = await sut.create();

    expect(board).toBe('example.md');
  });

  it('returns an error when the board cannot be loaded', async () => {
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => null);

    await expect(sut.get('example.md'))
      .rejects
      .toThrow(KanbanBoardOpenError);
  });

  it('returns a valid board', async () => {
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => dummyFile);
    vault.read = jest.fn();
    jest.spyOn(vault, 'read').mockImplementation(async (_) => 'Random contents');

    const board = await sut.get('example.md');

    expect(board.getFileName()).toBe('example.md');
  });

});
