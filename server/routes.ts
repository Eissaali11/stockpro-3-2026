import type { Express } from "express";
import type { Server } from "http";

/**
 * Legacy compatibility wrapper.
 *
 * This file used to contain a very large monolithic route registration.
 * It now delegates to the modular route system under `server/routes/*`
 * organized by role and responsibility.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  const { registerRoutes: registerModularRoutes } = await import("./routes/index");
  return registerModularRoutes(app);
}
