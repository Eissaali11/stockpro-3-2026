import { repositories } from '../infrastructure/repositories';
import type {
  WarehouseInventoryEntry,
  TechnicianMovingInventoryEntry,
  TechnicianInventory,
  InsertTechnicianInventory,
} from '../infrastructure/schemas';

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

export async function getTechnicianMovingInventoryEntries(technicianId: string): Promise<TechnicianMovingInventoryEntry[]> {
  return repositories.technicianInventory.getTechnicianMovingInventoryEntries(technicianId);
}

export async function upsertTechnicianMovingInventoryEntry(
  technicianId: string,
  itemTypeId: string,
  boxes: number,
  units: number
): Promise<TechnicianMovingInventoryEntry> {
  return repositories.technicianInventory.upsertTechnicianMovingInventoryEntry(technicianId, itemTypeId, boxes, units);
}

export async function getTechnicianInventory(id: string): Promise<TechnicianInventory | undefined> {
  return repositories.technicianInventory.getTechnicianInventory(id);
}

export async function updateTechnicianInventory(
  id: string,
  updates: Partial<InsertTechnicianInventory>
): Promise<TechnicianInventory> {
  return repositories.technicianInventory.updateTechnicianInventory(id, updates);
}
