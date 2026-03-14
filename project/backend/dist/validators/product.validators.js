import { z } from "zod";
export const productQuerySchema = z.object({
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    stockStatus: z.enum(["in", "low", "out"]).optional(),
    warehouseId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(["name", "sku", "createdAt", "stock"]).default("name"),
    sortDir: z.enum(["asc", "desc"]).default("asc"),
});
export const productCreateSchema = z.object({
    name: z.string().min(2),
    sku: z.string().min(1),
    categoryId: z.string().uuid().optional(),
    uom: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    reorderEnabled: z.boolean().optional(),
    reorderMin: z.number().optional(),
    reorderQty: z.number().optional(),
    initialQty: z.number().optional(),
    initialLocationId: z.string().uuid().optional(),
});
export const productUpdateSchema = productCreateSchema.omit({
    initialQty: true,
    initialLocationId: true,
}).partial();
export const categoryCreateSchema = z.object({
    name: z.string().min(2),
    parentId: z.string().uuid().optional(),
});
