import { App } from 'obsidian';
import AutoTasks from '../..';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { IgnoreMatches } from '../../settings/ignore-matches';

const WAIT_TIME: number = 20;

describe('Ignore Matches', () => {
  let app: App;
  let plugin: AutoTasks;
  let settings: ISettings;
  let el: HTMLElement;

  let sut: IgnoreMatches;

  beforeEach(() => {
    settings = Object.assign({}, DEFAULT_SETTINGS);
    app = jest.fn() as unknown as App;
    plugin = jest.fn() as unknown as AutoTasks;
    plugin.getSettings = jest.fn().mockReturnValue(settings);
    plugin.updateSettings = jest.fn();
    el = createDiv();

    sut = new IgnoreMatches(app, plugin, el);
  });

  it('displays an empty list when opened', () => {
    sut.display();

    expect(el.innerHTML).toEqual(
      '<div class="at--setting-existing-container"></div><div class="at--setting-button-container"><div class="at--setting-controls-wrapper"><input type="text"><button class="button">Add entry</button></div></div>'
    );
  });

  it('displays existing settings when provided', () => {
    settings.kanbanIgnoreMatches = ['^Meeting:'];

    sut.display();

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="^Meeting:">');
    expect(el.innerHTML).toContain('data-setting="^Meeting:"');
  });

  it('adds a new entry when the add button is clicked', async () => {
    settings.kanbanIgnoreMatches = ['^Meeting:'];

    sut.display();

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="^Meeting:">');
    expect(el.innerHTML).toContain('data-setting="^Meeting:"');

    const inputEl = el.find('.at--setting-controls-wrapper input') as HTMLInputElement;
    inputEl.value = 'foo';
    const buttonEl = el.find('.at--setting-controls-wrapper button') as HTMLButtonElement;
    buttonEl.dispatchEvent(new Event('click'));
    await new Promise((r) => setTimeout(r, WAIT_TIME));

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="^Meeting:">');
    expect(el.innerHTML).toContain('data-setting="^Meeting:"');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="foo">');
    expect(el.innerHTML).toContain('data-setting="foo"');
  });

  it('removes a folder when the delete button is clicked', async () => {
    settings.kanbanIgnoreMatches = ['foo', 'bar'];

    sut.display();

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="foo">');
    expect(el.innerHTML).toContain('data-setting="foo"');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="bar">');
    expect(el.innerHTML).toContain('data-setting="bar"');

    const aEl = el.find('.at--setting-existing-item a[data-setting="bar"]') as HTMLButtonElement;
    aEl.dispatchEvent(new Event('click'));
    await new Promise((r) => setTimeout(r, WAIT_TIME));

    expect(el.innerHTML).toContain('<div class="at--setting-existing-item">');
    expect(el.innerHTML).toContain('<input type="text" readonly="readonly" value="foo">');
    expect(el.innerHTML).toContain('data-setting="foo"');
    expect(el.innerHTML).not.toContain('<input type="text" readonly="readonly" value="bar">');
    expect(el.innerHTML).not.toContain('data-setting="bar"');
  });
});
