import type { Express } from "express";
import { db } from "../db";
import { storage } from "../storage";
import { warehouseInventory } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireSupervisor } from "../middleware/auth";

/**
 * Warehouse Stock Movement Routes - حركات المخزون في المستودعات (< 100 lines)  
 * مجال المسؤولية: عرض حركات المخزون ومخزون المستودعات
 */
export function registerWarehouseStockMovementRoutes(app: Express): void {

  // عرض حركات المخزون حسب صلاحية المستخدم
  app.get("/api/stock-movements", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      let movements;
      
      if (user.role === 'admin') {
        // Admin can see all movements
        movements = await storage.getStockMovements();
      } else if (user.role === 'supervisor') {
        // Supervisor can see movements in their region
        movements = await storage.getStockMovementsByRegion(user.regionId);
      } else {
        // Technicians can see only their movements
        movements = await storage.getStockMovementsByTechnician(user.id);
      }
      
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  // عرض مخزون مستودع محدد
  app.get("/api/warehouse-inventory/:warehouseId", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const warehouseId = req.params.warehouseId;
      
      // Check if supervisor has access to this warehouse
      const supervisorWarehouses = await storage.getSupervisorWarehouses(user.id);
      if (user.role !== 'admin' && !supervisorWarehouses.includes(warehouseId)) {
        return res.status(403).json({ message: "Access denied to this warehouse" });
      }
      
      // Get warehouse inventory with item details
      const inventory = await db
        .select()
        .from(warehouseInventory)
        .where(eq(warehouseInventory.warehouseId, warehouseId));
      
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching warehouse inventory:", error);
      res.status(500).json({ message: "Failed to fetch warehouse inventory" });
    }
  });
}