import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
};
