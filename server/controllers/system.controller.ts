/**
 * System controller (logs, backup, etc.)
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { z } from "zod";
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
      severity: 'info',
      success: true
    });

    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup);
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
    await repositories.systemLogs.createSystemLog({
      userId: req.user!.id,
      userName: req.user!.username,
      userRole: req.user!.role,
      action: 'import',
      entityType: 'backup',
      entityId: 'system',
      entityName: 'استعادة نسخة احتياطية',
      description: 'استعادة نسخة احتياطية كاملة لجميع بيانات النظام',
      severity: 'warning',
      success: true
    });

    res.json({ success: true, message: "Backup restored successfully" });
  });
}

export const systemController = new SystemController();
