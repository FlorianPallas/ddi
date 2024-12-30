import { ILogSink, Logger, type LogEvent, LogLevel } from "./logging.ts";
import { App } from "./app.ts";
import { assertArrayIncludes, assertEquals } from "@std/assert";

class UserRepository {
  getUsers() {
    return [{ name: "Jane" }];
  }
}

class UserService {
  private readonly userRepository: UserRepository;
  private readonly logger: Logger;

  constructor(app: App) {
    this.userRepository = app.resolve(UserRepository);
    this.logger = app.resolve(Logger).named(UserService);
  }

  greetAllUsers() {
    this.logger.debug(
      this.userRepository
        .getUsers()
        .map((user) => `Hello ${user.name}`)
        .join("\n")
    );
  }
}

class MockLogSink implements ILogSink {
  events: LogEvent[] = [];

  log(event: LogEvent) {
    this.events.push(event);
  }
}

Deno.test(function addTest() {
  const app = new App();

  // Logging
  app.register(MockLogSink, ILogSink);
  const mockLogSink = app.resolve(MockLogSink);

  // Registered alias should resolve to the same instance
  assertEquals(app.resolve(MockLogSink), app.resolve(ILogSink));

  app.register(Logger);

  // System Under Test
  app.register(UserRepository);
  app.register(UserService);

  const userService = app.resolve(UserService);
  userService.greetAllUsers();

  assertArrayIncludes(mockLogSink.events, [
    { name: "UserService", args: ["Hello Jane"], level: LogLevel.Debug },
  ]);
});
