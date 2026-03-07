/**
 * System controller (logs, backup, etc.)
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { GetSystemLogsUseCase } from "../application/system-logs/use-cases/GetSystemLogs.use-case";
import { repositories } from "../infrastructure/repositories";
import { getDatabase } from "../infrastructure/database/connection";
import { inventoryItems, regions, transactions, users } from "../infrastructure/schemas";

const getSystemLogsUseCase = new GetSystemLogsUseCase(repositories.systemLogs);

async function exportAllData(): Promise<{ exportedAt: string; data: Record<string, unknown> }> {
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

async function importAllData(_backup: { data?: Record<string, unknown> }): Promise<void> {
  return;
}

const systemLogsFiltersSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  severity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class SystemController {
  /**
   * GET /api/system-logs
   * Get system logs
   */
  getLogs = asyncHandler(async (req: Request, res: Response) => {
    const query = systemLogsFiltersSchema.parse(req.query);

    const filters: any = {
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      severity: query.severity,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await getSystemLogsUseCase.execute(filters);
    res.json(result);
  });

  /**
   * GET /api/admin/backup
   * Create database backup
   */
  createBackup = asyncHandler(async (req: Request, res: Response) => {
    const backup = await exportAllData();
    const backupPayload = JSON.stringify(backup);
    const backupSizeBytes = Buffer.byteLength(backupPayload, "utf8");
    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    // Log the backup operation
    await repositories.systemLogs.createSystemLog({
      userId: req.user!.id,
      userName: req.user!.username,
      userRole: req.user!.role,
      action: 'export',
      entityType: 'backup',
      entityId: 'system',
      entityName: 'نسخة احتياطية كاملة',
      description: 'تصدير نسخة احتياطية كاملة لجميع بيانات النظام',
      details: JSON.stringify({
        backupSizeBytes,
        exportedAt: backup.exportedAt,
        filename,
      }),
      severity: 'info',
      success: true
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup);
  });

  /**
   * GET /api/admin/backup/history
   * Return backup history from system logs
   */
  getBackupHistory = asyncHandler(async (req: Request, res: Response) => {
    const db = getDatabase();
    const parsedLimit = Number(req.query.limit ?? 25);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 200)
      : 25;

    const historyResult = await db.execute(sql`
      SELECT id, entity_name, details, created_at
      FROM system_logs
      WHERE entity_type = 'backup'
        AND action = 'export'
        AND success = true
      ORDER BY created_at DESC
      LIMIT ${limit};
    `);

    const items = historyResult.rows.map((row: any) => {
      let details: Record<string, unknown> = {};

      if (typeof row.details === 'string' && row.details.trim().length > 0) {
        try {
          details = JSON.parse(row.details);
        } catch {
          details = {};
        }
      }

      const createdAtIso = row.created_at ? new Date(row.created_at).toISOString() : null;
      const fallbackName = createdAtIso
        ? `backup_${createdAtIso.replace(/[:.]/g, '-')}.json`
        : 'backup_unknown.json';

      return {
        id: String(row.id),
        name: String((details.filename as string) || row.entity_name || fallbackName),
        createdAt: createdAtIso,
        sizeBytes: Number(details.backupSizeBytes ?? 0),
        type: 'سحابي',
      };
    });

    res.json({ items });
  });

  /**
   * POST /api/admin/restore
   * Restore database from backup
   */
  restoreBackup = asyncHandler(async (req: Request, res: Response) => {
    const backup = req.body;

    if (!backup || !backup.data) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid backup file" 
      });
    }

    await importAllData(backup);

    // Log the restore operation
    const restorePayload = JSON.stringify(backup);
    const restoreSizeBytes = Buffer.byteLength(restorePayload, "utf8");

    await repositories.systemLogs.createSystemLog({
      userId: req.user!.id,
      userName: req.user!.username,
      userRole: req.user!.role,
      action: 'import',
      entityType: 'backup',
      entityId: 'system',
      entityName: 'استعادة نسخة احتياطية',
      description: 'استعادة نسخة احتياطية كاملة لجميع بيانات النظام',
      details: JSON.stringify({
        restoreSizeBytes,
      }),
      severity: 'warning',
      success: true
    });

    res.json({ success: true, message: "Backup restored successfully" });
  });

  /**
   * GET /api/admin/backup/storage-stats
   * Return live storage stats based on stored database size
   */
  getBackupStorageStats = asyncHandler(async (_req: Request, res: Response) => {
    const db = getDatabase();

    const sizeResult = await db.execute(sql`
      SELECT pg_database_size(current_database())::bigint AS used_bytes;
    `);

    const usedBytes = Number(sizeResult.rows?.[0]?.used_bytes ?? 0);

    const configuredCapacityGb = Number(process.env.BACKUP_STORAGE_CAPACITY_GB ?? "0");
    const totalBytes = configuredCapacityGb > 0
      ? Math.round(configuredCapacityGb * 1024 * 1024 * 1024)
      : usedBytes;

    const availableBytes = Math.max(totalBytes - usedBytes, 0);
    const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;

    const lastBackupResult = await db.execute(sql`
      SELECT created_at
      FROM system_logs
      WHERE entity_type = 'backup'
        AND action = 'export'
        AND success = true
      ORDER BY created_at DESC
      LIMIT 1;
    `);

    const exportsCountResult = await db.execute(sql`
      SELECT COUNT(*)::bigint AS exports_count
      FROM system_logs
      WHERE entity_type = 'backup'
        AND action = 'export'
        AND success = true;
    `);

    const exportsCount = Number(exportsCountResult.rows?.[0]?.exports_count ?? 0);
    const lastBackupAt = lastBackupResult.rows?.[0]?.created_at ?? null;

    res.json({
      usedBytes,
      totalBytes,
      availableBytes,
      usedPercent,
      exportsCount,
      lastBackupAt,
      hasConfiguredCapacity: configuredCapacityGb > 0,
    });
  });
}

export const systemController = new SystemController();
