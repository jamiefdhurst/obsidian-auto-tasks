import { App, DataWriteOptions, EventRef, Plugin, TAbstractFile, TFile, Workspace } from 'obsidian';

export class PluginSettingTab {}

export interface CommunityPluginManager {
  enabledPlugins: Set<string>;
  getPlugin(id: string): Plugin | undefined;
}

export type ObsidianAppWithPlugins = {
  plugins: CommunityPluginManager;
};
export type ObsidianApp = App & ObsidianAppWithPlugins;
export type ObsidianVault = {
  getFileByPath(path: string): TFile | null;
  create(path: string, data: string, options?: DataWriteOptions): Promise<TFile>;
  read(file: TFile): Promise<string>;
  modify(file: TFile, data: string, options?: DataWriteOptions): Promise<void>;
  process(file: TFile, fn: (data: string) => string, options?: DataWriteOptions): Promise<string>;
  getFiles(): TFile[];
  on(name: 'create', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
  on(name: 'modify', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
  on(name: 'delete', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
  on(name: 'rename', callback: (file: TAbstractFile, oldPath: string) => any, ctx?: any): EventRef;
}
export type ObsidianWorkspaceWithOn = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(name: string, callback: () => void, ctx?: any): EventRef;
};
export type ObsidianWorkspace = Workspace & ObsidianWorkspaceWithOn;
