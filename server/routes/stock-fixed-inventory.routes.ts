import type { Express } from "express";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";
import { insertTechnicianInventorySchema } from "@shared/schema";
import { stockFixedInventoryContainer } from "../composition/stock-fixed-inventory.container";

/**
 * Stock Fixed Inventory Routes - المخزون الثابت للفنيين (< 100 lines)
 * مجال المسؤولية: إدارة المخزون الثابت للفنيين (CRUD)
 */
export function registerStockFixedInventoryRoutes(app: Express): void {

  // عرض المخزون الثابت للفني
  app.get("/api/technician-fixed-inventory/:technicianId", requireAuth, async (req, res) => {
    try {
      const inventory = await stockFixedInventoryContainer.stockFixedInventoryUseCase.getByTechnicianId(
        req.params.technicianId,
      );
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching technician fixed inventory:", error);
      res.status(500).json({ message: "Failed to fetch technician fixed inventory" });
    }
  });

  // تحديث المخزون الثابت للفني
  app.put("/api/technician-fixed-inventory/:technicianId", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertTechnicianInventorySchema.parse(req.body);
      
      // Get technician info for logging
      const technician = await stockFixedInventoryContainer.userManagementUseCase.findById(req.params.technicianId);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }

      const updatedInventory = await stockFixedInventoryContainer.stockFixedInventoryUseCase.updateByTechnicianId(
        req.params.technicianId, 
        data
      );
      
      // Log the activity
      await stockFixedInventoryContainer.createSystemLogUseCase.execute({
        userId: user.id,
        userName: user.fullName || user.username || 'Unknown',
        userRole: user.role,
        regionId: technician.regionId,
        action: 'update',
        entityType: 'technician_fixed_inventory',
        entityId: req.params.technicianId,
        entityName: technician.fullName || technician.username,
        description: `تحديث المخزون الثابت للفني: ${technician.fullName || technician.username}`,
        severity: 'info',
        success: true,
      });
      
      res.json(updatedInventory);
    } catch (error) {
      console.error("Error updating technician fixed inventory:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Technician not found" });
      }
      res.status(500).json({ message: "Failed to update technician fixed inventory" });
    }
  });

  // حذف المخزون الثابت للفني
  app.delete("/api/technician-fixed-inventory/:technicianId", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const technician = await stockFixedInventoryContainer.userManagementUseCase.findById(req.params.technicianId);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }

      const deleted = await stockFixedInventoryContainer.stockFixedInventoryUseCase.deleteByTechnicianId(
        req.params.technicianId,
      );
      if (!deleted) {
        return res.status(404).json({ message: "Fixed inventory not found" });
      }
      
      // Log the activity
      await stockFixedInventoryContainer.createSystemLogUseCase.execute({
        userId: user.id,
        userName: user.fullName || user.username || 'Unknown',
        userRole: user.role,
        regionId: technician.regionId,
        action: 'delete',
        entityType: 'technician_fixed_inventory',
        entityId: req.params.technicianId,
        entityName: technician.fullName || technician.username,
        description: `حذف المخزون الثابت للفني: ${technician.fullName || technician.username}`,
        severity: 'warn',
        success: true,
      });
      
      res.json({ message: "Fixed inventory deleted successfully" });
    } catch (error) {
      console.error("Error deleting technician fixed inventory:", error);
      res.status(500).json({ message: "Failed to delete technician fixed inventory" });
    }
  });
}