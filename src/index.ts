import { Notice, Plugin, type PluginManifest } from 'obsidian';
import { SETTINGS_UPDATED } from './events';
import { PERIODIC_NOTES_EVENT_SETTING_UPDATED, PeriodicNotes } from './periodic-notes';
import { applyDefaultSettings, type ISettings } from './settings';
import type { ObsidianApp, ObsidianWorkspace } from './types';
import { AutoTasksSettingsTab } from './settings/SettingsTab';
import { Tasks } from './tasks';

export default class AutoTasks extends Plugin {
  public settings: ISettings;
  private periodicNotes: PeriodicNotes;
  private tasks: Tasks;

  constructor(app: ObsidianApp, manifest: PluginManifest) {
    super(app, manifest);

    this.settings = {} as ISettings;
    this.periodicNotes = new PeriodicNotes(app);
    this.tasks = new Tasks(app);
  }
  
  async onload(): Promise<void> {
    this.updateSettings = this.updateSettings.bind(this);

    await this.loadSettings();

    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
  }

  onLayoutReady(): void {
    if (!this.periodicNotes.isPeriodicNotesPluginEnabled()) {
      new Notice(
        'The Periodic Notes plugin must be installed and available for Auto Tasks to work.',
        10000
      );
      return;
    }

    if (!this.tasks.isTasksNotesPluginEnabled()) {
      new Notice(
        'The Tasks plugin must be installed and available for Auto Tasks to work.',
        10000
      );
      return;
    }

    // Watch for Periodic Notes settings changes
    const workspace: ObsidianWorkspace = this.app.workspace;
    this.registerEvent(workspace.on(PERIODIC_NOTES_EVENT_SETTING_UPDATED, this.syncPeriodicNotesSettings.bind(this)));
    this.syncPeriodicNotesSettings();

    // Add the settings tab
    this.addSettingTab(new AutoTasksSettingsTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    this.settings = applyDefaultSettings(await this.loadData());
  }

  async updateSettings(settings: ISettings): Promise<void> {
    this.settings = settings;
    await this.saveData(this.settings);
    this.onSettingsUpdate();
  }

  private syncPeriodicNotesSettings(): void {
    this.updateSettings(this.periodicNotes.convertPeriodicNotesSettings(
      this.settings, this.periodicNotes.getPeriodicNotesSettings()
    ));
  }

  private onSettingsUpdate(): void {
    this.app.workspace.trigger(SETTINGS_UPDATED);
  }
}
