import type { App } from "../core/app.ts";
import { getMetadataKey } from "../metadata/utils.ts";
import { MIDDLEWARE_METADATA } from "./decorators.ts";

export type MiddlewareHandler = IMiddleware["onRequest"];

export interface IMiddleware {
  onRequest(
    request: Request,
    info: Deno.ServeHandlerInfo,
    next: Deno.ServeHandler,
  ): Response | Promise<Response>;
}

export function getMiddlewareHandler(
  app: App,
  handler: Deno.ServeHandler,
): Deno.ServeHandler {
  const middleware = app
    .getTypes()
    .map((type) => [type, getMetadataKey(type, MIDDLEWARE_METADATA)] as const)
    .filter(([, metadata]) => metadata !== undefined)
    .map(([type, metadata]) => {
      const instance = app.resolve<IMiddleware>(type);
      return {
        priority: metadata!.priority,
        handler: instance.onRequest.bind(instance),
      };
    })
    .sort((a, b) => a.priority - b.priority)
    .map((m) => m.handler);

  return wrap(middleware, handler);
}

function wrap(
  stack: MiddlewareHandler[],
  handler: Deno.ServeHandler,
): Deno.ServeHandler {
  const next = stack.pop();
  if (!next) {
    return handler;
  }
  return (req, info) => next(req, info, wrap(stack, handler));
}
