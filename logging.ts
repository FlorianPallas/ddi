import { Alias, type App, type Type } from "./app.ts";
import type { Module } from "./mod.ts";

/**
 * The log level defines the severity of a log event.
 */
export enum LogLevel {
  Debug,
  Info,
  Warning,
  Error,
}

/**
 * A value that can be logged
 */
// deno-lint-ignore no-explicit-any
export type Printable = any;

/**
 * A generic log event.
 * This is mostly used internally.
 */
export type LogEvent = {
  name?: string;
  level: LogLevel;
  args: Printable[];
};

/**
 * A log sink is a target for log events.
 * By providing you own log sink, you can customize the logging behavior.
 * @see MockLogSink for an example.
 */
export interface ILogSink {
  /**
   * Handles a log event.
   * @param event the log event to log
   */
  log(event: LogEvent): void;
}
export const ILogSink: Alias<ILogSink> = new Alias<ILogSink>("ILogSink");

/**
 * The logging module provides basic logging functionality.
 * By default, it logs to the console.
 *
 * @param app the app to use
 */
export const loggingModule: Module = (app) => {
  app.register(ConsoleLogSink, ILogSink);
  app.register(Logger);
};

/**
 * A logger is used to log messages.
 * It can create a named sub-logger, to provide more context.
 *
 * The logger sends log events to the registered log sink.
 * @see ILogSink for more information.
 */
export class Logger {
  private readonly sink: ILogSink;

  constructor(private app: App, private name?: string) {
    this.sink = app.resolve(ILogSink);
  }

  named(from: string | Type): Logger {
    return new Logger(this.app, typeof from === "string" ? from : from.name);
  }

  debug(...args: Printable[]) {
    this.sink.log({ name: this.name, level: LogLevel.Debug, args });
  }

  info(...args: Printable[]) {
    this.sink.log({ name: this.name, level: LogLevel.Info, args });
  }

  warning(...args: Printable[]) {
    this.sink.log({ name: this.name, level: LogLevel.Warning, args });
  }

  error(...args: Printable[]) {
    this.sink.log({ name: this.name, level: LogLevel.Error, args });
  }
}

/**
 * The default log sink that logs to the console.
 * It formats the log events in a readable way.
 */
export class ConsoleLogSink implements ILogSink {
  log(event: LogEvent) {
    const parts = [
      this.printTimestamp(),
      this.printLevel(event.level),
      this.printName(event.name),
      this.printArgs(event.args),
    ];
    console.log(`%c${parts.join(" ")}`, this.getStyle(event.level));
  }

  private printTimestamp(): string {
    return new Date().toISOString();
  }

  private printName(name: string | undefined): string {
    return `[${name ?? "Logger"}]`;
  }

  private printLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.Debug:
        return "DEBUG";
      case LogLevel.Info:
        return " INFO";
      case LogLevel.Warning:
        return " WARN";
      case LogLevel.Error:
        return "ERROR";
    }
  }

  private printArgs(args: Printable[]): string {
    return args
      .map((arg) => {
        switch (typeof arg) {
          case "string":
            return arg;
          case "object":
            return JSON.stringify(arg);
          default:
            return String(arg);
        }
      })
      .join(" ");
  }

  private getStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.Debug:
        return "color: gray";
      case LogLevel.Info:
        return "color: blue";
      case LogLevel.Warning:
        return "color: yellow";
      case LogLevel.Error:
        return "color: red";
    }
  }
}

/**
 * A mock log sink that stores log events in memory.
 * This is useful if you want to test logging itself.
 */
export class MockLogSink implements ILogSink {
  events: LogEvent[] = [];

  log(event: LogEvent) {
    this.events.push(event);
  }
}

/**
 * A void log sink that does nothing.
 * This is useful if you want to disable logging.
 */
export class VoidLogSink implements ILogSink {
  log(_event: LogEvent) {
    // Do nothing
  }
}
