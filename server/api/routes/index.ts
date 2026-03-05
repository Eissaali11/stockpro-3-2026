import type { Express } from "express";
import { logger } from "../../shared/utils/logger";

/**
 * API Routes Registration
 * Central entry point for all API endpoints
 */

export async function registerRoutes(app: Express): Promise<void> {
  try {
    logger.info("Registering API routes...");

    // TODO: Register modular routes here
    // Example structure:
    // app.use('/api/auth', authRoutes);
    // app.use('/api/users', userRoutes);
    // app.use('/api/inventory', inventoryRoutes);
    // app.use('/api/warehouses', warehouseRoutes);
    // app.use('/api/technicians', technicianRoutes);

    // Temporary: Delegate to existing routes for compatibility
    const { registerRoutes: legacyRegisterRoutes } = await import("../../routes");
    await legacyRegisterRoutes(app);

    logger.info("API routes registered successfully");
    
  } catch (error) {
    logger.error("Failed to register routes:", error);
    throw error;
  }
}

/**
 * Health Check Endpoint
 * Basic system health monitoring
 */
export function registerHealthCheck(app: Express): void {
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });
}