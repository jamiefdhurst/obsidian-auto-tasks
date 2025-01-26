import { App, TFile } from 'obsidian';
import { Suggest } from '../../ui/suggest';

class SuggestTestable extends Suggest {
  exposeGetSuggestions(query: string): string[] {
    return this.getSuggestions(query);
  }
}

describe('Suggest', () => {

  let sut: SuggestTestable;

  let el: HTMLInputElement;

  beforeEach(() => {
    const app = jest.fn() as unknown as App;
    const options = [
      new TFile(),
      new TFile(),
      new TFile(),
    ];
    options[0].path = 'foo.md';
    options[1].path = 'foo/Bar.md';
    options[2].path = 'baz.md';
    el = createEl('input');

    sut = new SuggestTestable(app, options, el);
  });

  it('renders a suggestion', () => {
    const elSetText = jest.spyOn(el, 'setText');

    sut.renderSuggestion('example', el);

    expect(elSetText).toHaveBeenCalledWith('example');
  });

  it('selects a suggestion', () => {
    const elDispatch = jest.spyOn(el, 'dispatchEvent');

    sut.selectSuggestion('example', new MouseEvent('change'));

    expect(el.value).toEqual('example');
    expect(elDispatch).toHaveBeenCalled();
  });

  it('gets suggestions', () => {
    const suggestions = sut.exposeGetSuggestions('BA');
    
    expect(suggestions).toEqual(['foo/Bar.md', 'baz.md']);
  });

});
