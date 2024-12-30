import type { Route } from "@std/http/unstable-route";
import { Logger, type App } from "./mod.ts";

export interface IController {
  getRoutes(): Route[];
}

export class RouteProvider implements IController {
  private readonly logger: Logger;
  private readonly controllers: IController[];

  constructor(app: App) {
    this.logger = app.resolve(Logger).named(RouteProvider);
    this.controllers = app.resolveAll<IController>("controller");
  }

  getRoutes(): Route[] {
    const routes = this.controllers.flatMap((c) => c.getRoutes());
    routes.forEach((route) =>
      this.logger.debug(
        "Discovered route:",
        route.method,
        route.pattern.pathname
      )
    );
    return routes;
  }
}
