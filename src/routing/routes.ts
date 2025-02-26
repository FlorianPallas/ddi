import { route } from "@std/http/unstable-route";
import type { App } from "../core/app.ts";
import { getMetadataKey } from "../metadata/utils.ts";
import { CONTROLLER_METADATA } from "./decorators.ts";

export function getRoutingHandler(
  app: App,
): Deno.ServeHandler {
  const routes = app
    .getTypes()
    .map((type) => [type, getMetadataKey(type, CONTROLLER_METADATA)] as const)
    .filter(([, metadata]) => metadata !== undefined)
    .flatMap(([type, metadata]) => {
      const instance = app.resolve<unknown>(type);
      return metadata!.routes.map((route) => ({
        ...route,
        handler: route.handler.bind(instance),
      }));
    });

  return route(routes, () => new Response("Not Found", { status: 404 }));
}
