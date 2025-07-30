import { Notice, Plugin, TFile, type PluginManifest } from 'obsidian';
import { ObsidianAppWithPlugins, PERIODIC_NOTES_EVENT_SETTING_UPDATED, PeriodicNotesPluginAdapter } from 'obsidian-periodic-notes-provider';
import { SETTINGS_UPDATED } from './events';
import { KanbanProvider } from './kanban/provider';
import { KanbanPluginAdapter } from './plugins/kanban';
import { TasksPluginAdapter } from './plugins/tasks';
import { DEFAULT_SETTINGS, type ISettings } from './settings';
import { AutoTasksSettingsTab } from './settings/tab';
import { TasksProvider } from './tasks/provider';
import type { ObsidianApp, ObsidianVault, ObsidianWorkspace } from './types';
import { TaskFactory } from './tasks/factory';

export default class AutoTasks extends Plugin {
  private settings: ISettings = DEFAULT_SETTINGS;
  private periodicNotesPlugin: PeriodicNotesPluginAdapter;
  private tasksPlugin: TasksPluginAdapter;
  private taskFactory: TaskFactory;
  private kanbanPlugin: KanbanPluginAdapter;
  private kanban: KanbanProvider;
  private tasks: TasksProvider;

  private static instance: AutoTasks;

  constructor(app: ObsidianApp, manifest: PluginManifest) {
    super(app, manifest);

    const vault: ObsidianVault = app.vault;

    this.periodicNotesPlugin = new PeriodicNotesPluginAdapter(app as ObsidianAppWithPlugins);
    this.tasksPlugin = new TasksPluginAdapter(app);
    this.kanbanPlugin = new KanbanPluginAdapter(app);

    this.taskFactory = new TaskFactory(this.tasksPlugin);
    this.kanban = new KanbanProvider(this, vault, app.metadataCache, this.taskFactory);
    this.tasks = new TasksProvider(vault, this.kanban, this.taskFactory);

    AutoTasks.instance = this;
  }

  static getSettings(): ISettings {
    return AutoTasks.instance.getSettings();
  }
  
  async onload(): Promise<void> {
    this.updateSettings = this.updateSettings.bind(this);

    await this.loadSettings();

    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
  }

  onLayoutReady(): void {
    if (!this.periodicNotesPlugin.isEnabled()) {
      new Notice(
        'The Periodic Notes plugin must be installed and available for Auto Tasks to work.',
        10000
      );
      return;
    }

    this.settings.tasksAvailable = this.tasksPlugin.isEnabled();

    // Convert and setup settings from plugins
    const workspace: ObsidianWorkspace = this.app.workspace;
    this.registerEvent(workspace.on(PERIODIC_NOTES_EVENT_SETTING_UPDATED, this.syncPeriodicNotesSettings.bind(this)));
    this.syncPeriodicNotesSettings();

    // Copy tasks over when a new daily/weekly note is created
    this.registerEvent(this.app.vault.on('create', (file) => {
      this.tasks.checkAndCopyTasks(this.settings, file);
    }));

    // Sync all outstanding tasks now to the Kanban board
    this.kanban.synchroniseTasks();
    this.registerEvent(this.app.vault.on('create', (file) => {
      if (file instanceof TFile && file.name !== this.settings.kanbanFile) {
        this.kanban.getWatcher().notifyCreate(file);
      }
    }));
    this.registerEvent(this.app.vault.on('modify', (file) => {
      if (file instanceof TFile && file.name !== this.settings.kanbanFile) {
        this.kanban.getWatcher().notifyModify(file);
      }
    }));
    this.registerEvent(this.app.vault.on('rename', (file, oldFileName) => {
      if (file instanceof TFile) {
        this.kanban.getWatcher().notifyRename(file, oldFileName);
      }
    }));
    this.registerEvent(this.app.vault.on('delete', (file) => {
      if (file instanceof TFile) {
        this.kanban.getWatcher().notifyDelete(file);
      }
    }));

    // Add the settings tab
    this.addSettingTab(new AutoTasksSettingsTab(this.app, this, this.kanbanPlugin, this.kanban));
  }

  getSettings(): ISettings {
    return this.settings;
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async updateSettings(settings: ISettings): Promise<void> {
    this.settings = settings;
    await this.saveData(settings);
    this.onSettingsUpdate();
  }

  private syncPeriodicNotesSettings(): void {
    const pluginSettings = this.periodicNotesPlugin.convertSettings();
    this.settings.daily.available = pluginSettings.daily.available;
    this.settings.weekly.available = pluginSettings.weekly.available;
    this.updateSettings(this.settings);
  }

  private onSettingsUpdate(): void {
    this.app.workspace.trigger(SETTINGS_UPDATED);
  }
}
