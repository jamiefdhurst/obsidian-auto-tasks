import * as momentImpl from 'moment';

export class PluginSettingTab {}
export class TAbstractFile {}
export class TFile extends TAbstractFile {
  public basename!: string;
  public name!: string;
}
class BaseComponent {
  onChange(cb: (val: any) => any) {
    return this;
  }
  setDisabled(b: boolean) {
    return this;
  }
  setValue(s: string) {
    return this;
  }
}
export class TextComponent extends BaseComponent {}
export class ToggleComponent extends BaseComponent {}

export const moment = momentImpl;

// Mock the Notice class so it can be checked
export const Notice = jest.fn();

// Mock the Setting class
export class Setting {
  constructor(el: HTMLElement) {
    return this;
  }

  setDesc(s: string) {
    return this;
  }

  setHeading(s: string) {
    return this;
  }

  setName(s: string) {
    return this;
  }

  addText(cb: (text: TextComponent) => any) {
    cb(new TextComponent);
    return this;
  }

  addToggle(cb: (toggle: ToggleComponent) => any) {
    cb(new ToggleComponent);
    return this;
  }
}
