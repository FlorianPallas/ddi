import { App } from "./app.ts";
import { assertEquals } from "@std/assert";
import { Provides } from "./decorators.ts";
import { Alias } from "./common.ts";
import { Metadata } from "../metadata/decorators.ts";

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

  @Provides(IFoo)
  class Foo implements IFoo {
    bar() {
      return "baz";
    }
  }

  app.register(Foo);

  assertEquals(app.resolve(IFoo).bar(), "baz");
  assertEquals(app.resolve(Foo).bar(), "baz");
});

Deno.test(function resolveByMetadata() {
  @Metadata("name", "foo")
  @Metadata("type", "service")
  class Foo {
    foo() {
      return "foo";
    }
  }

  @Metadata("name", "bar")
  @Metadata("type", "service")
  class Bar {
    bar() {
      return "bar";
    }
  }

  @Metadata("name", "baz")
  @Metadata("type", "controller")
  class Baz {
    baz() {
      return "baz";
    }
  }

  const app = new App();
  app.register(Foo);
  app.register(Bar);
  app.register(Baz);
});

// Deno.test(function registerValue() {
//   // ---
//   // Lets assume this is inaccessible code

//   class PostgresClient<T extends string> {
//     query(query: T) {
//       console.log(query);
//       return [{ name: "Jane" }];
//     }
//   }
//   const postgres = new PostgresClient<"very complex type I want to preserve">();

//   // ---

//   const Database = new Alias<typeof postgres>("Database");

//   const app = new App();
//   app.registerValue(postgres, Database);

//   assertEquals(app.resolve(Database), postgres);
//   assertEquals(
//     app.resolve(Database).query("very complex type I want to preserve"),
//     [{ name: "Jane" }]
//   );
// });
