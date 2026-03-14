import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Redis = require("ioredis");
export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
});
redis.on("error", () => {
    // Connection issues are handled by bootstrap and retried by ioredis.
});
