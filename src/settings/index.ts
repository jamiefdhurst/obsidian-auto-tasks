export type IPeriodicity = 
  | 'daily'
  | 'weekly';

export interface IPeriodicitySettings {
  available: boolean;
  carryOver: boolean;
  setDueDate: boolean;
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
    available: false,
    carryOver: false,
    setDueDate: false,
    header: '## TODOs',
    searchHeaders: [],
  },
  weekly: {
    available: false,
    carryOver: false,
    setDueDate: false,
    header: '## TODOs',
    searchHeaders: [],
  },
});
