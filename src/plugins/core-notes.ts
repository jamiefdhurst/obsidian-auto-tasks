import type { ObsidianAppWithInternalPlugins, ObsidianAppWithPlugins } from '../types';

const DAILY_NOTES_PLUGIN_NAME: string = 'daily-notes';
const CALENDAR_PLUGIN_NAME: string = 'calendar';

/**
 * Reports whether Obsidian's own periodic note sources are in play.
 *
 * The Periodic Notes plugin is not the only way to end up with daily or weekly
 * notes - the core Daily Notes plugin and the Calendar plugin both provide them
 * too. Note lookup already resolves against all three, so availability has to
 * as well, otherwise a vault using core Daily Notes looks like it has no daily
 * notes at all.
 */
export class CoreNotesAdapter {
  private app: ObsidianAppWithPlugins & ObsidianAppWithInternalPlugins;

  constructor(app: ObsidianAppWithPlugins & ObsidianAppWithInternalPlugins) {
    this.app = app;
  }

  // The core Daily Notes plugin is an internal plugin, so it is not listed in
  // the community plugin manager
  isDailyNotesEnabled(): boolean {
    try {
      return !!this.app.internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_NAME)?.enabled;
    } catch {
      return false;
    }
  }

  // Weekly notes have no core equivalent, but the Calendar plugin supplies the
  // same settings and is honoured by the note lookup
  isCalendarEnabled(): boolean {
    try {
      return this.app.plugins.enabledPlugins.has(CALENDAR_PLUGIN_NAME);
    } catch {
      return false;
    }
  }
}
