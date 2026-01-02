import { App, TFolder } from 'obsidian';
import AutoTasks from '..';
import { Suggest } from '../ui/suggest';
import { IgnoreComponent } from './ignore-component';

export class IgnoreFolders extends IgnoreComponent {
  private folders: TFolder[];

  constructor(app: App, plugin: AutoTasks, el: HTMLElement, folders: TFolder[]) {
    super(app, plugin, el);
    this.folders = folders.sort((a, b) => a.name.localeCompare(b.name));
  }

  protected getIgnoredSetting(): string[] {
    return this.settings.kanbanIgnoreFolders;
  }

  createAddControls(): void {
    const controlsWrapperEl = this.buttonContainerEl.createDiv('at--setting-controls-wrapper');
    this.addEntryInputEl = controlsWrapperEl.createEl('input', { type: 'text' });
    new Suggest(
      this.app,
      this.folders.filter(
        (folder) => this.settings.kanbanIgnoreFolders.indexOf(folder.path) === -1
      ),
      this.addEntryInputEl
    );
    const addEl = controlsWrapperEl.createEl('button', { cls: 'button', text: 'Add folder' });
    addEl.addEventListener('click', (event: MouseEvent) => {
      this.handleAddIgnoredEntry(this.addEntryInputEl.value);
      this.addEntryInputEl.value = '';
      event.stopPropagation();
    });
  }
}
