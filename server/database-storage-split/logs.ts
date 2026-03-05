import { getDatabase } from '../infrastructure/database/connection';
import { systemLogs } from '../infrastructure/schemas';
import type { SystemLog, InsertSystemLog } from '../infrastructure/schemas';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export async function getSystemLogs(filters?: {
  limit?: number;
  offset?: number;
  userId?: string;
  regionId?: string;
  action?: string;
  entityType?: string;
  severity?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}): Promise<SystemLog[]> {
  const db = getDatabase();
  let query = db.select().from(systemLogs).$dynamic();

  const conditions: any[] = [];
  if (filters?.userId) conditions.push(eq(systemLogs.userId, filters.userId));
  if (filters?.regionId) conditions.push(eq(systemLogs.regionId, filters.regionId));
  if (filters?.action) conditions.push(eq(systemLogs.action, filters.action));
  if (filters?.entityType) conditions.push(eq(systemLogs.entityType, filters.entityType));
  if (filters?.severity) conditions.push(eq(systemLogs.severity, filters.severity));
  if (filters?.startDate) conditions.push(gte(systemLogs.createdAt, new Date(filters.startDate)));
  if (filters?.endDate) conditions.push(lte(systemLogs.createdAt, new Date(filters.endDate)));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.offset(filters.offset);

  const rows = await query.orderBy(desc(systemLogs.createdAt));
  return rows;
}

export async function createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
  const db = getDatabase();
  const [created] = await db.insert(systemLogs).values(log).returning();
  return created;
}
