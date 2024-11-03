import type { Plugin } from 'obsidian';
import type { ISettings } from '../settings';
import type { ObsidianAppWithPlugins } from '../types';

const PLUGIN_NAME: string = 'periodic-notes';

export const PERIODIC_NOTES_EVENT_SETTING_UPDATED: string = 'periodic-notes:settings-updated';

interface IPeriodicNotesPeriodicitySettings {
  enabled: boolean;
}

interface IPeriodicNotesSettings {
  daily: IPeriodicNotesPeriodicitySettings;
  weekly: IPeriodicNotesPeriodicitySettings;
}

export interface IPeriodicNotesPlugin extends Plugin {
  settings: IPeriodicNotesSettings;
}

export class PeriodicNotesPluginAdapter {
  private app: ObsidianAppWithPlugins;

  constructor(app: ObsidianAppWithPlugins) {
    this.app = app;
  }

  isEnabled(): boolean {
    return this.app.plugins.enabledPlugins.has(PLUGIN_NAME);
  }

  private getPlugin(): IPeriodicNotesPlugin {
    return this.app.plugins.getPlugin(PLUGIN_NAME) as IPeriodicNotesPlugin;
  }

  private getSettings(): IPeriodicNotesSettings {
    return this.getPlugin().settings || ({
      daily: { enabled: false },
      weekly: { enabled: false },
    } as IPeriodicNotesSettings);
  }

  convertSettings(settings: ISettings) {
    const periodicNotesSettings: IPeriodicNotesSettings = this.getSettings();

    settings.daily.available = periodicNotesSettings.daily.enabled;
    settings.weekly.available = periodicNotesSettings.weekly.enabled;
  
    return settings;
  }
}
