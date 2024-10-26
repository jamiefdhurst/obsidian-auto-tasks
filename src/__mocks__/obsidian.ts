import * as momentImpl from 'moment';

export class PluginSettingTab {}
export class TAbstractFile {}
export class TFile extends TAbstractFile {
  public basename!: string;
  public name!: string;
}

export const moment = momentImpl;

// Mock the Notice class so it can be checked
export const Notice = jest.fn();
