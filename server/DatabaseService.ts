import { repositories } from './infrastructure/repositories';
import { 
  type User, 
  type InsertUser, 
  type UserSafe, 
  type Warehouse,
  type InsertWarehouse,
  type WarehouseWithStats,
  type WarehouseWithInventory,
  type WarehouseInventory,
  type InsertWarehouseInventory,
  type WarehouseTransfer,
  type InsertWarehouseTransfer,
  type WarehouseTransferWithDetails,
  type WarehouseInventoryEntry,
  type InsertWarehouseInventoryEntry,
  type TechnicianMovingInventoryEntry,
  type InsertTechnicianMovingInventoryEntry,
  type TechnicianInventory,
  type InsertTechnicianInventory,
  type InventoryRequest,
  type InsertInventoryRequest,
  type SupervisorTechnician,
  type InsertSupervisorTechnician,
} from './infrastructure/schemas';

/**
 * Modern Database Service Implementation
 * Uses Repository Pattern with Clean Architecture principles
 * Provides backward compatibility through delegation
 */
export class DatabaseService {
  // User Management Methods
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

  async getSupervisorTechnicians(supervisorId: string): Promise<UserSafe[]> {
    return repositories.supervisor.getSupervisorTechnicians(supervisorId);
  }

  async assignTechnicianToSupervisor(supervisorId: string, technicianId: string): Promise<SupervisorTechnician> {
    return repositories.supervisor.assignTechnicianToSupervisor(supervisorId, technicianId);
  }

  async removeTechnicianFromSupervisor(supervisorId: string, technicianId: string): Promise<boolean> {
    return repositories.supervisor.removeTechnicianFromSupervisor(supervisorId, technicianId);
  }

  // Warehouse Management Methods
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

  async getWarehouseInventory(warehouseId: string): Promise<WarehouseInventory | undefined> {
    const inventory = await repositories.warehouse.getWarehouseInventory(warehouseId);
    return inventory || undefined;
  }

  async updateWarehouseInventory(warehouseId: string, updates: Partial<InsertWarehouseInventory>): Promise<WarehouseInventory> {
    return repositories.warehouse.updateWarehouseInventory(warehouseId, updates);
  }

  // Warehouse Inventory Entries (New System)
  async getWarehouseInventoryEntries(warehouseId: string): Promise<WarehouseInventoryEntry[]> {
    return repositories.warehouseInventory.getWarehouseInventoryEntries(warehouseId);
  }

  async upsertWarehouseInventoryEntry(warehouseId: string, itemTypeId: string, boxes: number, units: number): Promise<WarehouseInventoryEntry> {
    return repositories.warehouseInventory.upsertWarehouseInventoryEntry(warehouseId, itemTypeId, boxes, units);
  }

  // Technician Inventory Methods
  async getTechnicianMovingInventoryEntries(technicianId: string): Promise<TechnicianMovingInventoryEntry[]> {
    return repositories.technicianInventory.getTechnicianMovingInventoryEntries(technicianId);
  }

  async upsertTechnicianMovingInventoryEntry(technicianId: string, itemTypeId: string, boxes: number, units: number): Promise<TechnicianMovingInventoryEntry> {
    return repositories.technicianInventory.upsertTechnicianMovingInventoryEntry(technicianId, itemTypeId, boxes, units);
  }

  async getTechnicianInventory(technicianId: string): Promise<TechnicianInventory | undefined> {
    return repositories.technicianInventory.getTechnicianInventory(technicianId);
  }

  async updateTechnicianInventory(technicianId: string, updates: Partial<InsertTechnicianInventory>): Promise<TechnicianInventory> {
    return repositories.technicianInventory.updateTechnicianInventory(technicianId, updates);
  }

  // Transfer Methods
  async getWarehouseTransfers(warehouseId?: string, technicianId?: string, regionId?: string, limit?: number): Promise<WarehouseTransferWithDetails[]> {
    return repositories.transfer.getWarehouseTransfers(warehouseId, technicianId, regionId, limit);
  }

  async transferFromWarehouse(data: InsertWarehouseTransfer): Promise<WarehouseTransfer> {
    return repositories.transfer.transferFromWarehouse(data);
  }

  async acceptWarehouseTransfer(transferId: string): Promise<WarehouseTransfer> {
    return repositories.transfer.acceptWarehouseTransfer(transferId);
  }
}