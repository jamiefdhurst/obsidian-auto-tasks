import * as momentImpl from 'moment';

export class PluginSettingTab {}
export class TAbstractFile {
  public name!: string;
  public path!: string;
}
export class TFile extends TAbstractFile {
  public basename!: string;
}
export class TFolder extends TAbstractFile {}
class BaseComponent {
  onChange(cb: (val: any) => any) {
    return this;
  }
  setDisabled(b: boolean) {
    return this;
  }
  setPlaceholder(b: boolean) {
    return this;
  }
  setValue(s: string) {
    return this;
  }
}
export class SearchComponent extends BaseComponent {}
export class TextComponent extends BaseComponent {}
export class ToggleComponent extends BaseComponent {}

export const moment = momentImpl;

// Mock the Notice class so it can be checked
export const Notice = jest.fn();

// Mock the Setting class
export class Setting {
  settingEl: HTMLElement;
  controlEl: HTMLElement;

  constructor(el: HTMLElement) {
    this.settingEl = el.createDiv();
    this.controlEl = el.createDiv();
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

  addSearch(cb: (text: SearchComponent) => any) {
    cb(new SearchComponent);
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

export class AbstractInputSuggest<T> {
  close(): void {
    
  }
};

export function setIcon(el: HTMLElement, icon: string): void {
  const svg = el.createSvg('svg', {cls: 'icon'});
  svg.setAttribute('data-icon', icon);
}
