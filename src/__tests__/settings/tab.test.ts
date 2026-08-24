import { App, Setting, SettingDefinitionGroup, SettingDefinitionItem, Vault } from 'obsidian';
import AutoTasks from '../..';
import { KanbanBoardManager } from '../../kanban/board-manager';
import { KanbanProvider } from '../../kanban/provider';
import { KanbanPluginAdapter } from '../../plugins/kanban';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { AutoTasksSettingsTab } from '../../settings/tab';

/**
 * Resolves a `visible` predicate, which may be absent, a boolean or a function.
 */
function isVisible(item: { visible?: boolean | (() => boolean) }): boolean {
  if (typeof item.visible === 'function') {
    return item.visible();
  }
  return item.visible !== false;
}

/**
 * Collects the `name` of every setting definition that would actually render,
 * including those nested inside groups, so tests can assert on what the user
 * sees. Definitions are built once and hidden by predicate, so visibility has
 * to be resolved the same way Obsidian resolves it on each render.
 */
function names(items: SettingDefinitionItem[]): string[] {
  return items.filter(isVisible).flatMap((item) => {
    const group = item as SettingDefinitionGroup;
    if (group.items) {
      return [...(group.heading ? [group.heading] : []), ...names(group.items)];
    }
    return 'name' in item ? [item.name] : [];
  });
}

/**
 * Finds a single definition by name, wherever it sits in the tree.
 */
function find(items: SettingDefinitionItem[], name: string): any {
  for (const item of items) {
    const group = item as SettingDefinitionGroup;
    if (group.items) {
      const nested = find(group.items, name);
      if (nested) {
        return nested;
      }
    } else if ('name' in item && item.name === name) {
      return item;
    }
  }
  return null;
}

describe('settings tab', () => {
  let app: App;
  let plugin: AutoTasks;
  let kanbanPlugin: KanbanPluginAdapter;
  let kanban: KanbanProvider;
  let kanbanBoardManager: KanbanBoardManager;
  let settings: ISettings;

  let sut: AutoTasksSettingsTab;

  beforeEach(() => {
    app = jest.fn() as unknown as App;
    app.vault = jest.fn() as unknown as Vault;
    app.vault.getAllFolders = jest.fn().mockReturnValue([]);
    settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as ISettings;
    plugin = jest.fn() as unknown as AutoTasks;
    plugin.getSettings = jest.fn().mockReturnValue(settings);
    plugin.updateSettings = jest.fn();
    kanbanPlugin = jest.fn() as unknown as KanbanPluginAdapter;
    kanbanPlugin.isEnabled = jest.fn().mockReturnValue(false);
    kanbanBoardManager = jest.fn() as unknown as KanbanBoardManager;
    kanbanBoardManager.getAllBoards = jest.fn().mockReturnValue([]);
    kanban = jest.fn() as unknown as KanbanProvider;
    kanban.getBoardManager = jest.fn().mockReturnValue(kanbanBoardManager);

    sut = new AutoTasksSettingsTab(app, plugin, kanbanPlugin, kanban);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('displays banner when periodic notes plugin is unavailable', () => {
    expect(names(sut.getSettingDefinitions())).toContain('No periodic notes enabled');
  });

  it('does not display banner when periodic notes plugin is unavailable', () => {
    settings.daily.available = true;

    expect(names(sut.getSettingDefinitions())).not.toContain('No periodic notes enabled');
  });

  it('displays banner when tasks plugin is unavailable', () => {
    expect(names(sut.getSettingDefinitions())).toContain('Tasks due date support');
  });

  it('does not display banner when tasks plugin is unavailable', () => {
    settings.tasksAvailable = true;

    expect(names(sut.getSettingDefinitions())).not.toContain('Tasks due date support');
  });

  it('displays all tasks settings', () => {
    const displayed = names(sut.getSettingDefinitions());

    expect(displayed).toContain('All tasks');
    expect(displayed).toContain('Prefix for carried over tasks');
  });

  it('displays settings for daily periodicity', () => {
    settings.daily.available = true;

    const displayed = names(sut.getSettingDefinitions());

    expect(displayed).toContain('Carry over daily tasks');
    expect(displayed).not.toContain('Carry over weekly tasks');
    expect(displayed).not.toContain('Add due tasks');
  });

  it('displays settings for both periodicities', () => {
    settings.daily.available = true;
    settings.weekly.available = true;

    const displayed = names(sut.getSettingDefinitions());

    expect(displayed).toContain('Carry over daily tasks');
    expect(displayed).toContain('Carry over weekly tasks');
    expect(displayed).not.toContain('Add due tasks');
  });

  it('displays due date setting when tasks are available', () => {
    settings.daily.available = true;
    settings.tasksAvailable = true;

    const definitions = sut.getSettingDefinitions();

    expect(names(definitions)).toContain('Add due tasks');
    expect(find(definitions, 'Add due tasks').desc).toEqual(
      'Whether any tasks from anywhere else in the vault should be added that are marked as due within the daily period.'
    );
  });

  it('displays banner when kanban plugin is unavailable', () => {
    const displayed = names(sut.getSettingDefinitions());

    expect(displayed).toContain('Kanban support');
    expect(displayed).not.toContain('Primary Kanban board');
  });

  it('displays kanban settings', () => {
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(true);

    const displayed = names(sut.getSettingDefinitions());

    expect(displayed).not.toContain('Kanban support');
    expect(displayed).toContain('Automatically synchronise tasks to Kanban board');
    expect(displayed).toContain('Primary Kanban board');
    expect(displayed).toContain('Folder(s) to ignore');
    expect(displayed).toContain('Task name(s) to ignore');
  });

  it('renders the kanban board, folder and match settings', () => {
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(true);
    const definitions = sut.getSettingDefinitions();

    for (const name of ['Primary Kanban board', 'Folder(s) to ignore', 'Task name(s) to ignore']) {
      const setting = new Setting(createDiv());

      expect(() => find(definitions, name).render(setting)).not.toThrow();
    }
  });

  it('reads control values from the settings', () => {
    settings.carryOverPrefix = '[>]';
    settings.daily.carryOver = true;

    expect(sut.getControlValue('carryOverPrefix')).toEqual('[>]');
    expect(sut.getControlValue('daily.carryOver')).toEqual(true);
  });

  it('reads list control values as comma-separated text', () => {
    settings.daily.searchHeaders = ['## TODOs', '## Notes'];

    expect(sut.getControlValue('daily.searchHeaders')).toEqual('## TODOs,## Notes');
  });

  it('writes control values back to the settings', async () => {
    const updateSettings = jest.spyOn(plugin, 'updateSettings');

    await sut.setControlValue('daily.carryOver', true);

    expect(settings.daily.carryOver).toEqual(true);
    expect(updateSettings).toHaveBeenCalledWith(settings);
  });

  it('writes comma-separated text back as a list', async () => {
    settings.daily.searchHeaders = [];

    await sut.setControlValue('daily.searchHeaders', '## TODOs,## Notes');

    expect(settings.daily.searchHeaders).toEqual(['## TODOs', '## Notes']);
  });

  it('ignores a control value with an empty key', async () => {
    const updateSettings = jest.spyOn(plugin, 'updateSettings');

    await sut.setControlValue('', 'anything');

    expect(updateSettings).not.toHaveBeenCalled();
  });
});
