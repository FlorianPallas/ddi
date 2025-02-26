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
