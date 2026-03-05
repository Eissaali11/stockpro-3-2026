import { and, desc, eq, sql } from 'drizzle-orm';
import { getDatabase } from '../infrastructure/database/connection';
import { repositories } from '../infrastructure/repositories';
import {
  stockMovements,
  technicianFixedInventories,
  technicianFixedInventoryEntries,
  users,
  type FixedInventorySummary,
  type InsertStockMovement,
  type InsertTechnicianFixedInventory,
  type InsertTechnicianFixedInventoryEntry,
  type StockMovement,
  type StockMovementWithDetails,
  type TechnicianFixedInventory,
  type TechnicianFixedInventoryEntry,
  type TechnicianWithFixedInventory,
} from '../infrastructure/schemas';

export async function getTechnicianFixedInventory(technicianId: string): Promise<TechnicianFixedInventory | undefined> {
  const db = getDatabase();
  const [inventory] = await db
    .select()
    .from(technicianFixedInventories)
    .where(eq(technicianFixedInventories.technicianId, technicianId));
  return inventory || undefined;
}

export async function createTechnicianFixedInventory(data: InsertTechnicianFixedInventory): Promise<TechnicianFixedInventory> {
  const db = getDatabase();
  const [inventory] = await db
    .insert(technicianFixedInventories)
    .values(data)
    .returning();
  return inventory;
}

export async function updateTechnicianFixedInventory(
  technicianId: string,
  updates: Partial<InsertTechnicianFixedInventory>
): Promise<TechnicianFixedInventory> {
  const db = getDatabase();
  const [inventory] = await db
    .update(technicianFixedInventories)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(technicianFixedInventories.technicianId, technicianId))
    .returning();

  if (!inventory) {
    throw new Error(`Technician fixed inventory for technician ${technicianId} not found`);
  }
  return inventory;
}

export async function deleteTechnicianFixedInventory(technicianId: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db
    .delete(technicianFixedInventories)
    .where(eq(technicianFixedInventories.technicianId, technicianId));
  return (result.rowCount || 0) > 0;
}

export async function getAllTechniciansWithFixedInventory(): Promise<TechnicianWithFixedInventory[]> {
  const db = getDatabase();
  const technicians = await db
    .select({
      technicianId: users.id,
      technicianName: users.fullName,
      city: users.city,
    })
    .from(users)
    .where(eq(users.role, 'technician'));

  const result: TechnicianWithFixedInventory[] = [];
  for (const technician of technicians) {
    const fixedInventory = await getTechnicianFixedInventory(technician.technicianId);
    result.push({
      technicianId: technician.technicianId,
      technicianName: technician.technicianName,
      city: technician.city || 'غير محدد',
      fixedInventory: fixedInventory || null,
      alertLevel: 'good',
    });
  }

  return result;
}

export async function getFixedInventorySummary(): Promise<FixedInventorySummary> {
  const db = getDatabase();
  const [summary] = await db
    .select({
      totalN950: sql<number>`COALESCE(SUM(${technicianFixedInventories.n950Boxes} + ${technicianFixedInventories.n950Units}), 0)`,
      totalI9000s: sql<number>`COALESCE(SUM(${technicianFixedInventories.i9000sBoxes} + ${technicianFixedInventories.i9000sUnits}), 0)`,
      totalI9100: sql<number>`COALESCE(SUM(${technicianFixedInventories.i9100Boxes} + ${technicianFixedInventories.i9100Units}), 0)`,
      totalRollPaper: sql<number>`COALESCE(SUM(${technicianFixedInventories.rollPaperBoxes} + ${technicianFixedInventories.rollPaperUnits}), 0)`,
      totalStickers: sql<number>`COALESCE(SUM(${technicianFixedInventories.stickersBoxes} + ${technicianFixedInventories.stickersUnits}), 0)`,
      totalNewBatteries: sql<number>`COALESCE(SUM(${technicianFixedInventories.newBatteriesBoxes} + ${technicianFixedInventories.newBatteriesUnits}), 0)`,
      totalMobilySim: sql<number>`COALESCE(SUM(${technicianFixedInventories.mobilySimBoxes} + ${technicianFixedInventories.mobilySimUnits}), 0)`,
      totalStcSim: sql<number>`COALESCE(SUM(${technicianFixedInventories.stcSimBoxes} + ${technicianFixedInventories.stcSimUnits}), 0)`,
      totalZainSim: sql<number>`COALESCE(SUM(${technicianFixedInventories.zainSimBoxes} + ${technicianFixedInventories.zainSimUnits}), 0)`,
      techniciansWithCriticalStock: sql<number>`0`,
      techniciansWithWarningStock: sql<number>`0`,
      techniciansWithGoodStock: sql<number>`COUNT(*)`,
    })
    .from(technicianFixedInventories);

  return {
    totalN950: Number(summary?.totalN950 || 0),
    totalI9000s: Number(summary?.totalI9000s || 0),
    totalI9100: Number(summary?.totalI9100 || 0),
    totalRollPaper: Number(summary?.totalRollPaper || 0),
    totalStickers: Number(summary?.totalStickers || 0),
    totalNewBatteries: Number(summary?.totalNewBatteries || 0),
    totalMobilySim: Number(summary?.totalMobilySim || 0),
    totalStcSim: Number(summary?.totalStcSim || 0),
    totalZainSim: Number(summary?.totalZainSim || 0),
    techniciansWithCriticalStock: Number(summary?.techniciansWithCriticalStock || 0),
    techniciansWithWarningStock: Number(summary?.techniciansWithWarningStock || 0),
    techniciansWithGoodStock: Number(summary?.techniciansWithGoodStock || 0),
  };
}

export async function getAllTechniciansWithBothInventories(): Promise<any[]> {
  const db = getDatabase();
  const technicians = await db
    .select({
      technicianId: users.id,
      technicianName: users.fullName,
      city: users.city,
      regionId: users.regionId,
    })
    .from(users)
    .where(eq(users.role, 'technician'));

  const result: any[] = [];
  for (const technician of technicians) {
    const fixedInventory = await getTechnicianFixedInventory(technician.technicianId);
    const movingInventory = await repositories.technicianInventory.getTechnicianInventory(technician.technicianId);

    result.push({
      ...technician,
      city: technician.city || 'غير محدد',
      fixedInventory: fixedInventory || null,
      movingInventory: movingInventory || null,
      alertLevel: 'good',
    });
  }

  return result;
}

export async function getRegionTechniciansWithInventories(regionId: string): Promise<any[]> {
  const allTechnicians = await getAllTechniciansWithBothInventories();
  return allTechnicians.filter((technician) => technician.regionId === regionId);
}

export async function createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
  const db = getDatabase();
  const [created] = await db
    .insert(stockMovements)
    .values(movement)
    .returning();
  return created;
}

export async function getStockMovements(
  technicianId?: string,
  limit: number = 50
): Promise<StockMovementWithDetails[]> {
  const db = getDatabase();
  let query = db
    .select({
      id: stockMovements.id,
      technicianId: stockMovements.technicianId,
      itemType: stockMovements.itemType,
      packagingType: stockMovements.packagingType,
      quantity: stockMovements.quantity,
      fromInventory: stockMovements.fromInventory,
      toInventory: stockMovements.toInventory,
      reason: stockMovements.reason,
      performedBy: stockMovements.performedBy,
      notes: stockMovements.notes,
      createdAt: stockMovements.createdAt,
      technicianName: users.fullName,
    })
    .from(stockMovements)
    .leftJoin(users, eq(stockMovements.technicianId, users.id))
    .$dynamic();

  if (technicianId) {
    query = query.where(eq(stockMovements.technicianId, technicianId));
  }

  const rows = await query
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    technicianName: row.technicianName || undefined,
    performedByName: undefined,
    itemNameAr: row.itemType,
  }));
}

export async function getStockMovementsByRegion(regionId: string): Promise<StockMovementWithDetails[]> {
  const db = getDatabase();
  const rows = await db
    .select({
      id: stockMovements.id,
      technicianId: stockMovements.technicianId,
      itemType: stockMovements.itemType,
      packagingType: stockMovements.packagingType,
      quantity: stockMovements.quantity,
      fromInventory: stockMovements.fromInventory,
      toInventory: stockMovements.toInventory,
      reason: stockMovements.reason,
      performedBy: stockMovements.performedBy,
      notes: stockMovements.notes,
      createdAt: stockMovements.createdAt,
      technicianName: users.fullName,
    })
    .from(stockMovements)
    .leftJoin(users, eq(stockMovements.technicianId, users.id))
    .where(eq(users.regionId, regionId))
    .orderBy(desc(stockMovements.createdAt));

  return rows.map((row) => ({
    ...row,
    technicianName: row.technicianName || undefined,
    performedByName: undefined,
    itemNameAr: row.itemType,
  }));
}

export async function getStockMovementsByTechnician(technicianId: string): Promise<StockMovementWithDetails[]> {
  return getStockMovements(technicianId);
}

export async function getTechnicianFixedInventoryEntries(technicianId: string): Promise<TechnicianFixedInventoryEntry[]> {
  const db = getDatabase();
  return db
    .select()
    .from(technicianFixedInventoryEntries)
    .where(eq(technicianFixedInventoryEntries.technicianId, technicianId));
}

export async function upsertTechnicianFixedInventoryEntry(
  technicianId: string,
  itemTypeId: string,
  boxes: number,
  units: number
): Promise<TechnicianFixedInventoryEntry> {
  const db = getDatabase();
  const [existing] = await db
    .select()
    .from(technicianFixedInventoryEntries)
    .where(and(
      eq(technicianFixedInventoryEntries.technicianId, technicianId),
      eq(technicianFixedInventoryEntries.itemTypeId, itemTypeId)
    ));

  if (existing) {
    const [updated] = await db
      .update(technicianFixedInventoryEntries)
      .set({ boxes, units, updatedAt: new Date() })
      .where(eq(technicianFixedInventoryEntries.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(technicianFixedInventoryEntries)
    .values({
      technicianId,
      itemTypeId,
      boxes,
      units,
    } as InsertTechnicianFixedInventoryEntry)
    .returning();

  return created;
}
