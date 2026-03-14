import "dotenv/config";
import bcrypt from "bcryptjs";
import { VIRTUAL_CUSTOMER_LOCATION_SHORT_CODE, VIRTUAL_VENDOR_LOCATION_SHORT_CODE, VIRTUAL_WAREHOUSE_SHORT_CODE, } from "./lib/constants.js";
import { prisma } from "./lib/prisma.js";
const run = async () => {
    const virtualWarehouse = await prisma.warehouse.upsert({
        where: { shortCode: VIRTUAL_WAREHOUSE_SHORT_CODE },
        update: { name: "Virtual" },
        create: {
            name: "Virtual",
            shortCode: VIRTUAL_WAREHOUSE_SHORT_CODE,
            address: "System virtual warehouse",
        },
    });
    await prisma.location.upsert({
        where: { shortCode_warehouseId: { shortCode: VIRTUAL_VENDOR_LOCATION_SHORT_CODE, warehouseId: virtualWarehouse.id } },
        update: { name: "Vendor", isVirtual: true },
        create: {
            warehouseId: virtualWarehouse.id,
            name: "Vendor",
            shortCode: VIRTUAL_VENDOR_LOCATION_SHORT_CODE,
            isVirtual: true,
        },
    });
    await prisma.location.upsert({
        where: { shortCode_warehouseId: { shortCode: VIRTUAL_CUSTOMER_LOCATION_SHORT_CODE, warehouseId: virtualWarehouse.id } },
        update: { name: "Customer", isVirtual: true },
        create: {
            warehouseId: virtualWarehouse.id,
            name: "Customer",
            shortCode: VIRTUAL_CUSTOMER_LOCATION_SHORT_CODE,
            isVirtual: true,
        },
    });
    await prisma.user.upsert({
        where: { email: "admin@coreinventory.com" },
        update: {},
        create: {
            name: "CoreInventory Admin",
            email: "admin@coreinventory.com",
            passwordHash: await bcrypt.hash("Admin@123", 12),
            role: "ADMIN",
        },
    });
    const mainWarehouse = await prisma.warehouse.upsert({
        where: { shortCode: "MWH" },
        update: { name: "Main Warehouse" },
        create: {
            name: "Main Warehouse",
            shortCode: "MWH",
        },
    });
    const locationNames = ["Rack A", "Rack B", "Storage Room"];
    for (const name of locationNames) {
        const code = name.toUpperCase().replace(/\s+/g, "-");
        await prisma.location.upsert({
            where: { shortCode_warehouseId: { shortCode: code, warehouseId: mainWarehouse.id } },
            update: { name },
            create: {
                warehouseId: mainWarehouse.id,
                name,
                shortCode: code,
            },
        });
    }
    const categories = ["Raw Materials", "Finished Goods", "Packaging"];
    for (const category of categories) {
        const exists = await prisma.category.findFirst({ where: { name: category } });
        if (!exists) {
            await prisma.category.create({ data: { name: category } });
        }
    }
    console.log("Seed complete");
};
run()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
