import cron from "node-cron";
import { notificationService } from "../services/notification.service.js";
export const startStockAlertCron = () => {
    cron.schedule("0 * * * *", async () => {
        await notificationService.refreshLowStockSet();
    });
};
