import { moment } from 'obsidian';
import AutoTasks from '../../';
import { DONE, DUE, PROGRESS, UPCOMING } from '../../kanban/board';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { EmojiTaskCollection } from '../../tasks/emoji-collection';
import { EmojiTask } from '../../tasks/emoji-task';
import { DUE_DATE_FORMAT } from '../../tasks/task';

describe('Emoji task collection', () => {
  let settings: ISettings;
  let sut: EmojiTaskCollection;

  beforeEach(() => {
    settings = Object.assign({}, DEFAULT_SETTINGS);

    jest.spyOn(AutoTasks, 'getSettings').mockReturnValue(settings);
  });

  it('parses tasks correctly', () => {
    settings.carryOverPrefix = '[>]';
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n- [ ] [>] Task 5\n'
    );

    expect(sut.getAllTasks().length).toEqual(5);
    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(2);
    expect(sut.getTasksFromLists(['## Header 2']).length).toEqual(3);
    expect(sut.getAllTasks()[4].getName()).toEqual('Task 5');
  });

  it('adds board headers', () => {
    sut = new EmojiTaskCollection(
      `${UPCOMING}\n\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n`,
      true
    );
    sut = new EmojiTaskCollection(
      `${UPCOMING}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`,
      true
    );
    sut = new EmojiTaskCollection(
      `${UPCOMING}\n\n\n\n\n\n${DUE}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`,
      true
    );
    sut = new EmojiTaskCollection(
      `${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`,
      true
    );
  });

  it('adds a new task to given header', () => {
    sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.add(new EmojiTask('- [ ] Task 2'), '## Header 1');

    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(2);
  });

  it('adds a new task to complete', () => {
    sut = new EmojiTaskCollection('', true);

    sut.add(new EmojiTask('- [x] Complete task'));

    expect(sut.getTasksFromLists([UPCOMING, DUE, PROGRESS]).length).toEqual(0);
    expect(sut.getTasksFromLists([DONE]).length).toEqual(1);
  });

  it('adds a new task to due', () => {
    sut = new EmojiTaskCollection('', true);

    sut.add(
      new EmojiTask(`- [ ] Due task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}`)
    );

    expect(sut.getTasksFromLists([UPCOMING, PROGRESS, DONE]).length).toEqual(0);
    expect(sut.getTasksFromLists([DUE]).length).toEqual(1);
  });

  it('adds a new task to upcoming', () => {
    sut = new EmojiTaskCollection('', true);

    sut.add(new EmojiTask('- [ ] Normal task'));

    expect(sut.getTasksFromLists([DUE, PROGRESS, DONE]).length).toEqual(0);
    expect(sut.getTasksFromLists([UPCOMING]).length).toEqual(1);
  });

  it('does not add a task when list is undefined', () => {
    sut = new EmojiTaskCollection('', true);

    sut.add(new EmojiTask('- [ ] Normal task'), '## Non-existant header');

    expect(sut.getAllTasks().length).toEqual(0);
  });

  it('does not add a task when task already exists in that header', () => {
    sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.add(new EmojiTask('- [ ] Task 1'), '## Header 1');

    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(1);
  });

  it('gets all tasks', () => {
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    const result = sut.getAllTasks();

    expect(result[0].getName()).toEqual('Task 1');
    expect(result[1].getName()).toEqual('Task 2');
    expect(result[2].getName()).toEqual('Task 3');
    expect(result[3].getName()).toEqual('Task 4');
  });

  it('gets list when it exists', () => {
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getList(new EmojiTask('- [ ] Task 3'))).toEqual('## Header 2');
  });

  it('returns empty string when list does not exist', () => {
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getList(new EmojiTask('- [ ] Task 5'))).toEqual('');
  });

  it('gets an existing task if it exists', () => {
    sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    expect(sut.getTask(new EmojiTask('- [ ] Task 1'))?.getName()).toEqual('Task 1');
  });

  it('returns undefined if an existing task does not exist', () => {
    sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    expect(sut.getTask(new EmojiTask('- [ ] Task 2'))).toBeUndefined();
  });

  it('returns no tasks from empty lists', () => {
    sut = new EmojiTaskCollection('');

    expect(sut.getTasksFromLists([]).length).toEqual(0);
  });

  it('gets tasks from a list', () => {
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(2);
    expect(sut.getTasksFromLists(['## Header 1', '## Header 2']).length).toEqual(4);
  });

  it('gets all tasks when no lists are passed in', () => {
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getTasksFromLists([]).length).toEqual(4);
  });

  it('gets all tasks when empty string is passed in', () => {
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getTasksFromLists(['']).length).toEqual(4);
  });

  it('returns nothing when the list does not exist', () => {
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getTasksFromLists(['## Header 3']).length).toEqual(0);
  });

  it('moves task', () => {
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    sut.move(new EmojiTask('- [ ] Task 1'), '## Header 2');

    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(1);
    expect(sut.getTasksFromLists(['## Header 2']).length).toEqual(3);
  });

  it('replaces task when it exists', () => {
    sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.replace(new EmojiTask('- [ ] Task 1 📅 2024-10-10'));

    expect(sut.getAllTasks().length).toEqual(1);
    expect(sut.getAllTasks()[0].getDueDate()).toEqual('2024-10-10');
  });

  it('replaces task when it exists with completed dates', () => {
    sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.replace(new EmojiTask('- [ ] Task 1 ✅ 2024-10-10'));

    expect(sut.getAllTasks().length).toEqual(1);
    expect(sut.getAllTasks()[0].getCompletedDate()).toEqual('2024-10-10');
  });

  it('does not replace task when it is not found', () => {
    sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.replace(new EmojiTask('- [ ] Task 2 📅 2024-10-10'));

    expect(sut.getAllTasks().length).toEqual(1);
  });

  it('removes a task', () => {
    sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2');

    sut.remove(new EmojiTask('- [ ] Task 1'));

    expect(sut.getAllTasks()[0].getName()).toEqual('Task 2');
  });

  it('converts collection to string format', () => {
    settings.carryOverPrefix = '[>]';
    sut = new EmojiTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n- [ ] [>] Task 5\n'
    );

    const result1 = sut.toString('\n\n\n');
    const result2 = sut.toString();

    expect(result1).toEqual(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n- [ ] [>] Task 5\n\n\n\n'
    );
    expect(result2).toEqual(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n- [ ] [>] Task 5\n\n'
    );
  });

  describe('sub-tasks', () => {
    it('parses sub-tasks with tab indentation', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent task\n\t- [ ] Child task 1\n\t- [ ] Child task 2\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(1);
      expect(tasks[0].getName()).toEqual('Parent task');
      expect(tasks[0].hasChildren()).toBe(true);
      expect(tasks[0].getChildren().length).toEqual(2);
      expect(tasks[0].getChildren()[0].getName()).toEqual('Child task 1');
      expect(tasks[0].getChildren()[1].getName()).toEqual('Child task 2');
    });

    it('parses sub-tasks with space indentation', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent task\n  - [ ] Child task 1\n  - [ ] Child task 2\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(1);
      expect(tasks[0].hasChildren()).toBe(true);
      expect(tasks[0].getChildren().length).toEqual(2);
    });

    it('parses deeply nested sub-tasks', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Level 0\n\t- [ ] Level 1\n\t\t- [ ] Level 2\n\t\t\t- [ ] Level 3\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(1);
      expect(tasks[0].getName()).toEqual('Level 0');
      expect(tasks[0].getChildren()[0].getName()).toEqual('Level 1');
      expect(tasks[0].getChildren()[0].getChildren()[0].getName()).toEqual('Level 2');
      expect(tasks[0].getChildren()[0].getChildren()[0].getChildren()[0].getName()).toEqual(
        'Level 3'
      );
    });

    it('parses multiple parent tasks with their own sub-tasks', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent 1\n\t- [ ] Child 1a\n- [ ] Parent 2\n\t- [ ] Child 2a\n\t- [ ] Child 2b\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(2);
      expect(tasks[0].getName()).toEqual('Parent 1');
      expect(tasks[0].getChildren().length).toEqual(1);
      expect(tasks[1].getName()).toEqual('Parent 2');
      expect(tasks[1].getChildren().length).toEqual(2);
    });

    it('outputs sub-tasks with correct indentation', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent task\n\t- [ ] Child task 1\n\t- [x] Child task 2\n'
      );

      const result = sut.toString();

      expect(result).toContain('- [ ] Parent task');
      expect(result).toContain('\t- [ ] Child task 1');
      expect(result).toContain('\t- [x] Child task 2');
    });

    it('parses sub-tasks with metadata', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent task 📅 2024-01-01\n\t- [ ] Child task 📅 2024-01-02\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks[0].getDueDate()).toEqual('2024-01-01');
      expect(tasks[0].getChildren()[0].getDueDate()).toEqual('2024-01-02');
    });

    it('filters incomplete children correctly', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent task\n\t- [x] Complete child\n\t- [ ] Incomplete child\n'
      );

      const tasks = sut.getAllTasks();
      const parent = tasks[0];
      expect(parent.getChildren().length).toEqual(2);

      parent.filterIncompleteChildren();

      expect(parent.getChildren().length).toEqual(1);
      expect(parent.getChildren()[0].getName()).toEqual('Incomplete child');
    });

    it('filters incomplete children recursively', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent\n\t- [ ] Child\n\t\t- [x] Complete grandchild\n\t\t- [ ] Incomplete grandchild\n'
      );

      const tasks = sut.getAllTasks();
      const parent = tasks[0];

      parent.filterIncompleteChildren();

      expect(parent.getChildren()[0].getChildren().length).toEqual(1);
      expect(parent.getChildren()[0].getChildren()[0].getName()).toEqual('Incomplete grandchild');
    });

    it('marks children as carried over when parent is marked', () => {
      settings.carryOverPrefix = '[>]';
      sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Parent task\n\t- [ ] Child task\n');

      const tasks = sut.getAllTasks();
      const parent = tasks[0];
      parent.markCarriedOver();

      const result = parent.toString();
      expect(result).toContain('- [ ] [>] Parent task');
      expect(result).toContain('\t- [ ] [>] Child task');
    });

    it('resets indent levels when setIndentLevel is called', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent\n\t- [ ] Child\n\t\t- [ ] Grandchild\n'
      );

      const tasks = sut.getAllTasks();
      const parent = tasks[0];

      // Reset to level 0 (simulating carry-over)
      parent.setIndentLevel(0);

      const result = parent.toString();
      expect(result).toContain('- [ ] Parent');
      expect(result).toContain('\t- [ ] Child');
      expect(result).toContain('\t\t- [ ] Grandchild');
    });

    it('preserves space indentation pattern when outputting', () => {
      // Use 2-space indentation (2 spaces = level 1, 4 spaces = level 2)
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent\n  - [ ] Child level 1\n    - [ ] Child level 2\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(1);
      expect(tasks[0].hasChildren()).toBe(true);

      const result = tasks[0].toString();
      // Should preserve the 2-space pattern
      expect(result).toContain('- [ ] Parent');
      expect(result).toContain('  - [ ] Child level 1');
      expect(result).toContain('    - [ ] Child level 2');
    });

    it('parses sub-tasks with 4-space indentation (issue #63)', () => {
      // 4-space indentation calculates as level 2, but should still find level 0 parent
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Perl Training setup\n    - [x] Initial build ✅ 2026-01-15\n    - [ ] Add in extra features\n    - [ ] Decide upon the activities\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(1);
      expect(tasks[0].getName()).toEqual('Perl Training setup');
      expect(tasks[0].hasChildren()).toBe(true);
      expect(tasks[0].getChildren().length).toEqual(3);
      expect(tasks[0].getChildren()[0].getName()).toEqual('Initial build');
      expect(tasks[0].getChildren()[1].getName()).toEqual('Add in extra features');
      expect(tasks[0].getChildren()[2].getName()).toEqual('Decide upon the activities');
    });

    it('preserves 4-space indentation pattern when outputting', () => {
      sut = new EmojiTaskCollection(
        '## Header 1\n\n- [ ] Parent\n    - [ ] Child with 4-space indent\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(1);
      expect(tasks[0].hasChildren()).toBe(true);

      const result = tasks[0].toString();
      expect(result).toContain('- [ ] Parent');
      expect(result).toContain('    - [ ] Child with 4-space indent');
    });

    it('finds nearest parent when indent levels are skipped', () => {
      // Task at level 2 without a level 1 parent - should find level 0 parent
      sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Parent\n\t\t- [ ] Child at level 2\n');

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(1);
      expect(tasks[0].getName()).toEqual('Parent');
      expect(tasks[0].hasChildren()).toBe(true);
      expect(tasks[0].getChildren()[0].getName()).toEqual('Child at level 2');
    });

    it('handles truly orphaned sub-tasks with no parent available', () => {
      // Indented task at start of section with no parent - should be added as top-level
      sut = new EmojiTaskCollection('## Header 1\n\n\t- [ ] Orphaned task with no parent\n');

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(1);
      expect(tasks[0].getName()).toEqual('Orphaned task with no parent');
    });

    it('handles task with due date in toString when dueDate is set', () => {
      sut = new EmojiTaskCollection('## Header 1\n\n- [ ] Task with due 📅 2024-01-15\n');

      const tasks = sut.getAllTasks();
      const task = tasks[0];

      // Call isDue to set the dueDate property
      task.isDue();

      const result = task.toString();
      expect(result).toContain('📅 2024-01-15');
    });
  });
});
