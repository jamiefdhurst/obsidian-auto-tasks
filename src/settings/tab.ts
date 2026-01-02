import { App, PluginSettingTab, Setting, Vault } from 'obsidian';
import { IPeriodicity, ISettings } from '.';
import AutoTasks from '..';
import { KanbanProvider } from '../kanban/provider';
import { KanbanPluginAdapter } from '../plugins/kanban';
import { Suggest } from '../ui/suggest';
import { capitalise } from '../utils';
import { IgnoreFolders } from './ignore-folders';
import { IgnoreMatches } from './ignore-matches';

export class AutoTasksSettingsTab extends PluginSettingTab {
  private vault: Vault;
  private plugin: AutoTasks;
  private kanbanPlugin: KanbanPluginAdapter;
  private kanban: KanbanProvider;

  constructor(
    app: App,
    plugin: AutoTasks,
    kanbanPlugin: KanbanPluginAdapter,
    kanban: KanbanProvider
  ) {
    super(app, plugin);
    this.vault = app.vault;
    this.plugin = plugin;
    this.kanbanPlugin = kanbanPlugin;
    this.kanban = kanban;
  }

  display(): void {
    this.containerEl.empty();

    let settings: ISettings = this.plugin.getSettings();
    const periodicities: IPeriodicity[] = ['daily', 'weekly'];

    if (!settings.daily.available && !settings.weekly.available) {
      const periodicBannerEl = this.containerEl.createDiv({ cls: 'settings-banner' });

      new Setting(periodicBannerEl)
        .setName('No periodic notes enabled')
        .setHeading()
        .setDesc(
          'No periodic notes settings are enabled. You must turn on either the daily or weekly notes within the Periodic Notes plugin settings to be able to configure automatic tasks.'
        );
    }

    if (!settings.tasksAvailable) {
      const tasksBannerEl = this.containerEl.createDiv({ cls: 'settings-banner' });
      new Setting(tasksBannerEl)
        .setName('Tasks due date support')
        .setHeading()
        .setDesc(
          'Download and enable the Tasks plugin to enable due date functionality within your tasks and TODOs.'
        );
    }

    new Setting(this.containerEl).setName('All tasks').setHeading();

    new Setting(this.containerEl)
      .setName('Prefix for carried over tasks')
      .setDesc('The prefix to add to any carried over tasks, e.g. "[>]".')
      .addText((text) => {
        text.setValue(settings.carryOverPrefix).onChange(async (val) => {
          settings.carryOverPrefix = val;
          await this.plugin.updateSettings(settings);
        });
      });

    for (const periodicity of periodicities) {
      if (settings[periodicity].available) {
        new Setting(this.containerEl).setName(`${capitalise(periodicity)} notes`).setHeading();
        new Setting(this.containerEl)
          .setName(`Carry over ${periodicity} tasks`)
          .setDesc(
            `Whether any ${periodicity} tasks that are incomplete should be automatically carried over to the following note.`
          )
          .addToggle((toggle) => {
            toggle.setValue(settings[periodicity].carryOver).onChange(async (val) => {
              settings[periodicity].carryOver = val;
              await this.plugin.updateSettings(settings);
            });
          });
        if (settings.tasksAvailable) {
          new Setting(this.containerEl)
            .setName('Add due tasks')
            .setDesc(
              `Whether any tasks from anywhere else in the vault should be added that are marked as due within the ${periodicity} period.`
            )
            .addToggle((toggle) => {
              toggle.setValue(settings[periodicity].addDue).onChange(async (val) => {
                settings[periodicity].addDue = val;
                await this.plugin.updateSettings(settings);
              });
            });
        }
        new Setting(this.containerEl)
          .setName(`${capitalise(periodicity)} tasks header`)
          .setDesc(
            'Set the header to be added to the top of the tasks section within new notes - include any markdown to set the heading style.'
          )
          .addText((text) => {
            text.setValue(settings[periodicity].header).onChange(async (val) => {
              settings[periodicity].header = val;
              await this.plugin.updateSettings(settings);
            });
          });
        new Setting(this.containerEl)
          .setName('Heading(s) to search for tasks')
          .setDesc(
            'Comma-separated list of headings within the notes to search and include any carry over tasks from. Leave this blank to search the entire note.'
          )
          .addText((text) => {
            text
              .setValue(
                settings[periodicity].searchHeaders
                  ? settings[periodicity].searchHeaders.join(',')
                  : ''
              )
              .onChange(async (val) => {
                settings[periodicity].searchHeaders = val.split(',');
                await this.plugin.updateSettings(settings);
              });
          });
      }
    }

    const kanbanEl = this.containerEl.createDiv();
    new Setting(kanbanEl).setName('Kanban board').setHeading();
    if (!this.kanbanPlugin.isEnabled()) {
      const bannerEl = kanbanEl.createDiv({ cls: 'settings-banner' });
      new Setting(bannerEl)
        .setName('Kanban support')
        .setHeading()
        .setDesc(
          'Download and enable the Kanban plugin to automatically sync tasks into your chosen Kanban board.'
        );
    } else {
      const syncSetting = new Setting(kanbanEl);
      const fileSetting = new Setting(kanbanEl);
      const ignoreFoldersSetting = new Setting(kanbanEl);
      const ignoreMatchesSetting = new Setting(kanbanEl);

      syncSetting
        .setName('Automatically synchronise tasks to Kanban board')
        .setDesc('Any newly discovered tasks will be added into the Kanban board you choose.')
        .addToggle((toggle) => {
          toggle.setValue(settings.kanbanSync).onChange(async (val) => {
            fileSetting.setDisabled(!val);
            settings.kanbanSync = val;
            await this.plugin.updateSettings(settings);
          });
        });

      const boards = this.kanban.getBoardManager().getAllBoards();
      fileSetting
        .setName('Primary Kanban board')
        .setDesc('This is the Kanban board that will have tasks automatically added.')
        .addSearch((search) => {
          search
            .setPlaceholder('Example: board.md')
            .setValue(settings.kanbanFile)
            .onChange(async (val) => {
              search.inputEl.classList.remove('has-error');
              if (boards.map((board) => board.path).indexOf(val) === -1) {
                search.inputEl.classList.add('has-error');
              } else {
                settings.kanbanFile = val;
                await this.plugin.updateSettings(settings);
              }
            });

          if (settings.kanbanSync && settings.kanbanFile === '') {
            search.inputEl.classList.add('has-error');
          }

          new Suggest(this.app, boards, search.inputEl);
        });

      ignoreFoldersSetting
        .setName('Folder(s) to ignore')
        .setDesc('Select folders to ignore reading tasks from when syncing to the Kanban board.');
      new IgnoreFolders(
        this.app,
        this.plugin,
        ignoreFoldersSetting.settingEl.createDiv({ cls: 'at--setting' }),
        this.vault.getAllFolders()
      ).display();
      ignoreFoldersSetting.controlEl.remove();
      ignoreFoldersSetting.settingEl.classList.add('at--setting-item');

      ignoreMatchesSetting
        .setName('Task name(s) to ignore')
        .setDesc(
          'Enter task names to ignore when syncing to the Kanban board. You can enter regular expression patterns, e.g. "^Meeting:"'
        );
      new IgnoreMatches(
        this.app,
        this.plugin,
        ignoreMatchesSetting.settingEl.createDiv({ cls: 'at--setting' })
      ).display();
      ignoreMatchesSetting.controlEl.remove();
      ignoreMatchesSetting.settingEl.classList.add('at--setting-item');
    }
  }
}
