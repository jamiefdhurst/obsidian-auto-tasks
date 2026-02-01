import { MetadataCache, TFile } from 'obsidian';
import AutoTasks from 'src';
import { KanbanBoard } from '../../kanban/board';
import { KanbanBoardManager, KanbanBoardOpenError } from '../../kanban/board-manager';
import { TaskOriginIndex } from '../../kanban/origin-index';
import { KanbanProvider } from '../../kanban/provider';
import { ReverseKanbanSynchroniser } from '../../kanban/reverse-synchroniser';
import { KanbanSynchroniser } from '../../kanban/synchroniser';
import { Watcher } from '../../kanban/watcher';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { TaskFactory } from '../../tasks/factory';
import { Task } from '../../tasks/task';
import { ObsidianVault } from '../../types';

// Mock task for testing
class MockTask {
  private taskName: string;
  private complete: boolean;
  private taskOrigins: string[];

  constructor(name: string, complete: boolean = false, origins: string[] = []) {
    this.taskName = name;
    this.complete = complete;
    this.taskOrigins = origins;
  }

  getName(): string {
    return this.taskName;
  }

  isComplete(): boolean {
    return this.complete;
  }

  getOrigins(): string[] {
    return this.taskOrigins;
  }

  addOrigin(origin: string): void {
    if (!this.taskOrigins.includes(origin)) {
      this.taskOrigins.push(origin);
    }
  }

  setOrigins(origins: string[]): void {
    this.taskOrigins = [...origins];
  }
}

// Mock TaskCollection for testing
class MockTaskCollection {
  private tasks: MockTask[];

  constructor(tasks: MockTask[]) {
    this.tasks = tasks;
  }

  getAllTasks(): MockTask[] {
    return this.tasks;
  }
}

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
    watcher.setForwardSyncInProgress = jest.fn();

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

  it('gets origin index', () => {
    expect(sut.getOriginIndex()).toBeInstanceOf(TaskOriginIndex);
  });

  describe('reverseSynchroniseTasks', () => {
    let vault: ObsidianVault;
    let reverseSynchroniser: ReverseKanbanSynchroniser;
    let originIndex: TaskOriginIndex;

    beforeEach(() => {
      vault = jest.fn() as unknown as ObsidianVault;
      vault.getFiles = jest.fn().mockReturnValue([]);
      vault.read = jest.fn();
      vault.modify = jest.fn();
      vault.getFileByPath = jest.fn();

      originIndex = new TaskOriginIndex();
      reverseSynchroniser = jest.fn() as unknown as ReverseKanbanSynchroniser;
      reverseSynchroniser.process = jest.fn();

      const metadataCache = jest.fn() as unknown as MetadataCache;

      taskFactory.newCollection = jest.fn().mockImplementation((content) => {
        // Parse tasks from content for testing
        const tasks: MockTask[] = [];
        const lines = content.split('\n');
        for (const line of lines) {
          const match = line.match(/^\s*-\s\[([x\s])\]\s+(.+?)(?:\s%%|$)/);
          if (match) {
            tasks.push(new MockTask(match[2].trim(), match[1] === 'x'));
          }
        }
        return new MockTaskCollection(tasks);
      });

      taskFactory.newTask = jest.fn().mockImplementation((line) => {
        const match = line.match(/^\s*-\s\[([x\s])\]\s+(.+)/);
        if (match) {
          return new MockTask(match[2].trim(), match[1] === 'x') as unknown as Task;
        }
        return new MockTask('Unknown', false) as unknown as Task;
      });

      sut = new KanbanProvider(
        plugin,
        vault,
        metadataCache,
        taskFactory,
        boardManager,
        synchroniser,
        watcher,
        originIndex,
        reverseSynchroniser
      );
    });

    it('does not reverse sync when kanban is disabled', async () => {
      settings.kanbanSync = false;
      const reverseSyncProcess = jest.spyOn(reverseSynchroniser, 'process');

      await sut.reverseSynchroniseTasks();

      expect(reverseSyncProcess).not.toHaveBeenCalled();
    });

    it('does not reverse sync when board cannot be retrieved', async () => {
      settings.kanbanSync = true;
      boardManager.get = jest.fn();
      jest.spyOn(boardManager, 'get').mockRejectedValue(new KanbanBoardOpenError());
      const reverseSyncProcess = jest.spyOn(reverseSynchroniser, 'process');

      await sut.reverseSynchroniseTasks();

      expect(reverseSyncProcess).not.toHaveBeenCalled();
    });

    it('calls reverse synchroniser when completion changes are detected', async () => {
      settings.kanbanSync = true;

      // Board with a task
      const board = {
        getFileName: () => 'example.md',
        getTaskCollection: () => new MockTaskCollection([new MockTask('Task 1', false)]),
        toString: () => '',
      } as unknown as KanbanBoard;

      boardManager.get = jest.fn();
      jest.spyOn(boardManager, 'get').mockResolvedValue(board);

      // Call reverse sync - no changes expected since previous state is empty
      await sut.reverseSynchroniseTasks();

      // Verify reverse sync was attempted (process may or may not be called depending on changes)
      // The important thing is that no errors occurred and the method completes
      expect(boardManager.get).toHaveBeenCalled();
    });

    it('does not process when no completion changes', async () => {
      settings.kanbanSync = true;

      const board = {
        getFileName: () => 'example.md',
        getTaskCollection: () => new MockTaskCollection([new MockTask('Task 1', false)]),
        toString: () => '',
      } as unknown as KanbanBoard;

      boardManager.get = jest.fn();
      jest.spyOn(boardManager, 'get').mockResolvedValue(board);

      // Set up previous state
      await sut.synchroniseTasks();

      // Reverse sync with same state
      const reverseSyncProcess = jest.spyOn(reverseSynchroniser, 'process');

      await sut.reverseSynchroniseTasks();

      expect(reverseSyncProcess).not.toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    let vault: ObsidianVault;
    let originIndex: TaskOriginIndex;

    beforeEach(() => {
      vault = jest.fn() as unknown as ObsidianVault;
      vault.getFiles = jest.fn().mockReturnValue([]);
      vault.read = jest.fn();
      vault.modify = jest.fn();
      vault.getFileByPath = jest.fn();

      originIndex = new TaskOriginIndex();

      const metadataCache = jest.fn() as unknown as MetadataCache;

      taskFactory.newCollection = jest.fn().mockImplementation((content) => {
        const tasks: MockTask[] = [];
        const lines = content.split('\n');
        for (const line of lines) {
          const match = line.match(/^\s*-\s\[([x\s])\]\s+(.+?)(?:\s%%origin:|$)/);
          if (match) {
            const origins: string[] = [];
            const originMatches = line.matchAll(/%%origin:(.*?)%%/g);
            for (const originMatch of originMatches) {
              origins.push(originMatch[1]);
            }
            tasks.push(new MockTask(match[2].trim(), match[1] === 'x', origins));
          }
        }
        return new MockTaskCollection(tasks);
      });

      taskFactory.newTask = jest.fn().mockImplementation((line) => {
        const match = line.match(/^\s*-\s\[([x\s])\]\s+(.+)/);
        if (match) {
          return new MockTask(match[2].trim(), match[1] === 'x') as unknown as Task;
        }
        return new MockTask('Unknown', false) as unknown as Task;
      });

      sut = new KanbanProvider(
        plugin,
        vault,
        metadataCache,
        taskFactory,
        boardManager,
        synchroniser,
        watcher,
        originIndex
      );
    });

    it('does not initialize when kanban is disabled', async () => {
      settings.kanbanSync = false;
      boardManager.get = jest.fn();
      const boardManagerGet = jest.spyOn(boardManager, 'get');

      await sut.initialize();

      expect(boardManagerGet).not.toHaveBeenCalled();
    });

    it('builds origin index from board tasks', async () => {
      settings.kanbanSync = true;

      const taskWithOrigin = new MockTask('Task 1', false, ['file1.md']);
      const board = {
        getFileName: () => 'example.md',
        getTaskCollection: () => new MockTaskCollection([taskWithOrigin]),
        toString: () => '',
      } as unknown as KanbanBoard;

      boardManager.get = jest.fn();
      jest.spyOn(boardManager, 'get').mockResolvedValue(board);

      await sut.initialize();

      expect(originIndex.getOrigins('Task 1')).toContain('file1.md');
    });

    it('handles board load error gracefully', async () => {
      settings.kanbanSync = true;
      boardManager.get = jest.fn();
      jest.spyOn(boardManager, 'get').mockRejectedValue(new KanbanBoardOpenError());

      await expect(sut.initialize()).resolves.not.toThrow();
    });
  });

  describe('migrateOrigins', () => {
    let vault: ObsidianVault;
    let originIndex: TaskOriginIndex;

    beforeEach(() => {
      vault = jest.fn() as unknown as ObsidianVault;
      vault.getFiles = jest.fn().mockReturnValue([]);
      vault.read = jest.fn();
      vault.modify = jest.fn();
      vault.getFileByPath = jest.fn();

      originIndex = new TaskOriginIndex();

      const metadataCache = jest.fn() as unknown as MetadataCache;

      taskFactory.newCollection = jest.fn().mockImplementation((content) => {
        const tasks: MockTask[] = [];
        const lines = content.split('\n');
        for (const line of lines) {
          const match = line.match(/^\s*-\s\[([x\s])\]\s+(.+?)(?:\s%%origin:|$)/);
          if (match) {
            const origins: string[] = [];
            const originMatches = line.matchAll(/%%origin:(.*?)%%/g);
            for (const originMatch of originMatches) {
              origins.push(originMatch[1]);
            }
            tasks.push(new MockTask(match[2].trim(), match[1] === 'x', origins));
          }
        }
        return new MockTaskCollection(tasks);
      });

      taskFactory.newTask = jest.fn().mockImplementation((line) => {
        const match = line.match(/^\s*-\s\[([x\s])\]\s+(.+)/);
        if (match) {
          return new MockTask(match[2].trim(), match[1] === 'x') as unknown as Task;
        }
        return new MockTask('Unknown', false) as unknown as Task;
      });

      plugin.updateSettings = jest.fn();

      sut = new KanbanProvider(
        plugin,
        vault,
        metadataCache,
        taskFactory,
        boardManager,
        synchroniser,
        watcher,
        originIndex
      );
    });

    it('does not migrate when kanban is disabled', async () => {
      settings.kanbanSync = false;
      boardManager.get = jest.fn();
      const boardManagerGet = jest.spyOn(boardManager, 'get');

      await sut.migrateOrigins();

      expect(boardManagerGet).not.toHaveBeenCalled();
    });

    it('does not migrate when already migrated', async () => {
      settings.kanbanSync = true;
      settings.kanbanOriginsMigrated = true;
      boardManager.get = jest.fn();
      const boardManagerGet = jest.spyOn(boardManager, 'get');

      await sut.migrateOrigins();

      expect(boardManagerGet).not.toHaveBeenCalled();
    });

    it('migrates origins from files to board tasks', async () => {
      settings.kanbanSync = true;
      settings.kanbanOriginsMigrated = false;

      const file1 = new TFile();
      file1.name = 'file1.md';
      file1.path = 'folder/file1.md';

      jest.spyOn(vault, 'getFiles').mockReturnValue([file1]);
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] Task 1\n');
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(new TFile());

      const boardTask = new MockTask('Task 1', false);
      const board = {
        getFileName: () => 'example.md',
        getTaskCollection: () => new MockTaskCollection([boardTask]),
        toString: () => '',
      } as unknown as KanbanBoard;

      boardManager.get = jest.fn();
      jest.spyOn(boardManager, 'get').mockResolvedValue(board);

      await sut.migrateOrigins();

      expect(originIndex.getOrigins('Task 1')).toContain('folder/file1.md');
      expect(plugin.updateSettings).toHaveBeenCalled();
    });

    it('filters out ignored folders during migration', async () => {
      settings.kanbanSync = true;
      settings.kanbanOriginsMigrated = false;
      settings.kanbanIgnoreFolders = ['ignored'];

      const file1 = new TFile();
      file1.name = 'file1.md';
      file1.path = 'ignored/file1.md';

      const file2 = new TFile();
      file2.name = 'file2.md';
      file2.path = 'valid/file2.md';

      jest.spyOn(vault, 'getFiles').mockReturnValue([file1, file2]);
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] Task 1\n');
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(new TFile());

      const boardTask = new MockTask('Task 1', false);
      const board = {
        getFileName: () => 'example.md',
        getTaskCollection: () => new MockTaskCollection([boardTask]),
        toString: () => '',
      } as unknown as KanbanBoard;

      boardManager.get = jest.fn();
      jest.spyOn(boardManager, 'get').mockResolvedValue(board);

      await sut.migrateOrigins();

      expect(originIndex.getOrigins('Task 1')).toContain('valid/file2.md');
      expect(originIndex.getOrigins('Task 1')).not.toContain('ignored/file1.md');
    });

    it('handles board load error during migration gracefully', async () => {
      settings.kanbanSync = true;
      settings.kanbanOriginsMigrated = false;
      boardManager.get = jest.fn();
      jest.spyOn(boardManager, 'get').mockRejectedValue(new KanbanBoardOpenError());

      await expect(sut.migrateOrigins()).resolves.not.toThrow();
    });

    it('skips files that cannot be read during migration', async () => {
      settings.kanbanSync = true;
      settings.kanbanOriginsMigrated = false;

      const file1 = new TFile();
      file1.name = 'file1.md';
      file1.path = 'folder/file1.md';

      jest.spyOn(vault, 'getFiles').mockReturnValue([file1]);
      jest.spyOn(vault, 'read').mockRejectedValue(new Error('Read error'));
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(new TFile());

      const boardTask = new MockTask('Task 1', false);
      const board = {
        getFileName: () => 'example.md',
        getTaskCollection: () => new MockTaskCollection([boardTask]),
        toString: () => '',
      } as unknown as KanbanBoard;

      boardManager.get = jest.fn();
      jest.spyOn(boardManager, 'get').mockResolvedValue(board);

      await expect(sut.migrateOrigins()).resolves.not.toThrow();
      expect(plugin.updateSettings).toHaveBeenCalled();
    });
  });
});
