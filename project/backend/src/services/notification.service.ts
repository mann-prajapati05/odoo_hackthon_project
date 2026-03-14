import { prisma } from "../lib/prisma.js";
import { inMemoryStore } from "../lib/inMemoryStore.js";

export const notificationService = {
  async refreshLowStockSet(): Promise<void> {
    const products = await prisma.product.findMany({
      where: { reorderEnabled: true },
      include: { stockLevels: true },
    });

    for (const product of products) {
      const qty = product.stockLevels.reduce((sum, item) => sum + item.qtyOnHand, 0);
      const reorderMin = product.reorderMin ?? 0;
      const key = "alerts:lowstock";

      if (qty < reorderMin) {
        await inMemoryStore.sadd(key, product.id);
      } else {
        await inMemoryStore.srem(key, product.id);
      }
    }
  },
};
