import { ConsoleLogSink } from "./sinks/console.ts";
import { Logger } from "./logger.ts";
import type { Module } from "../core/common.ts";

/**
 * The logging module provides basic logging functionality.
 * By default, it logs to the console.
 *
 * @param app the app to use
 */
export const loggingModule: Module = (app) => {
  app.register(ConsoleLogSink);
  app.register(Logger);
};
