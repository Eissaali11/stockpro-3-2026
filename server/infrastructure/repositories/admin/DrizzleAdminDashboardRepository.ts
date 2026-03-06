import type {
  FixedInventorySummary,
  InventoryRequest,
  TechnicianWithBothInventories,
  TechnicianWithFixedInventory,
} from '@shared/schema';
import { sql } from 'drizzle-orm';
import type { IAdminDashboardRepository } from '../../../application/admin/contracts/IAdminDashboardRepository';
import { getDatabase } from '../../database/connection';
import { technicianFixedInventories, users } from '../../schemas';
import { repositories } from '../../repositories';
import { TechnicianService } from '../../../services/technician.service';
import { DrizzleStockFixedInventoryRepository } from '../inventory/DrizzleStockFixedInventoryRepository';

export class DrizzleAdminDashboardRepository implements IAdminDashboardRepository {
  private readonly technicianService = new TechnicianService();
  private readonly fixedInventoryRepository = new DrizzleStockFixedInventoryRepository();

  private get db() {
    return getDatabase();
  }

  async getAllTechniciansWithFixedInventory(): Promise<TechnicianWithFixedInventory[]> {
    return this.technicianService.getAllTechniciansWithFixedInventory();
  }

  async getFixedInventorySummary(): Promise<FixedInventorySummary> {
    const [summary] = await this.db
      .select({
        totalN950: sql<number>`COALESCE(SUM(${technicianFixedInventories.n950Boxes} + ${technicianFixedInventories.n950Units}), 0)`,
        totalI9000s: sql<number>`COALESCE(SUM(${technicianFixedInventories.i9000sBoxes} + ${technicianFixedInventories.i9000sUnits}), 0)`,
        totalI9100: sql<number>`COALESCE(SUM(${technicianFixedInventories.i9100Boxes} + ${technicianFixedInventories.i9100Units}), 0)`,
        totalRollPaper: sql<number>`COALESCE(SUM(${technicianFixedInventories.rollPaperBoxes} + ${technicianFixedInventories.rollPaperUnits}), 0)`,
        totalStickers: sql<number>`COALESCE(SUM(${technicianFixedInventories.stickersBoxes} + ${technicianFixedInventories.stickersUnits}), 0)`,
        totalNewBatteries: sql<number>`COALESCE(SUM(${technicianFixedInventories.newBatteriesBoxes} + ${technicianFixedInventories.newBatteriesUnits}), 0)`,
        totalMobilySim: sql<number>`COALESCE(SUM(${technicianFixedInventories.mobilySimBoxes} + ${technicianFixedInventories.mobilySimUnits}), 0)`,
        totalStcSim: sql<number>`COALESCE(SUM(${technicianFixedInventories.stcSimBoxes} + ${technicianFixedInventories.stcSimUnits}), 0)`,
        totalZainSim: sql<number>`COALESCE(SUM(${technicianFixedInventories.zainSimBoxes} + ${technicianFixedInventories.zainSimUnits}), 0)`,
        techniciansWithCriticalStock: sql<number>`0`,
        techniciansWithWarningStock: sql<number>`0`,
        techniciansWithGoodStock: sql<number>`COUNT(*)`,
      })
      .from(technicianFixedInventories);

    return {
      totalN950: Number(summary?.totalN950 || 0),
      totalI9000s: Number(summary?.totalI9000s || 0),
      totalI9100: Number(summary?.totalI9100 || 0),
      totalRollPaper: Number(summary?.totalRollPaper || 0),
      totalStickers: Number(summary?.totalStickers || 0),
      totalNewBatteries: Number(summary?.totalNewBatteries || 0),
      totalMobilySim: Number(summary?.totalMobilySim || 0),
      totalStcSim: Number(summary?.totalStcSim || 0),
      totalZainSim: Number(summary?.totalZainSim || 0),
      techniciansWithCriticalStock: Number(summary?.techniciansWithCriticalStock || 0),
      techniciansWithWarningStock: Number(summary?.techniciansWithWarningStock || 0),
      techniciansWithGoodStock: Number(summary?.techniciansWithGoodStock || 0),
    };
  }

  async getAllTechniciansWithBothInventories(): Promise<TechnicianWithBothInventories[]> {
    const technicians = await this.db
      .select({
        technicianId: users.id,
        technicianName: users.fullName,
        city: users.city,
        regionId: users.regionId,
      })
      .from(users)
      .where(sql`${users.role} = 'technician'`);

    const result: TechnicianWithBothInventories[] = [];
    for (const technician of technicians) {
      const fixedInventory = await this.fixedInventoryRepository.getTechnicianFixedInventory(technician.technicianId);
      const movingInventory = await repositories.technicianInventory.getTechnicianInventory(technician.technicianId);

      result.push({
        technicianId: technician.technicianId,
        technicianName: technician.technicianName,
        city: technician.city || 'غير محدد',
        regionId: technician.regionId,
        fixedInventory: fixedInventory || null,
        movingInventory: movingInventory || null,
        alertLevel: 'good',
      });
    }

    return result;
  }

  async getInventoryRequests(): Promise<InventoryRequest[]> {
    return repositories.inventoryRequests.getInventoryRequests(undefined, undefined, undefined);
  }

  async getPendingInventoryRequestsCount(): Promise<number> {
    const requests = await repositories.inventoryRequests.getInventoryRequests(undefined, undefined, 'pending');
    return requests.length;
  }
}
