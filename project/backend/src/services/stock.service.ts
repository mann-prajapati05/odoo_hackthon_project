import type { Prisma, PrismaClient, StockMoveDirection } from "@prisma/client";

const upsertStockLevel = async (
  tx: Prisma.TransactionClient,
  productId: string,
  locationId: string,
  qtyOnHandDelta: number,
  qtyReservedDelta = 0
): Promise<void> => {
  const existing = await tx.stockLevel.findUnique({
    where: { productId_locationId: { productId, locationId } },
  });

  if (!existing) {
    await tx.stockLevel.create({
      data: {
        productId,
        locationId,
        qtyOnHand: qtyOnHandDelta,
        qtyReserved: qtyReservedDelta,
      },
    });
    return;
  }

  await tx.stockLevel.update({
    where: { id: existing.id },
    data: {
      qtyOnHand: existing.qtyOnHand + qtyOnHandDelta,
      qtyReserved: existing.qtyReserved + qtyReservedDelta,
    },
  });
};

type StockMoveInput = {
  operationId?: string | null;
  productId: string;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  qty: number;
  direction: StockMoveDirection;
  movedById: string;
  notes?: string;
};

const createMove = async (
  tx: Prisma.TransactionClient,
  input: StockMoveInput
): Promise<void> => {
  await tx.stockMove.create({
    data: {
      operationId: input.operationId,
      productId: input.productId,
      fromLocationId: input.fromLocationId,
      toLocationId: input.toLocationId,
      qty: input.qty,
      direction: input.direction,
      movedById: input.movedById,
      notes: input.notes,
    },
  });
};

const getAvailableQty = async (
  tx: Prisma.TransactionClient,
  productId: string,
  locationId: string
): Promise<number> => {
  const level = await tx.stockLevel.findUnique({
    where: { productId_locationId: { productId, locationId } },
  });

  if (!level) {
    return 0;
  }

  return level.qtyOnHand - level.qtyReserved;
};

export const stockService = {
  upsertStockLevel,
  createMove,
  getAvailableQty,
};
