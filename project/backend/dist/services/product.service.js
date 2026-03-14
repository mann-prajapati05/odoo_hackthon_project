import csvParser from "csv-parser";
import { format } from "fast-csv";
import { Readable } from "node:stream";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/index.js";
import { stockService } from "./stock.service.js";
const computeStock = (product) => {
    const qtyOnHand = product.stockLevels.reduce((sum, item) => sum + item.qtyOnHand, 0);
    const qtyReserved = product.stockLevels.reduce((sum, item) => sum + item.qtyReserved, 0);
    const qtyAvailable = qtyOnHand - qtyReserved;
    const reorderMin = product.reorderMin ?? 0;
    const stockStatus = qtyOnHand === 0 ? "out" : qtyOnHand <= reorderMin ? "low" : "in";
    return { qtyOnHand, qtyReserved, qtyAvailable, stockStatus };
};
export const productService = {
    async list(params) {
        const where = {
            ...(params.categoryId ? { categoryId: params.categoryId } : {}),
            ...(params.search
                ? {
                    OR: [
                        { name: { contains: params.search, mode: "insensitive" } },
                        { sku: { contains: params.search, mode: "insensitive" } },
                    ],
                }
                : {}),
        };
        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true } },
                    stockLevels: {
                        where: params.warehouseId
                            ? { location: { warehouseId: params.warehouseId } }
                            : undefined,
                        include: {
                            location: { select: { id: true, name: true, warehouseId: true } },
                        },
                    },
                },
                orderBy: params.sortBy === "stock"
                    ? { createdAt: params.sortDir }
                    : { [params.sortBy]: params.sortDir },
                skip: (params.page - 1) * params.limit,
                take: params.limit,
            }),
        ]);
        const mapped = products
            .map((item) => {
            const stock = computeStock(item);
            return {
                id: item.id,
                name: item.name,
                sku: item.sku,
                uom: item.uom,
                description: item.description,
                imageUrl: item.imageUrl,
                reorderEnabled: item.reorderEnabled,
                reorderMin: item.reorderMin,
                reorderQty: item.reorderQty,
                category: item.category,
                ...stock,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        })
            .filter((item) => (params.stockStatus ? item.stockStatus === params.stockStatus : true));
        return {
            data: mapped,
            meta: {
                total,
                page: params.page,
                limit: params.limit,
                totalPages: Math.ceil(total / params.limit),
            },
        };
    },
    async create(input, userId) {
        const skuExists = await prisma.product.findUnique({ where: { sku: input.sku } });
        if (skuExists) {
            throw new AppError("A record with this value already exists", 409, "Conflict");
        }
        if ((input.initialQty ?? 0) > 0 && !input.initialLocationId) {
            throw new AppError("initialLocationId is required when initialQty > 0", 422, "Validation failed");
        }
        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name: input.name,
                    sku: input.sku,
                    categoryId: input.categoryId,
                    uom: input.uom,
                    description: input.description,
                    imageUrl: input.imageUrl,
                    reorderEnabled: input.reorderEnabled ?? false,
                    reorderMin: input.reorderMin,
                    reorderQty: input.reorderQty,
                },
                include: { category: { select: { id: true, name: true } }, stockLevels: true },
            });
            if ((input.initialQty ?? 0) > 0 && input.initialLocationId) {
                await stockService.upsertStockLevel(tx, product.id, input.initialLocationId, input.initialQty || 0, 0);
                await stockService.createMove(tx, {
                    operationId: null,
                    productId: product.id,
                    fromLocationId: null,
                    toLocationId: input.initialLocationId,
                    qty: input.initialQty || 0,
                    direction: "ADJUSTMENT",
                    movedById: userId,
                });
            }
            const fresh = await tx.product.findUniqueOrThrow({
                where: { id: product.id },
                include: {
                    category: { select: { id: true, name: true } },
                    stockLevels: true,
                },
            });
            const stock = computeStock(fresh);
            return { ...fresh, ...stock };
        });
        return result;
    },
    async getById(id) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true } },
                stockLevels: {
                    include: {
                        location: {
                            select: {
                                id: true,
                                name: true,
                                shortCode: true,
                                warehouse: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!product) {
            throw new AppError("Not found", 404, "Not found");
        }
        const base = computeStock(product);
        return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            uom: product.uom,
            description: product.description,
            imageUrl: product.imageUrl,
            reorderEnabled: product.reorderEnabled,
            reorderMin: product.reorderMin,
            reorderQty: product.reorderQty,
            category: product.category,
            ...base,
            stockLevels: product.stockLevels.map((level) => ({
                id: level.id,
                qtyOnHand: level.qtyOnHand,
                qtyReserved: level.qtyReserved,
                qtyAvailable: level.qtyOnHand - level.qtyReserved,
                location: level.location,
            })),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    },
    async update(id, input) {
        const updated = await prisma.product.update({
            where: { id },
            data: input,
            include: { category: { select: { id: true, name: true } }, stockLevels: true },
        });
        const stock = computeStock(updated);
        return { ...updated, ...stock };
    },
    async remove(id) {
        const hasStock = await prisma.stockLevel.findFirst({
            where: { productId: id, qtyOnHand: { gt: 0 } },
            select: { id: true },
        });
        if (hasStock) {
            throw new AppError("Cannot delete product with existing stock", 409, "Conflict");
        }
        await prisma.product.delete({ where: { id } });
        return { message: "Deleted" };
    },
    async stock(id, locationId, warehouseId) {
        const data = await prisma.stockLevel.findMany({
            where: {
                productId: id,
                ...(locationId ? { locationId } : {}),
                ...(warehouseId ? { location: { warehouseId } } : {}),
            },
            include: {
                location: { include: { warehouse: { select: { id: true, name: true } } } },
            },
        });
        return {
            data: data.map((level) => ({
                id: level.id,
                qtyOnHand: level.qtyOnHand,
                qtyReserved: level.qtyReserved,
                qtyAvailable: level.qtyOnHand - level.qtyReserved,
                location: {
                    id: level.location.id,
                    name: level.location.name,
                    shortCode: level.location.shortCode,
                    warehouse: level.location.warehouse,
                },
            })),
        };
    },
    async stockHistory(id, days) {
        const maxDays = Math.min(days || 30, 90);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - maxDays + 1);
        const moves = await prisma.stockMove.findMany({
            where: { productId: id, movedAt: { gte: fromDate } },
            orderBy: { movedAt: "asc" },
        });
        const perDay = new Map();
        for (const move of moves) {
            const key = move.movedAt.toISOString().slice(0, 10);
            let delta = move.qty;
            if (move.direction === "OUT") {
                delta = -move.qty;
            }
            perDay.set(key, (perDay.get(key) || 0) + delta);
        }
        let running = 0;
        const data = [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, delta]) => {
            running += delta;
            return { date, qty: running };
        });
        return { data };
    },
    async importPreview(fileBuffer) {
        const rows = [];
        await new Promise((resolve, reject) => {
            Readable.from(fileBuffer)
                .pipe(csvParser())
                .on("data", (row) => rows.push(row))
                .on("end", () => resolve())
                .on("error", reject);
        });
        const preview = [];
        let newCount = 0;
        let updateCount = 0;
        let errorCount = 0;
        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            if (!row) {
                continue;
            }
            const name = row.name || "";
            const sku = row.sku || "";
            const uom = row.uom || "";
            if (!name || !sku || !uom) {
                errorCount += 1;
                preview.push({ rowIndex: i + 1, name, sku, status: "error", error: "Missing required columns" });
                continue;
            }
            const exists = await prisma.product.findUnique({ where: { sku } });
            if (exists) {
                updateCount += 1;
                preview.push({ rowIndex: i + 1, name, sku, status: "update", error: null });
            }
            else {
                newCount += 1;
                preview.push({ rowIndex: i + 1, name, sku, status: "new", error: null });
            }
        }
        return {
            rows: preview,
            summary: { new: newCount, update: updateCount, errors: errorCount },
        };
    },
    async importConfirm(payload, userId) {
        let imported = 0;
        let updated = 0;
        let failed = 0;
        const errors = [];
        await prisma.$transaction(async (tx) => {
            for (const index of payload.selectedRowIndexes) {
                const row = payload.rows[index - 1];
                if (!row)
                    continue;
                try {
                    let categoryId;
                    if (row.category) {
                        const category = (await tx.category.findFirst({ where: { name: row.category } })) ||
                            (await tx.category.create({ data: { name: row.category } }));
                        categoryId = category.id;
                    }
                    const existing = await tx.product.findUnique({ where: { sku: row.sku } });
                    const product = await tx.product.upsert({
                        where: { sku: row.sku },
                        update: { name: row.name, uom: row.uom, categoryId },
                        create: { name: row.name, sku: row.sku, uom: row.uom, categoryId },
                    });
                    if (existing)
                        updated += 1;
                    else
                        imported += 1;
                    if ((row.initial_qty || 0) > 0 && row.location_shortcode) {
                        const location = await tx.location.findFirst({ where: { shortCode: row.location_shortcode } });
                        if (!location) {
                            throw new Error(`Location shortcode ${row.location_shortcode} not found`);
                        }
                        await stockService.upsertStockLevel(tx, product.id, location.id, row.initial_qty || 0);
                        await stockService.createMove(tx, {
                            operationId: null,
                            productId: product.id,
                            fromLocationId: null,
                            toLocationId: location.id,
                            qty: row.initial_qty || 0,
                            direction: "ADJUSTMENT",
                            movedById: userId,
                        });
                    }
                }
                catch (error) {
                    failed += 1;
                    errors.push({ sku: row.sku, reason: error.message });
                }
            }
        });
        return { imported, updated, failed, errors };
    },
    async exportCsv(params, res) {
        const list = await this.list(params);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="products-export.csv"');
        const csvStream = format({ headers: true });
        csvStream.pipe(res);
        for (const row of list.data) {
            csvStream.write({
                name: row.name,
                sku: row.sku,
                category: row.category?.name || "",
                uom: row.uom,
                qtyOnHand: row.qtyOnHand,
                qtyReserved: row.qtyReserved,
                stockStatus: row.stockStatus,
                reorderMin: row.reorderMin || 0,
                reorderQty: row.reorderQty || 0,
            });
        }
        csvStream.end();
    },
    async categories(search, flat) {
        const categories = await prisma.category.findMany({
            where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
            orderBy: { name: "asc" },
        });
        if (flat) {
            return { data: categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId })) };
        }
        const map = new Map();
        const roots = [];
        for (const c of categories) {
            map.set(c.id, { id: c.id, name: c.name, parentId: c.parentId, children: [] });
        }
        for (const c of categories) {
            const node = map.get(c.id);
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId).children.push(node);
            }
            else {
                roots.push(node);
            }
        }
        return { data: roots };
    },
    async createCategory(input) {
        return prisma.category.create({ data: input });
    },
};
