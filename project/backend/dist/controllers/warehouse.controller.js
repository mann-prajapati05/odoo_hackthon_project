import { warehouseService } from "../services/warehouse.service.js";
export const warehouseController = {
    async list(req, res) {
        const result = await warehouseService.list(req.query.search);
        res.status(200).json(result);
    },
    async create(req, res) {
        const result = await warehouseService.create(req.body);
        res.status(201).json(result);
    },
    async getById(req, res) {
        const id = String(req.params.id);
        const result = await warehouseService.getById(id);
        res.status(200).json(result);
    },
    async update(req, res) {
        const id = String(req.params.id);
        const result = await warehouseService.update(id, req.body);
        res.status(200).json(result);
    },
    async remove(req, res) {
        const id = String(req.params.id);
        const result = await warehouseService.remove(id);
        res.status(200).json(result);
    },
    async listLocations(req, res) {
        const id = String(req.params.id);
        const flat = req.query.flat === "true";
        const result = await warehouseService.listLocations(id, flat);
        res.status(200).json(result);
    },
    async createLocation(req, res) {
        const id = String(req.params.id);
        const result = await warehouseService.createLocation(id, req.body);
        res.status(201).json(result);
    },
    async updateLocation(req, res) {
        const id = String(req.params.id);
        const result = await warehouseService.updateLocation(id, req.body);
        res.status(200).json(result);
    },
    async deleteLocation(req, res) {
        const id = String(req.params.id);
        const result = await warehouseService.deleteLocation(id);
        res.status(200).json(result);
    },
};
