import { getMetadataKey } from "../metadata/utils.ts";
import { PROVIDES_METADATA } from "./decorators.ts";
import type { Module, Resolvable, Type } from "./common.ts";
import { ROUTE_METADATA, withRoutes } from "../routing/route.ts";
import {
  type IMiddleware,
  MIDDLEWARE_METADATA,
  WITH_MIDDLEWARE_METADATA,
  withMiddleware,
} from "../routing/middleware.ts";
import { CONTROLLER_METADATA } from "../routing/controller.ts";
import { type ILogSink, Logger } from "../logging/logger.ts";
import { ConsoleLogSink } from "../logging/sinks/console.ts";

/**
 * The application provides a dependency injection container.
 * It can be used to register types and resolve instances.
 */
export class App {
  #registry = new Map<string, Type>();
  // deno-lint-ignore no-explicit-any
  #instances = new Map<Resolvable, any>();

  constructor(
    options: { LogSink: Type<ILogSink> } = { LogSink: ConsoleLogSink },
  ) {
    this.register(options.LogSink);
    this.register(Logger);
  }

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
  resolve<T>(symbol: Resolvable<T>): T {
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

  serve(
    defaultHandler: Deno.ServeHandler = () =>
      new Response("Not Found", { status: 404 }),
  ): Deno.ServeHandler {
    const types = [...this.#registry.values()];

    const controllers = types
      .map((type) => ({
        resolvable: type,
        metadata: getMetadataKey(type, CONTROLLER_METADATA),
      }))
      .filter((def) => !!def.metadata).map((def) => ({
        ...def,
        instance: this.resolve<any>(def.resolvable),
      }));

    const globalMiddleware = types
      .map((type) => ({
        resolvable: type as Resolvable<IMiddleware>,
        metadata: getMetadataKey(type, MIDDLEWARE_METADATA),
      }))
      .filter((def) => !!def.metadata)
      .filter((def) => def.metadata!.global) // only global middleware
      .map((def) => ({
        ...def,
        instance: this.resolve<IMiddleware>(def.resolvable),
      }));

    const routes = controllers
      .flatMap(({ resolvable, instance }) => {
        const routes = getMetadataKey(resolvable, ROUTE_METADATA) ?? {};
        const x = getMetadataKey(resolvable, WITH_MIDDLEWARE_METADATA) ??
          { controller: [], perRoute: {} };

        const controllerMiddleware = x.controller
          .map((resolvable) => ({
            resolvable,
            metadata: getMetadataKey(resolvable, MIDDLEWARE_METADATA),
          }))
          .filter((def) => !!def.metadata)
          .map((def) => ({
            ...def,
            instance: this.resolve<IMiddleware>(def.resolvable),
          }));

        return Object.entries(routes).map(([name, mapping]) => {
          const handler = instance[name].bind(instance);

          const routeMiddleware = (x.perRoute[name] ?? [])
            .map((resolvable) => ({
              resolvable,
              instance: this.resolve<IMiddleware>(resolvable),
            }))
            .map(({ resolvable, instance }) => ({
              resolvable,
              instance,
              metadata: getMetadataKey(resolvable, MIDDLEWARE_METADATA),
            }))
            .filter((def) => !!def.metadata);

          const middleware = [
            ...globalMiddleware,
            ...controllerMiddleware,
            ...routeMiddleware,
          ].sort((a, b) => a.metadata!.priority - b.metadata!.priority);

          return {
            pattern: mapping.pattern,
            method: mapping.method,
            handler: withMiddleware(
              middleware.map((def) => def.instance),
              handler,
            ),
          };
        });
      });

    return withRoutes(routes, defaultHandler);
  }
}
