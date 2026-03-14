import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Redis = require("ioredis") as {
  new (url: string, options?: Record<string, unknown>): {
    connect: () => Promise<unknown>;
    ping: () => Promise<string>;
    on: (event: string, handler: (...args: unknown[]) => void) => unknown;
    set: (...args: unknown[]) => Promise<unknown>;
    get: (key: string) => Promise<string | null>;
    del: (...keys: string[]) => Promise<number>;
    sadd: (key: string, ...members: string[]) => Promise<number>;
    srem: (key: string, ...members: string[]) => Promise<number>;
    disconnect: () => void;
  };
};

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

redis.on("error", () => {
  // Connection issues are handled by bootstrap and retried by ioredis.
});
