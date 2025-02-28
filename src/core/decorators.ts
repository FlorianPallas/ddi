import { ArrayMetadata } from "../metadata/decorators.ts";
import type { ClassDecorator } from "../metadata/mod.ts";
import { type Alias, MetadataDef } from "./common.ts";

export const PROVIDES_METADATA: MetadataDef<Alias[]> = new MetadataDef(
  Symbol("ddi.provides"),
);

/**
 * Indicates that the class should be used to resolve the given alias.
 * The class must match the type associated with the alias.
 *
 * @param alias the alias the class provides
 * @returns the class decorator
 */
export const Provides = <T>(alias: Alias<T>): ClassDecorator<T> =>
  ArrayMetadata(PROVIDES_METADATA, alias);
