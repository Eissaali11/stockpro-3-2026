import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";

/**
 * Warehouse Batch Operations Routes - العمليات المجمعة للمناقلات (< 100 lines)
 * مجال المسؤولية: العمليات المجمعة (Batch Operations) للمناقلات
 */
export function registerWarehouseBatchOperationsRoutes(app: Express): void {

  // قبول مناقلات متعددة بالمعرف
  app.post("/api/warehouse-transfer-batches/by-ids/accept", requireAuth, async (req, res) => {
    try {
      const { transferIds } = req.body;
      const results = await storage.acceptWarehouseTransferBatch(transferIds);
      res.json(results);
    } catch (error) {
      console.error("Error accepting transfer batch:", error);
      res.status(500).json({ message: "Failed to accept transfer batch" });
    }
  });

  // رفض مناقلات متعددة بالمعرف
  app.post("/api/warehouse-transfer-batches/by-ids/reject", requireAuth, async (req, res) => {
    try {
      const { transferIds, reason } = req.body;
      const results = await storage.rejectWarehouseTransferBatch(transferIds, reason);
      res.json(results);
    } catch (error) {
      console.error("Error rejecting transfer batch:", error);
      res.status(500).json({ message: "Failed to reject transfer batch" });
    }
  });

  // قبول مناقلات بكميات كبيرة حسب المعايير
  app.post("/api/warehouse-transfer-batches/bulk/accept", requireAuth, async (req, res) => {
    try {
      const { criteria } = req.body;
      const results = await storage.acceptWarehouseTransfersBulk(criteria);
      res.json(results);
    } catch (error) {
      console.error("Error accepting transfers in bulk:", error);
      res.status(500).json({ message: "Failed to accept transfers in bulk" });
    }
  });

  // رفض مناقلات بكميات كبيرة حسب المعايير
  app.post("/api/warehouse-transfer-batches/bulk/reject", requireAuth, async (req, res) => {
    try {
      const { criteria, reason } = req.body;
      const results = await storage.rejectWarehouseTransfersBulk(criteria, reason);
      res.json(results);
    } catch (error) {
      console.error("Error rejecting transfers in bulk:", error);
      res.status(500).json({ message: "Failed to reject transfers in bulk" });
    }
  });

  // قبول مناقلة بمعرف الطلب
  app.post("/api/warehouse-transfer-batches/:requestId/accept", requireAuth, async (req, res) => {
    try {
      const result = await storage.acceptWarehouseTransferByRequestId(req.params.requestId);
      res.json(result);
    } catch (error) {
      console.error("Error accepting transfer by request ID:", error);
      res.status(500).json({ message: "Failed to accept transfer" });
    }
  });

  // رفض مناقلة بمعرف الطلب
  app.post("/api/warehouse-transfer-batches/:requestId/reject", requireAuth, async (req, res) => {
    try {
      const { reason } = req.body;
      const result = await storage.rejectWarehouseTransferByRequestId(req.params.requestId, reason);
      res.json(result);
    } catch (error) {
      console.error("Error rejecting transfer by request ID:", error);
      res.status(500).json({ message: "Failed to reject transfer" });
    }
  });
}