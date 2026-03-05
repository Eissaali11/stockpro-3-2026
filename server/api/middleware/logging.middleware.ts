import type { Express, Request, Response, NextFunction } from "express";
import { logger } from "../../shared/utils/logger";

/**
 * Request Logging Middleware
 * Provides structured logging for API requests
 */

export function loggingMiddleware(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedResponse: Record<string, any> | undefined = undefined;

    // Capture JSON responses for logging
    const originalJsonResponse = res.json;
    res.json = function (body: any, ...args: any[]) {
      capturedResponse = body;
      return originalJsonResponse.call(this, body);
    };

    // Log when response finishes
    res.on("finish", () => {
      const duration = Date.now() - start;
      
      if (path.startsWith("/api")) {
        let logMessage = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        
        if (capturedResponse) {
          const responseStr = JSON.stringify(capturedResponse);
          logMessage += ` :: ${responseStr}`;
        }

        // Truncate long messages
        if (logMessage.length > 80) {
          logMessage = logMessage.slice(0, 79) + "…";
        }

        logger.info(logMessage);
      }
    });

    next();
  });
}