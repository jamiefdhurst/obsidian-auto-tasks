import { type Moment, type unitOfTime } from 'moment';
import { moment, TAbstractFile, type TFile } from 'obsidian';
import { getAllWeeklyNotes, getWeeklyNote } from 'obsidian-daily-notes-interface';
import Note, { checkCreateTime } from '.';

const MAX_PREVIOUS = 8;
const UNIT: unitOfTime.Base = 'week';

export default class WeeklyNote extends Note {

  private getDate(): Moment {
    return moment().startOf(UNIT);
  }

  getCurrent(): TFile {
    return getWeeklyNote(this.getDate(), getAllWeeklyNotes());
  }

  getNextDate(): Moment {
    return this.getDate().clone().add(1, UNIT);
  }

  getPrevious(): TFile {
    let date: Moment = this.getDate().clone().subtract(1, UNIT);
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
    const note: TFile = getWeeklyNote(this.getDate(), getAllWeeklyNotes());
    
    if (!note) {
      return false;
    }

    return note.name === file.name && checkCreateTime(note);
  }
}
