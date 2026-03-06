import type { IInventoryEntriesRepository, InventoryEntryInput } from '../../../application/inventory/contracts/IInventoryEntriesRepository';
import type {
  TechnicianFixedInventoryEntry,
  TechnicianMovingInventoryEntry,
  WarehouseInventoryEntry,
} from '../../../infrastructure/schemas';
import { and, eq } from 'drizzle-orm';
import { getDatabase } from '../../database/connection';
import { technicianFixedInventoryEntries } from '../../schemas';
import { TechnicianInventoryRepository } from '../TechnicianInventoryRepository';
import { WarehouseInventoryRepository } from '../WarehouseInventoryRepository';

export class DrizzleInventoryEntriesRepository implements IInventoryEntriesRepository {
  private get db() {
    return getDatabase();
  }

  private readonly warehouseInventory = new WarehouseInventoryRepository();
  private readonly technicianInventory = new TechnicianInventoryRepository();

  async getWarehouseEntries(warehouseId: string): Promise<WarehouseInventoryEntry[]> {
    return this.warehouseInventory.getWarehouseInventoryEntries(warehouseId);
  }

  async upsertWarehouseEntry(warehouseId: string, input: InventoryEntryInput): Promise<WarehouseInventoryEntry> {
    return this.warehouseInventory.upsertWarehouseInventoryEntry(
      warehouseId,
      input.itemTypeId,
      input.boxes,
      input.units,
    );
  }

  async getTechnicianFixedEntries(technicianId: string): Promise<TechnicianFixedInventoryEntry[]> {
    return this.db
      .select()
      .from(technicianFixedInventoryEntries)
      .where(eq(technicianFixedInventoryEntries.technicianId, technicianId));
  }

  async upsertTechnicianFixedEntry(
    technicianId: string,
    input: InventoryEntryInput,
  ): Promise<TechnicianFixedInventoryEntry> {
    const [existing] = await this.db
      .select()
      .from(technicianFixedInventoryEntries)
      .where(and(
        eq(technicianFixedInventoryEntries.technicianId, technicianId),
        eq(technicianFixedInventoryEntries.itemTypeId, input.itemTypeId),
      ));

    if (existing) {
      const [updated] = await this.db
        .update(technicianFixedInventoryEntries)
        .set({
          boxes: input.boxes,
          units: input.units,
          updatedAt: new Date(),
        })
        .where(eq(technicianFixedInventoryEntries.id, existing.id))
        .returning();

      return updated;
    }

    const [created] = await this.db
      .insert(technicianFixedInventoryEntries)
      .values({
        technicianId,
        itemTypeId: input.itemTypeId,
        boxes: input.boxes,
        units: input.units,
      })
      .returning();

    return created;
  }

  async getTechnicianMovingEntries(technicianId: string): Promise<TechnicianMovingInventoryEntry[]> {
    return this.technicianInventory.getTechnicianMovingInventoryEntries(technicianId);
  }

  async upsertTechnicianMovingEntry(
    technicianId: string,
    input: InventoryEntryInput,
  ): Promise<TechnicianMovingInventoryEntry> {
    return this.technicianInventory.upsertTechnicianMovingInventoryEntry(
      technicianId,
      input.itemTypeId,
      input.boxes,
      input.units,
    );
  }
}
