import { getDatabase } from '../infrastructure/database/connection';
import { transactions, inventoryItems, users, regions } from '../infrastructure/schemas';
import { eq, desc, and, or, gte, lte, ilike, sql } from 'drizzle-orm';
import type { Transaction, InsertTransaction, TransactionWithDetails } from '../infrastructure/schemas';

export async function getTransactions(filters?: {
  page?: number;
  limit?: number;
  type?: string;
  userId?: string;
  regionId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<{
  transactions: TransactionWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const db = getDatabase();
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const offset = (page - 1) * limit;

  const query = db
    .select({
      id: transactions.id,
      itemId: transactions.itemId,
      userId: transactions.userId,
      type: transactions.type,
      quantity: transactions.quantity,
      reason: transactions.reason,
      createdAt: transactions.createdAt,
      itemName: inventoryItems.name,
      userName: users.fullName,
      regionName: regions.name,
    })
    .from(transactions)
    .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
    .leftJoin(users, eq(transactions.userId, users.id))
    .leftJoin(regions, eq(inventoryItems.regionId, regions.id))
    .$dynamic();

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
    .leftJoin(users, eq(transactions.userId, users.id))
    .leftJoin(regions, eq(inventoryItems.regionId, regions.id))
    .$dynamic();

  const conditions: any[] = [];

  if (filters?.type) conditions.push(eq(transactions.type, filters.type));
  if (filters?.userId) conditions.push(eq(transactions.userId, filters.userId));
  if (filters?.regionId) conditions.push(eq(inventoryItems.regionId, filters.regionId));
  if (filters?.startDate) conditions.push(gte(transactions.createdAt, new Date(filters.startDate)));
  if (filters?.endDate) conditions.push(lte(transactions.createdAt, new Date(filters.endDate)));
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(inventoryItems.name, searchTerm),
        ilike(users.fullName, searchTerm),
        ilike(transactions.reason, searchTerm)
      )
    );
  }

  let finalQuery = query;
  let finalCountQuery = countQuery;
  if (conditions.length > 0) {
    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
    finalQuery = query.where(whereCondition);
    finalCountQuery = countQuery.where(whereCondition);
  }

  const [{ count }] = await finalCountQuery;
  const total = Number(count || 0);

  const allTransactions = await finalQuery
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  const processedTransactions = allTransactions.map(transaction => ({
    ...transaction,
    itemName: transaction.itemName || "صنف محذوف",
    userName: transaction.userName || "غير محدد",
    regionName: transaction.regionName || "غير محدد",
  }));

  return {
    transactions: processedTransactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
  const db = getDatabase();
  const [transaction] = await db
    .insert(transactions)
    .values(insertTransaction)
    .returning();
  return transaction;
}

export async function getRecentTransactions(limit: number = 10): Promise<TransactionWithDetails[]> {
  const db = getDatabase();
  const recentTransactions = await db
    .select({
      id: transactions.id,
      itemId: transactions.itemId,
      type: transactions.type,
      quantity: transactions.quantity,
      reason: transactions.reason,
      userId: transactions.userId,
      createdAt: transactions.createdAt,
      itemName: inventoryItems.name,
      userName: users.fullName,
    })
    .from(transactions)
    .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
    .leftJoin(users, eq(transactions.userId, users.id))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);

  return recentTransactions.map(t => ({
    ...t,
    itemName: t.itemName || undefined,
    userName: t.userName || undefined,
  }));
}
