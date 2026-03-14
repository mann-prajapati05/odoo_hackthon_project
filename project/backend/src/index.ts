import "dotenv/config";

import app from "./app.js";
import { startStockAlertCron } from "./cron/stockAlerts.cron.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const PORT = Number(process.env.PORT || 4000);

const bootstrap = async (): Promise<void> => {
  await prisma.$connect();

  startStockAlertCron();

  const server = app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });

  const shutdown = async () => {
    logger.info("Graceful shutdown started");
    await prisma.$disconnect();
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

bootstrap().catch(async (error) => {
  logger.error("Failed to bootstrap application", {
    message: (error as Error)?.message,
    stack: (error as Error)?.stack,
  });
  await prisma.$disconnect();
  process.exit(1);
});
