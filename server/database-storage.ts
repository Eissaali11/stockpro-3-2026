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
  type SupervisorWarehouse,
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
} from './infrastructure/schemas';
import * as compatibilityModule from './database-storage-split/compatibility';
import * as devicesModule from './database-storage-split/devices';
import * as fixedInventoryModule from './database-storage-split/fixed-inventory';
import * as inventoryModule from './database-storage-split/inventory';
import * as inventoryEntriesModule from './database-storage-split/inventory-entries';
import * as itemTypesModule from './database-storage-split/item-types';
import * as regionsModule from './database-storage-split/regions';
import * as requestsModule from './database-storage-split/requests';
import * as statsModule from './database-storage-split/stats';
import * as supervisionModule from './database-storage-split/supervision';
import * as systemMaintenanceModule from './database-storage-split/system-maintenance';
import * as transactionStatisticsModule from './database-storage-split/transaction-statistics';
import * as transactionsModule from './database-storage-split/transactions';
import * as transfersModule from './database-storage-split/transfers';
import * as usersModule from './database-storage-split/users';
import * as warehousesModule from './database-storage-split/warehouses';

/**
 * Modern Database Storage Implementation
 * Uses Repository Pattern with Clean Architecture principles
 * Maintains ALL original functionality while providing modular structure
 * 
 * This class serves as the main entry point for all database operations
 * and delegates to appropriate repositories for specific domains
 */
export class DatabaseStorage {
  // ================================
  // USER MANAGEMENT (تفويض للـ UserRepository)
  // ================================
  async getUsers(): Promise<UserSafe[]> {
    return usersModule.getUsers();
  }

  async getUser(id: string): Promise<UserSafe | undefined> {
    return usersModule.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return usersModule.getUserByUsername(username);
  }

  async createUser(insertUser: InsertUser): Promise<UserSafe> {
    return usersModule.createUser(insertUser);
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe> {
    return usersModule.updateUser(id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    return usersModule.deleteUser(id);
  }

  async getSupervisorTechnicians(supervisorId: string): Promise<string[]> {
    return usersModule.getSupervisorTechnicianIds(supervisorId);
  }

  async assignTechnicianToSupervisor(supervisorId: string, technicianId: string): Promise<SupervisorTechnician> {
    return usersModule.assignTechnicianToSupervisor(supervisorId, technicianId);
  }

  async removeTechnicianFromSupervisor(supervisorId: string, technicianId: string): Promise<boolean> {
    return usersModule.removeTechnicianFromSupervisor(supervisorId, technicianId);
  }

  // ================================
  // WAREHOUSE MANAGEMENT (تفويض للـ WarehouseRepository)
  // ================================
  async getWarehouses(): Promise<WarehouseWithStats[]> {
    return warehousesModule.getWarehouses();
  }

  async getWarehouse(id: string): Promise<WarehouseWithInventory | undefined> {
    return warehousesModule.getWarehouse(id);
  }

  async createWarehouse(insertWarehouse: InsertWarehouse, createdBy: string): Promise<Warehouse> {
    return warehousesModule.createWarehouse(insertWarehouse, createdBy);
  }

  async updateWarehouse(id: string, updates: Partial<InsertWarehouse>): Promise<Warehouse> {
    return warehousesModule.updateWarehouse(id, updates);
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    return warehousesModule.deleteWarehouse(id);
  }

  async getWarehouseInventory(warehouseId: string): Promise<WarehouseInventory | null> {
    return warehousesModule.getWarehouseInventory(warehouseId);
  }

  async updateWarehouseInventory(warehouseId: string, updates: Partial<InsertWarehouseInventory>): Promise<WarehouseInventory> {
    return warehousesModule.updateWarehouseInventory(warehouseId, updates);
  }

  // ================================
  // TRANSFERS (تفويض للـ TransferRepository)
  // ================================
  async getWarehouseTransfers(warehouseId?: string, technicianId?: string, regionId?: string, limit?: number): Promise<WarehouseTransferWithDetails[]> {
    return transfersModule.getWarehouseTransfers(warehouseId, technicianId, regionId, limit);
  }

  async transferFromWarehouse(data: InsertWarehouseTransfer): Promise<WarehouseTransfer> {
    return transfersModule.transferFromWarehouse(data);
  }

  async acceptWarehouseTransfer(transferId: string): Promise<WarehouseTransfer> {
    return transfersModule.acceptWarehouseTransfer(transferId);
  }

  async rejectWarehouseTransfer(transferId: string, reason?: string, performedBy?: string): Promise<WarehouseTransfer> {
    return transfersModule.rejectWarehouseTransfer(transferId, reason || 'Rejected', performedBy);
  }

  // ================================
  // INVENTORY ENTRIES (تفويض للـ InventoryRepositories)
  // ================================
  async getWarehouseInventoryEntries(warehouseId: string): Promise<WarehouseInventoryEntry[]> {
    return inventoryEntriesModule.getWarehouseInventoryEntries(warehouseId);
  }

  async upsertWarehouseInventoryEntry(warehouseId: string, itemTypeId: string, boxes: number, units: number): Promise<WarehouseInventoryEntry> {
    return inventoryEntriesModule.upsertWarehouseInventoryEntry(warehouseId, itemTypeId, boxes, units);
  }

  async getTechnicianMovingInventoryEntries(technicianId: string): Promise<TechnicianMovingInventoryEntry[]> {
    return inventoryEntriesModule.getTechnicianMovingInventoryEntries(technicianId);
  }

  async upsertTechnicianMovingInventoryEntry(technicianId: string, itemTypeId: string, boxes: number, units: number): Promise<TechnicianMovingInventoryEntry> {
    return inventoryEntriesModule.upsertTechnicianMovingInventoryEntry(technicianId, itemTypeId, boxes, units);
  }

  async getTechnicianInventory(id: string): Promise<TechnicianInventory | undefined> {
    return inventoryEntriesModule.getTechnicianInventory(id);
  }

  // ================================
  // LEGACY FUNCTIONS (تطبيق مباشر للتوافق العكسي)
  // ================================
  
  // وظائف إدارة العناصر
  async getInventoryItems(): Promise<InventoryItemWithStatus[]> {
    return inventoryModule.getInventoryItems();
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return inventoryModule.getInventoryItem(id);
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    return inventoryModule.createInventoryItem(insertItem);
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    return inventoryModule.updateInventoryItem(id, updates);
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return inventoryModule.deleteInventoryItem(id);
  }

  // وظائف إدارة المناطق
  async getRegions(): Promise<RegionWithStats[]> {
    return regionsModule.getRegions();
  }

  async getRegion(id: string): Promise<Region | undefined> {
    return regionsModule.getRegion(id);
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    return regionsModule.createRegion(insertRegion);
  }

  async updateRegion(id: string, updates: Partial<InsertRegion>): Promise<Region> {
    return regionsModule.updateRegion(id, updates);
  }

  async deleteRegion(id: string): Promise<boolean> {
    return regionsModule.deleteRegion(id);
  }

  // وظائف المعاملات
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    return transactionsModule.createTransaction(insertTransaction);
  }

  async getRecentTransactions(limit: number = 10): Promise<TransactionWithDetails[]> {
    return transactionsModule.getRecentTransactions(limit);
  }

  // وظائف الإحصائيات
  async getDashboardStats(): Promise<DashboardStats> {
    return statsModule.getDashboardStats();
  }

  async getAdminStats(): Promise<AdminStats> {
    return systemMaintenanceModule.getAdminStats();
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
    return compatibilityModule.getSystemLogs(filters);
  }

  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    return compatibilityModule.createSystemLog(log);
  }

  // وظائف أخرى ضرورية للتوافق
  async addStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
    return compatibilityModule.addStock(itemId, quantity, reason, userId);
  }

  async withdrawStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
    return compatibilityModule.withdrawStock(itemId, quantity, reason, userId);
  }

  // وظائف إضافية للحفاظ على التوافق الكامل
  async getTechniciansInventory(): Promise<TechnicianInventory[]> {
    return devicesModule.getTechniciansInventory();
  }

  async createTechnicianInventory(data: InsertTechnicianInventory): Promise<TechnicianInventory> {
    return devicesModule.createTechnicianInventory(data);
  }

  async updateTechnicianInventory(id: string, updates: Partial<InsertTechnicianInventory>): Promise<TechnicianInventory> {
    return inventoryEntriesModule.updateTechnicianInventory(id, updates);
  }

  async deleteTechnicianInventory(id: string): Promise<boolean> {
    return devicesModule.deleteTechnicianInventory(id);
  }

  async getWithdrawnDevices(): Promise<WithdrawnDevice[]> {
    return devicesModule.getWithdrawnDevices();
  }

  async getWithdrawnDevice(id: string): Promise<WithdrawnDevice | undefined> {
    return devicesModule.getWithdrawnDevice(id);
  }

  async createWithdrawnDevice(data: InsertWithdrawnDevice): Promise<WithdrawnDevice> {
    return devicesModule.createWithdrawnDevice(data);
  }

  async getReceivedDevices(filters?: { status?: string; technicianId?: string; supervisorId?: string; regionId?: string }): Promise<ReceivedDevice[]> {
    return devicesModule.getReceivedDevices(filters);
  }

  async createReceivedDevice(data: InsertReceivedDevice): Promise<ReceivedDevice> {
    return devicesModule.createReceivedDevice(data);
  }

  async updateReceivedDeviceStatus(id: string, status: string, approvedBy: string, adminNotes?: string): Promise<ReceivedDevice> {
    return devicesModule.updateReceivedDeviceStatus(id, status, approvedBy, adminNotes);
  }

  async getPendingReceivedDevicesCount(supervisorId?: string, regionId?: string | null): Promise<number> {
    return devicesModule.getPendingReceivedDevicesCount(supervisorId, regionId);
  }

  // ================================
  // LEGACY COMPATIBILITY LAYER (Batch-1/2)
  // ================================
  async logSystemActivity(log: InsertSystemLog): Promise<SystemLog> {
    return compatibilityModule.logSystemActivity(log);
  }

  async getWithdrawnDevicesByRegion(regionId: string): Promise<WithdrawnDevice[]> {
    return devicesModule.getWithdrawnDevicesByRegion(regionId);
  }

  async updateWithdrawnDevice(id: string, updates: Partial<InsertWithdrawnDevice>): Promise<WithdrawnDevice> {
    return devicesModule.updateWithdrawnDevice(id, updates);
  }

  async deleteWithdrawnDevice(id: string): Promise<boolean> {
    return devicesModule.deleteWithdrawnDevice(id);
  }

  async getReceivedDevice(id: string): Promise<ReceivedDevice | undefined> {
    return devicesModule.getReceivedDevice(id);
  }

  async deleteReceivedDevice(id: string): Promise<boolean> {
    return devicesModule.deleteReceivedDevice(id);
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
    return transactionsModule.getTransactions(filters);
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
    return transactionStatisticsModule.getTransactionStatistics(filters);
  }

  async getTechnicianFixedInventory(technicianId: string): Promise<TechnicianFixedInventory | undefined> {
    return fixedInventoryModule.getTechnicianFixedInventory(technicianId);
  }

  async createTechnicianFixedInventory(data: InsertTechnicianFixedInventory): Promise<TechnicianFixedInventory> {
    return fixedInventoryModule.createTechnicianFixedInventory(data);
  }

  async updateTechnicianFixedInventory(technicianId: string, updates: Partial<InsertTechnicianFixedInventory>): Promise<TechnicianFixedInventory> {
    return fixedInventoryModule.updateTechnicianFixedInventory(technicianId, updates);
  }

  async deleteTechnicianFixedInventory(technicianId: string): Promise<boolean> {
    return fixedInventoryModule.deleteTechnicianFixedInventory(technicianId);
  }

  async getAllTechniciansWithFixedInventory(): Promise<TechnicianWithFixedInventory[]> {
    return fixedInventoryModule.getAllTechniciansWithFixedInventory();
  }

  async getFixedInventorySummary(): Promise<FixedInventorySummary> {
    return fixedInventoryModule.getFixedInventorySummary();
  }

  async getAllTechniciansWithBothInventories(): Promise<any[]> {
    return fixedInventoryModule.getAllTechniciansWithBothInventories();
  }

  async getRegionTechniciansWithInventories(regionId: string): Promise<any[]> {
    return fixedInventoryModule.getRegionTechniciansWithInventories(regionId);
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    return fixedInventoryModule.createStockMovement(movement);
  }

  async getStockMovements(technicianId?: string, limit: number = 50): Promise<StockMovementWithDetails[]> {
    return fixedInventoryModule.getStockMovements(technicianId, limit);
  }

  async getStockMovementsByRegion(regionId: string): Promise<StockMovementWithDetails[]> {
    return fixedInventoryModule.getStockMovementsByRegion(regionId);
  }

  async getStockMovementsByTechnician(technicianId: string): Promise<StockMovementWithDetails[]> {
    return fixedInventoryModule.getStockMovementsByTechnician(technicianId);
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
    return compatibilityModule.transferStock(params);
  }

  async getTechnicianFixedInventoryEntries(technicianId: string): Promise<TechnicianFixedInventoryEntry[]> {
    return fixedInventoryModule.getTechnicianFixedInventoryEntries(technicianId);
  }

  async upsertTechnicianFixedInventoryEntry(
    technicianId: string,
    itemTypeId: string,
    boxes: number,
    units: number
  ): Promise<TechnicianFixedInventoryEntry> {
    return fixedInventoryModule.upsertTechnicianFixedInventoryEntry(technicianId, itemTypeId, boxes, units);
  }

  async getWarehousesByRegion(regionId: string): Promise<WarehouseWithStats[]> {
    return supervisionModule.getWarehousesByRegion(regionId);
  }

  async getWarehousesBySupervisor(supervisorId: string): Promise<WarehouseWithStats[]> {
    return supervisionModule.getWarehousesBySupervisor(supervisorId);
  }

  async assignWarehouseToSupervisor(supervisorId: string, warehouseId: string): Promise<SupervisorWarehouse> {
    return supervisionModule.assignWarehouseToSupervisor(supervisorId, warehouseId);
  }

  async removeWarehouseFromSupervisor(supervisorId: string, warehouseId: string): Promise<boolean> {
    return supervisionModule.removeWarehouseFromSupervisor(supervisorId, warehouseId);
  }

  async getSupervisorWarehouses(supervisorId: string): Promise<string[]> {
    return supervisionModule.getSupervisorWarehouses(supervisorId);
  }

  async getTechnicianSupervisor(technicianId: string): Promise<string | null> {
    return supervisionModule.getTechnicianSupervisor(technicianId);
  }

  async getInventoryRequests(warehouseId?: string, technicianId?: string, status?: string): Promise<InventoryRequest[]> {
    return requestsModule.getInventoryRequests(warehouseId, technicianId, status);
  }

  async getUserInventoryRequests(userId: string): Promise<InventoryRequest[]> {
    return requestsModule.getUserInventoryRequests(userId);
  }

  async createInventoryRequest(request: InsertInventoryRequest): Promise<InventoryRequest> {
    return requestsModule.createInventoryRequest(request);
  }

  async updateInventoryRequestStatus(
    id: string,
    status: string,
    respondedBy: string,
    adminNotes?: string
  ): Promise<InventoryRequest> {
    return requestsModule.updateInventoryRequestStatus(id, status, respondedBy, adminNotes);
  }

  async deleteInventoryRequest(id: string): Promise<boolean> {
    return requestsModule.deleteInventoryRequest(id);
  }

  async getPendingInventoryRequestsCount(): Promise<number> {
    return requestsModule.getPendingInventoryRequestsCount();
  }

  async acceptWarehouseTransferBatch(transferIds: string[]): Promise<WarehouseTransfer[]> {
    return compatibilityModule.acceptWarehouseTransferBatch(transferIds);
  }

  async rejectWarehouseTransferBatch(transferIds: string[], reason?: string): Promise<WarehouseTransfer[]> {
    return transfersModule.rejectWarehouseTransferBatch(transferIds, reason);
  }

  async acceptWarehouseTransfersBulk(criteria?: {
    warehouseId?: string;
    technicianId?: string;
    regionId?: string;
    limit?: number;
  }): Promise<WarehouseTransfer[]> {
    return compatibilityModule.acceptWarehouseTransfersBulk(criteria);
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
    return transfersModule.rejectWarehouseTransfersBulk(criteria, reason);
  }

  async acceptWarehouseTransferByRequestId(requestId: string): Promise<WarehouseTransfer> {
    return transfersModule.acceptWarehouseTransferByRequestId(requestId);
  }

  async rejectWarehouseTransferByRequestId(requestId: string, reason?: string): Promise<WarehouseTransfer> {
    return transfersModule.rejectWarehouseTransferByRequestId(requestId, reason);
  }

  async exportAllData(): Promise<{ exportedAt: string; data: Record<string, unknown> }> {
    return systemMaintenanceModule.exportAllData();
  }

  async importAllData(_backup: { data?: Record<string, unknown> }): Promise<void> {
    return systemMaintenanceModule.importAllData(_backup);
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