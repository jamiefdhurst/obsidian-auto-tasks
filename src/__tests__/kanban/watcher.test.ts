import { TFile } from 'obsidian';
import { KanbanProvider } from '../../kanban/provider';
import { Watcher } from '../../kanban/watcher';

describe('kanban watcher', () => {
  let sut: Watcher;
  let kanban: KanbanProvider;

  beforeEach(() => {
    kanban = jest.fn() as unknown as KanbanProvider;
    kanban.synchroniseTasks = jest.fn();
    kanban.reverseSynchroniseTasks = jest.fn();

    sut = new Watcher(kanban, 20);
  });

  it('initialises with default timeout', () => {
    expect(new Watcher(kanban)).toBeInstanceOf(Watcher);
  });

  it('notifies create', async () => {
    const run = jest.spyOn(kanban, 'synchroniseTasks');
    const file = new TFile();
    sut.notifyCreate(file);

    expect(run).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 20));
    expect(run).toHaveBeenCalledWith([file]);
  });

  it('notifies modify', async () => {
    const run = jest.spyOn(kanban, 'synchroniseTasks');
    const file = new TFile();
    sut.notifyModify(file);

    expect(run).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 20));
    expect(run).toHaveBeenCalledWith([file]);
  });

  it('notifies modify once for the same file for multiple events', async () => {
    const run = jest.spyOn(kanban, 'synchroniseTasks');
    const file = new TFile();

    sut.notifyModify(file);
    await new Promise((r) => setTimeout(r, 5));
    sut.notifyModify(file);

    await new Promise((r) => setTimeout(r, 20));
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith([file]);
  });

  it('notifies modify for different files', async () => {
    const run = jest.spyOn(kanban, 'synchroniseTasks');
    const file1 = new TFile();
    file1.name = 'file1.md';
    const file2 = new TFile();
    file2.name = 'file2.md';

    sut.notifyModify(file1);
    await new Promise((r) => setTimeout(r, 5));
    sut.notifyModify(file2);

    await new Promise((r) => setTimeout(r, 20));
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('notifies rename', async () => {
    const run = jest.spyOn(kanban, 'synchroniseTasks');
    const file = new TFile();
    sut.notifyRename(file, 'oldname.md');

    expect(run).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 20));
    expect(run).toHaveBeenCalledWith([file]);
  });

  it('notifies rename once for the same file for multiple events', async () => {
    const run = jest.spyOn(kanban, 'synchroniseTasks');
    const file = new TFile();
    file.name = 'newname.md';

    sut.notifyRename(file, 'oldname.md');
    await new Promise((r) => setTimeout(r, 5));
    file.name = 'anothernewname.md';
    sut.notifyRename(file, 'newname.md');

    await new Promise((r) => setTimeout(r, 20));
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith([file]);
  });

  it('notifies delete with no timeout', async () => {
    const run = jest.spyOn(kanban, 'synchroniseTasks');
    const file = new TFile();

    sut.notifyDelete(file);

    await new Promise((r) => setTimeout(r, 20));
    expect(run).not.toHaveBeenCalled();
  });

  it('notifies delete with existing timeout', async () => {
    const run = jest.spyOn(kanban, 'synchroniseTasks');
    const file = new TFile();

    sut.notifyModify(file);
    await new Promise((r) => setTimeout(r, 10));
    sut.notifyDelete(file);

    await new Promise((r) => setTimeout(r, 20));
    expect(run).not.toHaveBeenCalled();
  });

  describe('board monitoring', () => {
    it('notifies board modify triggers reverse sync', async () => {
      const reverseSync = jest.spyOn(kanban, 'reverseSynchroniseTasks');

      sut.notifyBoardModify();

      expect(reverseSync).not.toHaveBeenCalled();

      await new Promise((r) => setTimeout(r, 25));
      expect(reverseSync).toHaveBeenCalledTimes(1);
    });

    it('debounces multiple board modify calls', async () => {
      const reverseSync = jest.spyOn(kanban, 'reverseSynchroniseTasks');

      sut.notifyBoardModify();
      await new Promise((r) => setTimeout(r, 5));
      sut.notifyBoardModify();

      await new Promise((r) => setTimeout(r, 25));
      expect(reverseSync).toHaveBeenCalledTimes(1);
    });

    it('skips reverse sync when forward sync is in progress', async () => {
      const reverseSync = jest.spyOn(kanban, 'reverseSynchroniseTasks');

      sut.setForwardSyncInProgress(true);
      sut.notifyBoardModify();

      await new Promise((r) => setTimeout(r, 25));
      expect(reverseSync).not.toHaveBeenCalled();
    });

    it('allows reverse sync after forward sync completes', async () => {
      const reverseSync = jest.spyOn(kanban, 'reverseSynchroniseTasks');

      sut.setForwardSyncInProgress(true);
      sut.notifyBoardModify();

      await new Promise((r) => setTimeout(r, 25));
      expect(reverseSync).not.toHaveBeenCalled();

      sut.setForwardSyncInProgress(false);
      sut.notifyBoardModify();

      await new Promise((r) => setTimeout(r, 25));
      expect(reverseSync).toHaveBeenCalledTimes(1);
    });

    it('tracks forward sync in progress state', () => {
      expect(sut.isForwardSyncInProgress()).toBe(false);

      sut.setForwardSyncInProgress(true);
      expect(sut.isForwardSyncInProgress()).toBe(true);

      sut.setForwardSyncInProgress(false);
      expect(sut.isForwardSyncInProgress()).toBe(false);
    });
  });
});
