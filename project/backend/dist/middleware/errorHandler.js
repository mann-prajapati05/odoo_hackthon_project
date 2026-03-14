import { Prisma } from "@prisma/client";
import { logger } from "../lib/logger.js";
import { AppError } from "../types/index.js";
export const errorHandler = (err, req, res, _next) => {
    const requestMeta = {
        method: req.method,
        path: req.originalUrl,
    };
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            logger.warn("Prisma conflict", {
                ...requestMeta,
                code: err.code,
                message: err.message,
                meta: err.meta,
            });
            res.status(409).json({
                error: "Conflict",
                message: "A record with this value already exists",
            });
            return;
        }
        if (err.code === "P2025") {
            logger.warn("Prisma record not found", {
                ...requestMeta,
                code: err.code,
                message: err.message,
            });
            res.status(404).json({ error: "Not found", message: "Record not found" });
            return;
        }
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
        logger.error("Prisma validation error", {
            ...requestMeta,
            message: err.message,
            stack: err.stack,
        });
        res.status(400).json({
            error: "Bad request",
            message: "Invalid request for database query",
        });
        return;
    }
    if (err instanceof AppError) {
        const errorType = err.code === "Unauthorized"
            ? "Unauthorized"
            : err.statusCode === 403
                ? "Forbidden"
                : err.statusCode === 404
                    ? "Not found"
                    : err.statusCode === 409
                        ? "Conflict"
                        : err.statusCode === 422
                            ? "Validation failed"
                            : err.statusCode === 502
                                ? "Bad gateway"
                                : err.statusCode >= 500
                                    ? "Internal server error"
                                    : "Bad request";
        const payload = {
            error: errorType,
            message: err.message,
        };
        if (err.details !== undefined) {
            payload.details = err.details;
        }
        res.status(err.statusCode).json(payload);
        return;
    }
    const normalizedError = err instanceof Error
        ? {
            name: err.name,
            message: err.message,
            stack: err.stack,
        }
        : { value: String(err) };
    logger.error("Unhandled error", {
        ...requestMeta,
        err: normalizedError,
    });
    res.status(500).json({ error: "Internal server error", message: "Internal server error" });
};
