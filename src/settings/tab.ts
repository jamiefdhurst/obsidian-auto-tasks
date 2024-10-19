import { App, PluginSettingTab, Setting } from 'obsidian';
import AutoTasks from 'src';
import { KanbanPluginAdapter } from 'src/plugins/kanban';
import { capitalise } from 'src/utils';
import { IPeriodicity, ISettings } from '.';
import { KanbanProvider } from 'src/kanban/provider';

export class AutoTasksSettingsTab extends PluginSettingTab {
  private plugin: AutoTasks;
  private kanbanPlugin: KanbanPluginAdapter;
  private kanban: KanbanProvider;

  constructor(app: App, plugin: AutoTasks, kanbanPlugin: KanbanPluginAdapter, kanban: KanbanProvider) {
    super(app, plugin);
    this.plugin = plugin;
    this.kanbanPlugin = kanbanPlugin;
    this.kanban = kanban;
  }

  display(): void {
    this.containerEl.empty();

    let settings: ISettings = this.plugin.getSettings();
    const periodicities: IPeriodicity[] = [
      'daily',
      'weekly',
    ];

    if (!settings.daily.available && !settings.weekly.available) {
      const bannerEl = this.containerEl.createDiv({ cls: 'settings-banner' });

      new Setting(bannerEl)
        .setName('No periodic notes enabled')
        .setHeading()
        .setDesc('No periodic notes settings are enabled. You must turn on either the daily or weekly notes within the Periodic Notes plugin settings to be able to configure automatic tasks.');
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

    const kanbanEl = this.containerEl.createDiv();
    kanbanEl.createEl('h3', { text: 'Kanban board' });
    if (!this.kanbanPlugin.isEnabled()) {
      const bannerEl = kanbanEl.createDiv({ cls: 'settings-banner' });
      new Setting(bannerEl)
        .setName('Kanban support')
        .setHeading()
        .setDesc('Download and enable the Kanban plugin to automatically sync tasks into your chosen Kanban board.');

    } else {

      const syncSetting = new Setting(kanbanEl);
      const fileReadOnlySetting = new Setting(kanbanEl);

      syncSetting
        .setName('Automatically synchronise tasks to Kanban board')
        .setDesc('Any newly discovered tasks will be added into the Kanban board you choose.')
        .addToggle((toggle) => {
          toggle
            .setValue(settings.kanbanSync)
            .onChange(async (val) => {
              settings.kanbanSync = val;
              settings = await this.kanban.resolveSettings(settings);
              fileReadOnlySetting.clear();
              this.displayKanbanFile(fileReadOnlySetting, settings);
              await this.plugin.updateSettings(settings);
            });
        });
      
      this.displayKanbanFile(fileReadOnlySetting, settings);
    }
  }

  private displayKanbanFile(settingComponent: Setting, settings: ISettings) {
    settingComponent
        .setName('Primary Kanban board')
        .setDesc('This is the Kanban board that will have tasks automatically added. '
          + 'If you turn on Kanban sync above and this does not exist, it will be created for you.')
        .addText((text) => {
          text
            .setDisabled(true)
            .setValue(settings.kanbanFile);
        });
  }
}
