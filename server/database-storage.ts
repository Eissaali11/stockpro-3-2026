import { repositories } from './infrastructure/repositories';
import { 
  type InventoryItem, 
  type InsertInventoryItem, 
  type Transaction, 
  type InsertTransaction, 
  type InventoryItemWithStatus, 
  type DashboardStats, 
  type Region, 
  type InsertRegion, 
  type User, 
  type InsertUser, 
  type UserSafe, 
  type RegionWithStats, 
  type AdminStats, 
  type TransactionWithDetails,
  type TechnicianInventory,
  type InsertTechnicianInventory,
  type WithdrawnDevice,
  type InsertWithdrawnDevice,
  type ReceivedDevice,
  type InsertReceivedDevice,
  type TechnicianFixedInventory,
  type InsertTechnicianFixedInventory,
  type StockMovement,
  type InsertStockMovement,
  type TechnicianWithFixedInventory,
  type FixedInventorySummary,
  type StockMovementWithDetails,
  type Warehouse,
  type WarehouseInventory,
  type WarehouseTransfer,
  type InsertWarehouse,
  type InsertWarehouseInventory,
  type InsertWarehouseTransfer,
  type WarehouseWithStats,
  type WarehouseWithInventory,
  type WarehouseTransferWithDetails,
  type SupervisorTechnician,
  type InsertSupervisorTechnician,
  type SupervisorWarehouse,
  type InsertSupervisorWarehouse,
  type SystemLog,
  type InsertSystemLog,
  type ItemType,
  type InsertItemType,
  type WarehouseInventoryEntry,
  type InsertTechnicianFixedInventoryEntry,
  type TechnicianFixedInventoryEntry,
  type TechnicianMovingInventoryEntry,
  type InventoryRequest,
  type InsertInventoryRequest,
  inventoryItems,
  transactions,
  regions,
  users,
  techniciansInventory,
  withdrawnDevices,
  receivedDevices,
  technicianFixedInventories,
  stockMovements,
  inventoryRequests,
  supervisorTechnicians,
  supervisorWarehouses,
  systemLogs,
  itemTypes,
  warehouseInventoryEntries,
  technicianFixedInventoryEntries,
  technicianMovingInventoryEntries,
} from './infrastructure/schemas';
import { eq, desc, and, or, gte, lte, sql } from 'drizzle-orm';
import { getDatabase } from './infrastructure/database/connection';
import * as logsModule from './database-storage-split/logs';
import * as itemTypesModule from './database-storage-split/item-types';

/**
 * Modern Database Storage Implementation
 * Uses Repository Pattern with Clean Architecture principles
 * Maintains ALL original functionality while providing modular structure
 * 
 * This class serves as the main entry point for all database operations
 * and delegates to appropriate repositories for specific domains
 */
export class DatabaseStorage {
  private get db() {
    return getDatabase();
  }

  // ================================
  // USER MANAGEMENT (تفويض للـ UserRepository)
  // ================================
  async getUsers(): Promise<UserSafe[]> {
    return repositories.user.getUsers();
  }

  async getUser(id: string): Promise<UserSafe | undefined> {
    return repositories.user.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return repositories.user.getUserByUsername(username);
  }

  async createUser(insertUser: InsertUser): Promise<UserSafe> {
    return repositories.user.createUser(insertUser);
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe> {
    return repositories.user.updateUser(id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    return repositories.user.deleteUser(id);
  }

  async getSupervisorTechnicians(supervisorId: string): Promise<string[]> {
    const technicians = await repositories.supervisor.getSupervisorTechnicians(supervisorId);
    return technicians.map((technician) => technician.id);
  }

  async assignTechnicianToSupervisor(supervisorId: string, technicianId: string): Promise<SupervisorTechnician> {
    return repositories.supervisor.assignTechnicianToSupervisor(supervisorId, technicianId);
  }

  async removeTechnicianFromSupervisor(supervisorId: string, technicianId: string): Promise<boolean> {
    return repositories.supervisor.removeTechnicianFromSupervisor(supervisorId, technicianId);
  }

  // ================================
  // WAREHOUSE MANAGEMENT (تفويض للـ WarehouseRepository)
  // ================================
  async getWarehouses(): Promise<WarehouseWithStats[]> {
    return repositories.warehouse.getWarehouses();
  }

  async getWarehouse(id: string): Promise<WarehouseWithInventory | undefined> {
    return repositories.warehouse.getWarehouse(id);
  }

  async createWarehouse(insertWarehouse: InsertWarehouse, createdBy: string): Promise<Warehouse> {
    return repositories.warehouse.createWarehouse(insertWarehouse, createdBy);
  }

  async updateWarehouse(id: string, updates: Partial<InsertWarehouse>): Promise<Warehouse> {
    return repositories.warehouse.updateWarehouse(id, updates);
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    return repositories.warehouse.deleteWarehouse(id);
  }

  async getWarehouseInventory(warehouseId: string): Promise<WarehouseInventory | null> {
    return repositories.warehouse.getWarehouseInventory(warehouseId);
  }

  async updateWarehouseInventory(warehouseId: string, updates: Partial<InsertWarehouseInventory>): Promise<WarehouseInventory> {
    return repositories.warehouse.updateWarehouseInventory(warehouseId, updates);
  }

  // ================================
  // TRANSFERS (تفويض للـ TransferRepository)
  // ================================
  async getWarehouseTransfers(warehouseId?: string, technicianId?: string, regionId?: string, limit?: number): Promise<WarehouseTransferWithDetails[]> {
    return repositories.transfer.getWarehouseTransfers(warehouseId, technicianId, regionId, limit);
  }

  async transferFromWarehouse(data: InsertWarehouseTransfer): Promise<WarehouseTransfer> {
    return repositories.transfer.transferFromWarehouse(data);
  }

  async acceptWarehouseTransfer(transferId: string): Promise<WarehouseTransfer> {
    return repositories.transfer.acceptWarehouseTransfer(transferId);
  }

  async rejectWarehouseTransfer(transferId: string, reason?: string, performedBy?: string): Promise<WarehouseTransfer> {
    return repositories.transfer.rejectWarehouseTransfer(transferId, reason || 'Rejected', performedBy);
  }

  // ================================
  // INVENTORY ENTRIES (تفويض للـ InventoryRepositories)
  // ================================
  async getWarehouseInventoryEntries(warehouseId: string): Promise<WarehouseInventoryEntry[]> {
    return repositories.warehouseInventory.getWarehouseInventoryEntries(warehouseId);
  }

  async upsertWarehouseInventoryEntry(warehouseId: string, itemTypeId: string, boxes: number, units: number): Promise<WarehouseInventoryEntry> {
    return repositories.warehouseInventory.upsertWarehouseInventoryEntry(warehouseId, itemTypeId, boxes, units);
  }

  async getTechnicianMovingInventoryEntries(technicianId: string): Promise<TechnicianMovingInventoryEntry[]> {
    return repositories.technicianInventory.getTechnicianMovingInventoryEntries(technicianId);
  }

  async upsertTechnicianMovingInventoryEntry(technicianId: string, itemTypeId: string, boxes: number, units: number): Promise<TechnicianMovingInventoryEntry> {
    return repositories.technicianInventory.upsertTechnicianMovingInventoryEntry(technicianId, itemTypeId, boxes, units);
  }

  async getTechnicianInventory(id: string): Promise<TechnicianInventory | undefined> {
    return repositories.technicianInventory.getTechnicianInventory(id);
  }

  // ================================
  // LEGACY FUNCTIONS (تطبيق مباشر للتوافق العكسي)
  // ================================
  
  // وظائف إدارة العناصر
  async getInventoryItems(): Promise<InventoryItemWithStatus[]> {
    const items = await this.db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        type: inventoryItems.type,
        unit: inventoryItems.unit,
        quantity: inventoryItems.quantity,
        minThreshold: inventoryItems.minThreshold,
        technicianName: inventoryItems.technicianName,
        city: inventoryItems.city,
        regionId: inventoryItems.regionId,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
      })
      .from(inventoryItems)
      .orderBy(inventoryItems.name);

    return items.map(item => ({
      ...item,
      status: item.quantity <= 0 ? 'out' : item.quantity <= item.minThreshold ? 'low' : 'available',
    }));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await this.db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await this.db
      .insert(inventoryItems)
      .values({
        ...insertItem,
        quantity: insertItem.quantity ?? 0,
        minThreshold: insertItem.minThreshold ?? 5,
      })
      .returning();
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [item] = await this.db
      .update(inventoryItems)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();
    
    if (!item) {
      throw new Error(`Inventory item with id ${id} not found`);
    }
    return item;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await this.db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // وظائف إدارة المناطق
  async getRegions(): Promise<RegionWithStats[]> {
    const regionList = await this.db
      .select()
      .from(regions)
      .orderBy(regions.name);

    const result: RegionWithStats[] = [];
    for (const region of regionList) {
      const [{ itemCount }] = await this.db
        .select({ itemCount: sql<number>`count(*)` })
        .from(inventoryItems)
        .where(eq(inventoryItems.regionId, region.id));

      const [{ totalQuantity }] = await this.db
        .select({ totalQuantity: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)` })
        .from(inventoryItems)
        .where(eq(inventoryItems.regionId, region.id));

      const [{ lowStockCount }] = await this.db
        .select({ lowStockCount: sql<number>`count(*)` })
        .from(inventoryItems)
        .where(and(
          eq(inventoryItems.regionId, region.id),
          sql`${inventoryItems.quantity} <= ${inventoryItems.minThreshold}`
        ));

      result.push({
        ...region,
        itemCount: Number(itemCount),
        totalQuantity: Number(totalQuantity),
        lowStockCount: Number(lowStockCount),
      });
    }
    return result;
  }

  async getRegion(id: string): Promise<Region | undefined> {
    const [region] = await this.db
      .select()
      .from(regions)
      .where(eq(regions.id, id));
    return region || undefined;
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const [region] = await this.db
      .insert(regions)
      .values(insertRegion)
      .returning();
    return region;
  }

  async updateRegion(id: string, updates: Partial<InsertRegion>): Promise<Region> {
    const [region] = await this.db
      .update(regions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(regions.id, id))
      .returning();

    if (!region) {
      throw new Error(`Region with id ${id} not found`);
    }
    return region;
  }

  async deleteRegion(id: string): Promise<boolean> {
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.regionId, id));

    if (Number(count) > 0) {
      throw new Error(`Cannot delete region with existing users`);
    }

    const result = await this.db
      .delete(regions)
      .where(eq(regions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // وظائف المعاملات
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await this.db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getRecentTransactions(limit: number = 10): Promise<TransactionWithDetails[]> {
    const recentTransactions = await this.db
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

  // وظائف الإحصائيات
  async getDashboardStats(): Promise<DashboardStats> {
    const [{ totalItems }] = await this.db
      .select({ totalItems: sql<number>`count(*)` })
      .from(inventoryItems);

    const [{ lowStockItems }] = await this.db
      .select({ lowStockItems: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(sql`${inventoryItems.quantity} <= ${inventoryItems.minThreshold}`);

    const [{ outOfStockItems }] = await this.db
      .select({ outOfStockItems: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(sql`${inventoryItems.quantity} <= 0`);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [{ todayTransactions }] = await this.db
      .select({ todayTransactions: sql<number>`count(*)` })
      .from(transactions)
      .where(gte(transactions.createdAt, startOfToday));

    const [{ totalRegions }] = await this.db
      .select({ totalRegions: sql<number>`count(*)` })
      .from(regions);

    const [{ totalUsers }] = await this.db
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

  async getAdminStats(): Promise<AdminStats> {
    const [{ totalUsers }] = await this.db
      .select({ totalUsers: sql<number>`count(*)` })
      .from(users);

    const [{ activeUsers }] = await this.db
      .select({ activeUsers: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    const [{ totalRegions }] = await this.db
      .select({ totalRegions: sql<number>`count(*)` })
      .from(regions);

    const [{ totalTransactions }] = await this.db
      .select({ totalTransactions: sql<number>`count(*)` })
      .from(transactions);

    const recentTransactions = await this.getRecentTransactions(10);

    return {
      totalUsers: Number(totalUsers),
      activeUsers: Number(activeUsers),
      totalRegions: Number(totalRegions),
      totalTransactions: Number(totalTransactions),
      recentTransactions,
    };
  }

  async getSystemLogs(filters?: {
    page?: number;
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
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? (filters?.page ? (filters.page - 1) * limit : 0);
    return logsModule.getSystemLogs({
      ...filters,
      limit,
      offset,
    });
  }

  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    return logsModule.createSystemLog(log);
  }

  // وظائف أخرى ضرورية للتوافق
  async addStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
    return await this.db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, itemId));

      if (!item) {
        throw new Error(`Item with id ${itemId} not found`);
      }

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
        });
      }

      return updatedItem;
    });
  }

  async withdrawStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
    return await this.db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, itemId));

      if (!item) {
        throw new Error(`Item with id ${itemId} not found`);
      }

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
        });
      }

      return updatedItem;
    });
  }

  // وظائف إضافية للحفاظ على التوافق الكامل
  async getTechniciansInventory(): Promise<TechnicianInventory[]> {
    return await this.db
      .select()
      .from(techniciansInventory)
      .orderBy(desc(techniciansInventory.createdAt));
  }

  async createTechnicianInventory(data: InsertTechnicianInventory): Promise<TechnicianInventory> {
    const [inventory] = await this.db
      .insert(techniciansInventory)
      .values(data)
      .returning();
    return inventory;
  }

  async updateTechnicianInventory(id: string, updates: Partial<InsertTechnicianInventory>): Promise<TechnicianInventory> {
    return repositories.technicianInventory.updateTechnicianInventory(id, updates);
  }

  async deleteTechnicianInventory(id: string): Promise<boolean> {
    const result = await this.db
      .delete(techniciansInventory)
      .where(eq(techniciansInventory.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getWithdrawnDevices(): Promise<WithdrawnDevice[]> {
    return await this.db
      .select()
      .from(withdrawnDevices)
      .orderBy(desc(withdrawnDevices.createdAt));
  }

  async getWithdrawnDevice(id: string): Promise<WithdrawnDevice | undefined> {
    const [device] = await this.db
      .select()
      .from(withdrawnDevices)
      .where(eq(withdrawnDevices.id, id));
    return device || undefined;
  }

  async createWithdrawnDevice(data: InsertWithdrawnDevice): Promise<WithdrawnDevice> {
    const [device] = await this.db
      .insert(withdrawnDevices)
      .values(data)
      .returning();
    return device;
  }

  async getReceivedDevices(filters?: { status?: string; technicianId?: string; supervisorId?: string; regionId?: string }): Promise<ReceivedDevice[]> {
    let query = this.db.select().from(receivedDevices).$dynamic();

    if (filters) {
      const conditions = [];
      if (filters.status) {
        conditions.push(eq(receivedDevices.status, filters.status as any));
      }
      if (filters.technicianId) {
        conditions.push(eq(receivedDevices.technicianId, filters.technicianId));
      }
      if (filters.supervisorId) {
        conditions.push(eq(receivedDevices.supervisorId, filters.supervisorId));
      }
      if (filters.regionId) {
        conditions.push(eq(receivedDevices.regionId, filters.regionId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return await query.orderBy(desc(receivedDevices.createdAt));
  }

  async createReceivedDevice(data: InsertReceivedDevice): Promise<ReceivedDevice> {
    const [device] = await this.db
      .insert(receivedDevices)
      .values(data)
      .returning();
    return device;
  }

  async updateReceivedDeviceStatus(id: string, status: string, approvedBy: string, adminNotes?: string): Promise<ReceivedDevice> {
    const [device] = await this.db
      .update(receivedDevices)
      .set({
        status: status as any,
        approvedBy,
        adminNotes,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(receivedDevices.id, id))
      .returning();

    if (!device) {
      throw new Error(`Received device with id ${id} not found`);
    }
    return device;
  }

  async getPendingReceivedDevicesCount(supervisorId?: string, regionId?: string | null): Promise<number> {
    let query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(receivedDevices)
      .$dynamic();

    const conditions = [eq(receivedDevices.status, 'pending')];
    
    if (supervisorId) {
      conditions.push(eq(receivedDevices.supervisorId, supervisorId));
    }
    
    if (regionId) {
      conditions.push(eq(receivedDevices.regionId, regionId));
    }

    query = query.where(and(...conditions));

    const [{ count }] = await query;
    return Number(count);
  }

  // ================================
  // LEGACY COMPATIBILITY LAYER (Batch-1/2)
  // ================================
  async logSystemActivity(log: InsertSystemLog): Promise<SystemLog> {
    return this.createSystemLog(log);
  }

  async getWithdrawnDevicesByRegion(regionId: string): Promise<WithdrawnDevice[]> {
    return this.db
      .select()
      .from(withdrawnDevices)
      .where(eq(withdrawnDevices.regionId, regionId))
      .orderBy(desc(withdrawnDevices.createdAt));
  }

  async updateWithdrawnDevice(id: string, updates: Partial<InsertWithdrawnDevice>): Promise<WithdrawnDevice> {
    const [device] = await this.db
      .update(withdrawnDevices)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(withdrawnDevices.id, id))
      .returning();

    if (!device) {
      throw new Error(`Withdrawn device with id ${id} not found`);
    }
    return device;
  }

  async deleteWithdrawnDevice(id: string): Promise<boolean> {
    const result = await this.db
      .delete(withdrawnDevices)
      .where(eq(withdrawnDevices.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getReceivedDevice(id: string): Promise<ReceivedDevice | undefined> {
    const [device] = await this.db
      .select()
      .from(receivedDevices)
      .where(eq(receivedDevices.id, id));
    return device || undefined;
  }

  async deleteReceivedDevice(id: string): Promise<boolean> {
    const result = await this.db
      .delete(receivedDevices)
      .where(eq(receivedDevices.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getTransactions(filters?: {
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
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters?.userId) {
      conditions.push(eq(transactions.userId, filters.userId));
    }
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
    if (filters?.search) {
      conditions.push(
        or(
          sql`${inventoryItems.name} ILIKE ${`%${filters.search}%`}`,
          sql`${users.fullName} ILIKE ${`%${filters.search}%`}`
        )
      );
    }

    let dataQuery = this.db
      .select({
        id: transactions.id,
        itemId: transactions.itemId,
        type: transactions.type,
        quantity: transactions.quantity,
        reason: transactions.reason,
        userId: transactions.userId,
        createdAt: transactions.createdAt,
        itemName: inventoryItems.name,
        itemType: inventoryItems.type,
        userName: users.fullName,
        userRole: users.role,
        userCity: users.city,
      })
      .from(transactions)
      .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
      .leftJoin(users, eq(transactions.userId, users.id))
      .$dynamic();

    if (conditions.length > 0) {
      dataQuery = dataQuery.where(and(...conditions));
    }

    const rows = await dataQuery
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    let countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(inventoryItems, eq(transactions.itemId, inventoryItems.id))
      .$dynamic();

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ count }] = await countQuery;
    const total = Number(count || 0);

    return {
      transactions: rows.map((row) => ({
        ...row,
        itemName: row.itemName || undefined,
        itemType: row.itemType || undefined,
        userName: row.userName || undefined,
        userRole: row.userRole || undefined,
        userCity: row.userCity || undefined,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getTransactionStatistics(filters?: {
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

    let totalsQuery = this.db
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

    let byRegionQuery = this.db
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

    let byUserQuery = this.db
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

  async getTechnicianFixedInventory(technicianId: string): Promise<TechnicianFixedInventory | undefined> {
    const [inventory] = await this.db
      .select()
      .from(technicianFixedInventories)
      .where(eq(technicianFixedInventories.technicianId, technicianId));
    return inventory || undefined;
  }

  async createTechnicianFixedInventory(data: InsertTechnicianFixedInventory): Promise<TechnicianFixedInventory> {
    const [inventory] = await this.db
      .insert(technicianFixedInventories)
      .values(data)
      .returning();
    return inventory;
  }

  async updateTechnicianFixedInventory(technicianId: string, updates: Partial<InsertTechnicianFixedInventory>): Promise<TechnicianFixedInventory> {
    const [inventory] = await this.db
      .update(technicianFixedInventories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(technicianFixedInventories.technicianId, technicianId))
      .returning();

    if (!inventory) {
      throw new Error(`Technician fixed inventory for technician ${technicianId} not found`);
    }
    return inventory;
  }

  async deleteTechnicianFixedInventory(technicianId: string): Promise<boolean> {
    const result = await this.db
      .delete(technicianFixedInventories)
      .where(eq(technicianFixedInventories.technicianId, technicianId));
    return (result.rowCount || 0) > 0;
  }

  async getAllTechniciansWithFixedInventory(): Promise<TechnicianWithFixedInventory[]> {
    const technicians = await this.db
      .select({
        technicianId: users.id,
        technicianName: users.fullName,
        city: users.city,
      })
      .from(users)
      .where(eq(users.role, 'technician'));

    const result: TechnicianWithFixedInventory[] = [];
    for (const tech of technicians) {
      const fixedInventory = await this.getTechnicianFixedInventory(tech.technicianId);
      result.push({
        technicianId: tech.technicianId,
        technicianName: tech.technicianName,
        city: tech.city || 'غير محدد',
        fixedInventory: fixedInventory || null,
        alertLevel: 'good',
      });
    }

    return result;
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

  async getAllTechniciansWithBothInventories(): Promise<any[]> {
    const technicians = await this.db
      .select({
        technicianId: users.id,
        technicianName: users.fullName,
        city: users.city,
        regionId: users.regionId,
      })
      .from(users)
      .where(eq(users.role, 'technician'));

    const result: any[] = [];
    for (const tech of technicians) {
      const fixedInventory = await this.getTechnicianFixedInventory(tech.technicianId);
      const movingInventory = await this.getTechnicianInventory(tech.technicianId);
      result.push({
        ...tech,
        city: tech.city || 'غير محدد',
        fixedInventory: fixedInventory || null,
        movingInventory: movingInventory || null,
        alertLevel: 'good',
      });
    }

    return result;
  }

  async getRegionTechniciansWithInventories(regionId: string): Promise<any[]> {
    const all = await this.getAllTechniciansWithBothInventories();
    return all.filter((tech) => tech.regionId === regionId);
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [created] = await this.db
      .insert(stockMovements)
      .values(movement)
      .returning();
    return created;
  }

  async getStockMovements(technicianId?: string, limit: number = 50): Promise<StockMovementWithDetails[]> {
    let query = this.db
      .select({
        id: stockMovements.id,
        technicianId: stockMovements.technicianId,
        itemType: stockMovements.itemType,
        packagingType: stockMovements.packagingType,
        quantity: stockMovements.quantity,
        fromInventory: stockMovements.fromInventory,
        toInventory: stockMovements.toInventory,
        reason: stockMovements.reason,
        performedBy: stockMovements.performedBy,
        notes: stockMovements.notes,
        createdAt: stockMovements.createdAt,
        technicianName: users.fullName,
      })
      .from(stockMovements)
      .leftJoin(users, eq(stockMovements.technicianId, users.id))
      .$dynamic();

    if (technicianId) {
      query = query.where(eq(stockMovements.technicianId, technicianId));
    }

    const rows = await query
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      technicianName: row.technicianName || undefined,
      performedByName: undefined,
      itemNameAr: row.itemType,
    }));
  }

  async getStockMovementsByRegion(regionId: string): Promise<StockMovementWithDetails[]> {
    const rows = await this.db
      .select({
        id: stockMovements.id,
        technicianId: stockMovements.technicianId,
        itemType: stockMovements.itemType,
        packagingType: stockMovements.packagingType,
        quantity: stockMovements.quantity,
        fromInventory: stockMovements.fromInventory,
        toInventory: stockMovements.toInventory,
        reason: stockMovements.reason,
        performedBy: stockMovements.performedBy,
        notes: stockMovements.notes,
        createdAt: stockMovements.createdAt,
        technicianName: users.fullName,
      })
      .from(stockMovements)
      .leftJoin(users, eq(stockMovements.technicianId, users.id))
      .where(eq(users.regionId, regionId))
      .orderBy(desc(stockMovements.createdAt));

    return rows.map((row) => ({
      ...row,
      technicianName: row.technicianName || undefined,
      performedByName: undefined,
      itemNameAr: row.itemType,
    }));
  }

  async getStockMovementsByTechnician(technicianId: string): Promise<StockMovementWithDetails[]> {
    return this.getStockMovements(technicianId);
  }

  async transferStock(params: {
    technicianId: string;
    itemType: string;
    packagingType: string;
    quantity: number;
    fromInventory: string;
    toInventory: string;
    performedBy: string;
    reason?: string;
    notes?: string;
  }): Promise<{ movement: StockMovement; updatedInventory: TechnicianFixedInventory }> {
    const movement = await this.createStockMovement({
      technicianId: params.technicianId,
      itemType: params.itemType,
      packagingType: params.packagingType,
      quantity: params.quantity,
      fromInventory: params.fromInventory,
      toInventory: params.toInventory,
      performedBy: params.performedBy,
      reason: params.reason,
      notes: params.notes,
    });

    let updatedInventory = await this.getTechnicianFixedInventory(params.technicianId);
    if (!updatedInventory) {
      updatedInventory = await this.createTechnicianFixedInventory({ technicianId: params.technicianId });
    }

    return { movement, updatedInventory };
  }

  async getTechnicianFixedInventoryEntries(technicianId: string): Promise<TechnicianFixedInventoryEntry[]> {
    return this.db
      .select()
      .from(technicianFixedInventoryEntries)
      .where(eq(technicianFixedInventoryEntries.technicianId, technicianId));
  }

  async upsertTechnicianFixedInventoryEntry(
    technicianId: string,
    itemTypeId: string,
    boxes: number,
    units: number
  ): Promise<TechnicianFixedInventoryEntry> {
    const [existing] = await this.db
      .select()
      .from(technicianFixedInventoryEntries)
      .where(and(
        eq(technicianFixedInventoryEntries.technicianId, technicianId),
        eq(technicianFixedInventoryEntries.itemTypeId, itemTypeId)
      ));

    if (existing) {
      const [updated] = await this.db
        .update(technicianFixedInventoryEntries)
        .set({ boxes, units, updatedAt: new Date() })
        .where(eq(technicianFixedInventoryEntries.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(technicianFixedInventoryEntries)
      .values({
        technicianId,
        itemTypeId,
        boxes,
        units,
      } as InsertTechnicianFixedInventoryEntry)
      .returning();

    return created;
  }

  async getWarehousesByRegion(regionId: string): Promise<WarehouseWithStats[]> {
    const warehouses = await this.getWarehouses();
    return warehouses.filter((warehouse) => warehouse.regionId === regionId);
  }

  async getWarehousesBySupervisor(supervisorId: string): Promise<WarehouseWithStats[]> {
    const assignments = await repositories.supervisor.getSupervisorWarehouses(supervisorId);
    if (!assignments.length) {
      return [];
    }

    const warehouses = await this.getWarehouses();
    const warehouseIds = new Set(assignments.map((assignment) => assignment.warehouseId));
    return warehouses.filter((warehouse) => warehouseIds.has(warehouse.id));
  }

  async assignWarehouseToSupervisor(supervisorId: string, warehouseId: string): Promise<SupervisorWarehouse> {
    return repositories.supervisor.assignWarehouseToSupervisor(supervisorId, warehouseId);
  }

  async removeWarehouseFromSupervisor(supervisorId: string, warehouseId: string): Promise<boolean> {
    return repositories.supervisor.removeWarehouseFromSupervisor(supervisorId, warehouseId);
  }

  async getSupervisorWarehouses(supervisorId: string): Promise<string[]> {
    const rows = await repositories.supervisor.getSupervisorWarehouses(supervisorId);
    return rows.map((row) => row.warehouseId);
  }

  async getTechnicianSupervisor(technicianId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ supervisorId: supervisorTechnicians.supervisorId })
      .from(supervisorTechnicians)
      .where(eq(supervisorTechnicians.technicianId, technicianId));
    return row?.supervisorId || null;
  }

  async getInventoryRequests(warehouseId?: string, technicianId?: string, status?: string): Promise<InventoryRequest[]> {
    return repositories.inventoryRequests.getInventoryRequests(warehouseId, technicianId, status);
  }

  async getUserInventoryRequests(userId: string): Promise<InventoryRequest[]> {
    return repositories.inventoryRequests.getInventoryRequests(undefined, userId);
  }

  async createInventoryRequest(request: InsertInventoryRequest): Promise<InventoryRequest> {
    return repositories.inventoryRequests.createInventoryRequest(request);
  }

  async updateInventoryRequestStatus(
    id: string,
    status: string,
    respondedBy: string,
    adminNotes?: string
  ): Promise<InventoryRequest> {
    const [updated] = await this.db
      .update(inventoryRequests)
      .set({
        status: status as any,
        respondedBy,
        respondedAt: new Date(),
        adminNotes,
      })
      .where(eq(inventoryRequests.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Inventory request with id ${id} not found`);
    }

    return updated;
  }

  async deleteInventoryRequest(id: string): Promise<boolean> {
    return repositories.inventoryRequests.deleteInventoryRequest(id);
  }

  async getPendingInventoryRequestsCount(): Promise<number> {
    const requests = await repositories.inventoryRequests.getInventoryRequests(undefined, undefined, 'pending');
    return requests.length;
  }

  async acceptWarehouseTransferBatch(transferIds: string[]): Promise<WarehouseTransfer[]> {
    const results: WarehouseTransfer[] = [];
    for (const transferId of transferIds) {
      results.push(await this.acceptWarehouseTransfer(transferId));
    }
    return results;
  }

  async rejectWarehouseTransferBatch(transferIds: string[], reason?: string): Promise<WarehouseTransfer[]> {
    const results: WarehouseTransfer[] = [];
    for (const transferId of transferIds) {
      results.push(await this.rejectWarehouseTransfer(transferId, reason));
    }
    return results;
  }

  async acceptWarehouseTransfersBulk(criteria?: {
    warehouseId?: string;
    technicianId?: string;
    regionId?: string;
    limit?: number;
  }): Promise<WarehouseTransfer[]> {
    const transfers = await this.getWarehouseTransfers(
      criteria?.warehouseId,
      criteria?.technicianId,
      criteria?.regionId,
      criteria?.limit
    );

    const pending = transfers.filter((transfer) => transfer.status === 'pending');
    const results: WarehouseTransfer[] = [];
    for (const transfer of pending) {
      results.push(await this.acceptWarehouseTransfer(transfer.id));
    }
    return results;
  }

  async rejectWarehouseTransfersBulk(
    criteria?: {
      warehouseId?: string;
      technicianId?: string;
      regionId?: string;
      limit?: number;
    },
    reason?: string
  ): Promise<WarehouseTransfer[]> {
    const transfers = await this.getWarehouseTransfers(
      criteria?.warehouseId,
      criteria?.technicianId,
      criteria?.regionId,
      criteria?.limit
    );

    const pending = transfers.filter((transfer) => transfer.status === 'pending');
    const results: WarehouseTransfer[] = [];
    for (const transfer of pending) {
      results.push(await this.rejectWarehouseTransfer(transfer.id, reason));
    }
    return results;
  }

  async acceptWarehouseTransferByRequestId(requestId: string): Promise<WarehouseTransfer> {
    const transfers = await this.getWarehouseTransfers();
    const transfer = transfers.find((item) => item.requestId === requestId);

    if (!transfer) {
      throw new Error(`Warehouse transfer with request id ${requestId} not found`);
    }

    return this.acceptWarehouseTransfer(transfer.id);
  }

  async rejectWarehouseTransferByRequestId(requestId: string, reason?: string): Promise<WarehouseTransfer> {
    const transfers = await this.getWarehouseTransfers();
    const transfer = transfers.find((item) => item.requestId === requestId);

    if (!transfer) {
      throw new Error(`Warehouse transfer with request id ${requestId} not found`);
    }

    return this.rejectWarehouseTransfer(transfer.id, reason);
  }

  async exportAllData(): Promise<{ exportedAt: string; data: Record<string, unknown> }> {
    const [allUsers, allRegions, allItems, allTransactions] = await Promise.all([
      this.db.select().from(users),
      this.db.select().from(regions),
      this.db.select().from(inventoryItems),
      this.db.select().from(transactions),
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

  async importAllData(_backup: { data?: Record<string, unknown> }): Promise<void> {
    return;
  }

  // وظائف إدارة أنواع العناصر
  async getItemTypes(): Promise<ItemType[]> {
    return itemTypesModule.getItemTypes();
  }

  async getActiveItemTypes(): Promise<ItemType[]> {
    return itemTypesModule.getActiveItemTypes();
  }

  async getItemTypeById(id: string): Promise<ItemType | undefined> {
    return itemTypesModule.getItemTypeById(id);
  }

  async createItemType(data: InsertItemType): Promise<ItemType> {
    return itemTypesModule.createItemType(data);
  }

  async updateItemType(id: string, data: Partial<InsertItemType>): Promise<ItemType | undefined> {
    return itemTypesModule.updateItemType(id, data);
  }

  async deleteItemType(id: string): Promise<boolean> {
    return itemTypesModule.deleteItemType(id);
  }

  async toggleItemTypeActive(id: string, isActive: boolean): Promise<ItemType | undefined> {
    return itemTypesModule.toggleItemTypeActive(id, isActive);
  }

  async toggleItemTypeVisibility(id: string, isVisible: boolean): Promise<ItemType | undefined> {
    return itemTypesModule.toggleItemTypeVisibility(id, isVisible);
  }

  async seedDefaultItemTypes(): Promise<void> {
    return itemTypesModule.seedDefaultItemTypes();
  }

  // دالة التهيئة للتوافق مع الكود القديم
  async migrateToInventoryEntries(): Promise<void> {
    console.log('Migration handled by Repository Pattern - Modern architecture in use');
  }
}

// إنشاء وتصدير المثيل العالمي للتوافق العكسي
const storage = new DatabaseStorage();
export default storage;

// تصديرات إضافية للمرونة
export { storage };

// تصدير جميع الأنواع
export * from './infrastructure/schemas';