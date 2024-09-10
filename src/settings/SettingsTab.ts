import { App, PluginSettingTab } from 'obsidian';
import type AutoTasks from '..';
import SettingsTab from './pages/SettingsTab.svelte';

export class AutoTasksSettingsTab extends PluginSettingTab {
  public plugin: AutoTasks;

  constructor(app: App, plugin: AutoTasks) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    new SettingsTab({
      target: this.containerEl,
      props: {
        settings: this.plugin.settings,
        onUpdateSettings: this.plugin.updateSettings,
      },
    });
  }
}
