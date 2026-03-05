import type { Express } from "express";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storage";
import { z } from "zod";
import { insertInventoryRequestSchema } from "@shared/schema";

/**
 * Inventory Requests Creation Routes - إنشاء وعرض طلبات المخزون (< 100 lines)
 * مجال المسؤولية: إنشاء طلبات جديدة وعرض طلبات المستخدم
 */
export function registerInventoryRequestsCreateRoutes(app: Express): void {

  // عرض طلبات المخزون الخاصة بالمستخدم
  app.get("/api/inventory-requests/my", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const requests = await storage.getUserInventoryRequests(user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user inventory requests:", error);
      res.status(500).json({ message: "Failed to fetch inventory requests" });
    }
  });

  // إنشاء طلب مخزون جديد  
  app.post("/api/inventory-requests", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertInventoryRequestSchema.parse(req.body);
      
      const requestData = {
        ...data,
        technicianId: user.id,
        createdAt: new Date(),
        status: "pending" as const,
      };
      
      const request = await storage.createInventoryRequest(requestData);
      
      // Log the request creation
      await storage.createSystemLog({
        userId: user.id,
        userName: user.fullName || user.username || 'Unknown',
        userRole: user.role,
        regionId: user.regionId,
        action: 'create',
        entityType: 'inventory_request',
        entityId: request.id,
        entityName: `طلب مخزون`,
        description: `تم إنشاء طلب مخزون جديد`,
        severity: 'info',
        success: true,
        details: JSON.stringify(data),
      });
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating inventory request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory request" });
    }
  });
}