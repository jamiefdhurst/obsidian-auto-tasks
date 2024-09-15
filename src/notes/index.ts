import type { TAbstractFile, TFile } from 'obsidian';

const CREATE_TIME_GAP_MS = 1000;

export default abstract class Note {
  abstract getCurrent(): TFile;
  abstract getPrevious(): TFile;
  abstract isValid(file: TAbstractFile): boolean;
}

export function checkCreateTime(file: TFile): boolean {
  return file.stat.ctime > new Date().getTime() - CREATE_TIME_GAP_MS;
}
