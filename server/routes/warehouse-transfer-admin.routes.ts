import type { Express } from "express";
import { db } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { techniciansInventory, warehouseTransfers, warehouseInventory, users } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Warehouse Transfer Admin Routes
 * Endpoints restricted to admin operations.
 */
export function registerWarehouseTransferAdminRoutes(app: Express): void {
  app.delete("/api/warehouse-transfers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty IDs array" });
      }

      await db.transaction(async (tx) => {
        const transfersToDelete = await tx
          .select()
          .from(warehouseTransfers)
          .where(inArray(warehouseTransfers.id, ids));

        if (transfersToDelete.length === 0) {
          throw new Error("No transfers found with the provided IDs");
        }

        const warehouseUpdates = new Map<string, any>();
        const technicianUpdates = new Map<string, any>();

        for (const transfer of transfersToDelete) {
          if (!warehouseUpdates.has(transfer.warehouseId)) {
            warehouseUpdates.set(transfer.warehouseId, {
              n950Boxes: 0,
              n950Units: 0,
              i9000sBoxes: 0,
              i9000sUnits: 0,
              i9100Boxes: 0,
              i9100Units: 0,
              rollPaperBoxes: 0,
              rollPaperUnits: 0,
              stickersBoxes: 0,
              stickersUnits: 0,
              newBatteriesBoxes: 0,
              newBatteriesUnits: 0,
              mobilySimBoxes: 0,
              mobilySimUnits: 0,
              stcSimBoxes: 0,
              stcSimUnits: 0,
              zainSimBoxes: 0,
              zainSimUnits: 0,
            });
          }

          const updates = warehouseUpdates.get(transfer.warehouseId);
          if (transfer.packagingType === "box") {
            updates[`${transfer.itemType}Boxes`] += transfer.quantity;
          } else {
            updates[`${transfer.itemType}Units`] += transfer.quantity;
          }

          if (transfer.status === "accepted") {
            if (!technicianUpdates.has(transfer.technicianId)) {
              technicianUpdates.set(transfer.technicianId, {
                n950Boxes: 0,
                n950Units: 0,
                i9000sBoxes: 0,
                i9000sUnits: 0,
                i9100Boxes: 0,
                i9100Units: 0,
                rollPaperBoxes: 0,
                rollPaperUnits: 0,
                stickersBoxes: 0,
                stickersUnits: 0,
                newBatteriesBoxes: 0,
                newBatteriesUnits: 0,
                mobilySimBoxes: 0,
                mobilySimUnits: 0,
                stcSimBoxes: 0,
                stcSimUnits: 0,
                zainSimBoxes: 0,
                zainSimUnits: 0,
              });
            }

            const techUpdates = technicianUpdates.get(transfer.technicianId);
            if (transfer.packagingType === "box") {
              techUpdates[`${transfer.itemType}Boxes`] += transfer.quantity;
            } else {
              techUpdates[`${transfer.itemType}Units`] += transfer.quantity;
            }
          }
        }

        for (const [warehouseId, updates] of Array.from(warehouseUpdates.entries())) {
          const [currentInventory] = await tx
            .select()
            .from(warehouseInventory)
            .where(eq(warehouseInventory.warehouseId, warehouseId));

          if (!currentInventory) {
            throw new Error(`Warehouse inventory not found for warehouse ID: ${warehouseId}`);
          }

          await tx
            .update(warehouseInventory)
            .set({
              n950Boxes: currentInventory.n950Boxes + updates.n950Boxes,
              n950Units: currentInventory.n950Units + updates.n950Units,
              i9000sBoxes: currentInventory.i9000sBoxes + updates.i9000sBoxes,
              i9000sUnits: currentInventory.i9000sUnits + updates.i9000sUnits,
              i9100Boxes: currentInventory.i9100Boxes + updates.i9100Boxes,
              i9100Units: currentInventory.i9100Units + updates.i9100Units,
              rollPaperBoxes: currentInventory.rollPaperBoxes + updates.rollPaperBoxes,
              rollPaperUnits: currentInventory.rollPaperUnits + updates.rollPaperUnits,
              stickersBoxes: currentInventory.stickersBoxes + updates.stickersBoxes,
              stickersUnits: currentInventory.stickersUnits + updates.stickersUnits,
              newBatteriesBoxes: currentInventory.newBatteriesBoxes + updates.newBatteriesBoxes,
              newBatteriesUnits: currentInventory.newBatteriesUnits + updates.newBatteriesUnits,
              mobilySimBoxes: currentInventory.mobilySimBoxes + updates.mobilySimBoxes,
              mobilySimUnits: currentInventory.mobilySimUnits + updates.mobilySimUnits,
              stcSimBoxes: currentInventory.stcSimBoxes + updates.stcSimBoxes,
              stcSimUnits: currentInventory.stcSimUnits + updates.stcSimUnits,
              zainSimBoxes: currentInventory.zainSimBoxes + updates.zainSimBoxes,
              zainSimUnits: currentInventory.zainSimUnits + updates.zainSimUnits,
            })
            .where(eq(warehouseInventory.warehouseId, warehouseId));
        }

        for (const [technicianId, updates] of Array.from(technicianUpdates.entries())) {
          const [technician] = await tx
            .select({ fullName: users.fullName })
            .from(users)
            .where(eq(users.id, technicianId));

          if (!technician) {
            throw new Error(`Technician not found for ID: ${technicianId}`);
          }

          const [currentMovingInventory] = await tx
            .select()
            .from(techniciansInventory)
            .where(eq(techniciansInventory.technicianName, technician.fullName));

          if (!currentMovingInventory) {
            throw new Error(`Moving inventory not found for technician: ${technician.fullName}`);
          }

          await tx
            .update(techniciansInventory)
            .set({
              n950Boxes: Math.max(0, currentMovingInventory.n950Boxes - updates.n950Boxes),
              n950Units: Math.max(0, currentMovingInventory.n950Units - updates.n950Units),
              i9000sBoxes: Math.max(0, currentMovingInventory.i9000sBoxes - updates.i9000sBoxes),
              i9000sUnits: Math.max(0, currentMovingInventory.i9000sUnits - updates.i9000sUnits),
              i9100Boxes: Math.max(0, currentMovingInventory.i9100Boxes - updates.i9100Boxes),
              i9100Units: Math.max(0, currentMovingInventory.i9100Units - updates.i9100Units),
              rollPaperBoxes: Math.max(0, currentMovingInventory.rollPaperBoxes - updates.rollPaperBoxes),
              rollPaperUnits: Math.max(0, currentMovingInventory.rollPaperUnits - updates.rollPaperUnits),
              stickersBoxes: Math.max(0, currentMovingInventory.stickersBoxes - updates.stickersBoxes),
              stickersUnits: Math.max(0, currentMovingInventory.stickersUnits - updates.stickersUnits),
              newBatteriesBoxes: Math.max(0, currentMovingInventory.newBatteriesBoxes - updates.newBatteriesBoxes),
              newBatteriesUnits: Math.max(0, currentMovingInventory.newBatteriesUnits - updates.newBatteriesUnits),
              mobilySimBoxes: Math.max(0, currentMovingInventory.mobilySimBoxes - updates.mobilySimBoxes),
              mobilySimUnits: Math.max(0, currentMovingInventory.mobilySimUnits - updates.mobilySimUnits),
              stcSimBoxes: Math.max(0, currentMovingInventory.stcSimBoxes - updates.stcSimBoxes),
              stcSimUnits: Math.max(0, currentMovingInventory.stcSimUnits - updates.stcSimUnits),
              zainSimBoxes: Math.max(0, currentMovingInventory.zainSimBoxes - updates.zainSimBoxes),
              zainSimUnits: Math.max(0, currentMovingInventory.zainSimUnits - updates.zainSimUnits),
            })
            .where(eq(techniciansInventory.technicianName, technician.fullName));
        }

        await tx
          .delete(warehouseTransfers)
          .where(inArray(warehouseTransfers.id, ids));
      });

      res.json({
        message: "Transfers deleted successfully and inventory returned to warehouse",
        count: ids.length,
      });
    } catch (error) {
      console.error("Error deleting transfers:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete transfers" });
    }
  });
}
