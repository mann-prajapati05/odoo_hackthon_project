import cron from "node-cron";

import { notificationService } from "../services/notification.service.js";

export const startStockAlertCron = (): void => {
  cron.schedule("0 * * * *", async () => {
    await notificationService.refreshLowStockSet();
  });
};
