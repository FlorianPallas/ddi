// deno-lint-ignore-file
import { assertEquals } from "@std/assert";
import { Controller } from "./mod.ts";
import { App } from "../core/app.ts";
import { Route } from "./route.ts";

Deno.test(async function routing() {
  @Controller()
  class FooController {
    #response: string = "foo";

    @Route("GET", "/foo")
    foo() {
      return new Response(this.#response);
    }
  }

  @Controller()
  class BarController {
    @Route("POST", "/bar")
    bar() {
      return new Response("bar");
    }
  }

  const app = new App();

  app.register(FooController);
  app.register(BarController);

  const handler = app.serve();

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
