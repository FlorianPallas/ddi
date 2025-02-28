export type RouteHandler = (
  request: Request,
  params?: URLPatternResult,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response>;

export type RouteKey = string | symbol;

export interface RouteDef {
  pattern: URLPattern;
  method?: string | string[];
  handler: RouteHandler;
}
