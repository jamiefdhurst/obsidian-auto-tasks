import { App, PluginSettingTab, Setting, Vault, type SettingDefinitionItem } from 'obsidian';
import { IPeriodicity, ISettings } from '.';
import AutoTasks from '..';
import { KanbanProvider } from '../kanban/provider';
import { KanbanPluginAdapter } from '../plugins/kanban';
import { Suggest } from '../ui/suggest';
import { capitalise } from '../utils';
import { IgnoreFolders } from './ignore-folders';
import { IgnoreMatches } from './ignore-matches';

const PERIODICITIES: IPeriodicity[] = ['daily', 'weekly'];

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

  getSettingDefinitions(): SettingDefinitionItem[] {
    const items: SettingDefinitionItem[] = [];

    // Every `visible` predicate below is re-evaluated on each render, so that
    // enabling a note type in Periodic Notes, or installing the Tasks or Kanban
    // plugin, is reflected without a reload
    items.push({
      type: 'group',
      cls: 'settings-banner',
      visible: () => !this.isAnyPeriodicityAvailable(),
      items: [
        {
          name: 'No periodic notes enabled',
          desc: 'No periodic notes settings are enabled. You must turn on either the daily or weekly notes within the Periodic Notes plugin settings to be able to configure automatic tasks.',
        },
      ],
    });

    items.push({
      type: 'group',
      cls: 'settings-banner',
      visible: () => !this.getSettings().tasksAvailable,
      items: [
        {
          name: 'Tasks due date support',
          desc: 'Download and enable the Tasks plugin to enable due date functionality within your tasks and TODOs.',
        },
      ],
    });

    items.push({
      type: 'group',
      heading: 'All tasks',
      items: [
        {
          name: 'Prefix for carried over tasks',
          desc: 'The prefix to add to any carried over tasks, e.g. "[>]".',
          control: { type: 'text', key: 'carryOverPrefix' },
        },
        {
          name: 'Mark carried over tasks in previous note as',
          desc: 'The status character to write back into the previous note for each task that has been carried forward, e.g. ">" for forwarded or "x" for complete. Leave this blank to leave the previous note untouched.',
          control: { type: 'text', key: 'carryOverStatus' },
        },
      ],
    });

    for (const periodicity of PERIODICITIES) {
      items.push({
        type: 'group',
        heading: `${capitalise(periodicity)} notes`,
        visible: () => this.getSettings()[periodicity].available,
        items: [
          {
            name: `Carry over ${periodicity} tasks`,
            desc: `Whether any ${periodicity} tasks that are incomplete should be automatically carried over to the following note.`,
            control: { type: 'toggle', key: `${periodicity}.carryOver` },
          },
          {
            // Due dates come from the Tasks plugin, so this is meaningless
            // without it
            visible: () => this.getSettings().tasksAvailable,
            name: 'Add due tasks',
            desc: `Whether any tasks from anywhere else in the vault should be added that are marked as due within the ${periodicity} period.`,
            control: { type: 'toggle', key: `${periodicity}.addDue` },
          },
          {
            name: `${capitalise(periodicity)} tasks header`,
            desc: 'Set the header to be added to the top of the tasks section within new notes - include any markdown to set the heading style.',
            control: { type: 'text', key: `${periodicity}.header` },
          },
          {
            name: 'Heading(s) to search for tasks',
            desc: 'Comma-separated list of headings within the notes to search and include any carry over tasks from. Leave this blank to search the entire note.',
            control: { type: 'text', key: `${periodicity}.searchHeaders` },
          },
        ],
      });
    }

    items.push({
      type: 'group',
      heading: 'Kanban board',
      items: [
        {
          visible: () => !this.kanbanPlugin.isEnabled(),
          name: 'Kanban support',
          desc: 'Download and enable the Kanban plugin to automatically sync tasks into your chosen Kanban board.',
        },
        {
          visible: () => this.kanbanPlugin.isEnabled(),
          name: 'Automatically synchronise tasks to Kanban board',
          desc: 'Any newly discovered tasks will be added into the Kanban board you choose.',
          control: { type: 'toggle', key: 'kanbanSync' },
        },
        {
          visible: () => this.kanbanPlugin.isEnabled(),
          name: 'Primary Kanban board',
          desc: 'This is the Kanban board that will have tasks automatically added.',
          // Rendered imperatively: the board name is completed from the vault's
          // existing boards, and anything else is flagged as an error rather
          // than saved
          render: (setting: Setting) => this.renderBoardSetting(setting),
        },
        {
          visible: () => this.kanbanPlugin.isEnabled(),
          name: 'Folder(s) to ignore',
          desc: 'Select folders to ignore reading tasks from when syncing to the Kanban board.',
          render: (setting: Setting) =>
            new IgnoreFolders(
              this.app,
              this.plugin,
              this.prepareListSetting(setting),
              this.vault.getAllFolders()
            ).display(),
        },
        {
          visible: () => this.kanbanPlugin.isEnabled(),
          name: 'Task name(s) to ignore',
          desc: 'Enter task names to ignore when syncing to the Kanban board. You can enter regular expression patterns, e.g. "^Meeting:"',
          render: (setting: Setting) =>
            new IgnoreMatches(this.app, this.plugin, this.prepareListSetting(setting)).display(),
        },
      ],
    });

    return items;
  }

  /**
   * Reads a control value from the plugin settings, where the key is a dotted
   * path such as `daily.carryOver`.
   */
  getControlValue(key: string): unknown {
    let value: unknown = this.getSettings();
    for (const part of key.split('.')) {
      value = (value as Record<string, unknown> | undefined)?.[part];
    }

    // The search headers are stored as a list, but edited as a single
    // comma-separated text field
    if (Array.isArray(value)) {
      return value.join(',');
    }

    return value;
  }

  /**
   * Persists a control value into the plugin settings, where the key is a
   * dotted path such as `daily.carryOver`.
   */
  async setControlValue(key: string, value: unknown): Promise<void> {
    const parts = key.split('.');
    const property = parts.pop();
    if (!property) {
      return;
    }

    const settings = this.getSettings();
    let target = settings as unknown as Record<string, unknown>;
    for (const part of parts) {
      target = target[part] as Record<string, unknown>;
    }

    // Split the comma-separated text back into the list it is stored as
    target[property] = Array.isArray(target[property]) ? String(value).split(',') : value;

    await this.plugin.updateSettings(settings);

    // Re-evaluate the `visible` predicates, e.g. the Kanban board settings
    // appear as soon as the plugin is enabled
    this.refreshDomState();
  }

  private renderBoardSetting(setting: Setting): void {
    const settings = this.getSettings();
    const boards = this.kanban.getBoardManager().getAllBoards();

    setting.addSearch((search) => {
      search
        .setPlaceholder('Example: board.md')
        .setValue(settings.kanbanFile)
        .onChange((val) => {
          search.inputEl.classList.remove('has-error');
          if (boards.map((board) => board.path).indexOf(val) === -1) {
            search.inputEl.classList.add('has-error');
          } else {
            void this.setControlValue('kanbanFile', val);
          }
        });

      if (settings.kanbanSync && settings.kanbanFile === '') {
        search.inputEl.classList.add('has-error');
      }

      new Suggest(this.app, boards, search.inputEl);
    });
  }

  /**
   * Strips the control column from a setting so an editable list can take up
   * the full width of the row, and returns the element to render it into.
   */
  private prepareListSetting(setting: Setting): HTMLElement {
    const el = setting.settingEl.createDiv({ cls: 'at--setting' });
    setting.controlEl.remove();
    setting.settingEl.classList.add('at--setting-item');

    return el;
  }

  private getSettings(): ISettings {
    return this.plugin.getSettings();
  }

  private isAnyPeriodicityAvailable(): boolean {
    return PERIODICITIES.some((periodicity) => this.getSettings()[periodicity].available);
  }
}
