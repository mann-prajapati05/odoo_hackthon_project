import { operationService } from "../services/operation.service.js";
export const operationController = {
    async list(req, res) {
        const query = (res.locals.validatedQuery ?? req.query);
        const result = await operationService.list(query);
        res.status(200).json(result);
    },
    async counts(req, res) {
        const result = await operationService.counts(req.query.type);
        res.status(200).json(result);
    },
    async create(req, res) {
        const result = await operationService.create(req.body, req.user.id);
        res.status(201).json(result);
    },
    async getById(req, res) {
        const id = String(req.params.id);
        const result = await operationService.getById(id);
        res.status(200).json(result);
    },
    async update(req, res) {
        const id = String(req.params.id);
        const result = await operationService.update(id, req.body, req.user.id);
        res.status(200).json(result);
    },
    async patchStatus(req, res) {
        const id = String(req.params.id);
        const result = await operationService.patchStatus(id, req.body.status, req.user.id);
        res.status(200).json(result);
    },
    async validate(req, res) {
        const id = String(req.params.id);
        const result = await operationService.validate(id, req.user.id);
        res.status(200).json(result);
    },
    async cancel(req, res) {
        const id = String(req.params.id);
        const result = await operationService.cancel(id, req.user.id, req.body.reason);
        res.status(200).json(result);
    },
    async duplicate(req, res) {
        const id = String(req.params.id);
        const result = await operationService.duplicate(id, req.user.id);
        res.status(201).json(result);
    },
    async lockQuantities(req, res) {
        const id = String(req.params.id);
        const result = await operationService.lockQuantities(id, req.user.id);
        res.status(200).json(result);
    },
    async timeline(req, res) {
        const id = String(req.params.id);
        const result = await operationService.timeline(id);
        res.status(200).json(result);
    },
};
