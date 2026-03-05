import type { Express } from "express";
import type { Server } from "http";
import express from "express";
import { corsMiddleware } from "../api/middleware/cors.middleware";
import { sessionMiddleware } from "../api/middleware/session.middleware";
import { loggingMiddleware } from "../api/middleware/logging.middleware";
import { errorHandler } from "../api/middleware/error.middleware";
import { registerRoutes } from "../api/routes";
import { setupVite, serveStatic } from "../shared/utils/vite";
import { initializeDefaults } from "../core/services/InitializationService";

/**
 * Application Configuration & Setup
 * Sets up middleware, routes, and development tools
 */

export async function setupApplication(app: Express, server: Server): Promise<void> {
  // Trust proxy configuration
  if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
    app.set('trust proxy', true);
  }

  // Apply middleware in order
  corsMiddleware(app);
  sessionMiddleware(app);
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));

  // Request logging
  loggingMiddleware(app);

  // Initialize default data
  await initializeDefaults();

  // Register API routes
  await registerRoutes(app);

  // Global error handler (must be last middleware)
  app.use(errorHandler);

  // Development/Production static file serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    await serveStatic(app);
  }
}

/**
 * Database URL Configuration
 * Centralized database connection string management
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return url;
}

/**
 * Session Secret Configuration
 * Centralized session secret management
 */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return secret;
}