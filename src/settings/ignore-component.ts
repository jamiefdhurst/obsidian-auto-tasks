import { App, setIcon } from 'obsidian';
import { ISettings } from '.';
import AutoTasks from '..';

export abstract class IgnoreComponent {
  protected app: App;
  protected plugin: AutoTasks;
  protected settings: ISettings;
  protected el: HTMLElement;

  protected existingContainerEl: HTMLElement;
  protected buttonContainerEl: HTMLElement;
  protected addEntryInputEl: HTMLInputElement;

  constructor(app: App, plugin: AutoTasks, el: HTMLElement) {
    this.app = app;
    this.plugin = plugin;
    this.el = el;

    this.settings = this.plugin.getSettings();
  }

  display(): void {
    this.el.empty();
    this.existingContainerEl = this.el.createDiv({cls: 'at--setting-existing-container'});
    this.buttonContainerEl = this.el.createDiv({cls: 'at--setting-button-container'});

    this.createIgnoredEntries();
    this.createAddControls();
  }

  protected abstract getIgnoredSetting(): string[];

  createIgnoredEntries(): void {
    for (const entry of this.getIgnoredSetting()) {
      const existingWrapperEl = this.existingContainerEl.createDiv({cls: 'at--setting-existing-wrapper'});
      const existingItemEl = existingWrapperEl.createDiv({cls: 'at--setting-existing-item'});
      const existingItemControlsEl = existingItemEl.createDiv({cls: 'at--setting-existing-controls'});
      const existingItemInputEl = existingItemControlsEl.createEl('input', {type: 'text'});
      existingItemInputEl.setAttribute('readonly', 'readonly');
      existingItemInputEl.setAttribute('value', entry);
      const existingItemButtonsEl = existingItemEl.createDiv({cls: 'at--setting-existing-buttons'});
      const deleteEl = existingItemButtonsEl.createEl('a');
      setIcon(deleteEl, 'lucide-trash-2');
      deleteEl.setAttribute('data-setting', entry);
      deleteEl.addEventListener('click', (event: MouseEvent) => {
        this.handleRemoveIgnoredEntry(entry);
        event.stopPropagation();
      });
    }
  }

  createAddControls(): void {
    const controlsWrapperEl = this.buttonContainerEl.createDiv('at--setting-controls-wrapper');
    this.addEntryInputEl = controlsWrapperEl.createEl('input', {type: 'text'});
    const addEl = controlsWrapperEl.createEl('button', {cls: 'button', text: 'Add entry'});
    addEl.addEventListener('click', (event: MouseEvent) => {
      this.handleAddIgnoredEntry(this.addEntryInputEl.value);
      this.addEntryInputEl.value = '';
      event.stopPropagation();
    });
  }

  async handleAddIgnoredEntry(entry: string): Promise<void> {
    this.getIgnoredSetting().push(entry);
    await this.saveAndReset();
  }

  async handleRemoveIgnoredEntry(entry: string): Promise<void> {
    this.getIgnoredSetting().remove(entry);
    await this.saveAndReset();
  }

  protected async saveAndReset(): Promise<void> {
    await this.plugin.updateSettings(this.settings);
    this.display();
  }

}
