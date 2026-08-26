import { Plugin } from 'obsidian';
import { CoreNotesAdapter } from '../../plugins/core-notes';
import {
  InternalPlugin,
  ObsidianAppWithInternalPlugins,
  ObsidianAppWithPlugins,
} from '../../types';

describe('core notes adapter', () => {
  let app: ObsidianAppWithPlugins & ObsidianAppWithInternalPlugins;
  let internalPlugins: Map<string, InternalPlugin>;

  let sut: CoreNotesAdapter;

  beforeEach(() => {
    app = jest.fn() as unknown as ObsidianAppWithPlugins & ObsidianAppWithInternalPlugins;
    internalPlugins = new Map<string, InternalPlugin>();
    app.plugins = {
      enabledPlugins: new Set<string>(),
      getPlugin: (id: string): Plugin | undefined => undefined,
    };
    app.internalPlugins = {
      getPluginById: (id: string): InternalPlugin | undefined => internalPlugins.get(id),
    };

    sut = new CoreNotesAdapter(app);
  });

  describe('core Daily Notes', () => {
    it('returns true when the plugin is enabled', () => {
      internalPlugins.set('daily-notes', { enabled: true });

      expect(sut.isDailyNotesEnabled()).toEqual(true);
    });

    it('returns false when the plugin is present but disabled', () => {
      internalPlugins.set('daily-notes', { enabled: false });

      expect(sut.isDailyNotesEnabled()).toEqual(false);
    });

    it('returns false when the plugin is unknown', () => {
      expect(sut.isDailyNotesEnabled()).toEqual(false);
    });

    it('returns false when there is no internal plugin manager', () => {
      app.internalPlugins = undefined as unknown as typeof app.internalPlugins;

      expect(sut.isDailyNotesEnabled()).toEqual(false);
    });

    it('returns false when the internal plugin manager throws', () => {
      app.internalPlugins = {
        getPluginById: (): InternalPlugin | undefined => {
          throw new Error('nope');
        },
      };

      expect(sut.isDailyNotesEnabled()).toEqual(false);
    });
  });

  describe('Calendar', () => {
    it('returns true when the plugin is enabled', () => {
      app.plugins.enabledPlugins.add('calendar');

      expect(sut.isCalendarEnabled()).toEqual(true);
    });

    it('returns false when the plugin is unavailable', () => {
      expect(sut.isCalendarEnabled()).toEqual(false);
    });

    it('returns false when the plugin manager throws', () => {
      app.plugins = undefined as unknown as typeof app.plugins;

      expect(sut.isCalendarEnabled()).toEqual(false);
    });
  });
});
