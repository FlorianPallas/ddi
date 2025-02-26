import type z from "zod";

export class ConfigService {
  // deno-lint-ignore no-explicit-any
  private config: any = {};

  constructor() {
    const input = Deno.env.toObject();

    for (const [key, value] of Object.entries(input)) {
      const path = key.split(".");
      const name = path.pop();

      // this is only the case if the key is empty
      if (!name) {
        continue;
      }

      let node = this.config;
      for (const segment of path) {
        if (!node[segment]) {
          node[segment] = {};
        }
        node = node[segment];
      }

      node[name] = value;
    }
  }

  get<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
    return schema.parse(this.config);
  }
}
