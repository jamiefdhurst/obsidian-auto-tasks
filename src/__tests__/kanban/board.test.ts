import AutoTasks from '../..';
import { KanbanBoard } from '../../kanban/board';
import { DEFAULT_SETTINGS } from '../../settings';

describe('kanban board', () => {

  let sut: KanbanBoard;

    beforeAll(() => {
      jest.spyOn(AutoTasks, 'getSettings').mockReturnValue(Object.assign({}, DEFAULT_SETTINGS));
    });
  

  it('initialises without contents using defaults', () => {
    sut = new KanbanBoard('example.md');

    const markdown = sut.toString();
    expect(markdown).toContain('## Upcoming');
    expect(markdown).toContain('## Due');
    expect(markdown).toContain('## In progress');
    expect(markdown).toContain('## Done');
  });

  it('initialises with contents', () => {
    sut = new KanbanBoard('example.md', '## Example Header\n\n- [ ] Example task');

    const markdown = sut.toString();
    expect(markdown).not.toContain('## Upcoming');
    expect(markdown).toContain('## Example Header');
    expect(markdown).toContain('- [ ] Example task');
  });

  it('gets filename correctly', () => {
    sut = new KanbanBoard('example.md');

    expect(sut.getFileName()).toEqual('example.md');
  });

  it('gets a task collection and uses the cached object', () => {
    sut = new KanbanBoard('example.md', '## Example Header\n\n- [ ] Example task');

    const tasks1 = sut.getTaskCollection();
    const tasks2 = sut.getTaskCollection();

    expect(tasks1).toEqual(tasks2);
    expect(tasks1.getAllTasks().length).toEqual(1);
  });

});
