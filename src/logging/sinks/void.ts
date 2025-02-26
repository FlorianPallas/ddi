import { Provides } from "../../core/decorators.ts";
import type { LogEvent } from "../common.ts";
import { ILogSink } from "../logger.ts";

/**
 * A void log sink that does nothing.
 * This is useful if you want to disable logging.
 */
@Provides(ILogSink)
export class VoidLogSink implements ILogSink {
  log(_event: LogEvent) {
    // Do nothing
  }
}
