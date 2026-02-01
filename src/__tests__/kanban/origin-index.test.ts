import { TaskOriginIndex } from '../../kanban/origin-index';
import { Task } from '../../tasks/task';

describe('TaskOriginIndex', () => {
  let sut: TaskOriginIndex;

  beforeEach(() => {
    sut = new TaskOriginIndex();
  });

  describe('addOrigin', () => {
    it('adds a single origin for a task', () => {
      sut.addOrigin('Task 1', 'file1.md');

      expect(sut.getOrigins('Task 1')).toEqual(['file1.md']);
    });

    it('adds multiple origins for the same task', () => {
      sut.addOrigin('Task 1', 'file1.md');
      sut.addOrigin('Task 1', 'file2.md');

      expect(sut.getOrigins('Task 1')).toContain('file1.md');
      expect(sut.getOrigins('Task 1')).toContain('file2.md');
      expect(sut.getOrigins('Task 1')).toHaveLength(2);
    });

    it('does not add duplicate origins for the same task', () => {
      sut.addOrigin('Task 1', 'file1.md');
      sut.addOrigin('Task 1', 'file1.md');

      expect(sut.getOrigins('Task 1')).toEqual(['file1.md']);
    });

    it('adds origins for different tasks independently', () => {
      sut.addOrigin('Task 1', 'file1.md');
      sut.addOrigin('Task 2', 'file2.md');

      expect(sut.getOrigins('Task 1')).toEqual(['file1.md']);
      expect(sut.getOrigins('Task 2')).toEqual(['file2.md']);
    });
  });

  describe('getOrigins', () => {
    it('returns empty array for unknown task', () => {
      expect(sut.getOrigins('Unknown Task')).toEqual([]);
    });

    it('returns origins for known task', () => {
      sut.addOrigin('Task 1', 'file1.md');

      expect(sut.getOrigins('Task 1')).toEqual(['file1.md']);
    });
  });

  describe('hasOrigins', () => {
    it('returns false for unknown task', () => {
      expect(sut.hasOrigins('Unknown Task')).toBe(false);
    });

    it('returns true for task with origins', () => {
      sut.addOrigin('Task 1', 'file1.md');

      expect(sut.hasOrigins('Task 1')).toBe(true);
    });

    it('returns false after all origins are removed', () => {
      sut.addOrigin('Task 1', 'file1.md');
      sut.removeOrigin('Task 1', 'file1.md');

      expect(sut.hasOrigins('Task 1')).toBe(false);
    });
  });

  describe('removeFile', () => {
    it('removes file from all task origins', () => {
      sut.addOrigin('Task 1', 'file1.md');
      sut.addOrigin('Task 2', 'file1.md');
      sut.addOrigin('Task 2', 'file2.md');

      sut.removeFile('file1.md');

      expect(sut.getOrigins('Task 1')).toEqual([]);
      expect(sut.getOrigins('Task 2')).toEqual(['file2.md']);
    });

    it('removes task entry when no origins remain', () => {
      sut.addOrigin('Task 1', 'file1.md');

      sut.removeFile('file1.md');

      expect(sut.size()).toBe(0);
    });
  });

  describe('removeOrigin', () => {
    it('removes specific origin from task', () => {
      sut.addOrigin('Task 1', 'file1.md');
      sut.addOrigin('Task 1', 'file2.md');

      sut.removeOrigin('Task 1', 'file1.md');

      expect(sut.getOrigins('Task 1')).toEqual(['file2.md']);
    });

    it('handles removing non-existent origin', () => {
      sut.addOrigin('Task 1', 'file1.md');

      sut.removeOrigin('Task 1', 'file2.md');

      expect(sut.getOrigins('Task 1')).toEqual(['file1.md']);
    });

    it('handles removing from non-existent task', () => {
      sut.removeOrigin('Unknown Task', 'file1.md');

      expect(sut.size()).toBe(0);
    });
  });

  describe('clear', () => {
    it('removes all tracked origins', () => {
      sut.addOrigin('Task 1', 'file1.md');
      sut.addOrigin('Task 2', 'file2.md');

      sut.clear();

      expect(sut.size()).toBe(0);
      expect(sut.getOrigins('Task 1')).toEqual([]);
      expect(sut.getOrigins('Task 2')).toEqual([]);
    });
  });

  describe('size', () => {
    it('returns 0 for empty index', () => {
      expect(sut.size()).toBe(0);
    });

    it('returns count of tracked tasks', () => {
      sut.addOrigin('Task 1', 'file1.md');
      sut.addOrigin('Task 2', 'file2.md');

      expect(sut.size()).toBe(2);
    });
  });

  describe('buildFromTasks', () => {
    it('builds index from tasks with origins', () => {
      const task1 = {
        getName: () => 'Task 1',
        getOrigins: () => ['file1.md', 'file2.md'],
      } as unknown as Task;
      const task2 = {
        getName: () => 'Task 2',
        getOrigins: () => ['file3.md'],
      } as unknown as Task;

      sut.buildFromTasks([task1, task2]);

      expect(sut.getOrigins('Task 1')).toContain('file1.md');
      expect(sut.getOrigins('Task 1')).toContain('file2.md');
      expect(sut.getOrigins('Task 2')).toEqual(['file3.md']);
      expect(sut.size()).toBe(2);
    });

    it('handles tasks with no origins', () => {
      const task1 = {
        getName: () => 'Task 1',
        getOrigins: () => [],
      } as unknown as Task;

      sut.buildFromTasks([task1]);

      expect(sut.size()).toBe(0);
    });
  });
});
