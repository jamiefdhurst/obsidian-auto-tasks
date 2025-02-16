import { IgnoreComponent } from './ignore-component';

export class IgnoreMatches extends IgnoreComponent {
  
  protected getIgnoredSetting(): string[] {
    return this.settings.kanbanIgnoreMatches;
  }
}
