import { eq, sql } from 'drizzle-orm';
import { getDatabase } from '../infrastructure/database/connection';
import { inventoryItems, regions, transactions, users, type AdminStats } from '../infrastructure/schemas';
import { getRecentTransactions } from './transactions';

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

  const recentTransactions = await getRecentTransactions(10);

  return {
    totalUsers: Number(totalUsers),
    activeUsers: Number(activeUsers),
    totalRegions: Number(totalRegions),
    totalTransactions: Number(totalTransactions),
    recentTransactions,
  };
}

export async function exportAllData(): Promise<{ exportedAt: string; data: Record<string, unknown> }> {
  const db = getDatabase();

  const [allUsers, allRegions, allItems, allTransactions] = await Promise.all([
    db.select().from(users),
    db.select().from(regions),
    db.select().from(inventoryItems),
    db.select().from(transactions),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    data: {
      users: allUsers,
      regions: allRegions,
      inventoryItems: allItems,
      transactions: allTransactions,
    },
  };
}

export async function importAllData(_backup: { data?: Record<string, unknown> }): Promise<void> {
  return;
}
