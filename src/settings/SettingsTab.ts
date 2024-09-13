import { App, PluginSettingTab, Setting } from 'obsidian';
import type AutoTasks from '..';
import type { IPeriodicity, ISettings } from '.';
import { capitalise } from 'src/utils';

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
      }
    }
  }
}
