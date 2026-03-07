import type { SystemLog, InsertSystemLog } from '../infrastructure/schemas';
import { repositories } from '../infrastructure/repositories';

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
  return repositories.systemLogs.getSystemLogs(filters);
}

export async function createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
  return repositories.systemLogs.createSystemLog(log);
}
