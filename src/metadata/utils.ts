// deno-lint-ignore-file
import type { MetadataDef, Type } from "../core/common.ts";

export type ClassDecorator<T = any> = (
  target: Type<T>,
  context: ClassDecoratorContext<Type<T>>,
) => any;

export type ClassMethodDecorator<
  T = any,
  M extends (this: T, ...args: any) => any = (this: T, ...args: any) => any,
> = (target: M, context: ClassMethodDecoratorContext<T, M>) => M;

export type MetadataEntry<K extends PropertyKey = PropertyKey, T = unknown> = {
  key: K;
  value: T;
};

export function setMetadata(target: any, metadata: DecoratorMetadataObject) {
  target[Symbol.metadata] = metadata;
}

export function getMetadata(target: any): DecoratorMetadataObject | undefined {
  return target[Symbol.metadata] ?? undefined;
}

export function setMetadataKey<T>(target: any, def: MetadataDef<T>, value: T) {
  if (!target[Symbol.metadata]) {
    target[Symbol.metadata] = {};
  }
  target[Symbol.metadata][def.name] = value;
}

export function getMetadataKey<T>(
  target: any,
  def: MetadataDef<T>,
): T | undefined {
  return getMetadata(target)?.[def.name] as T | undefined;
}

export function hasMetadataKey(target: any, def: MetadataDef): boolean {
  const metadata = getMetadata(target);
  return !!metadata && def.name in metadata;
}

export function getContextKey<T>(
  context: DecoratorContext,
  def: MetadataDef<T>,
): T | undefined {
  return context.metadata[def.name] as T | undefined;
}

export function setContextKey<T>(
  context: DecoratorContext,
  def: MetadataDef<T>,
  value: T,
) {
  context.metadata[def.name] = value;
}

export function mutateContextKey<T>(
  context: DecoratorContext,
  def: MetadataDef<T>,
  mutator: (value: T | undefined) => T,
) {
  setContextKey(context, def, mutator(getContextKey(context, def)));
}
