// deno-lint-ignore-file
import { assertEquals } from "@std/assert";
import { HTTP } from "./mod.ts";
import { App } from "../core/app.ts";
import { getRoutingHandler } from "./routes.ts";

Deno.test(async function routing() {
  class FooController {
    #response: string = "foo";

    @HTTP.Get("/foo")
    foo() {
      return new Response(this.#response);
    }
  }

  class BarController {
    @HTTP.Post("/bar")
    bar() {
      return new Response("bar");
    }
  }

  const app = new App();

  app.register(FooController);
  app.register(BarController);

  const handler = getRoutingHandler(app);

  assertEquals(
    await (await handler(new Request("http://localhost/baz"), {} as any))
      .text(),
    "Not Found",
  );

  assertEquals(
    await (await handler(new Request("http://localhost/foo"), {} as any))
      .text(),
    "foo",
  );

  assertEquals(
    await (await handler(
      new Request("http://localhost/bar", { method: "POST" }),
      {} as any,
    ))
      .text(),
    "bar",
  );
});
