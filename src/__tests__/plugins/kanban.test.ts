import { Plugin } from 'obsidian';
import { KanbanPluginAdapter } from '../../plugins/kanban';
import { ObsidianAppWithPlugins } from '../../types';

describe('kanban plugin adapter', () => {
  let app: ObsidianAppWithPlugins;

  let sut: KanbanPluginAdapter;

  beforeEach(() => {
    app = jest.fn() as unknown as ObsidianAppWithPlugins;
    app.plugins = {
      enabledPlugins: new Set<string>(),
      getPlugin: (id: string): Plugin | undefined => undefined,
    };

    sut = new KanbanPluginAdapter(app);
  });

  it('returns true when plugin is enabled', () => {
    app.plugins.enabledPlugins.add('obsidian-kanban');

    expect(sut.isEnabled()).toEqual(true);
  });

  it('returns false when plugin is unavailable', () => {
    expect(sut.isEnabled()).toEqual(false);
  });
});
