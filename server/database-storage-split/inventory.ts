import { getDatabase } from '../infrastructure/database/connection';
import { inventoryItems } from '../infrastructure/schemas';
import { eq } from 'drizzle-orm';
import type { InventoryItem, InventoryItemWithStatus, InsertInventoryItem } from '../infrastructure/schemas';

export async function getInventoryItems(): Promise<InventoryItemWithStatus[]> {
  const db = getDatabase();
  const items = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      type: inventoryItems.type,
      unit: inventoryItems.unit,
      quantity: inventoryItems.quantity,
      minThreshold: inventoryItems.minThreshold,
      technicianName: inventoryItems.technicianName,
      city: inventoryItems.city,
      regionId: inventoryItems.regionId,
      createdAt: inventoryItems.createdAt,
      updatedAt: inventoryItems.updatedAt,
    })
    .from(inventoryItems)
    .orderBy(inventoryItems.name);

  return items.map(item => ({
    ...item,
    status: item.quantity <= 0 ? ('out' as const) : item.quantity <= item.minThreshold ? ('low' as const) : ('available' as const),
  }));
}

export async function getInventoryItem(id: string): Promise<InventoryItem | undefined> {
  const db = getDatabase();
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, id));
  return item || undefined;
}

export async function createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
  const db = getDatabase();
  const [item] = await db
    .insert(inventoryItems)
    .values({
      ...insertItem,
      quantity: insertItem.quantity ?? 0,
      minThreshold: insertItem.minThreshold ?? 5,
    })
    .returning();
  return item;
}

export async function updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem> {
  const db = getDatabase();
  const [item] = await db
    .update(inventoryItems)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, id))
    .returning();

  if (!item) throw new Error(`Inventory item with id ${id} not found`);
  return item;
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db
    .delete(inventoryItems)
    .where(eq(inventoryItems.id, id));
  return (result.rowCount || 0) > 0;
}
