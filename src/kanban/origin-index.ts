import debug from '../log';

export class TaskOriginIndex {
  private index: Map<string, Set<string>> = new Map();

  addOrigin(taskName: string, filePath: string): void {
    if (!this.index.has(taskName)) {
      this.index.set(taskName, new Set());
    }
    this.index.get(taskName)!.add(filePath);
  }

  getOrigins(taskName: string): string[] {
    const origins = this.index.get(taskName);
    return origins ? Array.from(origins) : [];
  }

  hasOrigins(taskName: string): boolean {
    return this.index.has(taskName) && this.index.get(taskName)!.size > 0;
  }

  removeFile(filePath: string): void {
    for (const [taskName, origins] of this.index) {
      origins.delete(filePath);
      if (origins.size === 0) {
        this.index.delete(taskName);
      }
    }
  }

  removeOrigin(taskName: string, filePath: string): void {
    const origins = this.index.get(taskName);
    if (origins) {
      origins.delete(filePath);
      if (origins.size === 0) {
        this.index.delete(taskName);
      }
    }
  }

  clear(): void {
    this.index.clear();
  }

  size(): number {
    return this.index.size;
  }

  buildFromTasks(tasks: { getName(): string; getOrigins(): string[] }[]): void {
    debug('Building origin index from existing tasks');
    let count = 0;
    for (const task of tasks) {
      const origins = task.getOrigins();
      for (const origin of origins) {
        this.addOrigin(task.getName(), origin);
        count++;
      }
    }
    debug(`Origin index built with ${this.size()} tasks and ${count} origin mappings`);
  }
}
