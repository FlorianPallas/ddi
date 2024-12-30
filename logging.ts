import { Alias, type App, type Type } from "./app.ts";
import type { Module } from "./mod.ts";

export enum LogLevel {
  Debug,
  Info,
  Warning,
  Error,
}

// deno-lint-ignore no-explicit-any
export type Printable = any;

export type LogEvent = {
  name?: string;
  level: LogLevel;
  args: Printable[];
};

export interface ILogSink {
  log(event: LogEvent): void;
}
export const ILogSink: Alias<ILogSink> = new Alias<ILogSink>("ILogSink");

export const loggingModule: Module = (app) => {
  app.register(ConsoleLogSink, ILogSink);
  app.register(Logger);
};

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
