import { MetadataDef } from "../core/common.ts";
import type { ClassDecorator } from "../metadata/utils.ts";
import { TypedMetadata } from "../metadata/decorators.ts";

export const CONTROLLER_METADATA: MetadataDef<true> = new MetadataDef(
  Symbol("ddi.stereotypes.controller"),
);

export const Controller = (): ClassDecorator =>
  TypedMetadata(CONTROLLER_METADATA, true);
