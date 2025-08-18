import { FrontMatterCache, MetadataCache, TFile } from 'obsidian';
import AutoTasks from '../..';
import { KANBAN_PROPERTY_NAME, KANBAN_PROPERTY_VALUE } from '../../kanban/board';
import { KanbanBoardManager, KanbanBoardOpenError } from '../../kanban/board-manager';
import { DEFAULT_SETTINGS } from '../../settings';
import { EmojiTaskCollection } from '../../tasks/emoji-collection';
import { TaskFactory } from '../../tasks/factory';
import { ObsidianVault } from '../../types';

describe('kanban board-manager', () => {

  let dummyFile: TFile;

  let metadataCache: MetadataCache;
  let vault: ObsidianVault;

  let sut: KanbanBoardManager;

  beforeEach(() => {
    const taskFactory = jest.fn as unknown as TaskFactory;
    taskFactory.newCollection = jest.fn().mockImplementation((a, b) => new EmojiTaskCollection(a, b));

    jest.spyOn(AutoTasks, 'getSettings').mockReturnValue(Object.assign({}, DEFAULT_SETTINGS));

    vault = jest.fn() as unknown as ObsidianVault;
    metadataCache = jest.fn() as unknown as MetadataCache;

    dummyFile = new TFile();
    dummyFile.basename = 'example';
    dummyFile.name = 'example.md';

    sut = new KanbanBoardManager(vault, metadataCache, taskFactory);
  });

  it('returns nothing when it can\'t find any boards', () => {
    vault.getFiles = jest.fn().mockReturnValue([new TFile()]);
    metadataCache.getFileCache = jest.fn().mockReturnValue(null);

    const result = sut.getAllBoards();

    expect(result).toEqual([]);
  });

  it('returns all valid boards with valid frontcache properties', () => {
    const files = [new TFile(), new TFile(), new TFile(), new TFile()];
    files[0].path = 'example-1.md';
    files[1].path = 'example-2.md';
    files[2].path = 'example-3.md';
    files[3].path = 'example-4.md';
    vault.getFiles = jest.fn().mockReturnValue(files);
    const frontmatter1: FrontMatterCache = {}
    const frontmatter2: FrontMatterCache = {}
    const frontmatter3: FrontMatterCache = {}
    frontmatter2[KANBAN_PROPERTY_NAME] = 'foobar';
    frontmatter3[KANBAN_PROPERTY_NAME] = KANBAN_PROPERTY_VALUE;
    metadataCache.getFileCache = jest.fn().mockReturnValueOnce({frontmatter: undefined})
      .mockReturnValueOnce({frontmatter: frontmatter1})
      .mockReturnValueOnce({frontmatter: frontmatter2})
      .mockReturnValueOnce({frontmatter: frontmatter3});

    const result = sut.getAllBoards();

    expect(result.length).toEqual(1);
    expect(result[0].path).toEqual('example-4.md');
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
    expect(board.getArchive().getAllTasks().length).toEqual(0);
  });

  it('returns a valid board with an archive', async () => {
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockImplementation((_) => dummyFile);
    vault.read = jest.fn();
    jest.spyOn(vault, 'read').mockImplementation(async (_) => '## Default List\n- [ ] Some task or another\n\n\n***\n## Archive\n\n- [x] Archived task');

    const board = await sut.get('example.md');

    expect(board.getFileName()).toBe('example.md');
    expect(board.getArchive().getAllTasks().length).toEqual(1);
  });

});
