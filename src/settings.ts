import { App, PluginSettingTab, Setting } from 'obsidian';
import AutoTasks from 'src';
import { capitalise } from 'src/utils';

export type IPeriodicity = 
  | 'daily'
  | 'weekly';

export interface IPeriodicitySettings {
  available: boolean;
  carryOver: boolean;
  setDueDate: boolean;
  header: string;
  searchHeaders: string[];
}

export interface ISettings {
  daily: IPeriodicitySettings;
  weekly: IPeriodicitySettings;
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
  daily: { 
    available: false,
    carryOver: false,
    setDueDate: false,
    header: '## TODOs',
    searchHeaders: [],
  },
  weekly: {
    available: false,
    carryOver: false,
    setDueDate: false,
    header: '## TODOs',
    searchHeaders: [],
  },
});

export function applyDefaultSettings(savedSettings: ISettings): ISettings {
  return Object.assign(
    {},
    DEFAULT_SETTINGS,
    savedSettings
  );
}

export class AutoTasksSettingsTab extends PluginSettingTab {
  public plugin: AutoTasks;

  constructor(app: App, plugin: AutoTasks) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    const settings: ISettings = this.plugin.settings;
    const periodicities: IPeriodicity[] = [
      'daily',
      'weekly',
    ];

    if (!settings.daily.available && !settings.weekly.available) {
      const bannerEl = this.containerEl.createDiv({ cls: 'settings-banner' });

      new Setting(bannerEl)
        .setName('No periodic notes enabled')
        .setHeading()
        .setDesc(' No periodic notes settings are enabled. You must turn on either the daily or weekly notes within the Periodic Notes plugin settings to be able to configure automatic tasks.');
    }

    for (const periodicity of periodicities) {
      if (settings[periodicity].available) {
        this.containerEl.createEl('h3', { text: `${capitalise(periodicity)} notes` });
        new Setting(this.containerEl)
          .setName(`Carry over ${periodicity} tasks`)
          .setDesc(`Whether any ${periodicity} tasks that are incomplete should be automatically carried over to the following note.`)
          .addToggle((toggle) => {
            toggle
              .setValue(settings[periodicity].carryOver)
              .onChange(async (val) => {
                settings[periodicity].carryOver = val;
                await this.plugin.updateSettings(settings);
              });
          });
        new Setting(this.containerEl)
          .setName('Set a due date')
          .setDesc(`Whether a due date for the current period should be automatically applied to any tasks that are created in the ${periodicity} note.`)
          .addToggle((toggle) => {
            toggle
              .setValue(settings[periodicity].setDueDate)
              .onChange(async (val) => {
                settings[periodicity].setDueDate = val;
                await this.plugin.updateSettings(settings);
              });
          });
        new Setting(this.containerEl)
          .setName(`${capitalise(periodicity)} tasks header`)
          .setDesc('Set the header to be added to the top of the tasks section within new notes - include any markdown to set the heading style.')
          .addText((text) => {
            text
              .setValue(settings[periodicity].header)
              .onChange(async (val) => {
                settings[periodicity].header = val;
                await this.plugin.updateSettings(settings);
              });
          });
        new Setting(this.containerEl)
          .setName('Heading(s) to search for tasks')
          .setDesc('Comma-separated list of headings within the notes to search and include any carry over tasks from. Leave this blank to search the entire note.')
          .addText((text) => {
            text
              .setValue(settings[periodicity].searchHeaders ? settings[periodicity].searchHeaders.join(',') : '')
              .onChange(async (val) => {
                settings[periodicity].searchHeaders = val.split(',');
                await this.plugin.updateSettings(settings);
              });
          });
      }
    }
  }
}

