import { type Moment, type unitOfTime } from 'moment';
import { moment, TAbstractFile, type TFile } from 'obsidian';
import { getAllDailyNotes, getDailyNote } from 'obsidian-daily-notes-interface';
import Note, { checkCreateTime } from '.';

const MAX_PREVIOUS = 30;
const UNIT: unitOfTime.Base = 'day';

export default class DailyNote extends Note {

  private date: Moment = moment().startOf(UNIT);

  getCurrent(): TFile {
    return getDailyNote(this.date, getAllDailyNotes());
  }

  getNextDate(): Moment {
    return this.date.clone().add(1, UNIT);
  }

  getPrevious(): TFile {
    let date: Moment = this.date.clone().subtract(1, UNIT);
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
    const note: TFile = getDailyNote(this.date, getAllDailyNotes());

    if (!note) {
      return false;
    }

    return note.name === file.name && checkCreateTime(note);
  }
}
