import {
  type ClassMethodDecorator,
  mutateContextKey,
} from "../metadata/mod.ts";
import { MetadataDef } from "../core/common.ts";
import type { RouteDef, RouteHandler } from "./common.ts";

export const ROUTE_METADATA: MetadataDef<
  Record<string | symbol, RouteOptions>
> = new MetadataDef(Symbol("ddi.route"));

export type RouteOptions = {
  method: string | string[];
  pattern: URLPattern;
};

export const Route = <T, M extends RouteHandler>(
  method: string | string[],
  path: string | URLPattern,
): ClassMethodDecorator<T, M> =>
(handler, context) => {
  const pattern = typeof path === "string"
    ? new URLPattern({ pathname: path })
    : path;

  mutateContextKey(context, ROUTE_METADATA, (existing) => {
    const routes = existing ?? {};
    routes[context.name] = { pattern, method };
    return routes;
  });

  return handler;
};

export const withRoutes =
  (routes: RouteDef[], handler: Deno.ServeHandler): Deno.ServeHandler =>
  (request, info) => {
    for (const route of routes) {
      const match = route.pattern.exec(request.url);
      if (
        match &&
        (Array.isArray(route.method)
          ? route.method.includes(request.method)
          : request.method === (route.method ?? "GET"))
      ) {
        return route.handler(request, match, info);
      }
    }
    return handler(request, info);
  };
