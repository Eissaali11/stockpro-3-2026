import type { Express, Request, Response, NextFunction } from "express";

/**
 * CORS Middleware Configuration
 * Handles cross-origin resource sharing
 */

export function corsMiddleware(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const host = req.get('host') || '';
    
    // Development: allow all origins
    // Production: allow same-origin and trusted domains
    if (process.env.NODE_ENV === 'development' || 
        !origin || 
        origin.includes(host) || 
        origin.includes('stoc.fun')) {
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
}