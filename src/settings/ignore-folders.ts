import { App, setIcon, TFolder } from 'obsidian';
import AutoTasks from '..';
import { Suggest } from '../ui/suggest';
import { ISettings } from '.';

export class IgnoreFolders {
  private app: App;
  private plugin: AutoTasks;
  private settings: ISettings;
  private el: HTMLElement;
  private folders: TFolder[];

  private foldersContainerEl: HTMLElement;
  private buttonContainerEl: HTMLElement;
  private addFolderInputEl: HTMLInputElement;

  constructor(app: App, plugin: AutoTasks, el: HTMLElement, folders: TFolder[]) {
    this.app = app;
    this.plugin = plugin;
    this.el = el;
    this.folders = folders.sort((a, b) => a.name.localeCompare(b.name));

    this.settings = this.plugin.getSettings();
  }

  display(): void {
    this.el.empty();
    this.foldersContainerEl = this.el.createDiv({cls: 'at--setting-folders-container'});
    this.buttonContainerEl = this.el.createDiv({cls: 'at--setting-button-container'});

    this.createIgnoredFolders();
    this.createAddControls();
  }

  createIgnoredFolders(): void {
    for (const folder of this.settings.kanbanIgnoreFolders) {
      const existingWrapperEl = this.foldersContainerEl.createDiv({cls: 'at--setting-existing-wrapper'});
      const existingItemEl = existingWrapperEl.createDiv({cls: 'at--setting-existing-item'});
      const existingItemControlsEl = existingItemEl.createDiv({cls: 'at--setting-existing-controls'});
      const existingItemInputEl = existingItemControlsEl.createEl('input', {type: 'text'});
      existingItemInputEl.setAttribute('readonly', 'readonly');
      existingItemInputEl.setAttribute('value', folder);
      const existingItemButtonsEl = existingItemEl.createDiv({cls: 'at--setting-existing-buttons'});
      const deleteEl = existingItemButtonsEl.createEl('a');
      setIcon(deleteEl, 'lucide-trash-2');
      deleteEl.setAttribute('data-folder', folder);
      deleteEl.addEventListener('click', (event: MouseEvent) => {
        this.handleRemoveFolder(folder);
        event.stopPropagation();
      });
    }
  }

  createAddControls(): void {
    const controlsWrapperEl = this.buttonContainerEl.createDiv('at--setting-controls-wrapper');
    this.addFolderInputEl = controlsWrapperEl.createEl('input', {type: 'text'});
    new Suggest(this.app, this.folders.filter(folder => this.settings.kanbanIgnoreFolders.indexOf(folder.path) === -1), this.addFolderInputEl);
    const addEl = controlsWrapperEl.createEl('button', {cls: 'button', text: 'Add folder'});
    addEl.addEventListener('click', (event: MouseEvent) => {
      this.handleAddFolder(this.addFolderInputEl.value);
      this.addFolderInputEl.value = '';
      event.stopPropagation();
    });
  }

  async handleAddFolder(folder: string): Promise<void> {
    this.settings.kanbanIgnoreFolders.push(folder);
    await this.plugin.updateSettings(this.settings);
    this.display();
  }

  async handleRemoveFolder(folder: string): Promise<void> {
    this.settings.kanbanIgnoreFolders.remove(folder);
    await this.plugin.updateSettings(this.settings);
    this.display();
  }

}
