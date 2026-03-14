import { productService } from "../services/product.service.js";
export const productController = {
    async list(req, res) {
        const query = (res.locals.validatedQuery ?? req.query);
        const result = await productService.list(query);
        res.status(200).json(result);
    },
    async create(req, res) {
        const result = await productService.create(req.body, req.user.id);
        res.status(201).json(result);
    },
    async getById(req, res) {
        const id = String(req.params.id);
        const result = await productService.getById(id);
        res.status(200).json(result);
    },
    async update(req, res) {
        const id = String(req.params.id);
        const result = await productService.update(id, req.body);
        res.status(200).json(result);
    },
    async remove(req, res) {
        const id = String(req.params.id);
        const result = await productService.remove(id);
        res.status(200).json(result);
    },
    async stock(req, res) {
        const id = String(req.params.id);
        const result = await productService.stock(id, req.query.locationId, req.query.warehouseId);
        res.status(200).json(result);
    },
    async stockHistory(req, res) {
        const id = String(req.params.id);
        const days = Number(req.query.days || 30);
        const result = await productService.stockHistory(id, days);
        res.status(200).json(result);
    },
    async importPreview(req, res) {
        const file = req.file;
        if (!file) {
            res.status(422).json({ error: "Validation failed", message: "File is required" });
            return;
        }
        const result = await productService.importPreview(file.buffer);
        res.status(200).json(result);
    },
    async importConfirm(req, res) {
        const result = await productService.importConfirm(req.body, req.user.id);
        res.status(200).json(result);
    },
    async export(req, res) {
        await productService.exportCsv(req.query, res);
    },
    async categories(req, res) {
        const result = await productService.categories(req.query.search, req.query.flat === "true");
        res.status(200).json(result);
    },
    async createCategory(req, res) {
        const result = await productService.createCategory(req.body);
        res.status(201).json(result);
    },
};
