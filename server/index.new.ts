import express from "express";
import { createServer } from "http";
import { setupApplication } from "./config/app.config";
import { initializeDatabase } from "./infrastructure/database/connection";
import { logger } from "./shared/utils/logger";

/**
 * StockPro Server Entry Point
 * Clean Architecture Implementation
 * Maximum 50 lines per initial requirement
 */

async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info("Database connection established");

    // Create Express application
    const app = express();
    const server = createServer(app);

    // Setup application middleware, routes, and configuration
    await setupApplication(app, server);

    // Start server
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, () => {
      logger.info(`StockPro server running on port ${port}`);
    });

    // Graceful shutdown handling
    process.on('SIGINT', () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();