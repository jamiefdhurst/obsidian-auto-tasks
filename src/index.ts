import { Notice, Plugin, TFile, type PluginManifest } from 'obsidian';
import { SETTINGS_UPDATED } from './events';
import { PERIODIC_NOTES_EVENT_SETTING_UPDATED, PeriodicNotes } from './plugins/periodic-notes';
import { applyDefaultSettings, AutoTasksSettingsTab, type ISettings } from './settings';
import { Tasks } from './plugins/tasks';
import type { ObsidianApp, ObsidianWorkspace } from './types';
import { TasksManager } from './tasks/tasks-manager';
import { TasksParser } from './tasks/tasks-parser';
import { Kanban } from './plugins/kanban';
import { KanbanManager } from './kanban/kanban-manager';
import { TaskWatcher } from './kanban/task-watcher';

export default class AutoTasks extends Plugin {
  public settings: ISettings;
  private periodicNotes: PeriodicNotes;
  private tasks: Tasks;
  private kanban: Kanban;
  private tasksManager: TasksManager;
  private kanbanManager: KanbanManager;
  private taskWatcher: TaskWatcher;

  constructor(app: ObsidianApp, manifest: PluginManifest) {
    super(app, manifest);

    this.settings = {} as ISettings;
    this.periodicNotes = new PeriodicNotes(app);
    this.tasks = new Tasks(app);
    this.kanban = new Kanban(app);
    const tasksParser: TasksParser = new TasksParser();
    this.tasksManager = new TasksManager(app.vault, tasksParser);
    this.kanbanManager = new KanbanManager(this, app.vault, app.metadataCache, tasksParser);
    this.taskWatcher = new TaskWatcher(this.kanbanManager, this.settings);
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

    if (!this.tasks.isTasksPluginEnabled()) {
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
    this.kanbanManager.resolveSettings(this.settings).then((newSettings: ISettings) => {
      this.updateSettings(newSettings);
    });

    // Copy tasks over when a new daily/weekly note is created
    this.registerEvent(this.app.vault.on('create', (file) => {
      this.tasksManager.checkAndCopyTasks(this.settings, file);
    }));

    // Sync all outstanding tasks now to the Kanban board
    this.kanbanManager.processFiles([]);
    this.registerEvent(this.app.vault.on('create', (file) => {
      if (file instanceof TFile && file.name !== this.settings.kanbanFile) {
        this.taskWatcher.notifyCreate(file);
      }
    }));
    this.registerEvent(this.app.vault.on('modify', (file) => {
      if (file instanceof TFile && file.name !== this.settings.kanbanFile) {
        this.taskWatcher.notifyModify(file);
      }
    }));
    this.registerEvent(this.app.vault.on('rename', (file, oldFileName) => {
      if (file instanceof TFile) {
        this.taskWatcher.notifyRename(file, oldFileName);
      }
    }));
    this.registerEvent(this.app.vault.on('delete', (file) => {
      if (file instanceof TFile) {
        this.taskWatcher.notifyDelete(file);
      }
    }));

    // Add the settings tab
    this.addSettingTab(new AutoTasksSettingsTab(this.app, this, this.kanban, this.kanbanManager));
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
