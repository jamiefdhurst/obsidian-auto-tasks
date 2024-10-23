import { Moment, unitOfTime } from 'moment';
import { moment, TAbstractFile, type TFile } from 'obsidian';
import { getAllWeeklyNotes, getWeeklyNote } from 'obsidian-daily-notes-interface';
import Note, { checkCreateTime } from '.';

const MAX_PREVIOUS = 8;
const UNIT: unitOfTime.Base = 'week';

export default class WeeklyNote extends Note {

  private date: Moment = moment();
  
  getCurrent(): TFile {
    const date: Moment = this.date.clone().startOf(UNIT);
    const allNotes: Record<string, TFile> = getAllWeeklyNotes();

    return getWeeklyNote(date, allNotes);
  }

  getPrevious(): TFile {
    let date: Moment = this.date.clone().startOf(UNIT).subtract(1, UNIT);
    const limit = date.clone().subtract(MAX_PREVIOUS, UNIT);
    const allNotes: Record<string, TFile> = getAllWeeklyNotes();
    let note: TFile;
    do {
      note = getWeeklyNote(date, allNotes);
      date.subtract(1, UNIT);
    } while (!note && date.isAfter(limit));

    return note;
  }

  isValid(file: TAbstractFile): boolean {
    const start: Moment = this.date.clone().startOf(UNIT);
    const allNotes: Record<string, TFile> = getAllWeeklyNotes();
    const note: TFile = getWeeklyNote(start, allNotes);
    
    return note.name === file.name && checkCreateTime(note);
  }
}
