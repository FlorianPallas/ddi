import { getMetadataKey } from "../metadata/utils.ts";
import { PROVIDES_METADATA } from "./decorators.ts";
import type { Module, Named, Type } from "./common.ts";

/**
 * The application provides a dependency injection container.
 * It can be used to register types and resolve instances.
 */
export class App {
  #registry = new Map<string, Type>();
  // deno-lint-ignore no-explicit-any
  #instances = new Map<Named, any>();

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
   * @throws an error if the type has already been registered
   * @param type the type to register
   */
  register<T>(type: Type<T>) {
    const aliases =
      getMetadataKey(type, PROVIDES_METADATA)?.map((alias) => alias.name) ?? [];

    for (const name of [type.name, ...aliases]) {
      if (this.#registry.has(name)) {
        throw new Error(
          `A type for key '${name}' has already been registered.`,
        );
      }
      this.#registry.set(name, type);
    }
  }

  /**
   * Resolves a type or alias to an instance of the type.
   * If the type has not been resolved before, a new instance is created.
   *
   * @throws an error if the type has not been registered yet
   * @param symbol the symbol to look up
   * @returns the instance of the type registered under the symbol
   */
  resolve<T>(symbol: Named<T>): T {
    let instance = this.#instances.get(symbol);
    if (instance) {
      return instance;
    }

    const type = this.#registry.get(symbol.name);
    if (!type) {
      throw new Error(`Type for key '${symbol.name}' has not been registered.`);
    }

    instance = new type(this);
    this.#instances.set(type, instance);

    return instance;
  }

  /**
   * Returns a list of types that have been registered with the application.
   * This is useful for scanning them for metadata.
   * This will not instantiate any types.
   *
   * @returns all types that have been registered with the application
   */
  getTypes(): Type[] {
    return this.#registry.values().toArray();
  }
}
