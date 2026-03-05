import type { Express } from "express";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storage";

/**
 * Inventory Requests Management Routes - إدارة طلبات المخزون (< 100 lines)
 * مجال المسؤولية: إدارة وتحديث حالات طلبات المخزون
 */
export function registerInventoryRequestsManagementRoutes(app: Express): void {

  // تحديث حالة طلب المخزون (موافقة/رفض)
  app.patch("/api/inventory-requests/:id/status", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { status, adminNotes } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
      }
      
      const updatedRequest = await storage.updateInventoryRequestStatus(
        req.params.id,
        status,
        user.id,
        adminNotes
      );
      
      // Log the status update
      await storage.createSystemLog({
        userId: user.id,
        userName: user.fullName || user.username || 'Unknown',
        userRole: user.role,
        regionId: user.regionId,
        action: 'update',
        entityType: 'inventory_request',
        entityId: req.params.id,
        entityName: `طلب مخزون`,
        description: `تم ${status === 'approved' ? 'الموافقة على' : 'رفض'} طلب المخزون`,
        severity: status === 'approved' ? 'info' : 'warn',
        success: true,
        details: JSON.stringify({ status, adminNotes }),
      });
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating inventory request status:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: "Inventory request not found" });
      }
      res.status(500).json({ message: "Failed to update inventory request status" });
    }
  });

  // حذف طلب المخزون
  app.delete("/api/inventory-requests/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const deleted = await storage.deleteInventoryRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Inventory request not found" });
      }
      
      // Log the deletion
      await storage.createSystemLog({
        userId: user.id,
        userName: user.fullName || user.username || 'Unknown',
        userRole: user.role,
        regionId: user.regionId,
        action: 'delete',
        entityType: 'inventory_request',
        entityId: req.params.id,
        entityName: `طلب مخزون`,
        description: `تم حذف طلب المخزون`,
        severity: 'warn',
        success: true,
      });
      
      res.json({ message: "Inventory request deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory request:", error);
      res.status(500).json({ message: "Failed to delete inventory request" });
    }
  });
}