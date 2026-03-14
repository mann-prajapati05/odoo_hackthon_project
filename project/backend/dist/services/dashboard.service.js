import { OperationStatus, OperationType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { inMemoryStore } from "../lib/inMemoryStore.js";
export const dashboardService = {
    async kpis() {
        const key = "cache:dashboard:kpis";
        const cached = await inMemoryStore.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        const [totalProducts, productsWithStock, pendingReceipts, pendingDeliveries, pendingTransfers] = await Promise.all([
            prisma.product.count(),
            prisma.product.findMany({
                where: { reorderEnabled: true },
                include: { stockLevels: true },
            }),
            prisma.operation.count({
                where: {
                    type: OperationType.RECEIPT,
                    status: { in: [OperationStatus.WAITING, OperationStatus.READY] },
                },
            }),
            prisma.operation.count({
                where: {
                    type: OperationType.DELIVERY,
                    status: { in: [OperationStatus.WAITING, OperationStatus.READY, OperationStatus.IN_PROGRESS] },
                },
            }),
            prisma.operation.count({
                where: {
                    type: OperationType.TRANSFER,
                    status: { in: [OperationStatus.WAITING, OperationStatus.READY] },
                },
            }),
        ]);
        let lowStockItems = 0;
        let outOfStockItems = 0;
        for (const product of productsWithStock) {
            const qty = product.stockLevels.reduce((sum, item) => sum + item.qtyOnHand, 0);
            if (qty === 0) {
                outOfStockItems += 1;
            }
            const min = product.reorderMin ?? 0;
            if (qty > 0 && qty <= min) {
                lowStockItems += 1;
            }
        }
        const payload = {
            totalProducts,
            lowStockItems,
            outOfStockItems,
            pendingReceipts,
            pendingDeliveries,
            pendingTransfers,
            cachedAt: new Date().toISOString(),
        };
        await inMemoryStore.set(key, JSON.stringify(payload), 120);
        return payload;
    },
    async recentActivity(limit = 8) {
        const take = Math.min(limit, 20);
        const data = await prisma.stockMove.findMany({
            take,
            orderBy: { movedAt: "desc" },
            include: {
                product: { select: { id: true, name: true, sku: true, uom: true } },
                fromLocation: { select: { id: true, name: true, warehouse: { select: { name: true } } } },
                toLocation: { select: { id: true, name: true, warehouse: { select: { name: true } } } },
                operation: { select: { id: true, refNumber: true, type: true } },
                movedBy: { select: { id: true, name: true } },
            },
        });
        return { data: data.reverse() };
    },
    async lowStock(limit = 8) {
        const products = await prisma.product.findMany({
            where: { reorderEnabled: true },
            include: {
                stockLevels: {
                    include: {
                        location: {
                            select: {
                                name: true,
                                warehouse: { select: { name: true } },
                            },
                        },
                    },
                },
            },
            take: Math.max(limit, 1),
        });
        const data = products
            .map((product) => {
            const qtyOnHand = product.stockLevels.reduce((sum, item) => sum + item.qtyOnHand, 0);
            const reorderMin = product.reorderMin ?? 0;
            const sampleLocation = product.stockLevels[0]?.location;
            return {
                id: product.id,
                name: product.name,
                sku: product.sku,
                uom: product.uom,
                qtyOnHand,
                reorderMin,
                percentOfMin: reorderMin > 0 ? (qtyOnHand / reorderMin) * 100 : 0,
                location: sampleLocation
                    ? { name: sampleLocation.name, warehouse: { name: sampleLocation.warehouse.name } }
                    : null,
            };
        })
            .filter((item) => item.reorderMin > 0 && item.qtyOnHand <= item.reorderMin)
            .sort((a, b) => a.percentOfMin - b.percentOfMin)
            .slice(0, limit);
        return { data };
    },
};
