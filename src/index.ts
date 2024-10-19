import { Notice, Plugin, TFile, type PluginManifest } from 'obsidian';
import { SETTINGS_UPDATED } from './events';
import { KanbanProvider } from './kanban/provider';
import { KanbanPluginAdapter } from './plugins/kanban';
import { PERIODIC_NOTES_EVENT_SETTING_UPDATED, PeriodicNotesPluginAdapter } from './plugins/periodic-notes';
import { TasksPluginAdapter } from './plugins/tasks';
import { DEFAULT_SETTINGS, type ISettings } from './settings';
import { AutoTasksSettingsTab } from './settings/tab';
import { TasksProvider } from './tasks/provider';
import type { ObsidianApp, ObsidianWorkspace } from './types';

export default class AutoTasks extends Plugin {
  private settings: ISettings = DEFAULT_SETTINGS;
  private periodicNotesPlugin: PeriodicNotesPluginAdapter;
  private tasksPlugin: TasksPluginAdapter;
  private kanbanPlugin: KanbanPluginAdapter;
  private kanban: KanbanProvider;
  private tasks: TasksProvider;

  constructor(app: ObsidianApp, manifest: PluginManifest) {
    super(app, manifest);

    this.periodicNotesPlugin = new PeriodicNotesPluginAdapter(app);
    this.tasksPlugin = new TasksPluginAdapter(app);
    this.kanbanPlugin = new KanbanPluginAdapter(app);
    
    this.kanban = new KanbanProvider(this, app.vault, app.metadataCache);
    this.tasks = new TasksProvider(app.vault);
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

    if (!this.tasksPlugin.isEnabled()) {
      new Notice(
        'The Tasks plugin must be installed and available for Auto Tasks to work.',
        10000
      );
      return;
    }

    // Convert and setup settings from plugins
    const workspace: ObsidianWorkspace = this.app.workspace;
    this.registerEvent(workspace.on(PERIODIC_NOTES_EVENT_SETTING_UPDATED, this.syncPeriodicNotesSettings.bind(this)));
    this.syncPeriodicNotesSettings();
    this.kanban.resolveSettings().then((newSettings: ISettings) => {
      this.updateSettings(newSettings);
    });

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
    this.updateSettings(this.periodicNotesPlugin.convertSettings(this.settings));
  }

  private onSettingsUpdate(): void {
    this.app.workspace.trigger(SETTINGS_UPDATED);
  }
}
