export type IPeriodicity = 
  | 'daily'
  | 'weekly';

export interface IPeriodicitySettings {
  available: boolean;
  carryOver: boolean;
  setDueDate: boolean;
}

export interface ISettings {
  daily: IPeriodicitySettings;
  weekly: IPeriodicitySettings;
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
  daily: { 
    available: false,
    carryOver: false,
    setDueDate: false,
  },
  weekly: {
    available: false,
    carryOver: false,
    setDueDate: false,
  },
});

export function applyDefaultSettings(savedSettings: ISettings): ISettings {
  return Object.assign(
    {},
    DEFAULT_SETTINGS,
    savedSettings
  );
}
