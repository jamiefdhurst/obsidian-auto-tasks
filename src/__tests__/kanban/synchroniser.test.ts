import { moment, TFile } from 'obsidian';
import { DONE, DUE, KanbanBoard, PROGRESS, UPCOMING } from '../../kanban/board';
import { KanbanSynchroniser } from '../../kanban/synchroniser';
import { DUE_DATE_FORMAT } from '../../tasks/task';
import { ObsidianVault } from '../../types';

describe('kanban synchroniser', () => {

  const BOARD_FILENAME = 'board.md';

  let sut: KanbanSynchroniser;

  let vault: ObsidianVault;
  let board: KanbanBoard;

  beforeEach(() => {
    vault = jest.fn() as unknown as ObsidianVault;
    vault.getFileByPath = jest.fn();
    jest.spyOn(vault, 'getFileByPath').mockReturnValue(new TFile());
    vault.getFiles = jest.fn();
    vault.modify = jest.fn();
    vault.read = jest.fn();

    sut = new KanbanSynchroniser(vault);
  });

  it('retrieves files with empty list and performs with empty list', async () => {
    jest.spyOn(vault, 'getFiles').mockReturnValue([]);
    const vaultModify = jest.spyOn(vault, 'modify');
    board = new KanbanBoard(BOARD_FILENAME);
    const boardGetTaskCollection = jest.spyOn(board, 'getTaskCollection');

    await sut.process(board);
    await sut.process(board, []);

    expect(vaultModify).toHaveBeenCalledTimes(2);
    expect(boardGetTaskCollection).toHaveBeenCalledTimes(2);
  });

  it('ignores the provided board file', async () => {
    const file = new TFile();
    file.name = BOARD_FILENAME;
    const vaultModify = jest.spyOn(vault, 'modify');
    board = new KanbanBoard(BOARD_FILENAME);
    const boardGetTaskCollection = jest.spyOn(board, 'getTaskCollection');

    await sut.process(board, [file]);

    expect(vaultModify).toHaveBeenCalled();
    expect(boardGetTaskCollection).toHaveBeenCalledTimes(1);
  });

  it('retrieves files with empty list and performs with multiple files, working with empty collections', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const file2 = new TFile();
    file2.name = 'file2.md';
    jest.spyOn(vault, 'getFiles').mockImplementation(() => [file1, file2]);
    board = new KanbanBoard(BOARD_FILENAME);
    const boardGetTaskCollection = jest.spyOn(board, 'getTaskCollection');
    const vaultRead = jest.spyOn(vault, 'read').mockResolvedValue('');

    await sut.process(board, []);

    expect(boardGetTaskCollection).toHaveBeenCalledTimes(3);
    expect(vaultRead).toHaveBeenCalledTimes(2);
    expect(board.toString()).not.toContain('- [');
  });

  it('adds new tasks', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    board = new KanbanBoard(BOARD_FILENAME);
    jest.spyOn(vault, 'read').mockResolvedValue('## TODOs\n\n- [ ] A new task\n- [ ] Another new task\n');

    await sut.process(board, [file1]);

    expect(board.toString()).toContain('- [ ] A new task');
    expect(board.toString()).toContain('- [ ] Another new task');
  });

  it('checks due tasks but does not move when already in DUE', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const dueDate = moment().format(DUE_DATE_FORMAT);
    board = new KanbanBoard(BOARD_FILENAME, `${UPCOMING}\n\n\n\n\n\n${DUE}\n\n- [ ] Due task 📅 ${dueDate}\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Due task 📅 ${dueDate}\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n\n\n\n\n${DUE}\n\n- [ ] Due task 📅 ${dueDate}\n`);
  });

  it('checks due tasks and moves lists', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const dueDate = moment().format(DUE_DATE_FORMAT);
    board = new KanbanBoard(BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Due task 📅 ${dueDate}\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Due task 📅 ${dueDate}\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n\n\n\n\n${DUE}\n\n- [ ] Due task 📅 ${dueDate}\n`);
  });

  it('moves incomplete tasks back to UPCOMING', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    board = new KanbanBoard(BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n- [x] Incomplete task\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Existing task\n- [ ] Incomplete task\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n- [ ] Existing task\n- [ ] Incomplete task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
  });

  it('moves incomplete tasks back to DUE', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const dueDate = moment().format(DUE_DATE_FORMAT);
    board = new KanbanBoard(BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n- [x] Incomplete task\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Existing task\n- [ ] Incomplete task 📅 ${dueDate}\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n- [ ] Incomplete task 📅 ${dueDate}\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
  });

  it('moves complete tasks to DONE', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    board = new KanbanBoard(BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Complete task\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Existing task\n- [x] Complete task\n`);

    await sut.process(board, [file1]);

    expect(board.toString()).toContain(`${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n- [x] Complete task\n\n\n\n\n`);
  });

  it('replaces any other tasks to ensure new metadata is persisted', async () => {
    const file1 = new TFile();
    file1.name = 'file1.md';
    const dueDate = moment().add(5, 'days').format(DUE_DATE_FORMAT);
    board = new KanbanBoard(BOARD_FILENAME, `${UPCOMING}\n\n- [ ] Existing task\n\n\n\n\n${DUE}\n\n\n\n\n\n${PROGRESS}\n\n\n\n\n\n${DONE}\n\n\n\n\n\n`);
    jest.spyOn(vault, 'read').mockResolvedValue(`## TODOs\n\n- [ ] Existing task 📅 ${dueDate} ⏫ 🆔 random-id\n`);

    await sut.process(board, [file1]);
    expect(board.toString()).toContain(`${UPCOMING}\n\n- [ ] Existing task 📅 ${dueDate} ⏫ 🆔 random-id\n\n\n\n\n${DUE}`);
  });

});
