import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validate = (schema: ZodSchema, target: "body" | "query" | "params") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      res.status(422).json({
        error: "Validation failed",
        issues: result.error.flatten().fieldErrors,
      });
      return;
    }

    if (target === "query") {
      res.locals.validatedQuery = result.data;
    } else if (target === "params") {
      Object.assign(req.params as Record<string, string>, result.data as Record<string, string>);
    } else {
      req.body = result.data;
    }

    next();
  };
};
