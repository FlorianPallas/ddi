import { Provides } from "../../core/decorators.ts";
import type { LogEvent } from "../common.ts";
import { ILogSink } from "../logger.ts";

/**
 * A mock log sink that stores log events in memory.
 * This is useful if you want to test logging itself.
 */
@Provides(ILogSink)
export class MockLogSink implements ILogSink {
  events: LogEvent[] = [];

  log(event: LogEvent) {
    this.events.push(event);
  }
}
