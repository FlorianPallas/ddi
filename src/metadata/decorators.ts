// deno-lint-ignore-file

import { MetadataDef } from "../core/common.ts";
import { mutateContextKey } from "./utils.ts";

export const Metadata = (key: PropertyKey, value: any) =>
(
  target: any,
  context: DecoratorContext,
): any => {
  context.metadata[key] = value;
  return target;
};

export const TypedMetadata = <T>(def: MetadataDef<T>, value: T): any =>
  Metadata(def.name, value);

export const ArrayMetadata =
  <T>(def: MetadataDef<T[]>, value: T) =>
  (target: any, context: DecoratorContext) => {
    mutateContextKey(context, def, (existing) => {
      const items = existing ?? [];
      items.push(value);
      return items;
    });
    return target;
  };

export const RecordMetadata =
  <T>(def: MetadataDef<Record<string, T>>, key: string, value: T) =>
  (target: any, context: DecoratorContext) => {
    mutateContextKey(context, def, (existing) => {
      const record = existing ?? {};
      record[key] = value;
      return record;
    });
    return target;
  };
