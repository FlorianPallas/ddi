import { assertEquals } from "@std/assert";
import { getMetadataKey } from "../metadata/mod.ts";
import { Provides, PROVIDES_METADATA } from "./decorators.ts";
import { App } from "./app.ts";
import { Alias } from "./common.ts";

Deno.test(function provides() {
  interface IFoo {
    foo(): string;
  }

  const IFoo = new Alias<IFoo>("IFoo");

  // Since `Foo` implements `IFoo`, it can be used to resolve it.

  @Provides(IFoo)
  class Foo implements IFoo {
    foo() {
      return "foo";
    }
  }

  assertEquals(getMetadataKey(Foo, PROVIDES_METADATA), [IFoo]);

  const app = new App();
  app.register(Foo);

  assertEquals(app.resolve(Foo).foo(), "foo");
  assertEquals(app.resolve(IFoo).foo(), "foo");

  // Since `Bar` does not implement `IFoo`, the decorator can not be applied.

  // @Provides(IFoo)
  // class Bar {
  //   bar() {
  //     return "bar";
  //   }
  // }
});
