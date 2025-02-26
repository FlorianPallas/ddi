// deno-lint-ignore-file

export const Metadata = (key: PropertyKey, value: any) =>
(
  target: any,
  context: DecoratorContext,
): any => {
  context.metadata[key] = value;
  return target;
};
