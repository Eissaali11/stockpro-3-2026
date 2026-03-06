/**
 * Main routes index - registers all route modules
 */

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth.routes";
import { initializeDefaults } from "./bootstrap";

/**
 * Initialize default data on startup
 */
// initializeDefaults moved to routes/bootstrap.ts to keep this file minimal

/**
 * Register all routes
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default data on startup
  await initializeDefaults();

  const healthHandler = (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "stockpro-api",
      timestamp: new Date().toISOString(),
    });
  };

  app.get("/api/health", healthHandler);
  app.get("/health", healthHandler);

  // Register new route modules
  registerAuthRoutes(app);
  
  // Register refactored route modules
  await (await import("./register-modules")).registerRefactoredRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
