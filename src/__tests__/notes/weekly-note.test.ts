import { moment, TFile } from 'obsidian';
import * as weeklyNotesInterface from 'obsidian-daily-notes-interface';
import WeeklyNote from '../../notes/weekly-note';

jest.mock('obsidian-daily-notes-interface');

describe('weekly note', () => {

  let sut: WeeklyNote;

  let mockGetAllNotes: jest.MockedFunction<typeof weeklyNotesInterface.getAllWeeklyNotes>;

  beforeEach(() => {
    const emptyRecord: Record<string, TFile> = {};
    mockGetAllNotes = weeklyNotesInterface.getAllWeeklyNotes as jest.MockedFunction<typeof weeklyNotesInterface.getAllWeeklyNotes>;
    mockGetAllNotes.mockImplementation(() => {
      return emptyRecord;
    });

    sut = new WeeklyNote();
  });

  afterEach(() => {
    mockGetAllNotes.mockReset();
  });

  it('returns current note', () => {
    const mock = weeklyNotesInterface.getWeeklyNote as jest.MockedFunction<typeof weeklyNotesInterface.getWeeklyNote>;
    const fileName = moment().format('YYYY-MM-DD');
    mock.mockImplementation(() => {
      const file = new TFile();
      file.basename = fileName;
      return file;
    });

    const result = sut.getCurrent();
    
    expect(result.basename).toEqual(fileName);
  });

  it('returns false when note not available', () => {
    const mock = weeklyNotesInterface.getWeeklyNote as jest.MockedFunction<typeof weeklyNotesInterface.getWeeklyNote>;
    mock.mockReturnValue(false as unknown as TFile);

    const result = sut.getCurrent();
    
    expect(result).toBeFalsy();
  });

  it('gets next date', () => {
    expect(sut.getNextDate()).toEqual(moment().startOf('week').add(1, 'week'));
  });

  it('gets immediately previous note', () => {
    const mock = weeklyNotesInterface.getWeeklyNote as jest.MockedFunction<typeof weeklyNotesInterface.getWeeklyNote>;
    const fileName = moment().subtract(1, 'week').format('YYYY-MM-DD');
    mock.mockImplementation(() => {
      const file = new TFile();
      file.basename = fileName;
      return file;
    });

    const result = sut.getPrevious();
    
    expect(result.basename).toEqual(fileName);
  });

  it('gets a further back previous note', () => {
    const mock = weeklyNotesInterface.getWeeklyNote as jest.MockedFunction<typeof weeklyNotesInterface.getWeeklyNote>;
    const fileName = moment().subtract(7, 'week').format('YYYY-MM-DD');
    mock.mockReturnValueOnce(false as unknown as TFile)
      .mockReturnValueOnce(false as unknown as TFile)
      .mockReturnValueOnce(false as unknown as TFile)
      .mockReturnValueOnce(false as unknown as TFile)
      .mockReturnValueOnce(false as unknown as TFile)
      .mockReturnValueOnce(false as unknown as TFile)
      .mockImplementationOnce(() => {
        const file = new TFile();
        file.basename = fileName;
        return file;
      });

    const result = sut.getPrevious();
    
    expect(result.basename).toEqual(fileName);
  });

  it('hits the previous limit', () => {
    const mock = weeklyNotesInterface.getWeeklyNote as jest.MockedFunction<typeof weeklyNotesInterface.getWeeklyNote>;
    mock.mockReturnValue(false as unknown as TFile);

    const result = sut.getPrevious();
    
    expect(result).toBeFalsy();
  });

  it('returns invalid', () => {
    const mock = weeklyNotesInterface.getWeeklyNote as jest.MockedFunction<typeof weeklyNotesInterface.getWeeklyNote>;
    mock.mockReturnValue(false as unknown as TFile);

    expect(sut.isValid(new TFile())).toEqual(false);
  });

  it('returns valid but false when files do not match', () => {
    const mock = weeklyNotesInterface.getWeeklyNote as jest.MockedFunction<typeof weeklyNotesInterface.getWeeklyNote>;
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
    const mock = weeklyNotesInterface.getWeeklyNote as jest.MockedFunction<typeof weeklyNotesInterface.getWeeklyNote>;
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
    const mock = weeklyNotesInterface.getWeeklyNote as jest.MockedFunction<typeof weeklyNotesInterface.getWeeklyNote>;
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
