import { storage } from "../storage";
import type { InsertWarehouse, WarehouseWithInventory } from "@shared/schema";

export async function getWarehouses() {
  return storage.getWarehouses();
}

export async function getWarehousesByRegion(regionId: string) {
  return storage.getWarehousesByRegion(regionId);
}

export async function getWarehouse(id: string): Promise<WarehouseWithInventory | undefined> {
  return storage.getWarehouse(id);
}

export async function createWarehouse(warehouse: InsertWarehouse, createdBy: string) {
  return storage.createWarehouse(warehouse, createdBy);
}

export async function updateWarehouse(id: string, updates: Partial<InsertWarehouse>) {
  return storage.updateWarehouse(id, updates);
}

export async function deleteWarehouse(id: string) {
  return storage.deleteWarehouse(id);
}
