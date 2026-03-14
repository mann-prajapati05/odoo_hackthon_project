import { ipKeyGenerator, rateLimit } from "express-rate-limit";
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests",
        message: "Too many auth requests, try again later",
    },
});
export const refreshLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests",
        message: "Too many refresh requests, try again shortly",
    },
});
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip || ""),
    message: {
        error: "Too many requests",
        message: "API request limit exceeded",
    },
});
