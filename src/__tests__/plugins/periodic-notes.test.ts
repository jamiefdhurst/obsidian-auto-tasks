import type { Plugin } from 'obsidian';
import { IPeriodicNotesPlugin, PeriodicNotesPluginAdapter } from '../../plugins/periodic-notes';
import { DEFAULT_SETTINGS, type ISettings } from '../../settings';
import type { ObsidianAppWithPlugins } from '../../types';

describe('periodic-notes plugin adapter', () => {

  let app: ObsidianAppWithPlugins;
  let settings: ISettings;

  let sut: PeriodicNotesPluginAdapter;

  beforeEach(() => {
    app = jest.fn() as unknown as ObsidianAppWithPlugins;
    app.plugins = {
      enabledPlugins: new Set<string>(),
      getPlugin: (id: string): Plugin | undefined => undefined,
    };
    settings = Object.assign({}, DEFAULT_SETTINGS);

    sut = new PeriodicNotesPluginAdapter(app);
  });

  it('returns true when plugin is enabled', () => {
    app.plugins.enabledPlugins.add('periodic-notes');

    expect(sut.isEnabled()).toEqual(true);
  });

  it('returns false when plugin is unavailable', () => {
    expect(sut.isEnabled()).toEqual(false);
  });

  it('converts the plugin settings', () => {
    const mockSettings = {
      daily: { enabled: true },
      weekly: { enabled: false },
      monthly: { enabled: false },
      quarterly: { enabled: false },
      yearly: { enabled: false },
    };
    const mockPlugin: IPeriodicNotesPlugin = jest.fn() as unknown as IPeriodicNotesPlugin;
    mockPlugin.settings = mockSettings;
    app.plugins.getPlugin = (id: string) => {
      return mockPlugin;
    }

    const result = sut.convertSettings(settings);
    expect(result.daily.available).toEqual(true);
    expect(result.weekly.available).toEqual(false);
  });

  it('converts empty settings when plugin settings are unavailable', () => {
    const mockPlugin: IPeriodicNotesPlugin = jest.fn() as unknown as IPeriodicNotesPlugin;
    app.plugins.getPlugin = (id: string) => {
      return mockPlugin;
    }

    const result = sut.convertSettings(settings);
    expect(result.daily.available).toEqual(false);
    expect(result.weekly.available).toEqual(false);
  });
});
