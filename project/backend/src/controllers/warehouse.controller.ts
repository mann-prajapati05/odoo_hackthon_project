import type { Request, Response } from "express";

import { warehouseService } from "../services/warehouse.service.js";

export const warehouseController = {
  async list(req: Request, res: Response) {
    const result = await warehouseService.list(req.query.search as string | undefined);
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const result = await warehouseService.create(req.body);
    res.status(201).json(result);
  },

  async getById(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await warehouseService.getById(id);
    res.status(200).json(result);
  },

  async update(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await warehouseService.update(id, req.body);
    res.status(200).json(result);
  },

  async remove(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await warehouseService.remove(id);
    res.status(200).json(result);
  },

  async listLocations(req: Request, res: Response) {
    const id = String(req.params.id);
    const flat = (req.query.flat as string | undefined) === "true";
    const result = await warehouseService.listLocations(id, flat);
    res.status(200).json(result);
  },

  async createLocation(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await warehouseService.createLocation(id, req.body);
    res.status(201).json(result);
  },

  async updateLocation(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await warehouseService.updateLocation(id, req.body);
    res.status(200).json(result);
  },

  async deleteLocation(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await warehouseService.deleteLocation(id);
    res.status(200).json(result);
  },
};
