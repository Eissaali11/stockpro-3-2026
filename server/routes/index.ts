/**
 * Main routes index - registers all route modules
 */

import type { Express } from "express";
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

  // Register new route modules
  registerAuthRoutes(app);
  
  // Register refactored route modules
  await (await import("./register-modules")).registerRefactoredRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
