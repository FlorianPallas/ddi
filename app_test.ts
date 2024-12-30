import { Alias, App } from "./app.ts";
import { assertEquals } from "@std/assert";

Deno.test(function registerType() {
  const app = new App();

  class Foo {
    bar() {
      return "baz";
    }
  }

  app.register(Foo);

  assertEquals(app.resolve(Foo).bar(), "baz");
});

Deno.test(function registerTypeWithAlias() {
  const app = new App();

  interface IFoo {
    bar(): string;
  }
  const IFoo = new Alias<IFoo>("IFoo");

  class Foo implements IFoo {
    bar() {
      return "baz";
    }
  }

  app.register(Foo, IFoo);

  assertEquals(app.resolve(IFoo).bar(), "baz");
  assertEquals(app.resolve(Foo).bar(), "baz");
});

Deno.test(function registerValue() {
  // ---
  // Lets assume this is inaccessible code

  class PostgresClient<T extends string> {
    query(query: T) {
      console.log(query);
      return [{ name: "Jane" }];
    }
  }
  const postgres = new PostgresClient<"very complex type I want to preserve">();

  // ---

  const Database = new Alias<typeof postgres>("Database");

  const app = new App();
  app.registerValue(postgres, Database);

  assertEquals(app.resolve(Database), postgres);
  assertEquals(
    app.resolve(Database).query("very complex type I want to preserve"),
    [{ name: "Jane" }]
  );
});

Deno.test(function resolveAll() {
  interface IController {
    getRoutes(): string[];
  }

  class FooController implements IController {
    getRoutes() {
      return ["/foo"];
    }
  }

  class BarController implements IController {
    getRoutes() {
      return ["/bar"];
    }
  }

  const app = new App();

  app.register(FooController);
  app.register(BarController);

  const controllers = app.resolveAll<IController>("controller");

  assertEquals(controllers.length, 2);
  assertEquals(
    controllers.flatMap((c) => c.getRoutes()),
    ["/foo", "/bar"]
  );
});
