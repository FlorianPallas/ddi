import { Provides } from "../../core/decorators.ts";
import { type LogEvent, LogLevel, type Printable } from "../common.ts";
import { ILogSink } from "../logger.ts";

/**
 * The default log sink that logs to the console.
 * It formats the log events in a readable way.
 */
@Provides(ILogSink)
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
