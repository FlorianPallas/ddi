// deno-lint-ignore-file no-explicit-any

import type { Logger } from "./mod.ts";

/**
 * A type defines a class that produces a certain type of object.
 */
export type Type<T = any> = new (app: App) => T;

/**
 * An alias is is used as a symbol which types can be registered under.
 */
export class Alias<T = unknown> {
  constructor(public name: string) {}
}

/**
 * Extracts the underlying type from an alias.
 */
export type Resolve<T extends Alias> = T extends Alias<infer U> ? U : never;

/**
 * A module can be called to mutate the application.
 * It usually registers multiple types of similar functionality.
 */
export type Module = (app: App) => void;

/**
 * The application provides a dependency injection container.
 * It can be used to register types and resolve instances.
 *
 * @example
 * import { App, loggingModule } from "@fpallas/ddi";
 *
 * class MyClass {
 *   constructor(app: App) {
 *     // ...
 *   }
 * }
 *
 * const app = new App();
 *
 * app.use(loggingModule);
 * app.register(MyClass);
 */
export class App {
  private readonly logger?: Logger;

  private types = new Map<string, Type>();
  private instances = new Map<string, any>();
  private aliases = new Map<string, string>();

  /**
   * Registers a module with the application.
   *
   * @param module the module to call
   */
  use(module: Module) {
    module(this);
  }

  /**
   * Registers a type with the application.
   * This makes the type available for resolution.
   * The type is not instantiated until it is resolved.
   *
   * By providing an alias, the type can additionally be registered under a different symbol.
   * This can be useful if you register a concrete type for a generic interface.
   * This way you can resolve the concrete type by its alias.
   *
   * @example
   * interface IMyClass {
   *   speak(): string;
   * }
   * const IMyClass: Alias<IMyClass> = new Alias("IMyClass");
   *
   * class MyClass implements IMyClass {
   *   speak() {
   *     console.log("Hello, world!");
   *   }
   * }
   *
   * class MyConsumer {
   *   myClass: IMyClass;
   *
   *   constructor(app: App) {
   *     this.myClass = app.resolve<IMyClass>(IMyClass);
   *   }
   * }
   *
   * const app = new App();
   * app.register(MyClass, IMyClass); // register concrete type under alias
   * app.register(MyConsumer); // register consumer
   * app.resolve(MyConsumer).myClass.speak(); // logs "Hello, world!"
   *
   * @param type the type to register
   * @param alias an optional alias to register the type under
   */
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

  /**
   * Alternative to `register` that allows registering a value instead of a type.
   *
   * @param value the value to register
   * @param alias the alias to register the value under
   */
  registerValue<T>(value: T, alias: Alias<T>) {
    this.instances.set(alias.name, value);
    this.logger?.debug("Registered value under alias:", alias.name);
  }

  /**
   * Resolves a type or alias to an instance of the type.
   * If the type has not been resolved before, a new instance is created.
   *
   * @throws an error if the type has not been registered
   * @param symbol the symbol to look up
   * @returns the instance of the type registered under the symbol
   */
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

  /**
   * Searches all registered symbols for a match with the search text.
   * This is useful for creating complex logic which accumulates all instances that match a certain criteria.
   *
   * @param text the text to search for
   * @returns all instances that match the search text
   */
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
