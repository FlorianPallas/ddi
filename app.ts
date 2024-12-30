// deno-lint-ignore-file no-explicit-any

import type { Logger } from "./mod.ts";

export type Type<T = any> = new (app: App) => T;

export class Alias<T = any> {
  constructor(public name: string) {}
}
export type Resolve<T extends Alias> = T extends Alias<infer U> ? U : never;

export type Module = (app: App) => void;

export class App {
  private readonly logger?: Logger;

  private types = new Map<string, Type>();
  private instances = new Map<string, any>();
  private aliases = new Map<string, string>();

  use(module: Module) {
    module(this);
  }

  register<T>(type: Type<T>, alias?: Alias<T>) {
    this.setType(type.name, type);
    this.logger?.debug("Registered type:", type.name);

    if (alias) {
      this.setType(alias.name, type);
      this.aliases.set(alias.name, type.name);
      this.aliases.set(type.name, alias.name);
      this.logger?.debug("Registered alias:", alias.name);
    }
  }

  registerValue<T>(value: T, alias: Alias<T>) {
    this.instances.set(alias.name, value);
    this.logger?.debug("Registered value under alias:", alias.name);
  }

  resolve<T>(symbol: Type<T> | Alias<T>): T {
    let instance = this.instances.get(symbol.name);
    if (instance) {
      this.logger?.debug("Resolved instance:", symbol.name);
      return instance;
    }
    const type = this.getType(symbol.name);
    instance = new type(this);
    this.instances.set(symbol.name, instance);
    const alias = this.aliases.get(symbol.name);
    if (alias) {
      this.instances.set(alias, instance);
    }
    this.logger?.debug("Created instance:", symbol.name);
    return instance;
  }

  resolveAll<T>(text: string): T[] {
    return this.types
      .entries()
      .filter(([key]) => !this.aliases.has(key)) // exclude aliased types
      .filter(([key]) => key.toLowerCase().includes(text.toLowerCase())) // case-insensitive search
      .map(([_, type]) => this.resolve(type) as T) // resolve instance
      .toArray();
  }

  private setType(key: string, type: Type) {
    if (this.types.has(key)) {
      throw new Error(`Type for key '${key}' has already been registered.`);
    }
    this.types.set(key, type);
  }

  private getType<T>(key: string): Type<T> {
    if (!this.types.has(key)) {
      throw new Error(`Type for key '${key}' has not been registered.`);
    }
    return this.types.get(key)!;
  }
}
