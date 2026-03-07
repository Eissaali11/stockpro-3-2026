import { getDatabase } from '../infrastructure/database/connection';
import { inventoryItems, transactions, users, regions } from '../infrastructure/schemas';
import { eq, gte, sql } from 'drizzle-orm';
import type { DashboardStats, AdminStats } from '../infrastructure/schemas';

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDatabase();
  const [{ totalItems }] = await db
    .select({ totalItems: sql<number>`count(*)` })
    .from(inventoryItems);

  const [{ lowStockItems }] = await db
    .select({ lowStockItems: sql<number>`count(*)` })
    .from(inventoryItems)
    .where(sql`${inventoryItems.quantity} <= ${inventoryItems.minThreshold}`);

  const [{ outOfStockItems }] = await db
    .select({ outOfStockItems: sql<number>`count(*)` })
    .from(inventoryItems)
    .where(sql`${inventoryItems.quantity} <= 0`);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [{ todayTransactions }] = await db
    .select({ todayTransactions: sql<number>`count(*)` })
    .from(transactions)
    .where(gte(transactions.createdAt, startOfToday));
  
  const [{ totalRegions }] = await db
    .select({ totalRegions: sql<number>`count(*)` })
    .from(regions);

  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.isActive, true));

  return {
    totalItems: Number(totalItems),
    lowStockItems: Number(lowStockItems),
    outOfStockItems: Number(outOfStockItems),
    todayTransactions: Number(todayTransactions),
    totalRegions: Number(totalRegions),
    totalUsers: Number(totalUsers),
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = getDatabase();
  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`count(*)` })
    .from(users);

  const [{ activeUsers }] = await db
    .select({ activeUsers: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.isActive, true));

  const [{ totalRegions }] = await db
    .select({ totalRegions: sql<number>`count(*)` })
    .from(regions);

  const [{ totalTransactions }] = await db
    .select({ totalTransactions: sql<number>`count(*)` })
    .from(transactions);

  const recentTransactions = await db
    .select()
    .from(transactions)
    .orderBy(sql`${transactions.createdAt} desc`)
    .limit(10);

  return {
    totalUsers: Number(totalUsers),
    activeUsers: Number(activeUsers),
    totalRegions: Number(totalRegions),
    totalTransactions: Number(totalTransactions),
    recentTransactions,
  };
}
