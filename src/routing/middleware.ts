import { MetadataDef, type Resolvable } from "../core/common.ts";
import { TypedMetadata } from "../metadata/decorators.ts";
import { type ClassDecorator, mutateContextKey } from "../metadata/utils.ts";
import type { RouteHandler, RouteKey } from "./common.ts";

export const DEFAULT_OPTIONS: MiddlewareOptions = {
  priority: 0,
  global: false,
};

export type MiddlewareOptions = {
  priority: number;
  global: boolean;
};

export const MIDDLEWARE_METADATA: MetadataDef<MiddlewareOptions> =
  new MetadataDef(Symbol("ddi.stereotypes.middleware"));

export const Middleware = (
  options?: Partial<MiddlewareOptions>,
): ClassDecorator<IMiddleware> =>
  TypedMetadata(MIDDLEWARE_METADATA, { ...DEFAULT_OPTIONS, ...options });

export interface IMiddleware {
  onRequest: (
    next: RouteHandler,
    request: Request,
    params?: URLPatternResult,
    info?: Deno.ServeHandlerInfo,
  ) => Response | Promise<Response>;
}

export const withMiddleware = (
  middleware: IMiddleware[],
  handler: RouteHandler,
): RouteHandler => applyMiddleware(middleware.toReversed(), 0, handler);

function applyMiddleware(
  middleware: IMiddleware[],
  cursor: number,
  handler: RouteHandler,
): RouteHandler {
  const instance = middleware[cursor];
  if (!instance) {
    return handler;
  }
  return (req, info) =>
    instance.onRequest(
      applyMiddleware(middleware, cursor + 1, handler),
      req,
      info,
    );
}

export const WITH_MIDDLEWARE_METADATA: MetadataDef<
  {
    controller: Resolvable<IMiddleware>[];
    perRoute: Record<RouteKey, Resolvable<IMiddleware>[]>;
  }
> = new MetadataDef(Symbol("ddi.withMiddleware"));

export const WithMiddleware = <T>(middleware: Resolvable<T>) =>
(
  // only allow the decorator to be applied if the type is actually a middleware
  target: T extends IMiddleware ? any : never,
  context: ClassDecoratorContext | ClassMethodDecoratorContext,
) => {
  mutateContextKey(context, WITH_MIDDLEWARE_METADATA, (existing) => {
    const data = existing ?? { controller: [], perRoute: {} };

    if (context.kind === "class") {
      data.controller.push(middleware);
    }

    if (context.kind === "method") {
      const perRoute = data.perRoute[context.name] ?? [];
      perRoute.push(middleware);
      data.perRoute[context.name] = perRoute;
    }

    return data;
  });
  return target;
};
