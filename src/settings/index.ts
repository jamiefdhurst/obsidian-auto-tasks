export type IPeriodicity = 'daily' | 'weekly';

export interface IPeriodicitySettings {
  addDue: boolean;
  available: boolean;
  carryOver: boolean;
  header: string;
  searchHeaders: string[];
}

export interface ISettings {
  carryOverPrefix: string;
  kanbanSync: boolean;
  kanbanFile: string;
  kanbanIgnoreFolders: string[];
  kanbanIgnoreMatches: string[];
  kanbanOriginsMigrated: boolean;
  tasksAvailable: boolean;
  daily: IPeriodicitySettings;
  weekly: IPeriodicitySettings;
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
  carryOverPrefix: '',
  kanbanSync: false,
  kanbanFile: '',
  kanbanIgnoreFolders: [],
  kanbanIgnoreMatches: [],
  kanbanOriginsMigrated: false,
  tasksAvailable: false,
  daily: {
    addDue: false,
    available: false,
    carryOver: false,
    header: '## TODOs',
    searchHeaders: [],
  },
  weekly: {
    addDue: false,
    available: false,
    carryOver: false,
    header: '## TODOs',
    searchHeaders: [],
  },
});
