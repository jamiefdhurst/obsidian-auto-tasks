import { MetadataCache } from 'obsidian';
import AutoTasks from 'src';
import { KanbanBoard } from '../../kanban/board';
import { KanbanBoardManager, KanbanBoardOpenError, KanbanBoardResolveError } from '../../kanban/board-manager';
import { KanbanProvider } from '../../kanban/provider';
import { KanbanSynchroniser } from '../../kanban/synchroniser';
import { Watcher } from '../../kanban/watcher';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { ObsidianVault } from '../../types';

describe('kanban provider', () => {

  let plugin: AutoTasks;

  let boardManager: KanbanBoardManager;
  let synchroniser: KanbanSynchroniser;
  let watcher: Watcher;

  let settings: ISettings;

  let sut: KanbanProvider;

  beforeEach(() => {
    const vault = jest.fn() as unknown as ObsidianVault;
    const metadataCache = jest.fn() as unknown as MetadataCache;
    plugin = jest.fn() as unknown as AutoTasks;
    boardManager = jest.fn() as unknown as KanbanBoardManager;
    synchroniser = jest.fn() as unknown as KanbanSynchroniser;
    watcher = jest.fn() as unknown as Watcher;

    plugin.getSettings = jest.fn().mockImplementation(() => settings);
    settings = Object.assign({}, DEFAULT_SETTINGS, {
      kanbanSync: true,
      kanbanFile: 'example.md',
    });

    sut = new KanbanProvider(plugin, vault, metadataCache, boardManager, synchroniser, watcher);
  });

  it('loads with default dependencies', () => {
    const vault = jest.fn() as unknown as ObsidianVault;
    const metadataCache = jest.fn() as unknown as MetadataCache;
    sut = new KanbanProvider(plugin, vault, metadataCache);

    expect(sut).toBeInstanceOf(KanbanProvider);
  });

  it('does not resolve with kanban disabled', async () => {
    settings.kanbanSync = false;
    boardManager.create = jest.fn();
    const boardManagerCreate = jest.spyOn(boardManager, 'create');

    const result = await sut.resolveSettings(settings);

    expect(boardManagerCreate).not.toHaveBeenCalled();
    expect(result).toEqual(settings);
  });

  it('creates a new board when missing', async () => {
    settings.kanbanSync = true;
    settings.kanbanFile = '';
    boardManager.create = jest.fn();
    const boardManagerCreate = jest.spyOn(boardManager, 'create').mockImplementation(async () => 'example.md');

    const result = await sut.resolveSettings(settings);

    expect(boardManagerCreate).toHaveBeenCalled();
    expect(result.kanbanFile).toEqual('example.md');
  });

  it('when file is invalid, resolves correctly', async () => {
    settings.kanbanSync = true;
    settings.kanbanFile = 'example.md';
    boardManager.isValid = jest.fn();
    const boardManagerIsValid = jest.spyOn(boardManager, 'isValid').mockImplementation(() => false);
    boardManager.resolve = jest.fn();
    const boardManagerResolve = jest.spyOn(boardManager, 'resolve').mockImplementation(() => 'correct.md');

    const result = await sut.resolveSettings(settings);

    expect(boardManagerIsValid).toHaveBeenCalled();
    expect(boardManagerResolve).toHaveBeenCalled();
    expect(result.kanbanFile).toEqual('correct.md');
  });

  it('when file is invalid and cannot resolve, creates a new one', async () => {
    settings.kanbanSync = true;
    settings.kanbanFile = 'example.md';
    boardManager.isValid = jest.fn();
    const boardManagerIsValid = jest.spyOn(boardManager, 'isValid').mockImplementation(() => false);
    boardManager.resolve = jest.fn();
    const boardManagerResolve = jest.spyOn(boardManager, 'resolve').mockImplementationOnce(() => { throw new KanbanBoardResolveError(); });
    boardManager.create = jest.fn();
    const boardManagerCreate = jest.spyOn(boardManager, 'create').mockImplementation(async () => 'newfile.md');

    const result = await sut.resolveSettings(settings);

    expect(boardManagerIsValid).toHaveBeenCalled();
    expect(boardManagerResolve).toHaveBeenCalled();
    expect(boardManagerCreate).toHaveBeenCalled();
    expect(result.kanbanFile).toEqual('newfile.md');
  });

  it('does not synchronise when kanban is disabled', async () => {
    settings.kanbanSync = false;
    boardManager.get = jest.fn();
    const boardManagerGet = jest.spyOn(boardManager, 'get');

    await sut.synchroniseTasks();

    expect(boardManagerGet).not.toHaveBeenCalled();
  });

  it('does not synchronise when the board cannot be retrieved', async () => {
    settings.kanbanSync = true;
    settings.kanbanFile = 'example.md';
    boardManager.get = jest.fn();
    jest.spyOn(boardManager, 'get').mockImplementationOnce(async () => { throw new KanbanBoardOpenError(); });
    synchroniser.process = jest.fn();
    const synchroniserProcess = jest.spyOn(synchroniser, 'process');

    await sut.synchroniseTasks();

    expect(synchroniserProcess).not.toHaveBeenCalled();
  });

  it('synchronises with board', async () => {
    settings.kanbanSync = true;
    settings.kanbanFile = 'example.md';
    boardManager.get = jest.fn();
    jest.spyOn(boardManager, 'get').mockImplementationOnce(async () => new KanbanBoard('example.md'));
    synchroniser.process = jest.fn();
    const synchroniserProcess = jest.spyOn(synchroniser, 'process');

    await sut.synchroniseTasks();

    expect(synchroniserProcess).toHaveBeenCalled();
  });

  it('does not get board when kanban is disabled', async () => {
    settings.kanbanSync = false;
    boardManager.get = jest.fn();
    const boardManagerGet = jest.spyOn(boardManager, 'get');

    const result = await sut.getBoard();

    expect(boardManagerGet).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('passes any errors from board manager', () => {
    settings.kanbanSync = true;
    settings.kanbanFile = 'example.md';
    boardManager.get = jest.fn();
    jest.spyOn(boardManager, 'get').mockRejectedValue(new KanbanBoardOpenError());

    expect(sut.getBoard())
      .rejects
      .toThrow(KanbanBoardOpenError);
  });

  it('gets board successfully', async () => {
    settings.kanbanSync = true;
    settings.kanbanFile = 'example.md';
    boardManager.get = jest.fn();
    const board = new KanbanBoard('example.md');
    jest.spyOn(boardManager, 'get').mockImplementation(async () => board);

    const result = await sut.getBoard();

    expect(result).toEqual(board);
  });

  it('gets watcher', () => {
    expect(sut.getWatcher()).toEqual(watcher);
  });

});
