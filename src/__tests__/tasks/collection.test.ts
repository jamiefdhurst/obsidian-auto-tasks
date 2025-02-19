import { moment } from 'obsidian';
import AutoTasks from '../../';
import { DONE, DUE, PROGRESS, UPCOMING } from '../../kanban/board';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { TaskCollection } from '../../tasks/collection';
import { DUE_DATE_FORMAT, Task } from '../../tasks/task';

describe('task collection', () => {

  let settings: ISettings;
  let sut: TaskCollection;

  beforeEach(() => {
    settings = Object.assign({}, DEFAULT_SETTINGS);

    jest.spyOn(AutoTasks, 'getSettings').mockReturnValue(settings);
  });

  it('parses tasks correctly', () => {
    settings.carryOverPrefix = '[>]';
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n- [ ] [>] Task 5\n');

    expect(sut.getAllTasks().length).toEqual(5);
    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(2);
    expect(sut.getTasksFromLists(['## Header 2']).length).toEqual(3);
    expect(sut.getAllTasks()[4].getName()).toEqual('Task 5');
  });

  it('adds board headers', () => {
    sut = new TaskCollection(`${UPCOMING}\n\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n`, true);
    sut = new TaskCollection(`${UPCOMING}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`, true);
    sut = new TaskCollection(`${UPCOMING}\n\n\n\n\n\n${DUE}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`, true);
    sut = new TaskCollection(`${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`, true);
  });

  it('adds a new task to given header', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.add(new Task('- [ ] Task 2'), '## Header 1');
    
    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(2);
  });

  it('adds a new task to complete', () => {
    sut = new TaskCollection('', true);

    sut.add(new Task('- [x] Complete task'));

    expect(sut.getTasksFromLists([UPCOMING, DUE, PROGRESS]).length).toEqual(0);
    expect(sut.getTasksFromLists([DONE]).length).toEqual(1);
  });

  it('adds a new task to due', () => {
    sut = new TaskCollection('', true);

    sut.add(new Task(`- [ ] Due task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}`));

    expect(sut.getTasksFromLists([UPCOMING, PROGRESS, DONE]).length).toEqual(0);
    expect(sut.getTasksFromLists([DUE]).length).toEqual(1);
  });

  it('adds a new task to upcoming', () => {
    sut = new TaskCollection('', true);

    sut.add(new Task('- [ ] Normal task'));

    expect(sut.getTasksFromLists([DUE, PROGRESS, DONE]).length).toEqual(0);
    expect(sut.getTasksFromLists([UPCOMING]).length).toEqual(1);
  });

  it('does not add a task when list is undefined', () => {
    sut = new TaskCollection('', true);

    sut.add(new Task('- [ ] Normal task'), '## Non-existant header');

    expect(sut.getAllTasks().length).toEqual(0);
  });

  it('does not add a task when task already exists in that header', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.add(new Task('- [ ] Task 1'), '## Header 1');
    
    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(1);
  });

  it('gets all tasks', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n');

    const result = sut.getAllTasks();

    expect(result[0].getName()).toEqual('Task 1');
    expect(result[1].getName()).toEqual('Task 2');
    expect(result[2].getName()).toEqual('Task 3');
    expect(result[3].getName()).toEqual('Task 4');
  });

  it('gets list when it exists', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n');

    expect(sut.getList(new Task('- [ ] Task 3'))).toEqual('## Header 2');
  });

  it('returns empty string when list does not exist', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n');

    expect(sut.getList(new Task('- [ ] Task 5'))).toEqual('');
  });

  it('gets an existing task if it exists', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n');

    expect(sut.getTask(new Task('- [ ] Task 1'))?.getName()).toEqual('Task 1');
  });

  it('returns undefined if an existing task does not exist', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n');

    expect(sut.getTask(new Task('- [ ] Task 2'))).toBeUndefined();
  });

  it('returns no tasks from empty lists', () => {
    sut = new TaskCollection('');

    expect(sut.getTasksFromLists([]).length).toEqual(0);
  });

  it('gets tasks from a list', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n');

    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(2);
    expect(sut.getTasksFromLists(['## Header 1', '## Header 2']).length).toEqual(4);
  });

  it('gets all tasks when no lists are passed in', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n');

    expect(sut.getTasksFromLists([]).length).toEqual(4);
  });

  it('gets all tasks when empty string is passed in', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n');

    expect(sut.getTasksFromLists(['']).length).toEqual(4);
  });

  it('returns nothing when the list does not exist', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n');

    expect(sut.getTasksFromLists(['## Header 3']).length).toEqual(0);
  });

  it('moves task', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n');

    sut.move(new Task('- [ ] Task 1'), '## Header 2');
    
    expect(sut.getTasksFromLists(['## Header 1']).length).toEqual(1);
    expect(sut.getTasksFromLists(['## Header 2']).length).toEqual(3);
  });

  it('replaces task when it exists', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.replace(new Task('- [ ] Task 1 📅 2024-10-10'));
    
    expect(sut.getAllTasks().length).toEqual(1);
    expect(sut.getAllTasks()[0].getDueDate()).toEqual('2024-10-10');
  });

  it('does not replace task when it is not found', () => {
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n');

    sut.replace(new Task('- [ ] Task 2 📅 2024-10-10'));
    
    expect(sut.getAllTasks().length).toEqual(1);
  });

  it('converts collection to string format', () => {
    settings.carryOverPrefix = '[>]';
    sut = new TaskCollection('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n- [ ] [>] Task 5\n');

    const result1 = sut.toString('\n\n\n');
    const result2 = sut.toString();

    expect(result1).toEqual('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n- [ ] [>] Task 5\n\n\n\n');
    expect(result2).toEqual('## Header 1\n\n- [ ] Task 1\n- [ ] Task 2\n\n## Header 2\n\n- [ ] Task 3\n- [ ] Task 4\n- [ ] [>] Task 5\n\n');
  });

});
