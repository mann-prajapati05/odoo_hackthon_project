import { format } from "fast-csv";
import { prisma } from "../lib/prisma.js";
const buildWhere = (query) => ({
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.direction ? { direction: query.direction } : {}),
    ...(query.movedById ? { movedById: query.movedById } : {}),
    ...(query.locationId
        ? {
            OR: [{ fromLocationId: query.locationId }, { toLocationId: query.locationId }],
        }
        : {}),
    ...(query.warehouseId
        ? {
            OR: [
                { fromLocation: { warehouseId: query.warehouseId } },
                { toLocation: { warehouseId: query.warehouseId } },
            ],
        }
        : {}),
    ...(query.operationType ? { operation: { type: query.operationType } } : {}),
    ...(query.search
        ? {
            OR: [
                { operation: { refNumber: { contains: query.search, mode: "insensitive" } } },
                { product: { name: { contains: query.search, mode: "insensitive" } } },
                { product: { sku: { contains: query.search, mode: "insensitive" } } },
            ],
        }
        : {}),
    ...(query.fromDate || query.toDate
        ? {
            movedAt: {
                ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
                ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
            },
        }
        : {}),
});
export const moveService = {
    async list(query) {
        const where = buildWhere(query);
        const [total, rows] = await Promise.all([
            prisma.stockMove.count({ where }),
            prisma.stockMove.findMany({
                where,
                include: {
                    product: { select: { id: true, name: true, sku: true, uom: true } },
                    fromLocation: { select: { id: true, name: true, warehouse: { select: { name: true } } } },
                    toLocation: { select: { id: true, name: true, warehouse: { select: { name: true } } } },
                    operation: { select: { id: true, refNumber: true, type: true } },
                    movedBy: { select: { id: true, name: true } },
                },
                orderBy: { movedAt: query.sortDir },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
        ]);
        return {
            data: rows,
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    },
    async exportCsv(query, res) {
        const where = buildWhere(query);
        const rows = await prisma.stockMove.findMany({
            where,
            include: {
                product: { select: { name: true, sku: true } },
                fromLocation: { select: { name: true } },
                toLocation: { select: { name: true } },
                operation: { select: { refNumber: true, type: true } },
                movedBy: { select: { name: true } },
            },
            orderBy: { movedAt: query.sortDir },
        });
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="move-history.csv"');
        const csvStream = format({ headers: true });
        csvStream.pipe(res);
        for (const row of rows) {
            csvStream.write({
                date: row.movedAt.toISOString(),
                refNumber: row.operation?.refNumber || "",
                type: row.operation?.type || "",
                product: row.product.name,
                sku: row.product.sku,
                fromLocation: row.fromLocation?.name || "",
                toLocation: row.toLocation?.name || "",
                qty: row.qty,
                direction: row.direction,
                movedBy: row.movedBy.name,
            });
        }
        csvStream.end();
    },
};
