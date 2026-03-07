import { getDatabase } from '../infrastructure/database/connection';
import { inventoryItems, transactions } from '../infrastructure/schemas';
import { eq } from 'drizzle-orm';
import type { InventoryItem, InsertTransaction } from '../infrastructure/schemas';

export async function addStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
  const db = getDatabase();
  return await db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId));

    if (!item) throw new Error(`Item with id ${itemId} not found`);

    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        quantity: item.quantity + quantity,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId))
      .returning();

    if (userId) {
      await tx.insert(transactions).values({
        itemId,
        type: 'add',
        quantity,
        reason: reason || 'Stock addition',
        userId,
      } as InsertTransaction);
    }

    return updatedItem;
  });
}

export async function withdrawStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
  const db = getDatabase();
  return await db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId));

    if (!item) throw new Error(`Item with id ${itemId} not found`);

    if (item.quantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${item.quantity}, Requested: ${quantity}`);
    }

    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        quantity: item.quantity - quantity,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, itemId))
      .returning();

    if (userId) {
      await tx.insert(transactions).values({
        itemId,
        type: 'withdraw',
        quantity,
        reason: reason || 'Stock withdrawal',
        userId,
      } as InsertTransaction);
    }

    return updatedItem;
  });
}
