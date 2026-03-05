import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";

/**
 * Warehouse Transfer Operations - العمليات الأساسية للمناقلات (< 100 lines)
 * مجال المسؤولية: إنشاء وعرض وتحديث المناقلات (CRUD Operations)
 */
export function registerWarehouseTransferOperationsRoutes(app: Express): void {

  // عرض جميع المناقلات
  app.get("/api/warehouse-transfers", requireAuth, async (req, res) => {
    try {
      const transfers = await storage.getWarehouseTransfers();
      res.json(transfers);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error fetching warehouse transfers:", message);
      res.status(500).json({ message: "Failed to fetch warehouse transfers" });
    }
  });

  // إنشاء مناقلة جديدة
  app.post("/api/warehouse-transfers", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const schema = z.object({
        warehouseId: z.string(),
        technicianId: z.string(),
        notes: z.string().optional(),
        items: z
          .array(
            z.object({
              itemType: z.string(),
              packagingType: z.enum(["box", "unit"]),
              quantity: z.number().positive(),
            })
          )
          .optional(),
      });

      const parsed = schema.safeParse(req.body);

      let warehouseId: string;
      let technicianId: string;
      let notes: string | undefined;
      let items: Array<{ itemType: string; packagingType: "box" | "unit"; quantity: number }> = [];

      if (parsed.success) {
        warehouseId = parsed.data.warehouseId;
        technicianId = parsed.data.technicianId;
        notes = parsed.data.notes;
        items = parsed.data.items || [];
      } else {
        const legacySchema = z.object({
          warehouseId: z.string(),
          technicianId: z.string(),
          notes: z.string().optional(),
          n950: z.number().optional(),
          n950PackagingType: z.enum(["box", "unit"]).optional(),
          i9000s: z.number().optional(),
          i9000sPackagingType: z.enum(["box", "unit"]).optional(),
          i9100: z.number().optional(),
          i9100PackagingType: z.enum(["box", "unit"]).optional(),
          rollPaper: z.number().optional(),
          rollPaperPackagingType: z.enum(["box", "unit"]).optional(),
          stickers: z.number().optional(),
          stickersPackagingType: z.enum(["box", "unit"]).optional(),
          newBatteries: z.number().optional(),
          newBatteriesPackagingType: z.enum(["box", "unit"]).optional(),
          mobilySim: z.number().optional(),
          mobilySimPackagingType: z.enum(["box", "unit"]).optional(),
          stcSim: z.number().optional(),
          stcSimPackagingType: z.enum(["box", "unit"]).optional(),
          zainSim: z.number().optional(),
          zainSimPackagingType: z.enum(["box", "unit"]).optional(),
          lebara: z.number().optional(),
          lebaraPackagingType: z.enum(["box", "unit"]).optional(),
        });

        const legacy = legacySchema.parse(req.body);
        warehouseId = legacy.warehouseId;
        technicianId = legacy.technicianId;
        notes = legacy.notes;

        const itemTypes = [
          "n950",
          "i9000s",
          "i9100",
          "rollPaper",
          "stickers",
          "newBatteries",
          "mobilySim",
          "stcSim",
          "zainSim",
          "lebara",
        ] as const;

        for (const itemType of itemTypes) {
          const quantity = (legacy as any)[itemType];
          const packagingType = (legacy as any)[`${itemType}PackagingType`];
          if (quantity && quantity > 0 && (packagingType === "box" || packagingType === "unit")) {
            items.push({ itemType, packagingType, quantity });
          }
        }
      }

      if (items.length === 0) {
        return res.status(400).json({ message: "No items to transfer" });
      }

      for (const item of items) {
        await storage.transferFromWarehouse({
          warehouseId,
          technicianId,
          itemType: item.itemType,
          packagingType: item.packagingType,
          quantity: item.quantity,
          performedBy: user.id,
          notes,
        } as any);
      }

      res.status(201).json({ success: true, message: "Transfer created", itemsCount: items.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error creating warehouse transfer:", message);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create warehouse transfer" });
    }
  });

  // تحديث حالة المناقلة
  app.patch("/api/warehouse-transfers/:id/status", requireAuth, async (req, res) => {
    try {
      const status = String(req.body?.status || '').toLowerCase();
      if (status === 'approved' || status === 'accepted') {
        const transfer = await storage.acceptWarehouseTransfer(req.params.id);
        return res.json(transfer);
      }
      if (status === 'rejected') {
        const reason = typeof req.body?.reason === 'string' ? req.body.reason : 'Rejected via status endpoint';
        const transfer = await storage.rejectWarehouseTransfer(req.params.id, reason);
        return res.json(transfer);
      }

      return res.status(400).json({ message: "Invalid status. Use approved|accepted|rejected" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error updating transfer status:", message);
      if (message.toLowerCase().includes('not found')) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      res.status(500).json({ message: "Failed to update transfer status" });
    }
  });

  // قبول مناقلة
  app.post("/api/warehouse-transfers/:id/accept", requireAuth, async (req, res) => {
    try {
      const transfer = await storage.acceptWarehouseTransfer(req.params.id);
      res.json(transfer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error accepting warehouse transfer:", message);
      res.status(500).json({ message: "Failed to accept transfer" });
    }
  });

  // رفض مناقلة
  app.post("/api/warehouse-transfers/:id/reject", requireAuth, async (req, res) => {
    try {
      const { reason } = req.body;
      const transfer = await storage.rejectWarehouseTransfer(req.params.id, reason);
      res.json(transfer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error rejecting warehouse transfer:", message);
      res.status(500).json({ message: "Failed to reject transfer" });
    }
  });
}