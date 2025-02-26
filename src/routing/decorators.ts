import type { Handler, Route } from "@std/http/unstable-route";
import type { ClassMethodDecorator } from "../metadata/mod.ts";
import { MetadataDef } from "../core/common.ts";
import {
  type ClassDecorator,
  mutateContextKey,
  setContextKey,
} from "../metadata/utils.ts";
import type { IMiddleware } from "./middleware.ts";

export const CONTROLLER_METADATA: MetadataDef<{
  routes: Route[];
}> = new MetadataDef(Symbol("ddi:serve:controller"));

export const RouteDecorator = (method: string) =>
<T, M extends Handler>(
  path: string | URLPattern,
): ClassMethodDecorator<T, M> =>
(handler, context) => {
  const pattern = typeof path === "string"
    ? new URLPattern({ pathname: path })
    : path;

  mutateContextKey(context, CONTROLLER_METADATA, (existing) => {
    const routes = existing?.routes || [];
    routes.push({ pattern, method, handler });
    return { ...existing, routes };
  });

  return handler;
};

export const HTTP: {
  [
    K in
      | "Get"
      | "Post"
      | "Put"
      | "Patch"
      | "Delete"
      | "Head"
      | "Options"
      | "Connect"
      | "Trace"
  ]: <T, M extends Handler>(
    path: string | URLPattern,
  ) => ClassMethodDecorator<T, M>;
} = {
  Get: RouteDecorator("GET"),
  Post: RouteDecorator("POST"),
  Put: RouteDecorator("PUT"),
  Patch: RouteDecorator("PATCH"),
  Delete: RouteDecorator("DELETE"),
  Head: RouteDecorator("HEAD"),
  Options: RouteDecorator("OPTIONS"),
  Connect: RouteDecorator("CONNECT"),
  Trace: RouteDecorator("TRACE"),
};

export const MIDDLEWARE_METADATA: MetadataDef<{ priority: number }> =
  new MetadataDef(
    Symbol("ddi.serve.middleware"),
  );

export const Middleware =
  (priority?: number): ClassDecorator<IMiddleware> =>
  (target, context: ClassDecoratorContext) => {
    setContextKey(context, MIDDLEWARE_METADATA, { priority: priority ?? 0 });
    return target;
  };
