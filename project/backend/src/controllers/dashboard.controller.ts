import type { Request, Response } from "express";

import { dashboardService } from "../services/dashboard.service.js";

export const dashboardController = {
  async kpis(_req: Request, res: Response) {
    const result = await dashboardService.kpis();
    res.status(200).json(result);
  },

  async recentActivity(req: Request, res: Response) {
    const limit = Number(req.query.limit || 8);
    const result = await dashboardService.recentActivity(limit);
    res.status(200).json(result);
  },

  async lowStock(req: Request, res: Response) {
    const limit = Number(req.query.limit || 8);
    const result = await dashboardService.lowStock(limit);
    res.status(200).json(result);
  },
};
