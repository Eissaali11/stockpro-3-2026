import { getDatabase } from '../infrastructure/database/connection';
import { regions, users, inventoryItems } from '../infrastructure/schemas';
import { eq, and, sql } from 'drizzle-orm';
import type { Region, RegionWithStats, InsertRegion } from '../infrastructure/schemas';

export async function getRegions(): Promise<RegionWithStats[]> {
  const db = getDatabase();
  const regionList = await db
    .select()
    .from(regions)
    .orderBy(regions.name);

  const result: RegionWithStats[] = [];
  for (const region of regionList) {
    const [{ itemCount }] = await db
      .select({ itemCount: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(eq(inventoryItems.regionId, region.id));

    const [{ totalQuantity }] = await db
      .select({ totalQuantity: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)` })
      .from(inventoryItems)
      .where(eq(inventoryItems.regionId, region.id));

    const [{ lowStockCount }] = await db
      .select({ lowStockCount: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.regionId, region.id),
          sql`${inventoryItems.quantity} <= ${inventoryItems.minThreshold}`
        )
      );

    result.push({
      ...region,
      itemCount: Number(itemCount),
      totalQuantity: Number(totalQuantity),
      lowStockCount: Number(lowStockCount),
    });
  }
  return result;
}

export async function getRegion(id: string): Promise<Region | undefined> {
  const db = getDatabase();
  const [region] = await db
    .select()
    .from(regions)
    .where(eq(regions.id, id));
  return region || undefined;
}

export async function createRegion(insertRegion: InsertRegion): Promise<Region> {
  const db = getDatabase();
  const [region] = await db
    .insert(regions)
    .values(insertRegion)
    .returning();
  return region;
}

export async function updateRegion(id: string, updates: Partial<InsertRegion>): Promise<Region> {
  const db = getDatabase();
  const [region] = await db
    .update(regions)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(regions.id, id))
    .returning();

  if (!region) throw new Error(`Region with id ${id} not found`);
  return region;
}

export async function deleteRegion(id: string): Promise<boolean> {
  const db = getDatabase();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.regionId, id));

  if (Number(count) > 0) {
    throw new Error(`Cannot delete region with existing users`);
  }

  const result = await db
    .delete(regions)
    .where(eq(regions.id, id));
  return (result.rowCount || 0) > 0;
}
