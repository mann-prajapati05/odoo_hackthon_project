const upsertStockLevel = async (tx, productId, locationId, qtyOnHandDelta, qtyReservedDelta = 0) => {
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
const createMove = async (tx, input) => {
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
const getAvailableQty = async (tx, productId, locationId) => {
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
