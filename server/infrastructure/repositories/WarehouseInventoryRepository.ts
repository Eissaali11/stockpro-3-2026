import { eq, and } from "drizzle-orm";
import { getDatabase } from "../database/connection";
import {
  warehouseInventoryEntries,
  WarehouseInventoryEntry,
  InsertWarehouseInventoryEntry,
} from "../schemas";

export interface IWarehouseInventoryRepository {
  getWarehouseInventoryEntries(warehouseId: string): Promise<WarehouseInventoryEntry[]>;
  createWarehouseInventoryEntry(entry: InsertWarehouseInventoryEntry): Promise<WarehouseInventoryEntry>;
  updateWarehouseInventoryEntry(id: string, updates: Partial<InsertWarehouseInventoryEntry>): Promise<WarehouseInventoryEntry>;
  deleteWarehouseInventoryEntry(id: string): Promise<boolean>;
  upsertWarehouseInventoryEntry(warehouseId: string, itemTypeId: string, boxes: number, units: number): Promise<WarehouseInventoryEntry>;
}

/**
 * Warehouse Inventory Repository Implementation
 * Handles all warehouse inventory entries (new system)
 */
export class WarehouseInventoryRepository implements IWarehouseInventoryRepository {
  private get db() {
    return getDatabase();
  }

  async getWarehouseInventoryEntries(warehouseId: string): Promise<WarehouseInventoryEntry[]> {
    return await this.db
      .select()
      .from(warehouseInventoryEntries)
      .where(eq(warehouseInventoryEntries.warehouseId, warehouseId));
  }

  async createWarehouseInventoryEntry(entry: InsertWarehouseInventoryEntry): Promise<WarehouseInventoryEntry> {
    const [created] = await this.db
      .insert(warehouseInventoryEntries)
      .values(entry)
      .returning();
    return created;
  }

  async updateWarehouseInventoryEntry(id: string, updates: Partial<InsertWarehouseInventoryEntry>): Promise<WarehouseInventoryEntry> {
    const [updated] = await this.db
      .update(warehouseInventoryEntries)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(warehouseInventoryEntries.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Warehouse inventory entry with id ${id} not found`);
    }
    return updated;
  }

  async deleteWarehouseInventoryEntry(id: string): Promise<boolean> {
    const result = await this.db
      .delete(warehouseInventoryEntries)
      .where(eq(warehouseInventoryEntries.id, id));
    return (result.rowCount || 0) > 0;
  }

  async upsertWarehouseInventoryEntry(warehouseId: string, itemTypeId: string, boxes: number, units: number): Promise<WarehouseInventoryEntry> {
    const [existing] = await this.db
      .select()
      .from(warehouseInventoryEntries)
      .where(and(
        eq(warehouseInventoryEntries.warehouseId, warehouseId),
        eq(warehouseInventoryEntries.itemTypeId, itemTypeId)
      ));

    if (existing) {
      return await this.updateWarehouseInventoryEntry(existing.id, { boxes, units });
    } else {
      return await this.createWarehouseInventoryEntry({ warehouseId, itemTypeId, boxes, units });
    }
  }
}