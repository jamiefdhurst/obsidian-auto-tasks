import { moment, TFile } from 'obsidian';
import AutoTasks from '../..';
import { ARCHIVE, ARCHIVE_DIVIDER, COMPLETE, DONE, DUE, KanbanBoard, PROGRESS, UPCOMING } from '../../kanban/board';
import { KanbanSynchroniser } from '../../kanban/synchroniser';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { EmojiTaskCollection } from '../../tasks/emoji-collection';
import { TaskFactory } from '../../tasks/factory';
import { DUE_DATE_FORMAT } from '../../tasks/task';
import { ObsidianVault } from '../../types';

describe('kanban synchroniser', () => {

  const BOARD_FILENAME = 'board.md';

  let sut: KanbanSynchroniser;

  let plugin: AutoTasks;
  let settings: ISettings;
  let vault: ObsidianVault;
  let taskFactory: TaskFactory;
  let board: KanbanBoard;

  beforeEach(() => {
    settings = Object.assign({}, DEFAULT_SETTINGS);
    plugin = jest.fn() as unknown as AutoTasks;
    plugin.getSettings = jest.fn().mockReturnValue(settings);
    vault = jest.fn() as unknown as ObsidianVault;
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockReturnValue(new TFile());
    vault.getFiles = jest.fn();
    vault.modify = jest.fn();
    vault.read = jest.fn();
    taskFactory = jest.fn() as unknown as TaskFactory;
    taskFactory.newCollection = jest.fn().mockImplementation((a, b) => new EmojiTaskCollection(a, b));
    jest.spyOn(AutoTasks, 'getSettings').mockReturnValue(settings);

    sut = new KanbanSynchroniser(plugin, vault, taskFactory);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('retrieves files with empty list and performs with empty list', async () => {
    jest.spyOn(vault, 'getFiles').mockReturnValue([]);
    const vaultModify = jest.spyOn(vault, 'modify');
    board = new KanbanBoard(taskFactory, BOARD_FILENAME);
    const boardGetTaskCollection = jest.spyOn(board, 'getTaskCollection');

    await sut.process(board);
    await sut.process(board, []);

    expect(vaultModify).toHaveBeenCalledTimes(2);
    expect(boardGetTaskCollection).toHaveBeenCalledTimes(4);
  });

  it('excludes ignored folders', async () => {
    settings.kanbanIgnoreFolders = ['ignored', 'some/other'];
    const file1 = new TFile();
    file1.path = 'ignored/file1.md';
    const file2 = new TFile();
    file2.path = 'ignored/subpath/file2.md';
    const file3 = new TFile();
    file3.path = 'elsewhere/file3.md';
    const vaultModify = jest.spyOn(vault, 'modify');
    board = new KanbanBoard(taskFactory, BOARD_FILENAME);
    const boardGetTaskCollection = jest.spyOn(board, 'getTaskCollection');
    const vaultRead = jest.spyOn(vault, 'read').mockResolvedValue('');

    await sut.process(board, [file1, file2, file3]);

    expect(boardGetTaskCollection).toHaveBeenCalledTimes(3);
    expect(vaultRead).toHaveBeenCalledTimes(1);
    expect(vaultModify).toHaveBeenCalled();
  });

  it('ignores the provided board file', async () => {
    const file = new TFile();
    file.name = BOARD_FILENAME;
    const vaultModify = jest.spyOn(vault, 'modify');
    board = new KanbanBoard(taskFactory, BOARD_FILENAME);
    const boardGetTaskCollection = jest.spyOn(board, 'getTaskCollection');

    await sut.process(board, [file]);

    expect(vaultModify).toHaveBeenCalled();
    expect(boardGetTaskCollection).toHaveBeenCalledTimes(2);
  });

  it('retrieves files with empty list and performs with multiple files, working with empty collections', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const file2 = new TFile();
    file2.name = 'file2.md';
    jest.spyOn(vault, 'getFiles').mockImplementation(() => [file1, file2]);
    board = new KanbanBoard(taskFactory, BOARD_FILENAME);
    const boardGetTaskCollection = jest.spyOn(board, 'getTaskCollection');
    const vaultRead = jest.spyOn(vault, 'read').mockResolvedValue('');

    await sut.process(board, []);

    expect(boardGetTaskCollection).toHaveBeenCalledTimes(4);
    expect(vaultRead).toHaveBeenCalledTimes(2);
    expect(board.toString()).not.toContain('- [');
  });

  it('ignores tasks that match ignore settings', async () => {
    settings.kanbanIgnoreMatches = ['^Meeting:'];

    const file1 = new TFile();
    file1.name = 'file1.md';
    board = new KanbanBoard(taskFactory, BOARD_FILENAME);
    jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] A new task\n- [ ] Meeting: Something or other\n- [ ] Meeting: Jamie 1-2-1\n- [ ] Another new task\n');

    await sut.process(board, [file1]);

    expect(board.getTaskCollection().getAllTasks().length).toEqual(2);
    expect(board.toString()).toContain('- [ ] A new task');
    expect(board.toString()).toContain('- [ ] Another new task');
    expect(board.toString()).not.toContain('- [ ] Meeting:');
  });

  it('adds new tasks', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    board = new KanbanBoard(taskFactory, BOARD_FILENAME);
    jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] A new task\n- [ ] Another new task\n');

    await sut.process(board, [file1]);

    expect(board.toString()).toContain('- [ ] A new task');
    expect(board.toString()).toContain('- [ ] Another new task');
  });

  it('checks due tasks but does not move when already in DUE', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const dueDate = moment().format(DUE_DATE_FORMAT);
    board = new KanbanBoard(taskFactory, BOARD_FILENAME, `${UPCOMING}\n\n\n\n\n\n${DUE}\n\n- [ ] Due task 📅 ${dueDate}\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Due task 📅 ${dueDate}\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n\n\n\n\n${DUE}\n\n- [ ] Due task 📅 ${dueDate}\n`);
  });

  it('checks due tasks and moves lists', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const dueDate = moment().format(DUE_DATE_FORMAT);
    board = new KanbanBoard(taskFactory, BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Due task 📅 ${dueDate}\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Due task 📅 ${dueDate}\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n\n\n\n\n${DUE}\n\n- [ ] Due task 📅 ${dueDate}\n`);
  });

  it('moves incomplete tasks back to UPCOMING', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    board = new KanbanBoard(taskFactory, BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n- [x] Incomplete task\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Existing task\n- [ ] Incomplete task\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n- [ ] Existing task\n- [ ] Incomplete task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n${COMPLETE}\n\n\n\n`);
  });

  it('moves incomplete tasks back to DUE', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const dueDate = moment().format(DUE_DATE_FORMAT);
    board = new KanbanBoard(taskFactory, BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n- [x] Incomplete task\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Existing task\n- [ ] Incomplete task 📅 ${dueDate}\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n- [ ] Incomplete task 📅 ${dueDate}\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n${COMPLETE}\n\n\n\n`);
  });

  it('moves complete tasks to DONE', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    board = new KanbanBoard(taskFactory, BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Complete task\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Existing task\n- [x] Complete task\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n${COMPLETE}\n- [x] Complete task\n\n\n`);
  });

  it('replaces any other tasks to ensure new metadata is persisted', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const dueDate = moment().add(5, 'days').format(DUE_DATE_FORMAT);
    board = new KanbanBoard(taskFactory, BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Existing task 📅 ${dueDate} ⏫ 🆔 random-id\n`);

    await sut.process(board, [file1]);
    expect(board.toString()).toContain(`${UPCOMING}\n\n- [ ] Existing task 📅 ${dueDate} ⏫ 🆔 random-id\n\n\n\n\n${DUE}`);
  });

  it('moves completed tasks that are old to archive', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const dueDate = moment().subtract(3, 'weeks').format(DUE_DATE_FORMAT);
    board = new KanbanBoard(taskFactory, BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Existing task\n- [x] Complete task ✅ ${dueDate}\n`);

    await sut.process(board, [file1]);
    expect(board.toString()).toContain(`${DONE}\n\n${COMPLETE}\n\n\n\n\n\n${ARCHIVE_DIVIDER}`);
    expect(board.toString()).toContain(`${ARCHIVE}\n\n- [x] Complete task ✅ ${dueDate}\n`);
  });

});
