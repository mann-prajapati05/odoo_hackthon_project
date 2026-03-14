import jwt from "jsonwebtoken";
import { AppError } from "../types/index.js";
export const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
        next(new AppError("Invalid or expired token", 401, "Unauthorized"));
        return;
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "");
        req.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    }
    catch {
        next(new AppError("Invalid or expired token", 401, "Unauthorized"));
    }
};
