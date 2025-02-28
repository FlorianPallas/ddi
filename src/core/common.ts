import type { App } from "./app.ts";

export type Resolvable<T = unknown> = Type<T> | Alias<T>;

/**
 * A type defines a class that produces a certain type of object.
 */
export type Type<T = unknown> = new (app: App) => T;

/**
 * An alias is is used as a symbol which types can be registered under.
 */
export class Alias<T = unknown> {
  constructor(public name: string) {}
}

export class MetadataDef<T = unknown> {
  constructor(public name: PropertyKey) {}
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
