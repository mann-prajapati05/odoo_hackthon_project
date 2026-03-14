import type { Request, Response } from "express";

import { moveService } from "../services/move.service.js";

export const moveController = {
  async list(req: Request, res: Response) {
    const query = {
      ...req.query,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50),
      sortDir: (req.query.sortDir as "asc" | "desc") || "desc",
    } as never;

    if ((req.query.format as string | undefined) === "csv") {
      await moveService.exportCsv(query, res);
      return;
    }

    const result = await moveService.list(query);
    res.status(200).json(result);
  },
};
