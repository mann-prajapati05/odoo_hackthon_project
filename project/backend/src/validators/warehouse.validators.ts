import { z } from "zod";

export const warehouseCreateSchema = z.object({
  name: z.string().min(2),
  shortCode: z.string().min(2),
  address: z.string().optional(),
});

export const warehouseUpdateSchema = warehouseCreateSchema.partial();

export const locationCreateSchema = z.object({
  name: z.string().min(2),
  shortCode: z.string().min(1),
  parentId: z.string().uuid().optional(),
});

export const locationUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  shortCode: z.string().min(1).optional(),
  parentId: z.string().uuid().nullable().optional(),
});
