# DDI - Deno Dependency Injection

> A simple dependency injection library built for Deno.

[![JSR](https://jsr.io/badges/@fpallas/ddi)](https://jsr.io/@fpallas/ddi)
[![JSR Score](https://jsr.io/badges/@fpallas/ddi/score)](https://jsr.io/@fpallas/ddi)
[![JSR Scope](https://jsr.io/badges/@fpallas)](https://jsr.io/@fpallas)

---

This library provides a simple dependency injection container for Deno.
It also includes basic modules for logging and routing.
The library is designed with testability in mind.
By using aliases, you can easily define interfaces and swap implementations.

## Getting Started

```ts
import {
  App,
  loggingModule,
  RouteProvider,
  IController,
  Logger,
} from "@fpallas/ddi";
import { route, Route } from "@std/http/unstable-route";

class Service {
  private readonly logger: Logger;

  constructor(app: App) {
    this.logger = app.resolve(Logger).named(Service); // We can name our loggers
  }

  greet(name: string): string {
    this.logger.info(`Greeting ${name}!`);
    return `Hello, ${name}!`;
  }
}

class Controller implements IController {
  private readonly service: Service;

  constructor(app: App) {
    this.service = app.resolve(Service);
  }

  getRoutes(): Route[] {
    return [
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/hello/:name" }),
        handler: (_req, info) =>
          new Response(this.service.greet(info?.pathname.groups.name)),
      },
    ];
  }
}

const app = new App();

// Let's use the included logging module
app.use(loggingModule);

// Let's register our classes
app.register(Service);
app.register(Controller);

// The RouteProvider aggregates all controllers and provides their routes.
// This is also necessary to instantiate all controllers, as they are resolved lazily.
app.register(RouteProvider);
const routes = app.resolve(RouteProvider).getRoutes();

// Now we can use the routes to serve them with Deno
function defaultHandler(_req: Request) {
  return new Response("Not found", { status: 404 });
}

export default {
  fetch: route(routes, defaultHandler),
} satisfies Deno.ServeDefaultExport;
```
