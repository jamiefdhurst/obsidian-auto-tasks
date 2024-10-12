import { Moment, unitOfTime } from 'moment';
import { moment, TAbstractFile, type TFile } from 'obsidian';
import { getAllDailyNotes, getDailyNote } from 'obsidian-daily-notes-interface';
import Note, { checkCreateTime } from '.';

const UNIT: unitOfTime.StartOf = 'day';

export default class DailyNote extends Note {

  private date: Moment = moment();

  getCurrent(): TFile {
    const date: Moment = this.date.clone().startOf(UNIT);
    const allNotes: Record<string, TFile> = getAllDailyNotes();

    return getDailyNote(date, allNotes);
  }

  getPrevious(): TFile {
    const date: Moment = this.date.clone().startOf(UNIT).subtract(1, 'day');
    const allNotes: Record<string, TFile> = getAllDailyNotes();

    return getDailyNote(date, allNotes);
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
