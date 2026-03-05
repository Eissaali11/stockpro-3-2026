/**
 * Technicians controller
 */

import type { Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../middleware/errorHandler";
import { NotFoundError } from "../utils/errors";
import { z } from "zod";

export class TechniciansController {
  /**
   * GET /api/technicians
   * Get all technicians
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    let technicians;

    if (user.role === "supervisor") {
      // Get only assigned technicians for supervisor (resolve IDs to user objects)
      const techIds = await storage.getSupervisorTechnicians(user.id);
      const techs = await Promise.all(techIds.map(id => storage.getUser(id)));
      technicians = techs.filter((t): t is any => !!t);
    } else {
      // Admin gets all
      const users = await storage.getUsers();
      technicians = users.filter((u) => u.role === "technician");
    }

    res.json(technicians);
  });

  /**
   * GET /api/supervisor/technicians
   * Get supervisor's assigned technicians
   */
  getSupervisorTechnicians = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const techIds = await storage.getSupervisorTechnicians(user.id);
    const techs = await Promise.all(techIds.map(id => storage.getUser(id)));
    res.json(techs.filter((t): t is any => !!t));
  });

  /**
   * GET /api/technicians/:id
   * Get single technician details
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const technician = await storage.getUser(req.params.id);
    if (!technician) {
      throw new NotFoundError("Technician not found");
    }
    res.json(technician);
  });

  /**
   * GET /api/my-fixed-inventory
   * Get technician's fixed inventory
   */
  getMyFixedInventory = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const inventory = await storage.getTechnicianFixedInventory(user.id);
    res.json(inventory);
  });

  /**
   * GET /api/my-moving-inventory
   * Get technician's moving inventory (legacy + dynamic entries)
   */
  getMyMovingInventory = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    // Get legacy moving inventory
    const legacyInventory = await storage.getTechnicianInventory(user.id);
    // Get dynamic entries
    const entries = await storage.getTechnicianMovingInventoryEntries(user.id);
    
    res.json({
      ...legacyInventory,
      entries,
    });
  });

  /**
   * GET /api/technician-fixed-inventory/:technicianId
   * Get technician's fixed inventory
   */
  getFixedInventory = asyncHandler(async (req: Request, res: Response) => {
    const inventory = await storage.getTechnicianFixedInventory(
      req.params.technicianId
    );
    res.json(inventory);
  });

  /**
   * PUT /api/technician-fixed-inventory/:technicianId
   * Update technician's fixed inventory
   */
  updateFixedInventory = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const updates = req.body;
    const inventory = await storage.updateTechnicianFixedInventory(
      req.params.technicianId,
      updates
    );

    // Log the activity
    await storage.logSystemActivity({
      userId: user.id,
      userName: user.username,
      userRole: user.role,
      regionId: null,
      action: "update",
      entityType: "inventory",
      entityId: req.params.technicianId,
      entityName: "المخزون الثابت",
      description: `تم تحديث المخزون الثابت للفني`,
      severity: "info",
      success: true,
    });

    res.json(inventory);
  });

  /**
   * DELETE /api/technician-fixed-inventory/:technicianId
   * Delete technician's fixed inventory
   */
  deleteFixedInventory = asyncHandler(async (req: Request, res: Response) => {
    await storage.deleteTechnicianFixedInventory(req.params.technicianId);
    res.json({ message: "Fixed inventory deleted successfully" });
  });

  /**
   * GET /api/stock-movements
   * Get stock movements
   */
  getStockMovements = asyncHandler(async (req: Request, res: Response) => {
    const { technicianId, limit } = req.query;
    const movements = await storage.getStockMovements(
      technicianId as string | undefined,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(movements);
  });

  /**
   * POST /api/stock-transfer
   * Transfer stock between inventories
   */
  transferStock = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const schema = z.object({
      technicianId: z.string(),
      itemType: z.string(),
      packagingType: z.enum(["box", "unit"]),
      quantity: z.number().positive(),
      fromInventory: z.enum(["fixed", "moving"]),
      toInventory: z.enum(["fixed", "moving"]),
      reason: z.string().optional(),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await storage.transferStock({
      ...data,
      performedBy: user.id,
    });

    // Log the activity
    await storage.logSystemActivity({
      userId: user.id,
      userName: user.username,
      userRole: user.role,
      regionId: null,
      action: "transfer",
      entityType: "inventory",
      entityId: data.technicianId,
      entityName: data.itemType,
      description: `تم نقل ${data.quantity} ${data.packagingType} من ${data.fromInventory} إلى ${data.toInventory}`,
      severity: "info",
      success: true,
    });

    res.json(result);
  });

  /**
   * POST /api/technicians/:technicianId/withdraw-to-warehouse
   * Withdraw stock from technician moving inventory back to warehouse
   */
  withdrawToWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const actor = req.user!;
    const { technicianId } = req.params;

    const schema = z.object({
      warehouseId: z.string().min(1),
      notes: z.string().optional(),
      items: z.array(z.object({
        itemTypeId: z.string().min(1),
        packagingType: z.enum(["box", "unit"]),
        quantity: z.number().int().positive(),
      })).min(1),
    });

    const data = schema.parse(req.body);

    const technician = await storage.getUser(technicianId);
    if (!technician || technician.role !== "technician") {
      throw new NotFoundError("Technician not found");
    }

    const warehouse = await storage.getWarehouse(data.warehouseId);
    if (!warehouse) {
      throw new NotFoundError("Warehouse not found");
    }

    if (actor.role === "supervisor") {
      if (!actor.regionId) {
        return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
      }

      if (technician.regionId !== actor.regionId) {
        return res.status(403).json({ message: "لا يمكنك السحب من فني خارج منطقتك" });
      }

      if (warehouse.regionId !== actor.regionId) {
        return res.status(403).json({ message: "لا يمكنك السحب إلى مستودع خارج منطقتك" });
      }
    }

    const movingEntries = await storage.getTechnicianMovingInventoryEntries(technicianId);
    const warehouseEntries = await storage.getWarehouseInventoryEntries(data.warehouseId);
    const legacyTechnicianInventory = await storage.getTechnicianInventory(technicianId);
    const legacyWarehouseInventory = await storage.getWarehouseInventory(data.warehouseId);

    const movingMap = new Map(movingEntries.map((entry) => [entry.itemTypeId, entry]));
    const warehouseMap = new Map(warehouseEntries.map((entry) => [entry.itemTypeId, entry]));

    const legacyFieldMapping: Record<string, { boxes: string; units: string }> = {
      n950: { boxes: "n950Boxes", units: "n950Units" },
      i9000s: { boxes: "i9000sBoxes", units: "i9000sUnits" },
      i9100: { boxes: "i9100Boxes", units: "i9100Units" },
      rollPaper: { boxes: "rollPaperBoxes", units: "rollPaperUnits" },
      stickers: { boxes: "stickersBoxes", units: "stickersUnits" },
      newBatteries: { boxes: "newBatteriesBoxes", units: "newBatteriesUnits" },
      mobilySim: { boxes: "mobilySimBoxes", units: "mobilySimUnits" },
      stcSim: { boxes: "stcSimBoxes", units: "stcSimUnits" },
      zainSim: { boxes: "zainSimBoxes", units: "zainSimUnits" },
      lebaraSim: { boxes: "lebaraBoxes", units: "lebaraUnits" },
      lebara: { boxes: "lebaraBoxes", units: "lebaraUnits" },
    };

    const aggregated = new Map<string, { itemTypeId: string; packagingType: "box" | "unit"; quantity: number }>();
    for (const item of data.items) {
      const key = `${item.itemTypeId}:${item.packagingType}`;
      const existing = aggregated.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        aggregated.set(key, { ...item });
      }
    }

    const touched = new Map<string, { technicianBoxes: number; technicianUnits: number; warehouseBoxes: number; warehouseUnits: number }>();
    const technicianLegacyUpdates: Record<string, number> = {};
    const warehouseLegacyUpdates: Record<string, number> = {};

    for (const item of Array.from(aggregated.values())) {
      const { itemTypeId, packagingType, quantity } = item;
      const legacyFields = legacyFieldMapping[itemTypeId];

      const currentTechnician = touched.get(itemTypeId) || {
        technicianBoxes: movingMap.get(itemTypeId)?.boxes ?? (legacyFields && legacyTechnicianInventory ? ((legacyTechnicianInventory as any)[legacyFields.boxes] || 0) : 0),
        technicianUnits: movingMap.get(itemTypeId)?.units ?? (legacyFields && legacyTechnicianInventory ? ((legacyTechnicianInventory as any)[legacyFields.units] || 0) : 0),
        warehouseBoxes: warehouseMap.get(itemTypeId)?.boxes ?? (legacyFields && legacyWarehouseInventory ? ((legacyWarehouseInventory as any)[legacyFields.boxes] || 0) : 0),
        warehouseUnits: warehouseMap.get(itemTypeId)?.units ?? (legacyFields && legacyWarehouseInventory ? ((legacyWarehouseInventory as any)[legacyFields.units] || 0) : 0),
      };

      if (packagingType === "box") {
        if (currentTechnician.technicianBoxes < quantity) {
          return res.status(400).json({
            message: `الكمية غير كافية للصنف ${itemTypeId}. المتاح: ${currentTechnician.technicianBoxes} كرتون`,
          });
        }
        currentTechnician.technicianBoxes -= quantity;
        currentTechnician.warehouseBoxes += quantity;
      } else {
        if (currentTechnician.technicianUnits < quantity) {
          return res.status(400).json({
            message: `الكمية غير كافية للصنف ${itemTypeId}. المتاح: ${currentTechnician.technicianUnits} وحدة`,
          });
        }
        currentTechnician.technicianUnits -= quantity;
        currentTechnician.warehouseUnits += quantity;
      }

      touched.set(itemTypeId, currentTechnician);

      if (legacyFields && legacyTechnicianInventory && legacyWarehouseInventory) {
        if (packagingType === "box") {
          const currentTechLegacy = Number((legacyTechnicianInventory as any)[legacyFields.boxes] || 0);
          const currentWarehouseLegacy = Number((legacyWarehouseInventory as any)[legacyFields.boxes] || 0);
          technicianLegacyUpdates[legacyFields.boxes] = Math.max(0, currentTechLegacy - quantity);
          warehouseLegacyUpdates[legacyFields.boxes] = currentWarehouseLegacy + quantity;
        } else {
          const currentTechLegacy = Number((legacyTechnicianInventory as any)[legacyFields.units] || 0);
          const currentWarehouseLegacy = Number((legacyWarehouseInventory as any)[legacyFields.units] || 0);
          technicianLegacyUpdates[legacyFields.units] = Math.max(0, currentTechLegacy - quantity);
          warehouseLegacyUpdates[legacyFields.units] = currentWarehouseLegacy + quantity;
        }
      }
    }

    for (const [itemTypeId, values] of Array.from(touched.entries())) {
      await storage.upsertTechnicianMovingInventoryEntry(
        technicianId,
        itemTypeId,
        values.technicianBoxes,
        values.technicianUnits
      );

      await storage.upsertWarehouseInventoryEntry(
        data.warehouseId,
        itemTypeId,
        values.warehouseBoxes,
        values.warehouseUnits
      );
    }

    if (legacyTechnicianInventory && Object.keys(technicianLegacyUpdates).length > 0) {
      await storage.updateTechnicianInventory(technicianId, technicianLegacyUpdates as any);
    }

    if (legacyWarehouseInventory && Object.keys(warehouseLegacyUpdates).length > 0) {
      await storage.updateWarehouseInventory(data.warehouseId, warehouseLegacyUpdates as any);
    }

    const totalQuantity = Array.from(aggregated.values()).reduce((sum, item) => sum + item.quantity, 0);

    await storage.logSystemActivity({
      userId: actor.id,
      userName: actor.username,
      userRole: actor.role,
      regionId: actor.regionId || null,
      action: "transfer",
      entityType: "warehouse",
      entityId: data.warehouseId,
      entityName: warehouse.name,
      description: `تم سحب ${totalQuantity} من مخزون الفني ${technician.fullName} إلى المستودع ${warehouse.name}`,
      details: JSON.stringify({
        technicianId,
        technicianName: technician.fullName,
        warehouseId: data.warehouseId,
        warehouseName: warehouse.name,
        items: Array.from(aggregated.values()),
        notes: data.notes || null,
      }),
      severity: "info",
      success: true,
    });

    res.json({
      success: true,
      message: "تم سحب المخزون إلى المستودع بنجاح",
      itemsCount: aggregated.size,
      totalQuantity,
    });
  });

  /**
   * GET /api/technicians/:technicianId/fixed-inventory-entries
   * Get technician's fixed inventory entries
   */
  getFixedInventoryEntries = asyncHandler(async (req: Request, res: Response) => {
    const entries = await storage.getTechnicianFixedInventoryEntries(
      req.params.technicianId
    );
    res.json(entries);
  });

  /**
   * POST /api/technicians/:technicianId/fixed-inventory-entries
   * Upsert technician's fixed inventory entry
   */
  upsertFixedInventoryEntry = asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      itemTypeId: z.string(),
      boxes: z.number().min(0),
      units: z.number().min(0),
    });
    const data = schema.parse(req.body);
    const entry = await storage.upsertTechnicianFixedInventoryEntry(
      req.params.technicianId,
      data.itemTypeId,
      data.boxes,
      data.units
    );
    res.json(entry);
  });

  /**
   * GET /api/technicians/:technicianId/moving-inventory-entries
   * Get technician's moving inventory entries
   */
  getMovingInventoryEntries = asyncHandler(async (req: Request, res: Response) => {
    const entries = await storage.getTechnicianMovingInventoryEntries(
      req.params.technicianId
    );
    res.json(entries);
  });

  /**
   * POST /api/technicians/:technicianId/moving-inventory-entries
   * Upsert technician's moving inventory entry (supports single or batch)
   */
  upsertMovingInventoryEntry = asyncHandler(async (req: Request, res: Response) => {
    const singleSchema = z.object({
      itemTypeId: z.string(),
      boxes: z.number().min(0),
      units: z.number().min(0),
    });
    
    const batchSchema = z.object({
      entries: z.array(singleSchema),
    });
    
    const { technicianId } = req.params;
    
    // Check if it's a batch request with { entries: [...] }
    if (req.body.entries && Array.isArray(req.body.entries)) {
      const { entries } = batchSchema.parse(req.body);
      const results = [];
      for (const entry of entries) {
        const result = await storage.upsertTechnicianMovingInventoryEntry(
          technicianId,
          entry.itemTypeId,
          entry.boxes,
          entry.units
        );
        results.push(result);
      }
      return res.json(results);
    }
    
    // Single entry format
    const data = singleSchema.parse(req.body);
    const entry = await storage.upsertTechnicianMovingInventoryEntry(
      technicianId,
      data.itemTypeId,
      data.boxes,
      data.units
    );
    res.json(entry);
  });

  /**
   * GET /api/admin/all-technicians-inventory
   * Get all technicians with both inventories (admin)
   */
  getAllTechniciansInventory = asyncHandler(async (req: Request, res: Response) => {
    const technicians = await storage.getAllTechniciansWithBothInventories();
    res.json({ technicians });
  });

  /**
   * GET /api/supervisor/technicians-inventory
   * Get supervisor's technicians with inventories
   */
  getSupervisorTechniciansInventory = asyncHandler(
    async (req: Request, res: Response) => {
      const user = req.user!;
      
      // If admin, return all technicians
      if (user.role === 'admin') {
        const technicians = await storage.getAllTechniciansWithBothInventories();
        return res.json({ technicians });
      }
      
      // For supervisors, check regionId
      if (!user.regionId) {
        return res.status(400).json({ 
          success: false,
          message: "المشرف يجب أن يكون مرتبط بمنطقة لعرض البيانات" 
        });
      }
      
      const technicians = await storage.getRegionTechniciansWithInventories(
        user.regionId
      );
      res.json({ technicians });
    }
  );
}

export const techniciansController = new TechniciansController();
