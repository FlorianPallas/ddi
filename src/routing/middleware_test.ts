// deno-lint-ignore-file
import { assertEquals } from "@std/assert/equals";
import { App } from "../core/app.ts";
import { Logger } from "../logging/logger.ts";
import { MockLogSink } from "../logging/sinks/mod.ts";
import { type IMiddleware, Middleware, WithMiddleware } from "./middleware.ts";
import { RouteHandler } from "./common.ts";
import { Controller } from "./controller.ts";
import { Route } from "./route.ts";

@Middleware({ priority: 1000 })
class LogMiddleware implements IMiddleware {
  #logger: Logger;

  constructor(app: App) {
    this.#logger = app.resolve(Logger).named(LogMiddleware);
  }

  onRequest(
    next: RouteHandler,
    request: Request,
    params?: URLPatternResult,
    info?: Deno.ServeHandlerInfo,
  ): Response | Promise<Response> {
    this.#logger.debug(`${request.method} ${request.url}`, request.headers);
    return next(request, params, info);
  }
}

@Middleware()
class AuthMiddleware implements IMiddleware {
  onRequest(
    next: RouteHandler,
    request: Request,
    params?: URLPatternResult,
    info?: Deno.ServeHandlerInfo,
  ): Response | Promise<Response> {
    const role = request.headers.get("authorization");
    if (role !== "admin") {
      return new Response("Unauthorized", { status: 401 });
    }
    return next(request, params, info);
  }
}

@Controller()
@WithMiddleware(AuthMiddleware)
@WithMiddleware(LogMiddleware)
class TestController {
  @Route("GET", "/")
  foo() {
    return new Response("OK");
  }
}

Deno.test(async function middleware() {
  const app = new App({ LogSink: MockLogSink });
  app.register(LogMiddleware);
  app.register(AuthMiddleware);
  app.register(TestController);

  const handler = app.serve();

  assertEquals(
    (await handler(new Request("http://localhost/"), {} as any)).status,
    401,
  );
  assertEquals(app.resolve(MockLogSink).events.length, 1);

  assertEquals(
    (await handler(new Request("http://localhost/"), {} as any)).status,
    401,
  );
  assertEquals(app.resolve(MockLogSink).events.length, 2);

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
  assertEquals(app.resolve(MockLogSink).events.length, 3);
});
