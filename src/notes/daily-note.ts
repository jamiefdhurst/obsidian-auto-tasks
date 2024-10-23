import { Moment, unitOfTime } from 'moment';
import { moment, TAbstractFile, type TFile } from 'obsidian';
import { getAllDailyNotes, getDailyNote } from 'obsidian-daily-notes-interface';
import Note, { checkCreateTime } from '.';

const MAX_PREVIOUS = 30;
const UNIT: unitOfTime.Base = 'day';

export default class DailyNote extends Note {

  private date: Moment = moment();

  getCurrent(): TFile {
    const date: Moment = this.date.clone().startOf(UNIT);
    const allNotes: Record<string, TFile> = getAllDailyNotes();

    return getDailyNote(date, allNotes);
  }

  getPrevious(): TFile {
    let date: Moment = this.date.clone().startOf(UNIT).subtract(1, UNIT);
    const limit = date.clone().subtract(MAX_PREVIOUS, UNIT);
    const allNotes: Record<string, TFile> = getAllDailyNotes();
    let note: TFile;
    do {
      note = getDailyNote(date, allNotes);
      date.subtract(1, UNIT);
    } while (!note && date.isAfter(limit));

    return note;
  }

  isValid(file: TAbstractFile): boolean {
    const start: Moment = this.date.clone().startOf(UNIT);
    const allNotes: Record<string, TFile> = getAllDailyNotes();
    const note: TFile = getDailyNote(start, allNotes);

    if (!note) {
      return false;
    }

    return note.name === file.name && checkCreateTime(note);
  }
}
