import AutoTasks from '../..';
import { KanbanBoard } from '../../kanban/board';
import { DEFAULT_SETTINGS } from '../../settings';
import { EmojiTaskCollection } from '../../tasks/emoji-collection';
import { TaskFactory } from '../../tasks/factory';

describe('kanban board', () => {

  let taskFactory: TaskFactory;

  let sut: KanbanBoard;

  beforeEach(() => {
    taskFactory = jest.fn() as unknown as TaskFactory;
    taskFactory.newCollection = jest.fn().mockImplementation((a, b) => new EmojiTaskCollection(a, b));

    jest.spyOn(AutoTasks, 'getSettings').mockReturnValue(Object.assign({}, DEFAULT_SETTINGS));
  });

  it('initialises without contents using defaults', () => {
    sut = new KanbanBoard(taskFactory, 'example.md');

    const markdown = sut.toString();
    expect(markdown).toContain('## Upcoming');
    expect(markdown).toContain('## Due');
    expect(markdown).toContain('## In progress');
    expect(markdown).toContain('## Done');
  });

  it('initialises with contents, adds in default headers', () => {
    sut = new KanbanBoard(taskFactory, 'example.md', '## Example Header\n\n- [ ] Example task');

    const markdown = sut.toString();
    expect(markdown).toContain('## Upcoming');
    expect(markdown).toContain('## Example Header');
    expect(markdown).toContain('- [ ] Example task');
    expect(markdown).not.toContain('## Archive');
  });

  it('initialises with contents and archive', () => {
    sut = new KanbanBoard(taskFactory, 'example.md', '## Example Header\n\n- [ ] Example task', '## Archive\n\n- [x] Archived task');

    const markdown = sut.toString();
    expect(markdown).toContain('## Upcoming');
    expect(markdown).toContain('## Example Header');
    expect(markdown).toContain('- [ ] Example task');
    expect(markdown).toContain('## Archive');
    expect(markdown).toContain('- [x] Archived task');
  });

  it('gets filename correctly', () => {
    sut = new KanbanBoard(taskFactory, 'example.md');

    expect(sut.getFileName()).toEqual('example.md');
  });

  it('gets a task collection and uses the cached object', () => {
    const newCollection = jest.spyOn(taskFactory, 'newCollection');

    sut = new KanbanBoard(taskFactory, 'example.md', '## Example Header\n\n- [ ] Example task');

    const tasks1 = sut.getTaskCollection();
    const tasks2 = sut.getTaskCollection();

    expect(newCollection).toHaveBeenCalledTimes(1);
    expect(tasks1).toEqual(tasks2);
    expect(tasks1.getAllTasks().length).toEqual(1);
  });

    it('gets an archived task collection and uses the cached object', () => {
    const newCollection = jest.spyOn(taskFactory, 'newCollection');

    sut = new KanbanBoard(taskFactory, 'example.md', '## Example Header\n\n- [ ] Example task\n- [ ] Another example task', '## Archive\n\n- [x] Archived task');

    const tasks1 = sut.getArchive();
    const tasks2 = sut.getArchive();

    expect(newCollection).toHaveBeenCalledTimes(1);
    expect(tasks1).toEqual(tasks2);
    expect(tasks1.getAllTasks().length).toEqual(1);
  });

});
