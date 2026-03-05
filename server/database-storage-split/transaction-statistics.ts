import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { getDatabase } from '../infrastructure/database/connection';
import { regions, transactions, users } from '../infrastructure/schemas';

export async function getTransactionStatistics(filters?: {
  startDate?: string;
  endDate?: string;
  regionId?: string;
}): Promise<{
  totalTransactions: number;
  totalAdditions: number;
  totalWithdrawals: number;
  totalAddedQuantity: number;
  totalWithdrawnQuantity: number;
  byRegion: Array<{ regionName: string; count: number }>;
  byUser: Array<{ userName: string; count: number }>;
  totalInbound: number;
  totalOutbound: number;
  totalAdjustment: number;
  totalTransfer: number;
}> {
  const db = getDatabase();
  const conditions: any[] = [];

  if (filters?.regionId) {
    conditions.push(eq(users.regionId, filters.regionId));
  }

  if (filters?.startDate) {
    const startDate = new Date(filters.startDate);
    if (!Number.isNaN(startDate.getTime())) {
      conditions.push(gte(transactions.createdAt, startDate));
    }
  }

  if (filters?.endDate) {
    const endDate = new Date(filters.endDate);
    if (!Number.isNaN(endDate.getTime())) {
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(transactions.createdAt, endDate));
    }
  }

  let totalsQuery = db
    .select({
      totalTransactions: sql<number>`COUNT(*)`,
      totalAdditions: sql<number>`COUNT(CASE WHEN ${transactions.type} IN ('add', 'inbound') THEN 1 END)`,
      totalWithdrawals: sql<number>`COUNT(CASE WHEN ${transactions.type} IN ('withdraw', 'outbound') THEN 1 END)`,
      totalAddedQuantity: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} IN ('add', 'inbound') THEN ${transactions.quantity} ELSE 0 END), 0)`,
      totalWithdrawnQuantity: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} IN ('withdraw', 'outbound') THEN ${transactions.quantity} ELSE 0 END), 0)`,
      totalAdjustment: sql<number>`COUNT(CASE WHEN ${transactions.type} = 'adjustment' THEN 1 END)`,
      totalTransfer: sql<number>`COUNT(CASE WHEN ${transactions.type} = 'transfer' THEN 1 END)`,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .$dynamic();

  if (conditions.length > 0) {
    totalsQuery = totalsQuery.where(and(...conditions));
  }

  const [totals] = await totalsQuery;

  let byRegionQuery = db
    .select({
      regionName: sql<string>`COALESCE(${regions.name}, 'غير محدد')`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .leftJoin(regions, eq(users.regionId, regions.id))
    .$dynamic();

  if (conditions.length > 0) {
    byRegionQuery = byRegionQuery.where(and(...conditions));
  }

  const byRegionRows = await byRegionQuery
    .groupBy(regions.id, regions.name)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  let byUserQuery = db
    .select({
      userName: sql<string>`COALESCE(${users.fullName}, 'غير محدد')`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .$dynamic();

  if (conditions.length > 0) {
    byUserQuery = byUserQuery.where(and(...conditions));
  }

  const byUserRows = await byUserQuery
    .groupBy(users.id, users.fullName)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  const totalAdditions = Number(totals?.totalAdditions || 0);
  const totalWithdrawals = Number(totals?.totalWithdrawals || 0);

  return {
    totalTransactions: Number(totals?.totalTransactions || 0),
    totalAdditions,
    totalWithdrawals,
    totalAddedQuantity: Number(totals?.totalAddedQuantity || 0),
    totalWithdrawnQuantity: Number(totals?.totalWithdrawnQuantity || 0),
    byRegion: byRegionRows.map((row) => ({
      regionName: row.regionName || 'غير محدد',
      count: Number(row.count || 0),
    })),
    byUser: byUserRows.map((row) => ({
      userName: row.userName || 'غير محدد',
      count: Number(row.count || 0),
    })),
    totalInbound: totalAdditions,
    totalOutbound: totalWithdrawals,
    totalAdjustment: Number(totals?.totalAdjustment || 0),
    totalTransfer: Number(totals?.totalTransfer || 0),
  };
}
