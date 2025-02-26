import type { Module } from "../core/common.ts";
import { ConfigService } from "./mod.ts";

export const configModule: Module = (app) => {
  app.register(ConfigService);
};
