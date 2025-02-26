// deno-lint-ignore-file
import { assertEquals } from "@std/assert/equals";
import { App } from "../core/app.ts";
import { Logger } from "../logging/logger.ts";
import { MockLogSink } from "../logging/sinks/mod.ts";
import { Middleware } from "./decorators.ts";
import { getMiddlewareHandler, type IMiddleware } from "./middleware.ts";

@Middleware(1000) // always run first
class LogMiddleware implements IMiddleware {
  #logger: Logger;

  constructor(app: App) {
    this.#logger = app.resolve(Logger).named(LogMiddleware);
  }

  onRequest(
    request: Request,
    info: Deno.ServeHandlerInfo,
    next: Deno.ServeHandler,
  ): Response | Promise<Response> {
    this.#logger.debug(`${request.method} ${request.url}`, request.headers);
    return next(request, info);
  }
}

@Middleware()
class AuthMiddleware implements IMiddleware {
  onRequest(
    request: Request,
    info: Deno.ServeHandlerInfo,
    next: Deno.ServeHandler,
  ): Response | Promise<Response> {
    const role = request.headers.get("authorization");
    if (role !== "admin") {
      return new Response("Unauthorized", { status: 401 });
    }
    return next(request, info);
  }
}

Deno.test(async function middleware() {
  const app = new App();

  app.register(MockLogSink);
  app.register(Logger);
  app.register(LogMiddleware);
  app.register(AuthMiddleware);

  const handler = getMiddlewareHandler(app, () => new Response("OK"));

  assertEquals(
    (await handler(new Request("http://localhost/"), {} as any)).status,
    401,
  );
  assertEquals(app.resolve(MockLogSink).events.length, 1);

  assertEquals(
    (
      await handler(
        new Request("http://localhost/", {
          headers: { authorization: "admin" },
        }),
        {} as any,
      )
    ).status,
    200,
  );
  assertEquals(app.resolve(MockLogSink).events.length, 2);
});
