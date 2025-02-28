import type { App } from "../core/app.ts";
import { Alias, type Resolvable } from "../core/common.ts";
import { type LogEvent, LogLevel, type Printable } from "./common.ts";

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

  named(from: string | Resolvable): Logger {
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
