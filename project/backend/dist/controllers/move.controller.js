import { moveService } from "../services/move.service.js";
export const moveController = {
    async list(req, res) {
        const query = {
            ...req.query,
            page: Number(req.query.page || 1),
            limit: Number(req.query.limit || 50),
            sortDir: req.query.sortDir || "desc",
        };
        if (req.query.format === "csv") {
            await moveService.exportCsv(query, res);
            return;
        }
        const result = await moveService.list(query);
        res.status(200).json(result);
    },
};
