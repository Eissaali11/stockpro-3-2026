import type { Express } from "express";
import { requireAuth, requireSupervisor } from "../middleware/auth";
import { db } from "../db";
import { inventoryRequests, users, warehouseInventory, warehouseTransfers } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Inventory Requests Approval Routes
 * Legacy-compatible approve/reject endpoints required by current clients.
 */
export function registerInventoryRequestsApprovalRoutes(app: Express): void {
  app.patch("/api/inventory-requests/:id/approve", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const { adminNotes, warehouseId } = req.body;

      if (!warehouseId) {
        return res.status(400).json({ message: "Warehouse ID is required" });
      }

      const request = await db
        .select()
        .from(inventoryRequests)
        .where(eq(inventoryRequests.id, req.params.id))
        .limit(1);

      if (!request || request.length === 0) {
        return res.status(404).json({ message: "Request not found" });
      }

      const inventoryRequest = request[0];

      if (inventoryRequest.status !== "pending") {
        return res.status(400).json({ message: "Request is not pending" });
      }

      if (user.role === "supervisor") {
        const [technician] = await db
          .select()
          .from(users)
          .where(eq(users.id, inventoryRequest.technicianId))
          .limit(1);

        if (!technician || technician.regionId !== user.regionId) {
          return res.status(403).json({ message: "لا يمكنك معالجة طلبات من خارج منطقتك" });
        }
      }

      await db.transaction(async (tx) => {
        const warehouseInv = await tx
          .select()
          .from(warehouseInventory)
          .where(eq(warehouseInventory.warehouseId, warehouseId))
          .limit(1);

        if (!warehouseInv || warehouseInv.length === 0) {
          throw new Error("Warehouse inventory not found");
        }

        const currentInv = warehouseInv[0];

        const stockChecks = [
          { name: "N950 (صناديق)", current: currentInv.n950Boxes || 0, requested: inventoryRequest.n950Boxes || 0 },
          { name: "N950 (وحدات)", current: currentInv.n950Units || 0, requested: inventoryRequest.n950Units || 0 },
          { name: "I9000s (صناديق)", current: currentInv.i9000sBoxes || 0, requested: inventoryRequest.i9000sBoxes || 0 },
          { name: "I9000s (وحدات)", current: currentInv.i9000sUnits || 0, requested: inventoryRequest.i9000sUnits || 0 },
          { name: "I9100 (صناديق)", current: currentInv.i9100Boxes || 0, requested: inventoryRequest.i9100Boxes || 0 },
          { name: "I9100 (وحدات)", current: currentInv.i9100Units || 0, requested: inventoryRequest.i9100Units || 0 },
          { name: "ورق حراري (صناديق)", current: currentInv.rollPaperBoxes || 0, requested: inventoryRequest.rollPaperBoxes || 0 },
          { name: "ورق حراري (وحدات)", current: currentInv.rollPaperUnits || 0, requested: inventoryRequest.rollPaperUnits || 0 },
          { name: "ملصقات (صناديق)", current: currentInv.stickersBoxes || 0, requested: inventoryRequest.stickersBoxes || 0 },
          { name: "ملصقات (وحدات)", current: currentInv.stickersUnits || 0, requested: inventoryRequest.stickersUnits || 0 },
          { name: "بطاريات جديدة (صناديق)", current: currentInv.newBatteriesBoxes || 0, requested: inventoryRequest.newBatteriesBoxes || 0 },
          { name: "بطاريات جديدة (وحدات)", current: currentInv.newBatteriesUnits || 0, requested: inventoryRequest.newBatteriesUnits || 0 },
          { name: "شريحة موبايلي (صناديق)", current: currentInv.mobilySimBoxes || 0, requested: inventoryRequest.mobilySimBoxes || 0 },
          { name: "شريحة موبايلي (وحدات)", current: currentInv.mobilySimUnits || 0, requested: inventoryRequest.mobilySimUnits || 0 },
          { name: "شريحة STC (صناديق)", current: currentInv.stcSimBoxes || 0, requested: inventoryRequest.stcSimBoxes || 0 },
          { name: "شريحة STC (وحدات)", current: currentInv.stcSimUnits || 0, requested: inventoryRequest.stcSimUnits || 0 },
          { name: "شريحة زين (صناديق)", current: currentInv.zainSimBoxes || 0, requested: inventoryRequest.zainSimBoxes || 0 },
          { name: "شريحة زين (وحدات)", current: currentInv.zainSimUnits || 0, requested: inventoryRequest.zainSimUnits || 0 },
        ];

        for (const check of stockChecks) {
          if (check.requested > 0 && check.current < check.requested) {
            throw new Error(`Insufficient stock in warehouse. Available: ${check.current}, Requested: ${check.requested} for ${check.name}`);
          }
        }

        await tx
          .update(inventoryRequests)
          .set({
            status: "approved",
            adminNotes,
            warehouseId,
            respondedBy: user.id,
            respondedAt: new Date(),
          })
          .where(eq(inventoryRequests.id, req.params.id));

        const itemsToTransfer = [
          { type: "n950", boxes: inventoryRequest.n950Boxes, units: inventoryRequest.n950Units },
          { type: "i9000s", boxes: inventoryRequest.i9000sBoxes, units: inventoryRequest.i9000sUnits },
          { type: "i9100", boxes: inventoryRequest.i9100Boxes, units: inventoryRequest.i9100Units },
          { type: "rollPaper", boxes: inventoryRequest.rollPaperBoxes, units: inventoryRequest.rollPaperUnits },
          { type: "stickers", boxes: inventoryRequest.stickersBoxes, units: inventoryRequest.stickersUnits },
          { type: "newBatteries", boxes: inventoryRequest.newBatteriesBoxes, units: inventoryRequest.newBatteriesUnits },
          { type: "mobilySim", boxes: inventoryRequest.mobilySimBoxes, units: inventoryRequest.mobilySimUnits },
          { type: "stcSim", boxes: inventoryRequest.stcSimBoxes, units: inventoryRequest.stcSimUnits },
          { type: "zainSim", boxes: inventoryRequest.zainSimBoxes, units: inventoryRequest.zainSimUnits },
        ];

        for (const item of itemsToTransfer) {
          if ((item.boxes || 0) > 0) {
            await tx.insert(warehouseTransfers).values({
              requestId: req.params.id,
              warehouseId,
              technicianId: inventoryRequest.technicianId,
              itemType: item.type,
              packagingType: "box",
              quantity: item.boxes || 0,
              performedBy: user.id,
              notes: `تم إنشاؤه من طلب مخزون ${inventoryRequest.notes ? ": " + inventoryRequest.notes : ""}`,
              status: "pending",
            });
          }
          if ((item.units || 0) > 0) {
            await tx.insert(warehouseTransfers).values({
              requestId: req.params.id,
              warehouseId,
              technicianId: inventoryRequest.technicianId,
              itemType: item.type,
              packagingType: "unit",
              quantity: item.units || 0,
              performedBy: user.id,
              notes: `تم إنشاؤه من طلب مخزون ${inventoryRequest.notes ? ": " + inventoryRequest.notes : ""}`,
              status: "pending",
            });
          }
        }

        await tx
          .update(warehouseInventory)
          .set({
            n950Boxes: (currentInv.n950Boxes || 0) - (inventoryRequest.n950Boxes || 0),
            n950Units: (currentInv.n950Units || 0) - (inventoryRequest.n950Units || 0),
            i9000sBoxes: (currentInv.i9000sBoxes || 0) - (inventoryRequest.i9000sBoxes || 0),
            i9000sUnits: (currentInv.i9000sUnits || 0) - (inventoryRequest.i9000sUnits || 0),
            i9100Boxes: (currentInv.i9100Boxes || 0) - (inventoryRequest.i9100Boxes || 0),
            i9100Units: (currentInv.i9100Units || 0) - (inventoryRequest.i9100Units || 0),
            rollPaperBoxes: (currentInv.rollPaperBoxes || 0) - (inventoryRequest.rollPaperBoxes || 0),
            rollPaperUnits: (currentInv.rollPaperUnits || 0) - (inventoryRequest.rollPaperUnits || 0),
            stickersBoxes: (currentInv.stickersBoxes || 0) - (inventoryRequest.stickersBoxes || 0),
            stickersUnits: (currentInv.stickersUnits || 0) - (inventoryRequest.stickersUnits || 0),
            newBatteriesBoxes: (currentInv.newBatteriesBoxes || 0) - (inventoryRequest.newBatteriesBoxes || 0),
            newBatteriesUnits: (currentInv.newBatteriesUnits || 0) - (inventoryRequest.newBatteriesUnits || 0),
            mobilySimBoxes: (currentInv.mobilySimBoxes || 0) - (inventoryRequest.mobilySimBoxes || 0),
            mobilySimUnits: (currentInv.mobilySimUnits || 0) - (inventoryRequest.mobilySimUnits || 0),
            stcSimBoxes: (currentInv.stcSimBoxes || 0) - (inventoryRequest.stcSimBoxes || 0),
            stcSimUnits: (currentInv.stcSimUnits || 0) - (inventoryRequest.stcSimUnits || 0),
            zainSimBoxes: (currentInv.zainSimBoxes || 0) - (inventoryRequest.zainSimBoxes || 0),
            zainSimUnits: (currentInv.zainSimUnits || 0) - (inventoryRequest.zainSimUnits || 0),
          })
          .where(eq(warehouseInventory.warehouseId, warehouseId));
      });

      const updatedRequest = await db
        .select()
        .from(inventoryRequests)
        .where(eq(inventoryRequests.id, req.params.id))
        .limit(1);

      res.json(updatedRequest[0]);
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ message: "Failed to approve request" });
    }
  });

  app.patch("/api/inventory-requests/:id/reject", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      const { adminNotes } = req.body;

      if (!adminNotes) {
        return res.status(400).json({ message: "Admin notes are required for rejection" });
      }

      if (user.role === "supervisor") {
        const [request] = await db
          .select()
          .from(inventoryRequests)
          .where(eq(inventoryRequests.id, req.params.id))
          .limit(1);

        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }

        const [technician] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.technicianId))
          .limit(1);

        if (!technician || technician.regionId !== user.regionId) {
          return res.status(403).json({ message: "لا يمكنك معالجة طلبات من خارج منطقتك" });
        }
      }

      const [updatedRequest] = await db
        .update(inventoryRequests)
        .set({
          status: "rejected",
          adminNotes,
          respondedBy: user.id,
          respondedAt: new Date(),
        })
        .where(eq(inventoryRequests.id, req.params.id))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ message: "Failed to reject request" });
    }
  });
}
