import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRouter from "./routes/auth.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import moveRouter from "./routes/move.routes.js";
import operationRouter from "./routes/operation.routes.js";
import productRouter from "./routes/product.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import userRouter from "./routes/user.routes.js";
import { locationRouter, warehouseRouter } from "./routes/warehouse.routes.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { productController } from "./controllers/product.controller.js";
import { validate } from "./middleware/validate.js";
import { categoryCreateSchema } from "./validators/product.validators.js";
const app = express();
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(apiLimiter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", authenticate, userRouter);
app.use("/api/v1/warehouses", authenticate, warehouseRouter);
app.use("/api/v1/locations", authenticate, locationRouter);
app.use("/api/v1/products", authenticate, productRouter);
app.get("/api/v1/categories", authenticate, productController.categories);
app.post("/api/v1/categories", authenticate, validate(categoryCreateSchema, "body"), productController.createCategory);
app.use("/api/v1/operations", authenticate, operationRouter);
app.use("/api/v1/move-history", authenticate, moveRouter);
app.use("/api/v1/dashboard", authenticate, dashboardRouter);
app.use("/api/v1/upload", authenticate, uploadRouter);
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});
app.use(errorHandler);
export default app;
