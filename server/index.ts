import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index";
import { initializeDatabase } from "./infrastructure/database/connection";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./middleware/errorHandler";
import { setupSession } from "./config/session";

const app = express();

// Trust proxy (required behind Nginx)
if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.get('host') || '';
  
  // In development, allow all origins
  // In production, allow same-origin requests
  if (process.env.NODE_ENV === 'development' || !origin || origin.includes(host) || origin.includes('stoc.fun')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Setup session
setupSession(app);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function startServer() {
  try {
    // Initialize database connection before registering routes
    await initializeDatabase();
    const server = await registerRoutes(app);

  // Global error handler (must be last)
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    await serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        log(`Port ${port} is already in use. Stop the other process or run with another port (e.g. PORT=3001).`);
        process.exit(1);
      }

      log(`Server failed to start: ${error.message}`);
      process.exit(1);
    });

    server.listen(port, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`Startup failed: ${message}`);
    process.exit(1);
  }
}

startServer();
