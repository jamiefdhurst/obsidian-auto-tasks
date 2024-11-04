import { moment, TFile } from 'obsidian';
import * as dailyNotesInterface from 'obsidian-daily-notes-interface';
import DailyNote from '../../notes/daily-note';

jest.mock('obsidian-daily-notes-interface');

describe('daily note', () => {

  let sut: DailyNote;

  let mockGetAllNotes: jest.MockedFunction<typeof dailyNotesInterface.getAllDailyNotes>;

  beforeEach(() => {
    const emptyRecord: Record<string, TFile> = {};
    mockGetAllNotes = dailyNotesInterface.getAllDailyNotes as jest.MockedFunction<typeof dailyNotesInterface.getAllDailyNotes>;
    mockGetAllNotes.mockImplementation(() => {
      return emptyRecord;
    });

    sut = new DailyNote();
  });

  afterEach(() => {
    mockGetAllNotes.mockReset();
  });

  it('returns current note', () => {
    const mock = dailyNotesInterface.getDailyNote as jest.MockedFunction<typeof dailyNotesInterface.getDailyNote>;
    const fileName = moment().format('YYYY-MM-DD');
    mock.mockImplementation(() => {
      const file = new TFile();
      file.basename = fileName;
      return file;
    });

    const result = sut.getCurrent();
    
    expect(result.basename).toEqual(fileName);
  });

  it('gets next date', () => {
    expect(sut.getNextDate()).toEqual(moment().startOf('day').add(1, 'day'));
  });

  it('gets immediately previous note', () => {
    const mock = dailyNotesInterface.getDailyNote as jest.MockedFunction<typeof dailyNotesInterface.getDailyNote>;
    const fileName = moment().subtract(1, 'day').format('YYYY-MM-DD');
    mock.mockImplementation(() => {
      const file = new TFile();
      file.basename = fileName;
      return file;
    });

    const result = sut.getPrevious();
    
    expect(result.basename).toEqual(fileName);
  });

  it('returns valid but false when files do not match', () => {
    const mock = dailyNotesInterface.getDailyNote as jest.MockedFunction<typeof dailyNotesInterface.getDailyNote>;
    mock.mockImplementation(() => {
      const file = new TFile();
      file.name = 'file1.md';
      return file;
    });

    const input = new TFile();
    input.name = 'file2.md';

    expect(sut.isValid(input)).toEqual(false);
  });

  it('returns valid but false when files match but create time is out', () => {
    const mock = dailyNotesInterface.getDailyNote as jest.MockedFunction<typeof dailyNotesInterface.getDailyNote>;
    mock.mockImplementation(() => {
      const file = new TFile();
      file.name = 'file1.md';
      file.stat = {
        ctime: 1000000,
        mtime: 0,
        size: 2,
      };
      return file;
    });

    const input = new TFile();
    input.name = 'file1.md';

    expect(sut.isValid(input)).toEqual(false);
  });

  it('returns valid', () => {
    const mock = dailyNotesInterface.getDailyNote as jest.MockedFunction<typeof dailyNotesInterface.getDailyNote>;
    mock.mockImplementation(() => {
      const file = new TFile();
      file.name = 'file1.md';
      file.stat = {
        ctime: new Date().getTime(),
        mtime: new Date().getTime(),
        size: 200,
      };
      return file;
    });

    const input = new TFile();
    input.name = 'file1.md';

    expect(sut.isValid(input)).toEqual(true);
  });

});
