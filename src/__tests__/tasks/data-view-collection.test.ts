import { moment } from 'obsidian';
import AutoTasks from '../..';
import { DONE, DUE, PROGRESS, UPCOMING } from '../../kanban/board';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { DataViewTaskCollection } from '../../tasks/data-view-collection';
import { DataViewTask } from '../../tasks/data-view-task';
import { DUE_DATE_FORMAT } from '../../tasks/task';

describe('DataView task collection', () => {
  let settings: ISettings;
  let sut: DataViewTaskCollection;

  beforeEach(() => {
    settings = Object.assign({}, DEFAULT_SETTINGS);

    jest.spyOn(AutoTasks, 'getSettings').mockReturnValue(settings);
  });

  it('parses tasks correctly', () => {
    settings.carryOverPrefix = '[>]';
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n- [ ] [>] Task 5\n'
    );

    expect(sut.getAllTasks().length).toEqual(5);
    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(2);
    expect(sut.getTasksFromLists(['## Header 2']).length).toEqual(3);
    expect(sut.getAllTasks()[4].getName()).toEqual('Task 5');
  });

  it('adds board headers', () => {
    sut = new DataViewTaskCollection(
      `${UPCOMING}\n\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n`,
      true
    );
    sut = new DataViewTaskCollection(
      `${UPCOMING}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`,
      true
    );
    sut = new DataViewTaskCollection(
      `${UPCOMING}\n\n\n\n\n\n${DUE}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`,
      true
    );
    sut = new DataViewTaskCollection(
      `${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`,
      true
    );
  });

  it('adds a new task to given header', () => {
    sut = new DataViewTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.add(new DataViewTask('- [ ] Task 2'), '## Header 1');

    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(2);
  });

  it('adds a new task to complete', () => {
    sut = new DataViewTaskCollection('', true);

    sut.add(new DataViewTask('- [x] Complete task'));

    expect(sut.getTasksFromLists([UPCOMING, DUE, PROGRESS]).length).toEqual(0);
    expect(sut.getTasksFromLists([DONE]).length).toEqual(1);
  });

  it('adds a new task to due', () => {
    sut = new DataViewTaskCollection('', true);

    sut.add(
      new DataViewTask(
        `- [ ] Due task [due:: ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}]`
      )
    );

    expect(sut.getTasksFromLists([UPCOMING, PROGRESS, DONE]).length).toEqual(0);
    expect(sut.getTasksFromLists([DUE]).length).toEqual(1);
  });

  it('adds a new task to upcoming', () => {
    sut = new DataViewTaskCollection('', true);

    sut.add(new DataViewTask('- [ ] Normal task'));

    expect(sut.getTasksFromLists([DUE, PROGRESS, DONE]).length).toEqual(0);
    expect(sut.getTasksFromLists([UPCOMING]).length).toEqual(1);
  });

  it('does not add a task when list is undefined', () => {
    sut = new DataViewTaskCollection('', true);

    sut.add(new DataViewTask('- [ ] Normal task'), '## Non-existant header');

    expect(sut.getAllTasks().length).toEqual(0);
  });

  it('does not add a task when task already exists in that header', () => {
    sut = new DataViewTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.add(new DataViewTask('- [ ] Task 1'), '## Header 1');

    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(1);
  });

  it('gets all tasks', () => {
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    const result = sut.getAllTasks();

    expect(result[0].getName()).toEqual('Task 1');
    expect(result[1].getName()).toEqual('Task 2');
    expect(result[2].getName()).toEqual('Task 3');
    expect(result[3].getName()).toEqual('Task 4');
  });

  it('gets list when it exists', () => {
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getList(new DataViewTask('- [ ] Task 3'))).toEqual('## Header 2');
  });

  it('returns empty string when list does not exist', () => {
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getList(new DataViewTask('- [ ] Task 5'))).toEqual('');
  });

  it('gets an existing task if it exists', () => {
    sut = new DataViewTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    expect(sut.getTask(new DataViewTask('- [ ] Task 1'))?.getName()).toEqual('Task 1');
  });

  it('returns undefined if an existing task does not exist', () => {
    sut = new DataViewTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    expect(sut.getTask(new DataViewTask('- [ ] Task 2'))).toBeUndefined();
  });

  it('returns no tasks from empty lists', () => {
    sut = new DataViewTaskCollection('');

    expect(sut.getTasksFromLists([]).length).toEqual(0);
  });

  it('gets tasks from a list', () => {
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(2);
    expect(sut.getTasksFromLists(['## Header 1', '## Header 2']).length).toEqual(4);
  });

  it('gets all tasks when no lists are passed in', () => {
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getTasksFromLists([]).length).toEqual(4);
  });

  it('gets all tasks when empty string is passed in', () => {
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getTasksFromLists(['']).length).toEqual(4);
  });

  it('returns nothing when the list does not exist', () => {
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    expect(sut.getTasksFromLists(['## Header 3']).length).toEqual(0);
  });

  it('moves task', () => {
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n'
    );

    sut.move(new DataViewTask('- [ ] Task 1'), '## Header 2');

    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(1);
    expect(sut.getTasksFromLists(['## Header 2']).length).toEqual(3);
  });

  it('replaces task when it exists', () => {
    sut = new DataViewTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.replace(new DataViewTask('- [ ] Task 1 [due:: 2024-10-10]'));

    expect(sut.getAllTasks().length).toEqual(1);
    expect(sut.getAllTasks()[0].getDueDate()).toEqual('2024-10-10');
  });

  it('replaces task when it exists with completed dates', () => {
    sut = new DataViewTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.replace(new DataViewTask('- [ ] Task 1 [completion:: 2024-10-10]'));

    expect(sut.getAllTasks().length).toEqual(1);
    expect(sut.getAllTasks()[0].getCompletedDate()).toEqual('2024-10-10');
  });

  it('does not replace task when it is not found', () => {
    sut = new DataViewTaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.replace(new DataViewTask('- [ ] Task 2 [due:: 2024-10-10]'));

    expect(sut.getAllTasks().length).toEqual(1);
  });

  it('removes a task', () => {
    sut = new DataViewTaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2');

    sut.remove(new DataViewTask('- [ ] Task 1'));

    expect(sut.getAllTasks()[0].getName()).toEqual('Task 2');
  });

  it('converts collection to string format', () => {
    settings.carryOverPrefix = '[>]';
    sut = new DataViewTaskCollection(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4 [due:: 2025-01-01]\n- [ ] [>] Task 5\n'
    );

    const result1 = sut.toString('\n\n\n');
    const result2 = sut.toString();

    expect(sut.getAllTasks()[3].getDueDate()).toEqual('2025-01-01');
    expect(result1).toEqual(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4 [due:: 2025-01-01]\n- [ ] [>] Task 5\n\n\n\n'
    );
    expect(result2).toEqual(
      '## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4 [due:: 2025-01-01]\n- [ ] [>] Task 5\n\n'
    );
  });

  describe('sub-tasks', () => {
    it('parses sub-tasks with tab indentation', () => {
      sut = new DataViewTaskCollection(
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
      sut = new DataViewTaskCollection(
        '## Header 1\n\n- [ ] Parent task\n  - [ ] Child task 1\n  - [ ] Child task 2\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks.length).toEqual(1);
      expect(tasks[0].hasChildren()).toBe(true);
      expect(tasks[0].getChildren().length).toEqual(2);
    });

    it('parses deeply nested sub-tasks', () => {
      sut = new DataViewTaskCollection(
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

    it('parses sub-tasks with metadata', () => {
      sut = new DataViewTaskCollection(
        '## Header 1\n\n- [ ] Parent task [due:: 2024-01-01]\n\t- [ ] Child task [due:: 2024-01-02]\n'
      );

      const tasks = sut.getAllTasks();
      expect(tasks[0].getDueDate()).toEqual('2024-01-01');
      expect(tasks[0].getChildren()[0].getDueDate()).toEqual('2024-01-02');
    });

    it('filters incomplete children correctly', () => {
      sut = new DataViewTaskCollection(
        '## Header 1\n\n- [ ] Parent task\n\t- [x] Complete child\n\t- [ ] Incomplete child\n'
      );

      const tasks = sut.getAllTasks();
      const parent = tasks[0];
      expect(parent.getChildren().length).toEqual(2);

      parent.filterIncompleteChildren();

      expect(parent.getChildren().length).toEqual(1);
      expect(parent.getChildren()[0].getName()).toEqual('Incomplete child');
    });

    it('outputs sub-tasks with correct indentation', () => {
      sut = new DataViewTaskCollection(
        '## Header 1\n\n- [ ] Parent task\n\t- [ ] Child task 1\n\t- [x] Child task 2\n'
      );

      const result = sut.toString();

      expect(result).toContain('- [ ] Parent task');
      expect(result).toContain('\t- [ ] Child task 1');
      expect(result).toContain('\t- [x] Child task 2');
    });
  });
});
