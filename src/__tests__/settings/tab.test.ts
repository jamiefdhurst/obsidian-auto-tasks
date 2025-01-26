import { App, Setting } from 'obsidian';
import AutoTasks from '../..';
import { KanbanProvider } from '../../kanban/provider';
import { KanbanPluginAdapter } from '../../plugins/kanban';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { AutoTasksSettingsTab } from '../../settings/tab';
import { KanbanBoardManager } from '../../kanban/board-manager';

describe('settings tab', () => {

  let app: App;
  let plugin: AutoTasks;
  let kanbanPlugin: KanbanPluginAdapter;
  let kanban: KanbanProvider;
  let kanbanBoardManager: KanbanBoardManager;
  let containerEl: HTMLElement;

  let sut: AutoTasksSettingsTab;

  beforeEach(() => {
    app = jest.fn() as unknown as App;
    plugin = jest.fn() as unknown as AutoTasks;
    plugin.getSettings = jest.fn();
    kanbanPlugin = jest.fn() as unknown as KanbanPluginAdapter;
    kanbanPlugin.isEnabled = jest.fn();
    kanbanBoardManager = jest.fn() as unknown as KanbanBoardManager;
    kanbanBoardManager.getAllBoards = jest.fn()
    kanban = jest.fn() as unknown as KanbanProvider;
    kanban.getBoardManager = jest.fn().mockReturnValue(kanbanBoardManager);
    containerEl = jest.fn() as unknown as HTMLElement;
    containerEl.createDiv = jest.fn();
    containerEl.createEl = jest.fn();
    containerEl.empty = jest.fn();
    const divEl = jest.fn() as unknown as HTMLDivElement;
    divEl.createDiv = jest.fn();
    divEl.createEl = jest.fn();
    jest.spyOn(divEl, 'createDiv').mockReturnValue(jest.fn() as unknown as HTMLDivElement);
    jest.spyOn(divEl, 'createEl').mockReturnValue(jest.fn() as unknown as HTMLElement);
    jest.spyOn(containerEl, 'createDiv').mockReturnValue(divEl);
    jest.spyOn(containerEl, 'createEl').mockReturnValue(jest.fn() as unknown as HTMLElement);

    sut = new AutoTasksSettingsTab(app, plugin, kanbanPlugin, kanban);
    sut.containerEl = containerEl;
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('displays banner when periodic notes plugin is unavailable', () => {
    jest.spyOn(plugin, 'getSettings').mockReturnValue(Object.assign({}, DEFAULT_SETTINGS));
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(false);
    const setNameSpy = jest.spyOn(Setting.prototype, 'setName');

    sut.display();

    expect(setNameSpy).toHaveBeenCalledWith('No periodic notes enabled');
  });

  it('does not display banner when periodic notes plugin is unavailable', () => {
    const settings: ISettings = Object.assign({}, DEFAULT_SETTINGS);
    settings.daily.available = true;
    jest.spyOn(plugin, 'getSettings').mockReturnValue(settings);
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(false);
    const setNameSpy = jest.spyOn(Setting.prototype, 'setName');

    sut.display();

    expect(setNameSpy).not.toHaveBeenCalledWith('No periodic notes enabled');
  });

  it('displays banner when tasks plugin is unavailable', () => {
    jest.spyOn(plugin, 'getSettings').mockReturnValue(Object.assign({}, DEFAULT_SETTINGS));
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(false);
    const setNameSpy = jest.spyOn(Setting.prototype, 'setName');

    sut.display();

    expect(setNameSpy).toHaveBeenCalledWith('Tasks due date support');
  });

  it('does not display banner when tasks plugin is unavailable', () => {
    const settings: ISettings = Object.assign({}, DEFAULT_SETTINGS);
    settings.tasksAvailable = true;
    jest.spyOn(plugin, 'getSettings').mockReturnValue(settings);
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(false);
    const setNameSpy = jest.spyOn(Setting.prototype, 'setName');

    sut.display();

    expect(setNameSpy).not.toHaveBeenCalledWith('Tasks due date support');
  });

  it('displays settings for daily periodicity', () => {
    const settings: ISettings = Object.assign({}, DEFAULT_SETTINGS);
    settings.daily.available = true;
    jest.spyOn(plugin, 'getSettings').mockReturnValue(settings);
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(false);
    const setNameSpy = jest.spyOn(Setting.prototype, 'setName');

    sut.display();

    expect(setNameSpy).toHaveBeenCalledWith('Carry over daily tasks');
    expect(setNameSpy).not.toHaveBeenCalledWith('Carry over weekly tasks');
    expect(setNameSpy).not.toHaveBeenCalledWith('Add due tasks');
  });

  it('displays settings for both periodicities', () => {
    const settings: ISettings = Object.assign({}, DEFAULT_SETTINGS);
    settings.daily.available = true;
    settings.weekly.available = true;
    jest.spyOn(plugin, 'getSettings').mockReturnValue(settings);
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(false);
    const setNameSpy = jest.spyOn(Setting.prototype, 'setName');

    sut.display();

    expect(setNameSpy).toHaveBeenCalledWith('Carry over daily tasks');
    expect(setNameSpy).toHaveBeenCalledWith('Carry over weekly tasks');
    expect(setNameSpy).not.toHaveBeenCalledWith('Add due tasks');
  });

  it('displays due date setting when tasks are available', () => {
    const settings: ISettings = Object.assign({}, DEFAULT_SETTINGS);
    settings.daily.available = true;
    settings.tasksAvailable = true;
    jest.spyOn(plugin, 'getSettings').mockReturnValue(settings);
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(false);
    const setDescSpy = jest.spyOn(Setting.prototype, 'setDesc');
    const setNameSpy = jest.spyOn(Setting.prototype, 'setName');

    sut.display();

    expect(setNameSpy).toHaveBeenCalledWith('Carry over daily tasks');
    expect(setDescSpy).toHaveBeenCalledWith('Whether any tasks from anywhere else in the vault should be added that are marked as due within the daily period.')
  });

  it('displays banner when kanban plugin is unavailable', () => {
    jest.spyOn(plugin, 'getSettings').mockReturnValue(Object.assign({}, DEFAULT_SETTINGS));
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(false);
    const setNameSpy = jest.spyOn(Setting.prototype, 'setName');

    sut.display();

    expect(setNameSpy).toHaveBeenCalledWith('Kanban support');
  });

  it('displays kanban settings', () => {
    jest.spyOn(plugin, 'getSettings').mockReturnValue(Object.assign({}, DEFAULT_SETTINGS));
    jest.spyOn(kanbanPlugin, 'isEnabled').mockReturnValue(true);
    jest.spyOn(kanbanBoardManager, 'getAllBoards').mockReturnValue([]);
    const setNameSpy = jest.spyOn(Setting.prototype, 'setName');

    sut.display();

    expect(setNameSpy).not.toHaveBeenCalledWith('Kanban support');
    expect(setNameSpy).toHaveBeenCalledWith('Automatically synchronise tasks to Kanban board');
    expect(setNameSpy).toHaveBeenCalledWith('Primary Kanban board');
  });

});
