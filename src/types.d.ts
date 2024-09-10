import { App, Plugin, Workspace } from 'obsidian';

export class PluginSettingTab {}

export interface CommunityPluginManager {
  enabledPlugins: Set<string>;
  getPlugin(id: string): Plugin | undefined;
}

export type ObsidianAppWithPlugins = {
  plugins: CommunityPluginManager;
};
export type ObsidianApp = App & ObsidianAppWithPlugins;
export type ObsidianWorkspaceWithOn = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(name: string, callback: () => void, ctx?: any): EventRef;
};
export type ObsidianWorkspace = Workspace & ObsidianWorkspaceWithOn;
