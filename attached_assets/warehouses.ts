import { repositories } from '../infrastructure/repositories';
import type {
  InsertWarehouse,
  InsertWarehouseInventory,
  Warehouse,
  WarehouseInventory,
  WarehouseInventoryEntry,
  WarehouseWithInventory,
  WarehouseWithStats,
} from '../infrastructure/schemas';

export async function getWarehouses(): Promise<WarehouseWithStats[]> {
  return repositories.warehouse.getWarehouses();
}

export async function getWarehouse(id: string): Promise<WarehouseWithInventory | undefined> {
  return repositories.warehouse.getWarehouse(id);
}

export async function createWarehouse(insertWarehouse: InsertWarehouse, createdBy: string): Promise<Warehouse> {
  return repositories.warehouse.createWarehouse(insertWarehouse, createdBy);
}

export async function updateWarehouse(id: string, updates: Partial<InsertWarehouse>): Promise<Warehouse> {
  return repositories.warehouse.updateWarehouse(id, updates);
}

export async function deleteWarehouse(id: string): Promise<boolean> {
  return repositories.warehouse.deleteWarehouse(id);
}

export async function getWarehouseInventory(warehouseId: string): Promise<WarehouseInventory | null> {
  return repositories.warehouse.getWarehouseInventory(warehouseId);
}

export async function updateWarehouseInventory(
  warehouseId: string,
  updates: Partial<InsertWarehouseInventory>
): Promise<WarehouseInventory> {
  return repositories.warehouse.updateWarehouseInventory(warehouseId, updates);
}

export async function getWarehouseInventoryEntries(warehouseId: string): Promise<WarehouseInventoryEntry[]> {
  return repositories.warehouseInventory.getWarehouseInventoryEntries(warehouseId);
}

export async function upsertWarehouseInventoryEntry(
  warehouseId: string,
  itemTypeId: string,
  boxes: number,
  units: number
): Promise<WarehouseInventoryEntry> {
  return repositories.warehouseInventory.upsertWarehouseInventoryEntry(warehouseId, itemTypeId, boxes, units);
}
