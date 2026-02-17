// @reference-only — This module is not wired into the main execution pipeline.
// src/infrastructure/container.ts

export class Container {
  private instances = new Map<string, unknown>();

  register<T>(key: string, instance: T) {
    if (this.instances.has(key)) {
      throw new Error(`Dependency ${key} already registered`);
    }
    this.instances.set(key, instance);
  }

  resolve<T>(key: string): T {
    const instance = this.instances.get(key);

    if (!instance) {
      throw new Error(`Dependency ${key} not found in container`);
    }

    return instance as T;
  }

  has(key: string): boolean {
    return this.instances.has(key);
  }
}
