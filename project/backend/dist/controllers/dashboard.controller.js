import { dashboardService } from "../services/dashboard.service.js";
export const dashboardController = {
    async kpis(_req, res) {
        const result = await dashboardService.kpis();
        res.status(200).json(result);
    },
    async recentActivity(req, res) {
        const limit = Number(req.query.limit || 8);
        const result = await dashboardService.recentActivity(limit);
        res.status(200).json(result);
    },
    async lowStock(req, res) {
        const limit = Number(req.query.limit || 8);
        const result = await dashboardService.lowStock(limit);
        res.status(200).json(result);
    },
};
