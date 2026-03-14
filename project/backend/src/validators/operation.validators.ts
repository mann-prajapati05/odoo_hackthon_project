import { AdjustmentType, OperationStatus, OperationType } from "@prisma/client";
import { z } from "zod";

const operationLineSchema = z.object({
  productId: z.string().uuid(),
  expectedQty: z.number().positive(),
  doneQty: z.number().nonnegative().optional(),
  locationId: z.string().uuid().optional(),
  lotNumber: z.string().optional(),
  notes: z.string().optional(),
  systemQty: z.number().optional(),
  physicalQty: z.number().optional(),
  reason: z.string().optional(),
});

export const operationCreateSchema = z.object({
  type: z.nativeEnum(OperationType),
  warehouseId: z.string().uuid(),
  supplier: z.string().optional(),
  destination: z.string().optional(),
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  scheduledDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  adjustmentType: z.nativeEnum(AdjustmentType).optional(),
  status: z.enum(["DRAFT", "READY"]).optional(),
  lines: z.array(operationLineSchema).optional(),
});

export const operationUpdateSchema = operationCreateSchema.partial();

export const operationListQuerySchema = z.object({
  type: z.nativeEnum(OperationType).optional(),
  status: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  search: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "scheduledDate", "refNumber"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const operationStatusPatchSchema = z.object({
  status: z.nativeEnum(OperationStatus),
});

export const operationCancelSchema = z.object({
  reason: z.string().optional(),
});

export const operationLockSchema = z.object({});
