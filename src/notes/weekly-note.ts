import { Moment, unitOfTime } from 'moment';
import { moment, TAbstractFile, type TFile } from 'obsidian';
import { getAllWeeklyNotes, getWeeklyNote } from 'obsidian-daily-notes-interface';
import Note, { checkCreateTime } from '.';

const UNIT: unitOfTime.StartOf = 'week';

export default class WeeklyNote extends Note {

  private date: Moment = moment();
  
  getCurrent(): TFile {
    const date: Moment = this.date.clone().startOf(UNIT);
    const allNotes: Record<string, TFile> = getAllWeeklyNotes();

    return getWeeklyNote(date, allNotes);
  }

  getPrevious(): TFile {
    const date: Moment = this.date.clone().startOf(UNIT).subtract(1, 'week');
    const allNotes: Record<string, TFile> = getAllWeeklyNotes();

    return getWeeklyNote(date, allNotes);
  }

  isValid(file: TAbstractFile): boolean {
    const start: Moment = this.date.clone().startOf(UNIT);
    const allNotes: Record<string, TFile> = getAllWeeklyNotes();
    const note: TFile = getWeeklyNote(start, allNotes);
    
    return note.name === file.name && checkCreateTime(note);
  }
}
