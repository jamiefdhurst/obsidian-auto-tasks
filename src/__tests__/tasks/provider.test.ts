import { moment, TFile } from 'obsidian';
import { DailyNote, WeeklyNote } from 'obsidian-periodic-notes-provider';
import AutoTasks from '../..';
import { DONE, DUE, KanbanBoard, PROGRESS, UPCOMING } from '../../kanban/board';
import { KanbanProvider } from '../../kanban/provider';
import { DEFAULT_SETTINGS, ISettings } from '../../settings';
import { EmojiTaskCollection } from '../../tasks/emoji-collection';
import { TaskFactory } from '../../tasks/factory';
import { TasksProvider } from '../../tasks/provider';
import { DUE_DATE_FORMAT } from '../../tasks/task';
import { ObsidianVault } from '../../types';

describe('tasks provider', () => {
  let vault: ObsidianVault;
  let kanban: KanbanProvider;
  let taskFactory: TaskFactory;
  let dailyNote: DailyNote;
  let weeklyNote: WeeklyNote;
  let settings: ISettings;

  let sut: TasksProvider;

  beforeEach(() => {
    vault = jest.fn() as unknown as ObsidianVault;
    vault.process = jest.fn();
    vault.read = jest.fn();
    kanban = jest.fn() as unknown as KanbanProvider;
    kanban.getBoard = jest.fn();
    taskFactory = jest.fn() as unknown as TaskFactory;
    taskFactory.newCollection = jest
      .fn()
      .mockImplementation((a, b) => new EmojiTaskCollection(a, b));
    dailyNote = jest.fn() as unknown as DailyNote;
    dailyNote.getCurrent = jest.fn();
    dailyNote.getNextDate = jest.fn();
    dailyNote.getPrevious = jest.fn().mockReturnValue(new TFile());
    dailyNote.isValid = jest.fn();
    weeklyNote = jest.fn() as unknown as WeeklyNote;
    settings = Object.assign({}, DEFAULT_SETTINGS);
    jest.spyOn(AutoTasks, 'getSettings').mockReturnValue(settings);

    sut = new TasksProvider(vault, kanban, taskFactory, dailyNote, weeklyNote);
  });

  it('initialises with default constructor', () => {
    expect(new TasksProvider(vault, kanban, taskFactory)).toBeInstanceOf(TasksProvider);
  });

  it('does nothing when daily and weekly notes are unavailable', async () => {
    const isValid = jest.spyOn(dailyNote, 'isValid');
    const vaultRead = jest.spyOn(vault, 'read');

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(vaultRead).not.toHaveBeenCalled();
    expect(isValid).not.toHaveBeenCalled();
  });

  it('does nothing when carry over is not enabled', async () => {
    settings.daily.available = true;
    const isValid = jest.spyOn(dailyNote, 'isValid');
    const vaultRead = jest.spyOn(vault, 'read');

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(vaultRead).not.toHaveBeenCalled();
    expect(isValid).not.toHaveBeenCalled();
  });

  it('does nothing when the provided file is invalid', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(false);
    const vaultRead = jest.spyOn(vault, 'read');

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(vaultRead).not.toHaveBeenCalled();
  });

  it('does nothing when there is no current note to copy into', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(undefined);
    const vaultRead = jest.spyOn(vault, 'read');
    const vaultProcess = jest.spyOn(vault, 'process');

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(vaultRead).not.toHaveBeenCalled();
    expect(vaultProcess).not.toHaveBeenCalled();
  });

  it('adds the header without reading when there is no previous note', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    settings.daily.header = '## Daily TODOs';
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest.spyOn(dailyNote, 'getPrevious').mockReturnValue(undefined);
    jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(new TFile());
    const vaultRead = jest.spyOn(vault, 'read');
    let result;
    jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
      result = fn('');
      return Promise.resolve(result);
    });

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(vaultRead).not.toHaveBeenCalled();
    expect(result).toEqual(`\n\n## Daily TODOs\n\n`);
  });

  it('copies tasks from previous note', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    settings.daily.header = '## Daily TODOs';
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest
      .spyOn(vault, 'read')
      .mockResolvedValueOnce(
        '## TODOs\n\n- [x] Complete 1\n- [ ] Incomplete 1\n- [ ] Incomplete 2'
      );
    const currentFile = new TFile();
    jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
    let result;
    const vaultProcess = jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
      result = fn('');
      return Promise.resolve(result);
    });

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(vaultProcess).toHaveBeenCalledWith(currentFile, expect.any(Function));
    expect(result).toEqual(`\n\n## Daily TODOs\n\n- [ ] Incomplete 1\n- [ ] Incomplete 2`);
  });

  it('copies tasks and adds carried over prefix', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    settings.carryOverPrefix = '[>]';
    settings.daily.header = '## Daily TODOs';
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest
      .spyOn(vault, 'read')
      .mockResolvedValueOnce(
        '## TODOs\n\n- [x] Complete 1\n- [ ] [>] Incomplete 1\n- [ ] Incomplete 2'
      );
    const currentFile = new TFile();
    jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
    let result;
    const vaultProcess = jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
      result = fn('');
      return Promise.resolve(result);
    });

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(vaultProcess).toHaveBeenCalledWith(currentFile, expect.any(Function));
    expect(result).toEqual(`\n\n## Daily TODOs\n\n- [ ] [>] Incomplete 1\n- [ ] [>] Incomplete 2`);
  });

  it('does not pull from kanban when not available', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    settings.daily.header = '## Daily TODOs';
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest.spyOn(vault, 'read').mockResolvedValueOnce('').mockResolvedValueOnce('');
    const getBoard = jest.spyOn(kanban, 'getBoard');

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(getBoard).not.toHaveBeenCalled();
  });

  it('does not pull from kanban when sync is not enabled', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    settings.daily.header = '## Daily TODOs';
    settings.tasksAvailable = true;
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest.spyOn(vault, 'read').mockResolvedValueOnce('').mockResolvedValueOnce('');
    const getBoard = jest.spyOn(kanban, 'getBoard');

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(getBoard).not.toHaveBeenCalled();
  });

  it('does not pull from kanban when adding due tasks is disabled', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    settings.daily.header = '## Daily TODOs';
    settings.tasksAvailable = true;
    settings.kanbanSync = true;
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest.spyOn(vault, 'read').mockResolvedValueOnce('');
    const getBoard = jest.spyOn(kanban, 'getBoard');

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(getBoard).not.toHaveBeenCalled();
  });

  it('does not pull from kanban when it cannot load the board', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    settings.daily.addDue = true;
    settings.daily.header = '## Daily TODOs';
    settings.tasksAvailable = true;
    settings.kanbanSync = true;
    settings.kanbanFile = 'board.md';
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest.spyOn(vault, 'read').mockResolvedValueOnce('');
    jest.spyOn(kanban, 'getBoard').mockResolvedValueOnce(undefined);

    await sut.checkAndCopyTasks(settings, new TFile());
  });

  it('adds any missing due tasks', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    settings.daily.addDue = true;
    settings.daily.header = '## Daily TODOs';
    settings.tasksAvailable = true;
    settings.kanbanSync = true;
    settings.kanbanFile = 'board.md';
    jest.spyOn(dailyNote, 'getNextDate').mockReturnValue(moment().startOf('day').add(1, 'day'));
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest
      .spyOn(vault, 'read')
      .mockResolvedValueOnce(
        `## TODOs\n\n- [ ] Due and existing task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}`
      );
    const board: KanbanBoard = new KanbanBoard(
      taskFactory,
      'board.md',
      `${UPCOMING}\n\n- [ ] Not due task 📅 ${moment().add(10, 'day').format(DUE_DATE_FORMAT)}\n\n\n\n\n${DUE}\n\n- [ ] Due task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}\n\n\n\n\n${PROGRESS}\n\n- [ ] Due and existing task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}\n\n\n\n\n${DONE}\n\n- [x] Complete task\n\n\n\n\n`
    );
    jest.spyOn(kanban, 'getBoard').mockResolvedValueOnce(board);
    const currentFile = new TFile();
    jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
    let result;
    const vaultProcess = jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
      result = fn('');
      return Promise.resolve(result);
    });

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(vaultProcess).toHaveBeenCalledWith(currentFile, expect.any(Function));
    expect(result).toEqual(
      `\n\n## Daily TODOs\n\n- [ ] Due and existing task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}\n- [ ] Due task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}`
    );
  });

  it('adds any missing tasks under an existing header if it exists', async () => {
    settings.daily.available = true;
    settings.daily.carryOver = true;
    settings.daily.addDue = true;
    settings.daily.header = '## Daily TODOs';
    settings.tasksAvailable = true;
    settings.kanbanSync = true;
    settings.kanbanFile = 'board.md';
    jest.spyOn(dailyNote, 'getNextDate').mockReturnValue(moment().startOf('day').add(1, 'day'));
    jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
    jest
      .spyOn(vault, 'read')
      .mockResolvedValueOnce(
        `## TODOs\n\n- [ ] Due and existing task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}`
      );
    const board: KanbanBoard = new KanbanBoard(
      taskFactory,
      'board.md',
      `${UPCOMING}\n\n- [ ] Not due task 📅 ${moment().add(10, 'day').format(DUE_DATE_FORMAT)}\n\n\n\n\n${DUE}\n\n- [ ] Due task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}\n\n\n\n\n${PROGRESS}\n\n- [ ] Due and existing task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}\n\n\n\n\n${DONE}\n\n- [x] Complete task\n\n\n\n\n`
    );
    jest.spyOn(kanban, 'getBoard').mockResolvedValueOnce(board);
    const currentFile = new TFile();
    jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
    let result;
    const vaultProcess = jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
      result = fn(
        'Some existing contents...\n\n## Daily TODOs\n\n## Some other content\n\nAnd something else...'
      );
      return Promise.resolve(result);
    });

    await sut.checkAndCopyTasks(settings, new TFile());

    expect(vaultProcess).toHaveBeenCalledWith(currentFile, expect.any(Function));
    expect(result).toEqual(
      `Some existing contents...\n\n## Daily TODOs\n\n- [ ] Due and existing task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}\n- [ ] Due task 📅 ${moment().subtract(1, 'day').format(DUE_DATE_FORMAT)}\n\n## Some other content\n\nAnd something else...`
    );
  });

  describe('sub-tasks carry-over', () => {
    it('carries over incomplete parent with incomplete sub-tasks', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce(
          '## TODOs\n\n- [ ] Parent task\n\t- [ ] Child task 1\n\t- [ ] Child task 2'
        );
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).toContain('- [ ] Parent task');
      expect(result).toContain('\t- [ ] Child task 1');
      expect(result).toContain('\t- [ ] Child task 2');
    });

    it('does not carry over complete parent even with incomplete sub-tasks', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce('## TODOs\n\n- [x] Complete parent\n\t- [ ] Incomplete child');
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).not.toContain('Complete parent');
      expect(result).not.toContain('Incomplete child');
    });

    it('filters out complete sub-tasks when carrying over incomplete parent', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce(
          '## TODOs\n\n- [ ] Parent task\n\t- [x] Complete child\n\t- [ ] Incomplete child'
        );
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).toContain('- [ ] Parent task');
      expect(result).not.toContain('Complete child');
      expect(result).toContain('\t- [ ] Incomplete child');
    });

    it('carries over deeply nested incomplete tasks', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce(
          '## TODOs\n\n- [ ] Level 0\n\t- [ ] Level 1\n\t\t- [ ] Level 2\n\t\t\t- [ ] Level 3'
        );
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).toContain('- [ ] Level 0');
      expect(result).toContain('\t- [ ] Level 1');
      expect(result).toContain('\t\t- [ ] Level 2');
      expect(result).toContain('\t\t\t- [ ] Level 3');
    });

    it('filters complete tasks at all nesting levels', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce(
          '## TODOs\n\n- [ ] Parent\n\t- [ ] Child 1\n\t\t- [x] Complete grandchild\n\t\t- [ ] Incomplete grandchild\n\t- [x] Complete child 2'
        );
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).toContain('- [ ] Parent');
      expect(result).toContain('\t- [ ] Child 1');
      expect(result).not.toContain('Complete grandchild');
      expect(result).toContain('\t\t- [ ] Incomplete grandchild');
      expect(result).not.toContain('Complete child 2');
    });

    it('adds carry-over prefix to parent and children', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.carryOverPrefix = '[>]';
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce('## TODOs\n\n- [ ] Parent task\n\t- [ ] Child task');
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).toContain('- [ ] [>] Parent task');
      expect(result).toContain('\t- [ ] [>] Child task');
    });
  });

  describe('not-needed tasks carry-over', () => {
    it('does not carry over not-needed tasks', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce(
          '## TODOs\n\n- [ ] Incomplete 1\n- [n] Not needed task\n- [ ] Incomplete 2'
        );
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).toContain('- [ ] Incomplete 1');
      expect(result).toContain('- [ ] Incomplete 2');
      expect(result).not.toContain('Not needed task');
    });

    it('does not carry over not-needed parent even with incomplete sub-tasks', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce('## TODOs\n\n- [n] Not needed parent\n\t- [ ] Incomplete child');
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).not.toContain('Not needed parent');
      expect(result).not.toContain('Incomplete child');
    });

    it('filters out not-needed sub-tasks when carrying over incomplete parent', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce(
          '## TODOs\n\n- [ ] Parent task\n\t- [n] Not needed child\n\t- [ ] Incomplete child'
        );
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).toContain('- [ ] Parent task');
      expect(result).not.toContain('Not needed child');
      expect(result).toContain('\t- [ ] Incomplete child');
    });

    it('filters not-needed tasks at all nesting levels', async () => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest
        .spyOn(vault, 'read')
        .mockResolvedValueOnce(
          '## TODOs\n\n- [ ] Parent\n\t- [ ] Child 1\n\t\t- [n] Not needed grandchild\n\t\t- [ ] Incomplete grandchild\n\t- [n] Not needed child 2'
        );
      const currentFile = new TFile();
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      let result;
      jest.spyOn(vault, 'process').mockImplementation((file, fn, options) => {
        result = fn('');
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(result).toContain('- [ ] Parent');
      expect(result).toContain('\t- [ ] Child 1');
      expect(result).not.toContain('Not needed grandchild');
      expect(result).toContain('\t\t- [ ] Incomplete grandchild');
      expect(result).not.toContain('Not needed child 2');
    });
  });

  describe('marking carried over tasks in the previous note', () => {
    const PREVIOUS =
      '## TODOs\n\n- [x] Complete 1\n- [ ] Incomplete 1\n\t- [ ] Child 1\n\t- [x] Child 2\n- [n] Not needed 1\n- [ ] Incomplete 2';

    let previousFile: TFile;
    let currentFile: TFile;
    let processed: Map<TFile, string>;

    beforeEach(() => {
      settings.daily.available = true;
      settings.daily.carryOver = true;
      settings.daily.header = '## Daily TODOs';
      previousFile = new TFile();
      currentFile = new TFile();
      processed = new Map<TFile, string>();

      jest.spyOn(dailyNote, 'isValid').mockReturnValue(true);
      jest.spyOn(dailyNote, 'getPrevious').mockReturnValue(previousFile);
      jest.spyOn(dailyNote, 'getCurrent').mockReturnValue(currentFile);
      jest.spyOn(vault, 'read').mockResolvedValue(PREVIOUS);
      jest.spyOn(vault, 'process').mockImplementation((file, fn) => {
        const result = fn(file === previousFile ? PREVIOUS : '');
        processed.set(file, result);
        return Promise.resolve(result);
      });
    });

    it('leaves the previous note untouched when no status is configured', async () => {
      await sut.checkAndCopyTasks(settings, new TFile());

      expect(processed.has(previousFile)).toBe(false);
    });

    it('leaves the previous note untouched when the status is only whitespace', async () => {
      settings.carryOverStatus = '   ';

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(processed.has(previousFile)).toBe(false);
    });

    it('marks carried over tasks and their carried children', async () => {
      settings.carryOverStatus = '>';

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(processed.get(previousFile)).toEqual(
        '## TODOs\n\n- [x] Complete 1\n- [>] Incomplete 1\n\t- [>] Child 1\n\t- [x] Child 2\n- [n] Not needed 1\n- [>] Incomplete 2'
      );
    });

    it('accepts a status of x to complete the tasks instead', async () => {
      settings.carryOverStatus = 'x';

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(processed.get(previousFile)).toContain('- [x] Incomplete 1');
      expect(processed.get(previousFile)).toContain('- [x] Incomplete 2');
    });

    it('uses only the first character of the configured status', async () => {
      settings.carryOverStatus = '>>';

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(processed.get(previousFile)).toContain('- [>] Incomplete 1');
    });

    it('ignores an invalid status', async () => {
      settings.carryOverStatus = '1';

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(processed.has(previousFile)).toBe(false);
    });

    it('preserves metadata on the lines it marks', async () => {
      settings.carryOverStatus = '>';
      const previous = '## TODOs\n\n- [ ] Incomplete 1 📅 2024-01-01 %%origin:file1.md%%';
      jest.spyOn(vault, 'read').mockResolvedValue(previous);
      jest.spyOn(vault, 'process').mockImplementation((file, fn) => {
        const result = fn(file === previousFile ? previous : '');
        processed.set(file, result);
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(processed.get(previousFile)).toEqual(
        '## TODOs\n\n- [>] Incomplete 1 📅 2024-01-01 %%origin:file1.md%%'
      );
    });

    it('does not carry the marked tasks a second time', async () => {
      settings.carryOverStatus = '>';

      await sut.checkAndCopyTasks(settings, new TFile());

      // Feed the note back in as it now stands - nothing is left to carry
      const marked = processed.get(previousFile) as string;
      processed.clear();
      jest.spyOn(vault, 'read').mockResolvedValue(marked);
      jest.spyOn(vault, 'process').mockImplementation((file, fn) => {
        const result = fn(file === previousFile ? marked : '');
        processed.set(file, result);
        return Promise.resolve(result);
      });

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(processed.get(currentFile)).toEqual('\n\n## Daily TODOs\n\n');
      expect(processed.has(previousFile)).toBe(false);
    });

    it('does not mark tasks that were pulled in from the Kanban board', async () => {
      settings.carryOverStatus = '>';
      settings.tasksAvailable = true;
      settings.kanbanSync = true;
      settings.daily.addDue = true;
      jest.spyOn(dailyNote, 'getNextDate').mockReturnValue(moment('2024-01-02'));
      const board = new KanbanBoard(
        taskFactory,
        'Board.md',
        `${UPCOMING}\n\n- [ ] Due elsewhere 📅 2024-01-01\n\n${DUE}\n\n\n\n${PROGRESS}\n\n\n\n${DONE}\n\n\n\n`
      );
      jest.spyOn(kanban, 'getBoard').mockResolvedValue(board);

      await sut.checkAndCopyTasks(settings, new TFile());

      expect(processed.get(currentFile)).toContain('- [ ] Due elsewhere');
      expect(processed.get(previousFile)).not.toContain('Due elsewhere');
      expect(processed.get(previousFile)).toContain('- [>] Incomplete 1');
    });
  });
});
