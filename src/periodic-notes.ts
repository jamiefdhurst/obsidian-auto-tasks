import type { Plugin } from 'obsidian';
import type { ISettings } from './settings';
import type { ObsidianAppWithPlugins } from './types';

export const PERIODIC_NOTES_NAME: string = 'periodic-notes';
export const PERIODIC_NOTES_EVENT_SETTING_UPDATED: string = 'periodic-notes:settings-updated';

export interface IPeriodicNotesPeriodicitySettings {
  enabled: boolean;
}

export interface IPeriodicNotesSettings {
  daily: IPeriodicNotesPeriodicitySettings;
  weekly: IPeriodicNotesPeriodicitySettings;
}

export interface IPeriodicNotesPlugin extends Plugin {
  settings: IPeriodicNotesSettings;
}

export class PeriodicNotes {
  private app: ObsidianAppWithPlugins;

  constructor(app: ObsidianAppWithPlugins) {
    this.app = app;
  }

  isPeriodicNotesPluginEnabled(): boolean {
    return this.app.plugins.enabledPlugins.has(PERIODIC_NOTES_NAME);
  }

  private getPeriodicNotesPlugin(): IPeriodicNotesPlugin {
    return this.app.plugins.getPlugin(PERIODIC_NOTES_NAME) as IPeriodicNotesPlugin;
  }

  getPeriodicNotesSettings(): IPeriodicNotesSettings {
    return this.getPeriodicNotesPlugin().settings || ({} as IPeriodicNotesSettings);
  }

  convertPeriodicNotesSettings(settings: ISettings, periodicNotesSettings: IPeriodicNotesSettings) {
    settings.daily.available = periodicNotesSettings.daily.enabled;
    settings.weekly.available = periodicNotesSettings.weekly.enabled;
  
    return settings;
  }
}
