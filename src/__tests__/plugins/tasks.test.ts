import { Plugin } from 'obsidian';
import { TasksPluginAdapter } from '../../plugins/tasks';
import { ObsidianAppWithPlugins } from '../../types';

describe('tasks plugin adapter', () => {

  let app: ObsidianAppWithPlugins;

  let sut: TasksPluginAdapter;

  beforeEach(() => {
    app = jest.fn() as unknown as ObsidianAppWithPlugins;
    app.plugins = {
      enabledPlugins: new Set<string>(),
      getPlugin: (id: string): Plugin | undefined => undefined,
    };

    sut = new TasksPluginAdapter(app);
  });

  it('returns true when plugin is enabled', () => {
    app.plugins.enabledPlugins.add('obsidian-tasks-plugin');

    expect(sut.isEnabled()).toEqual(true);
  });

  it('returns false when plugin is unavailable', () => {
    expect(sut.isEnabled()).toEqual(false);
  });
})
