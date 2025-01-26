import { AbstractInputSuggest, App, TAbstractFile } from 'obsidian';

export class Suggest extends AbstractInputSuggest<string> {
  private options: Set<string> = new Set();
  private el: HTMLInputElement;

  constructor(app: App, options: TAbstractFile[], el: HTMLInputElement) {
    super(app, el);
    this.el = el;
    options.forEach(option => {
      this.options.add(option.path);
    });
  }

  protected getSuggestions(query: string): string[] {
    query = query.toLocaleLowerCase();

    return [...this.options].filter(path => path.toLocaleLowerCase().contains(query));
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.setText(value);
  }

  selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
    this.el.value = value;
    this.el.dispatchEvent(new Event('input'));
    this.close();
  }
}
