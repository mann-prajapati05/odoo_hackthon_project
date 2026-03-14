import type { Request, Response } from "express";

import { productService } from "../services/product.service.js";

export const productController = {
  async list(req: Request, res: Response) {
    const query = (res.locals.validatedQuery ?? req.query) as never;
    const result = await productService.list(query);
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const result = await productService.create(req.body, req.user!.id);
    res.status(201).json(result);
  },

  async getById(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await productService.getById(id);
    res.status(200).json(result);
  },

  async update(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await productService.update(id, req.body);
    res.status(200).json(result);
  },

  async remove(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await productService.remove(id);
    res.status(200).json(result);
  },

  async stock(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await productService.stock(
      id,
      req.query.locationId as string | undefined,
      req.query.warehouseId as string | undefined
    );
    res.status(200).json(result);
  },

  async stockHistory(req: Request, res: Response) {
    const id = String(req.params.id);
    const days = Number(req.query.days || 30);
    const result = await productService.stockHistory(id, days);
    res.status(200).json(result);
  },

  async importPreview(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      res.status(422).json({ error: "Validation failed", message: "File is required" });
      return;
    }
    const result = await productService.importPreview(file.buffer);
    res.status(200).json(result);
  },

  async importConfirm(req: Request, res: Response) {
    const result = await productService.importConfirm(req.body, req.user!.id);
    res.status(200).json(result);
  },

  async export(req: Request, res: Response) {
    await productService.exportCsv(req.query as never, res);
  },

  async categories(req: Request, res: Response) {
    const result = await productService.categories(
      req.query.search as string | undefined,
      (req.query.flat as string | undefined) === "true"
    );
    res.status(200).json(result);
  },

  async createCategory(req: Request, res: Response) {
    const result = await productService.createCategory(req.body);
    res.status(201).json(result);
  },
};
