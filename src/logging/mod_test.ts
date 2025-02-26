import { assertArrayIncludes } from "@std/assert";
import { Logger, MockLogSink } from "./mod.ts";
import { App } from "../core/app.ts";
import { LogLevel } from "./common.ts";

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
        .join("\n"),
    );
  }
}

Deno.test(function addTest() {
  const app = new App();
  app.register(Logger);
  app.register(MockLogSink);
  app.register(UserRepository);
  app.register(UserService);

  const userService = app.resolve(UserService);
  userService.greetAllUsers();

  assertArrayIncludes(app.resolve(MockLogSink).events, [
    { name: "UserService", args: ["Hello Jane"], level: LogLevel.Debug },
  ]);
});
