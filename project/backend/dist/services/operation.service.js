import { OperationStatus, OperationType, Prisma, StockMoveDirection, } from "@prisma/client";
import { REF_PREFIX, VIRTUAL_CUSTOMER_LOCATION_SHORT_CODE, VIRTUAL_VENDOR_LOCATION_SHORT_CODE, } from "../lib/constants.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/index.js";
import { stockService } from "./stock.service.js";
const statusTransitions = {
    DRAFT: [OperationStatus.WAITING, OperationStatus.READY, OperationStatus.CANCELLED],
    WAITING: [OperationStatus.READY, OperationStatus.CANCELLED],
    READY: [OperationStatus.IN_PROGRESS, OperationStatus.CANCELLED],
    IN_PROGRESS: [OperationStatus.DONE, OperationStatus.CANCELLED],
    DONE: [],
    CANCELLED: [],
};
const getVirtualLocationIds = async (tx) => {
    const [vendor, customer] = await Promise.all([
        tx.location.findFirst({ where: { shortCode: VIRTUAL_VENDOR_LOCATION_SHORT_CODE } }),
        tx.location.findFirst({ where: { shortCode: VIRTUAL_CUSTOMER_LOCATION_SHORT_CODE } }),
    ]);
    if (!vendor || !customer) {
        throw new AppError("Virtual locations not seeded", 500, "Internal server error");
    }
    return { vendorId: vendor.id, customerId: customer.id };
};
const ensureWarehouse = async (tx, warehouseId) => {
    const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse || warehouse.shortCode === "VRT") {
        throw new AppError("Warehouse not found", 404, "Not found");
    }
    return warehouse;
};
const generateRefNumber = async (tx, type) => {
    const year = new Date().getUTCFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const count = await tx.operation.count({
        where: {
            type,
            createdAt: {
                gte: start,
                lt: end,
            },
        },
    });
    const sequence = String(count + 1).padStart(5, "0");
    const prefix = REF_PREFIX[type];
    return `${prefix}/${year}/${sequence}`;
};
const createTimeline = async (tx, operationId, actorId, action, fromStatus, toStatus) => {
    await tx.operationTimeline.create({
        data: {
            operationId,
            actorId,
            action,
            fromStatus,
            toStatus,
        },
    });
};
export const operationService = {
    async list(query) {
        const statuses = query.status?.split(",").filter(Boolean);
        const where = {
            ...(query.type ? { type: query.type } : {}),
            ...(statuses?.length ? { status: { in: statuses } } : {}),
            ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
            ...(query.search
                ? {
                    OR: [
                        { refNumber: { contains: query.search, mode: "insensitive" } },
                        { supplier: { contains: query.search, mode: "insensitive" } },
                        { destination: { contains: query.search, mode: "insensitive" } },
                    ],
                }
                : {}),
            ...(query.fromDate || query.toDate
                ? {
                    createdAt: {
                        ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
                        ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
                    },
                }
                : {}),
        };
        const [total, rows] = await Promise.all([
            prisma.operation.count({ where }),
            prisma.operation.findMany({
                where,
                include: {
                    warehouse: { select: { id: true, name: true } },
                    createdBy: { select: { id: true, name: true } },
                    _count: { select: { lines: true } },
                },
                orderBy: { [query.sortBy]: query.sortDir },
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
    async counts(type) {
        const where = type ? { type } : undefined;
        const grouped = await prisma.operation.groupBy({
            by: ["status"],
            where,
            _count: { _all: true },
        });
        const response = {
            DRAFT: 0,
            WAITING: 0,
            READY: 0,
            IN_PROGRESS: 0,
            DONE: 0,
            CANCELLED: 0,
            total: 0,
        };
        for (const item of grouped) {
            response[item.status] = item._count._all;
            response.total += item._count._all;
        }
        return response;
    },
    async create(input, userId) {
        return prisma.$transaction(async (tx) => {
            await ensureWarehouse(tx, input.warehouseId);
            if (input.type === OperationType.TRANSFER && (!input.fromLocationId || !input.toLocationId)) {
                throw new AppError("fromLocationId and toLocationId are required for transfer", 422, "Validation failed");
            }
            const refNumber = await generateRefNumber(tx, input.type);
            const initialStatus = input.status === "READY" ? OperationStatus.READY : OperationStatus.DRAFT;
            const operation = await tx.operation.create({
                data: {
                    refNumber,
                    type: input.type,
                    status: initialStatus,
                    adjustmentType: input.adjustmentType,
                    warehouseId: input.warehouseId,
                    fromLocationId: input.fromLocationId,
                    toLocationId: input.toLocationId,
                    supplier: input.supplier,
                    destination: input.destination,
                    scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
                    notes: input.notes,
                    createdById: userId,
                },
            });
            if (input.lines?.length) {
                for (const line of input.lines) {
                    let systemQty = line.systemQty;
                    let difference;
                    if (input.type === OperationType.ADJUSTMENT) {
                        const locationId = line.locationId || input.fromLocationId || undefined;
                        if (locationId) {
                            const level = await tx.stockLevel.findUnique({
                                where: {
                                    productId_locationId: {
                                        productId: line.productId,
                                        locationId,
                                    },
                                },
                            });
                            systemQty = level?.qtyOnHand ?? 0;
                            if (line.physicalQty !== undefined) {
                                difference = line.physicalQty - systemQty;
                            }
                        }
                    }
                    await tx.operationLine.create({
                        data: {
                            operationId: operation.id,
                            productId: line.productId,
                            locationId: line.locationId,
                            expectedQty: line.expectedQty,
                            doneQty: line.doneQty ?? 0,
                            lotNumber: line.lotNumber,
                            notes: line.notes,
                            systemQty,
                            physicalQty: line.physicalQty,
                            difference,
                            reason: line.reason,
                        },
                    });
                }
            }
            await createTimeline(tx, operation.id, userId, "Created", undefined, OperationStatus.DRAFT);
            if (initialStatus === OperationStatus.READY) {
                await createTimeline(tx, operation.id, userId, "Status changed", OperationStatus.DRAFT, OperationStatus.READY);
            }
            return tx.operation.findUniqueOrThrow({
                where: { id: operation.id },
                include: {
                    warehouse: true,
                    createdBy: { select: { id: true, name: true } },
                    validatedBy: { select: { id: true, name: true } },
                    fromLocation: { select: { id: true, name: true } },
                    toLocation: { select: { id: true, name: true } },
                    lines: {
                        include: {
                            product: { select: { id: true, name: true, sku: true, uom: true } },
                            location: { select: { id: true, name: true } },
                        },
                    },
                },
            });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
    async getById(id) {
        const operation = await prisma.operation.findUnique({
            where: { id },
            include: {
                warehouse: { select: { id: true, name: true, shortCode: true } },
                createdBy: { select: { id: true, name: true } },
                validatedBy: { select: { id: true, name: true } },
                fromLocation: { select: { id: true, name: true } },
                toLocation: { select: { id: true, name: true } },
                lines: {
                    include: {
                        product: { select: { id: true, name: true, sku: true, uom: true } },
                        location: { select: { id: true, name: true } },
                    },
                },
            },
        });
        if (!operation) {
            throw new AppError("Not found", 404, "Not found");
        }
        return operation;
    },
    async update(id, input, userId) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.operation.findUnique({ where: { id } });
            if (!existing)
                throw new AppError("Not found", 404, "Not found");
            if (existing.status !== OperationStatus.DRAFT && existing.status !== OperationStatus.WAITING) {
                throw new AppError("Only DRAFT or WAITING operations can be updated", 409, "Conflict");
            }
            await tx.operation.update({
                where: { id },
                data: {
                    warehouseId: input.warehouseId,
                    supplier: input.supplier,
                    destination: input.destination,
                    fromLocationId: input.fromLocationId,
                    toLocationId: input.toLocationId,
                    scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
                    notes: input.notes,
                    adjustmentType: input.adjustmentType,
                },
            });
            if (input.lines) {
                await tx.operationLine.deleteMany({ where: { operationId: id } });
                for (const line of input.lines) {
                    await tx.operationLine.create({
                        data: {
                            operationId: id,
                            productId: line.productId,
                            locationId: line.locationId,
                            expectedQty: line.expectedQty,
                            doneQty: line.doneQty ?? 0,
                            lotNumber: line.lotNumber,
                            notes: line.notes,
                            systemQty: line.systemQty,
                            physicalQty: line.physicalQty,
                            difference: line.physicalQty !== undefined && line.systemQty !== undefined
                                ? line.physicalQty - line.systemQty
                                : undefined,
                            reason: line.reason,
                        },
                    });
                }
            }
            await createTimeline(tx, id, userId, "Updated", existing.status, existing.status);
            return this.getById(id);
        });
    },
    async patchStatus(id, nextStatus, userId) {
        return prisma.$transaction(async (tx) => {
            const operation = await tx.operation.findUnique({ where: { id } });
            if (!operation)
                throw new AppError("Not found", 404, "Not found");
            if (!statusTransitions[operation.status].includes(nextStatus)) {
                throw new AppError("Invalid status transition", 409, "Conflict");
            }
            if (operation.status === OperationStatus.READY &&
                nextStatus === OperationStatus.IN_PROGRESS &&
                operation.type !== OperationType.DELIVERY) {
                throw new AppError("Invalid status transition", 409, "Conflict");
            }
            const updated = await tx.operation.update({
                where: { id },
                data: { status: nextStatus },
                select: { id: true, status: true, updatedAt: true },
            });
            await createTimeline(tx, id, userId, "Status changed", operation.status, nextStatus);
            return updated;
        });
    },
    async validate(id, userId) {
        return prisma.$transaction(async (tx) => {
            const operation = await tx.operation.findUnique({
                where: { id },
                include: {
                    lines: { include: { product: { select: { id: true, name: true } } } },
                },
            });
            if (!operation) {
                throw new AppError("Not found", 404, "Not found");
            }
            if (!(operation.status === OperationStatus.READY ||
                (operation.status === OperationStatus.IN_PROGRESS && operation.type === OperationType.DELIVERY))) {
                throw new AppError("Operation is not ready for validation", 409, "Conflict");
            }
            const { vendorId, customerId } = await getVirtualLocationIds(tx);
            let stockMovesCreated = 0;
            const defaultLocation = await tx.location.findFirst({
                where: { warehouseId: operation.warehouseId, isVirtual: false },
                orderBy: { createdAt: "asc" },
            });
            if (!defaultLocation) {
                throw new AppError("Warehouse has no default location", 422, "Validation failed");
            }
            if (operation.type === OperationType.DELIVERY) {
                const details = [];
                for (const line of operation.lines) {
                    const requested = line.doneQty > 0 ? line.doneQty : line.expectedQty;
                    const sourceLocationId = line.locationId || operation.fromLocationId;
                    if (!sourceLocationId) {
                        throw new AppError("Delivery line location is required", 422, "Validation failed");
                    }
                    const available = await stockService.getAvailableQty(tx, line.productId, sourceLocationId);
                    if (available < requested) {
                        details.push({
                            productId: line.productId,
                            productName: line.product.name,
                            available,
                            requested,
                        });
                    }
                }
                if (details.length > 0) {
                    throw new AppError("Insufficient stock", 422, "Validation failed", details);
                }
            }
            for (const line of operation.lines) {
                const qty = line.doneQty > 0 ? line.doneQty : line.expectedQty;
                if (operation.type === OperationType.RECEIPT) {
                    const targetLocationId = line.locationId || defaultLocation.id;
                    await stockService.upsertStockLevel(tx, line.productId, targetLocationId, qty, 0);
                    await stockService.createMove(tx, {
                        operationId: operation.id,
                        productId: line.productId,
                        fromLocationId: vendorId,
                        toLocationId: targetLocationId,
                        qty,
                        direction: StockMoveDirection.IN,
                        movedById: userId,
                    });
                    stockMovesCreated += 1;
                }
                if (operation.type === OperationType.DELIVERY) {
                    const sourceLocationId = line.locationId || operation.fromLocationId;
                    if (!sourceLocationId) {
                        throw new AppError("Delivery line location is required", 422, "Validation failed");
                    }
                    await stockService.upsertStockLevel(tx, line.productId, sourceLocationId, -qty, 0);
                    await stockService.createMove(tx, {
                        operationId: operation.id,
                        productId: line.productId,
                        fromLocationId: sourceLocationId,
                        toLocationId: customerId,
                        qty,
                        direction: StockMoveDirection.OUT,
                        movedById: userId,
                    });
                    stockMovesCreated += 1;
                }
                if (operation.type === OperationType.TRANSFER) {
                    if (!operation.fromLocationId || !operation.toLocationId) {
                        throw new AppError("Transfer locations are required", 422, "Validation failed");
                    }
                    const available = await stockService.getAvailableQty(tx, line.productId, operation.fromLocationId);
                    if (available < qty) {
                        throw new AppError("Insufficient stock", 422, "Validation failed", [
                            {
                                productId: line.productId,
                                productName: line.product.name,
                                available,
                                requested: qty,
                            },
                        ]);
                    }
                    await stockService.upsertStockLevel(tx, line.productId, operation.fromLocationId, -qty, 0);
                    await stockService.upsertStockLevel(tx, line.productId, operation.toLocationId, qty, 0);
                    await stockService.createMove(tx, {
                        operationId: operation.id,
                        productId: line.productId,
                        fromLocationId: operation.fromLocationId,
                        toLocationId: operation.toLocationId,
                        qty,
                        direction: StockMoveDirection.INTERNAL,
                        movedById: userId,
                    });
                    stockMovesCreated += 1;
                }
                if (operation.type === OperationType.ADJUSTMENT) {
                    const targetLocationId = line.locationId || operation.toLocationId || defaultLocation.id;
                    const sourceLocationId = line.locationId || operation.fromLocationId || defaultLocation.id;
                    const systemQty = line.systemQty ?? 0;
                    const physicalQty = line.physicalQty ?? systemQty;
                    const delta = physicalQty - systemQty;
                    if (delta === 0) {
                        continue;
                    }
                    await stockService.upsertStockLevel(tx, line.productId, sourceLocationId, delta, 0);
                    await stockService.createMove(tx, {
                        operationId: operation.id,
                        productId: line.productId,
                        fromLocationId: delta > 0 ? null : sourceLocationId,
                        toLocationId: delta > 0 ? targetLocationId : null,
                        qty: Math.abs(delta),
                        direction: StockMoveDirection.ADJUSTMENT,
                        movedById: userId,
                    });
                    stockMovesCreated += 1;
                }
            }
            await tx.operation.update({
                where: { id: operation.id },
                data: {
                    status: OperationStatus.DONE,
                    validatedById: userId,
                    validatedAt: new Date(),
                },
            });
            await createTimeline(tx, operation.id, userId, "Validated", operation.status, OperationStatus.DONE);
            return {
                message: "Operation validated successfully",
                operationId: operation.id,
                refNumber: operation.refNumber,
                stockMovesCreated,
            };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
    async cancel(id, userId, reason) {
        return prisma.$transaction(async (tx) => {
            const op = await tx.operation.findUnique({
                where: { id },
                include: { lines: true },
            });
            if (!op)
                throw new AppError("Not found", 404, "Not found");
            if (op.status === OperationStatus.DONE) {
                throw new AppError("Cannot cancel a completed operation", 409, "Conflict");
            }
            if (op.type === OperationType.DELIVERY &&
                (op.status === OperationStatus.WAITING || op.status === OperationStatus.READY)) {
                for (const line of op.lines) {
                    if (!line.locationId)
                        continue;
                    const level = await tx.stockLevel.findUnique({
                        where: {
                            productId_locationId: {
                                productId: line.productId,
                                locationId: line.locationId,
                            },
                        },
                    });
                    if (level && level.qtyReserved > 0) {
                        await tx.stockLevel.update({
                            where: { id: level.id },
                            data: { qtyReserved: 0 },
                        });
                    }
                }
            }
            const updated = await tx.operation.update({
                where: { id },
                data: { status: OperationStatus.CANCELLED, notes: reason ? `${op.notes || ""}\nCancel reason: ${reason}`.trim() : op.notes },
                select: { id: true, status: true },
            });
            await createTimeline(tx, id, userId, "Cancelled", op.status, OperationStatus.CANCELLED);
            return updated;
        });
    },
    async duplicate(id, userId) {
        return prisma.$transaction(async (tx) => {
            const source = await tx.operation.findUnique({
                where: { id },
                include: { lines: true },
            });
            if (!source)
                throw new AppError("Not found", 404, "Not found");
            const refNumber = await generateRefNumber(tx, source.type);
            const operation = await tx.operation.create({
                data: {
                    refNumber,
                    type: source.type,
                    warehouseId: source.warehouseId,
                    fromLocationId: source.fromLocationId,
                    toLocationId: source.toLocationId,
                    supplier: source.supplier,
                    destination: source.destination,
                    notes: source.notes,
                    scheduledDate: new Date(),
                    createdById: userId,
                    status: OperationStatus.DRAFT,
                    adjustmentType: source.adjustmentType,
                },
            });
            for (const line of source.lines) {
                await tx.operationLine.create({
                    data: {
                        operationId: operation.id,
                        productId: line.productId,
                        locationId: line.locationId,
                        expectedQty: line.expectedQty,
                        doneQty: 0,
                        lotNumber: line.lotNumber,
                        notes: line.notes,
                        reason: line.reason,
                    },
                });
            }
            await createTimeline(tx, operation.id, userId, "Created", undefined, OperationStatus.DRAFT);
            return this.getById(operation.id);
        });
    },
    async lockQuantities(id, userId) {
        return prisma.$transaction(async (tx) => {
            const operation = await tx.operation.findUnique({
                where: { id },
                include: { lines: true },
            });
            if (!operation)
                throw new AppError("Not found", 404, "Not found");
            if (operation.type !== OperationType.ADJUSTMENT) {
                throw new AppError("Only adjustment operations can lock quantities", 409, "Conflict");
            }
            const defaultLocation = await tx.location.findFirst({
                where: { warehouseId: operation.warehouseId, isVirtual: false },
            });
            if (!defaultLocation) {
                throw new AppError("Warehouse has no default location", 422, "Validation failed");
            }
            for (const line of operation.lines) {
                if (line.systemQty !== null && line.systemQty !== undefined)
                    continue;
                const locationId = line.locationId || defaultLocation.id;
                const level = await tx.stockLevel.findUnique({
                    where: {
                        productId_locationId: {
                            productId: line.productId,
                            locationId,
                        },
                    },
                });
                await tx.operationLine.update({
                    where: { id: line.id },
                    data: {
                        systemQty: level?.qtyOnHand ?? 0,
                        difference: line.physicalQty !== null && line.physicalQty !== undefined
                            ? line.physicalQty - (level?.qtyOnHand ?? 0)
                            : line.difference,
                    },
                });
            }
            const updated = await tx.operation.update({
                where: { id },
                data: { lockedAt: new Date() },
                select: { id: true, lockedAt: true },
            });
            await createTimeline(tx, id, userId, "Quantities locked", operation.status, operation.status);
            return updated;
        });
    },
    async timeline(id) {
        const data = await prisma.operationTimeline.findMany({
            where: { operationId: id },
            include: { actor: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
        });
        return { data };
    },
};
