import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
const router = Router();
router.get("/kpis", dashboardController.kpis);
router.get("/recent-activity", dashboardController.recentActivity);
router.get("/low-stock", dashboardController.lowStock);
export default router;
