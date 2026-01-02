import { MetadataCache } from 'obsidian';
import AutoTasks from 'src';
import { KanbanBoard } from '../../kanban/board';
import { KanbanBoardManager, KanbanBoardOpenError } from '../../kanban/board-manager';
import { KanbanProvider } from '../../kanban/provider';
import { KanbanSynchroniser } from '../../kanban/synchroniser';
import { Watcher } from '../../kanban/watcher';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { TaskFactory } from '../../tasks/factory';
import { ObsidianVault } from '../../types';

describe('kanban provider', () => {
  let plugin: AutoTasks;

  let taskFactory: TaskFactory;
  let boardManager: KanbanBoardManager;
  let synchroniser: KanbanSynchroniser;
  let watcher: Watcher;

  let settings: ISettings;

  let sut: KanbanProvider;

  beforeEach(() => {
    const vault = jest.fn() as unknown as ObsidianVault;
    const metadataCache = jest.fn() as unknown as MetadataCache;
    plugin = jest.fn() as unknown as AutoTasks;
    taskFactory = jest.fn() as unknown as TaskFactory;
    boardManager = jest.fn() as unknown as KanbanBoardManager;
    synchroniser = jest.fn() as unknown as KanbanSynchroniser;
    watcher = jest.fn() as unknown as Watcher;

    plugin.getSettings = jest.fn().mockImplementation(() => settings);
    settings = Object.assign({}, DEFAULT_SETTINGS, {
      kanbanSync: true,
      kanbanFile: 'example.md',
    });

    sut = new KanbanProvider(
      plugin,
      vault,
      metadataCache,
      taskFactory,
      boardManager,
      synchroniser,
      watcher
    );
  });

  it('loads with default dependencies', () => {
    const vault = jest.fn() as unknown as ObsidianVault;
    const metadataCache = jest.fn() as unknown as MetadataCache;
    sut = new KanbanProvider(plugin, vault, metadataCache, taskFactory);

    expect(sut).toBeInstanceOf(KanbanProvider);
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
    jest.spyOn(boardManager, 'get').mockImplementationOnce(async () => {
      throw new KanbanBoardOpenError();
    });
    synchroniser.process = jest.fn();
    const synchroniserProcess = jest.spyOn(synchroniser, 'process');

    await sut.synchroniseTasks();

    expect(synchroniserProcess).not.toHaveBeenCalled();
  });

  it('synchronises with board', async () => {
    settings.kanbanSync = true;
    settings.kanbanFile = 'example.md';
    boardManager.get = jest.fn();
    jest
      .spyOn(boardManager, 'get')
      .mockImplementationOnce(async () => new KanbanBoard(taskFactory, 'example.md'));
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

    expect(sut.getBoard()).rejects.toThrow(KanbanBoardOpenError);
  });

  it('gets board successfully', async () => {
    settings.kanbanSync = true;
    settings.kanbanFile = 'example.md';
    boardManager.get = jest.fn();
    const board = new KanbanBoard(taskFactory, 'example.md');
    jest.spyOn(boardManager, 'get').mockImplementation(async () => board);

    const result = await sut.getBoard();

    expect(result).toEqual(board);
  });

  it('gets board manager', () => {
    expect(sut.getBoardManager()).toEqual(boardManager);
  });

  it('gets watcher', () => {
    expect(sut.getWatcher()).toEqual(watcher);
  });
});
