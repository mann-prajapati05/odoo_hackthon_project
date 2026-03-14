import { OperationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/index.js";
const buildLocationTree = (rows) => {
    const map = new Map();
    const roots = [];
    for (const row of rows) {
        map.set(row.id, { ...row, children: [] });
    }
    for (const row of rows) {
        const node = map.get(row.id);
        if (row.parentId && map.has(row.parentId)) {
            map.get(row.parentId).children.push(node);
        }
        else {
            roots.push(node);
        }
    }
    return roots;
};
export const warehouseService = {
    async list(search) {
        const warehouses = await prisma.warehouse.findMany({
            where: {
                shortCode: { not: "VRT" },
                ...(search
                    ? {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { shortCode: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : {}),
            },
            include: { _count: { select: { locations: true, operations: true } } },
            orderBy: { name: "asc" },
        });
        return { data: warehouses };
    },
    async create(input) {
        return prisma.warehouse.create({ data: input });
    },
    async getById(id) {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
            include: {
                locations: {
                    where: { isVirtual: false },
                    select: { id: true, name: true, shortCode: true, parentId: true },
                    orderBy: { name: "asc" },
                },
            },
        });
        if (!warehouse) {
            throw new AppError("Warehouse not found", 404, "Not found");
        }
        return {
            id: warehouse.id,
            name: warehouse.name,
            shortCode: warehouse.shortCode,
            address: warehouse.address,
            locations: buildLocationTree(warehouse.locations),
        };
    },
    async update(id, input) {
        return prisma.warehouse.update({
            where: { id },
            data: input,
        });
    },
    async remove(id) {
        const hasStock = await prisma.stockLevel.findFirst({
            where: {
                location: { warehouseId: id },
                qtyOnHand: { gt: 0 },
            },
            select: { id: true },
        });
        const hasOps = await prisma.operation.findFirst({
            where: {
                warehouseId: id,
                status: { not: OperationStatus.CANCELLED },
            },
            select: { id: true },
        });
        if (hasStock || hasOps) {
            throw new AppError("Cannot delete warehouse with active stock or operations", 409, "Conflict");
        }
        await prisma.warehouse.delete({ where: { id } });
        return { message: "Deleted" };
    },
    async listLocations(warehouseId, flat = false) {
        const locations = await prisma.location.findMany({
            where: { warehouseId, isVirtual: false },
            select: { id: true, name: true, shortCode: true, parentId: true },
            orderBy: { name: "asc" },
        });
        return { data: flat ? locations : buildLocationTree(locations) };
    },
    async createLocation(warehouseId, input) {
        return prisma.location.create({
            data: {
                warehouseId,
                name: input.name,
                shortCode: input.shortCode,
                parentId: input.parentId,
                isVirtual: false,
            },
        });
    },
    async updateLocation(id, input) {
        return prisma.location.update({
            where: { id },
            data: input,
        });
    },
    async deleteLocation(id) {
        const hasStock = await prisma.stockLevel.findFirst({
            where: { locationId: id, qtyOnHand: { gt: 0 } },
            select: { id: true },
        });
        if (hasStock) {
            throw new AppError("Cannot delete location with active stock", 409, "Conflict");
        }
        await prisma.location.delete({ where: { id } });
        return { message: "Deleted" };
    },
};
