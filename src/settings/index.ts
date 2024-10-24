export type IPeriodicity = 
  | 'daily'
  | 'weekly';

export interface IPeriodicitySettings {
  addDue: boolean;
  available: boolean;
  carryOver: boolean;
  header: string;
  searchHeaders: string[];
}

export interface ISettings {
  kanbanSync: boolean;
  kanbanFile: string;
  daily: IPeriodicitySettings;
  weekly: IPeriodicitySettings;
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
  kanbanSync: false,
  kanbanFile: '',
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
