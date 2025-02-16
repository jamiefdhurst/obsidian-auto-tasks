import { App, TFolder } from 'obsidian';
import AutoTasks from '../..';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { IgnoreFolders } from '../../settings/ignore-folders';

const WAIT_TIME: number = 20;

describe('Ignore Folders', () => {

  let app: App;
  let plugin: AutoTasks;
  let settings: ISettings;
  let el: HTMLElement;
  let folders: TFolder[];

  let sut: IgnoreFolders;

  beforeEach(() => {
    settings = Object.assign({}, DEFAULT_SETTINGS);
    app = jest.fn() as unknown as App;
    plugin = jest.fn() as unknown as AutoTasks;
    plugin.getSettings = jest.fn().mockReturnValue(settings);
    plugin.updateSettings = jest.fn();
    el = createDiv();

    const folder1 = new TFolder();
    folder1.name = 'folder-1';
    folder1.path = 'folder-1';
    const folder2 = new TFolder();
    folder2.name = 'folder-2';
    folder2.path = 'folder-2';
    const folder3 = new TFolder();
    folder3.name = 'folder-3';
    folder3.path = 'folder-2/folder-3';
    folders = [folder1, folder2, folder3];

    sut = new IgnoreFolders(app, plugin, el, folders);
  });

  it('displays an empty list when opened', () => {
    sut.display();

    expect(el.innerHTML).toEqual('<div class="at--setting-existing-container"></div><div class="at--setting-button-container"><div class="at--setting-controls-wrapper"><input type="text"><button class="button">Add folder</button></div></div>');
  });

  it('displays existing settings when provided', () => {
    settings.kanbanIgnoreFolders = ['folder-1'];

    sut.display();

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="folder-1">');
    expect(el.innerHTML).toContain('data-setting="folder-1"');
  });

  it('adds a new folder when the add button is clicked', async () => {
    settings.kanbanIgnoreFolders = ['folder-1'];

    sut.display();

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="folder-1">');
    expect(el.innerHTML).toContain('data-setting="folder-1"');

    const inputEl = el.find('.at--setting-controls-wrapper input') as HTMLInputElement;
    inputEl.value = 'folder-4';
    const buttonEl = el.find('.at--setting-controls-wrapper button') as HTMLButtonElement;
    buttonEl.dispatchEvent(new Event('click'));
    await new Promise(r => setTimeout(r, WAIT_TIME));

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="folder-1">');
    expect(el.innerHTML).toContain('data-setting="folder-1"');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="folder-4">');
    expect(el.innerHTML).toContain('data-setting="folder-4"');
  });

  it('removes a folder when the delete button is clicked', async () => {
    settings.kanbanIgnoreFolders = ['folder-1', 'folder-2'];

    sut.display();

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="folder-1">');
    expect(el.innerHTML).toContain('data-setting="folder-1"');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="folder-2">');
    expect(el.innerHTML).toContain('data-setting="folder-2"');

    const aEl = el.find('.at--setting-existing-item a[data-setting="folder-2"]') as HTMLButtonElement;
    aEl.dispatchEvent(new Event('click'));
    await new Promise(r => setTimeout(r, WAIT_TIME));

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="folder-1">');
    expect(el.innerHTML).toContain('data-setting="folder-1"');
    expect(el.innerHTML).not.toContain('<input type="text" readonly="readonly" value="folder-2">');
    expect(el.innerHTML).not.toContain('data-setting="folder-2"');
  });
});
