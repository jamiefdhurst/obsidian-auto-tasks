import { TasksPluginAdapter } from '../../plugins/tasks';
import { TaskFactory } from '../../tasks/factory';
import { EmojiTaskCollection } from '../../tasks/emoji-collection';
import { DataViewTaskCollection } from '../../tasks/data-view-collection';

describe('TaskFactory', () => {
  let pluginAdapter: TasksPluginAdapter;
  let sut: TaskFactory;

  beforeEach(() => {
    pluginAdapter = jest.fn() as unknown as TasksPluginAdapter;
    pluginAdapter.isDataViewFormat = jest.fn();

    sut = new TaskFactory(pluginAdapter);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a new emoji collection', () => {
    jest.spyOn(pluginAdapter, 'isDataViewFormat').mockResolvedValue(false);

    const collection = sut.newCollection('');

    expect(collection).toBeInstanceOf(EmojiTaskCollection);
  });

  it('creates a new dataview collection', async () => {
    jest.spyOn(pluginAdapter, 'isDataViewFormat').mockResolvedValue(true);

    // Re-trigger the check in the background, but don't use this result
    sut.newCollection('');

    await new Promise((r) => setTimeout(r, 5));

    const collection = sut.newCollection('');

    expect(collection).toBeInstanceOf(DataViewTaskCollection);
  });
});
