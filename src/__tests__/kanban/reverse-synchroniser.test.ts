import { TFile } from 'obsidian';
import { TaskOriginIndex } from '../../kanban/origin-index';
import { ReverseKanbanSynchroniser, TaskCompletionChange } from '../../kanban/reverse-synchroniser';
import { Task } from '../../tasks/task';
import { ObsidianVault } from '../../types';

// Mock task for testing findCompletionChanges
class MockTask {
  private name: string;
  private complete: boolean;
  private taskOrigins: string[];

  constructor(name: string, complete: boolean, origins: string[] = []) {
    this.name = name;
    this.complete = complete;
    this.taskOrigins = origins;
  }

  getName(): string {
    return this.name;
  }

  isComplete(): boolean {
    return this.complete;
  }

  getOrigins(): string[] {
    return this.taskOrigins;
  }
}

describe('ReverseKanbanSynchroniser', () => {
  let sut: ReverseKanbanSynchroniser;
  let vault: ObsidianVault;
  let originIndex: TaskOriginIndex;

  beforeEach(() => {
    vault = jest.fn() as unknown as ObsidianVault;
    vault.getFileByPath = jest.fn();
    vault.read = jest.fn();
    vault.modify = jest.fn();

    originIndex = new TaskOriginIndex();

    sut = new ReverseKanbanSynchroniser(vault, originIndex);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('process', () => {
    it('does nothing with empty changes', async () => {
      const vaultModify = jest.spyOn(vault, 'modify');

      await sut.process([]);

      expect(vaultModify).not.toHaveBeenCalled();
    });

    it('skips tasks with no origins', async () => {
      const vaultModify = jest.spyOn(vault, 'modify');
      const changes: TaskCompletionChange[] = [
        { taskName: 'Unknown Task', isComplete: true, origins: [] },
      ];

      await sut.process(changes);

      expect(vaultModify).not.toHaveBeenCalled();
    });

    it('uses origins from change when provided', async () => {
      const file = new TFile();
      file.path = 'file1.md';
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(file);
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] Task 1\n');
      const vaultModify = jest.spyOn(vault, 'modify');

      const changes: TaskCompletionChange[] = [
        { taskName: 'Task 1', isComplete: true, origins: ['file1.md'] },
      ];

      await sut.process(changes);

      expect(vaultModify).toHaveBeenCalled();
      expect(vaultModify.mock.calls[0][1]).toContain('- [x] Task 1');
    });

    it('falls back to origin index when change has no origins', async () => {
      const file = new TFile();
      file.path = 'file1.md';
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(file);
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] Task 1\n');
      const vaultModify = jest.spyOn(vault, 'modify');

      originIndex.addOrigin('Task 1', 'file1.md');

      const changes: TaskCompletionChange[] = [
        { taskName: 'Task 1', isComplete: true, origins: [] },
      ];

      await sut.process(changes);

      expect(vaultModify).toHaveBeenCalled();
      expect(vaultModify.mock.calls[0][1]).toContain('- [x] Task 1');
    });

    it('marks task as complete in source file', async () => {
      const file = new TFile();
      file.path = 'file1.md';
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(file);
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] Task 1\n- [ ] Task 2\n');
      const vaultModify = jest.spyOn(vault, 'modify');

      const changes: TaskCompletionChange[] = [
        { taskName: 'Task 1', isComplete: true, origins: ['file1.md'] },
      ];

      await sut.process(changes);

      expect(vaultModify).toHaveBeenCalled();
      const content = vaultModify.mock.calls[0][1];
      expect(content).toContain('- [x] Task 1');
      expect(content).toContain('- [ ] Task 2');
    });

    it('marks task as incomplete in source file', async () => {
      const file = new TFile();
      file.path = 'file1.md';
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(file);
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [x] Task 1\n');
      const vaultModify = jest.spyOn(vault, 'modify');

      const changes: TaskCompletionChange[] = [
        { taskName: 'Task 1', isComplete: false, origins: ['file1.md'] },
      ];

      await sut.process(changes);

      expect(vaultModify).toHaveBeenCalled();
      expect(vaultModify.mock.calls[0][1]).toContain('- [ ] Task 1');
    });

    it('updates multiple files for same task', async () => {
      const file1 = new TFile();
      file1.path = 'file1.md';
      const file2 = new TFile();
      file2.path = 'file2.md';

      jest.spyOn(vault, 'getFileByPath').mockImplementation((path) => {
        if (path === 'file1.md') return file1;
        if (path === 'file2.md') return file2;
        return null;
      });
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] Task 1\n');
      const vaultModify = jest.spyOn(vault, 'modify');

      const changes: TaskCompletionChange[] = [
        { taskName: 'Task 1', isComplete: true, origins: ['file1.md', 'file2.md'] },
      ];

      await sut.process(changes);

      expect(vaultModify).toHaveBeenCalledTimes(2);
    });

    it('handles file not found gracefully', async () => {
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(null);
      const vaultModify = jest.spyOn(vault, 'modify');

      const changes: TaskCompletionChange[] = [
        { taskName: 'Task 1', isComplete: true, origins: ['nonexistent.md'] },
      ];

      await sut.process(changes);

      expect(vaultModify).not.toHaveBeenCalled();
    });

    it('handles task not found in file gracefully', async () => {
      const file = new TFile();
      file.path = 'file1.md';
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(file);
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] Different Task\n');
      const vaultModify = jest.spyOn(vault, 'modify');

      const changes: TaskCompletionChange[] = [
        { taskName: 'Task 1', isComplete: true, origins: ['file1.md'] },
      ];

      await sut.process(changes);

      expect(vaultModify).not.toHaveBeenCalled();
    });

    it('preserves task metadata when updating', async () => {
      const file = new TFile();
      file.path = 'file1.md';
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(file);
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] Task 1 📅 2024-01-01 ⏫\n');
      const vaultModify = jest.spyOn(vault, 'modify');

      const changes: TaskCompletionChange[] = [
        { taskName: 'Task 1', isComplete: true, origins: ['file1.md'] },
      ];

      await sut.process(changes);

      expect(vaultModify).toHaveBeenCalled();
      const content = vaultModify.mock.calls[0][1];
      expect(content).toContain('- [x] Task 1 📅 2024-01-01 ⏫');
    });

    it('handles indented tasks', async () => {
      const file = new TFile();
      file.path = 'file1.md';
      jest.spyOn(vault, 'getFileByPath').mockReturnValue(file);
      jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] Parent\n\t- [ ] Task 1\n');
      const vaultModify = jest.spyOn(vault, 'modify');

      const changes: TaskCompletionChange[] = [
        { taskName: 'Task 1', isComplete: true, origins: ['file1.md'] },
      ];

      await sut.process(changes);

      expect(vaultModify).toHaveBeenCalled();
      const content = vaultModify.mock.calls[0][1];
      expect(content).toContain('\t- [x] Task 1');
    });
  });

  describe('findCompletionChanges', () => {
    it('returns empty array when no changes', () => {
      const prev = [new MockTask('Task 1', false)] as unknown as Task[];
      const curr = [new MockTask('Task 1', false)] as unknown as Task[];

      const changes = ReverseKanbanSynchroniser.findCompletionChanges(prev, curr);

      expect(changes).toEqual([]);
    });

    it('detects task marked complete', () => {
      const prev = [new MockTask('Task 1', false)] as unknown as Task[];
      const curr = [new MockTask('Task 1', true)] as unknown as Task[];

      const changes = ReverseKanbanSynchroniser.findCompletionChanges(prev, curr);

      expect(changes).toHaveLength(1);
      expect(changes[0].taskName).toBe('Task 1');
      expect(changes[0].isComplete).toBe(true);
    });

    it('detects task marked incomplete', () => {
      const prev = [new MockTask('Task 1', true)] as unknown as Task[];
      const curr = [new MockTask('Task 1', false)] as unknown as Task[];

      const changes = ReverseKanbanSynchroniser.findCompletionChanges(prev, curr);

      expect(changes).toHaveLength(1);
      expect(changes[0].taskName).toBe('Task 1');
      expect(changes[0].isComplete).toBe(false);
    });

    it('includes origins from current task', () => {
      const prevTask = new MockTask('Task 1', false);
      const currTask = new MockTask('Task 1', true, ['file1.md']);

      const changes = ReverseKanbanSynchroniser.findCompletionChanges(
        [prevTask] as unknown as Task[],
        [currTask] as unknown as Task[]
      );

      expect(changes).toHaveLength(1);
      expect(changes[0].origins).toContain('file1.md');
    });

    it('ignores new tasks', () => {
      const prev: Task[] = [];
      const curr = [new MockTask('Task 1', true)] as unknown as Task[];

      const changes = ReverseKanbanSynchroniser.findCompletionChanges(prev, curr);

      expect(changes).toEqual([]);
    });

    it('ignores removed tasks', () => {
      const prev = [new MockTask('Task 1', false)] as unknown as Task[];
      const curr: Task[] = [];

      const changes = ReverseKanbanSynchroniser.findCompletionChanges(prev, curr);

      expect(changes).toEqual([]);
    });

    it('detects multiple changes', () => {
      const prev = [
        new MockTask('Task 1', false),
        new MockTask('Task 2', true),
      ] as unknown as Task[];
      const curr = [
        new MockTask('Task 1', true),
        new MockTask('Task 2', false),
      ] as unknown as Task[];

      const changes = ReverseKanbanSynchroniser.findCompletionChanges(prev, curr);

      expect(changes).toHaveLength(2);
      expect(changes.find((c) => c.taskName === 'Task 1')?.isComplete).toBe(true);
      expect(changes.find((c) => c.taskName === 'Task 2')?.isComplete).toBe(false);
    });
  });
});
