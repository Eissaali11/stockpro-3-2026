import { storage } from "../storage";
import type { InsertWarehouseTransfer } from "@shared/schema";

export async function getWarehouseTransfers(warehouseId?: string, technicianId?: string, regionId?: string, limit?: number) {
  return storage.getWarehouseTransfers(warehouseId, technicianId, regionId, limit);
}

export async function createWarehouseTransfer(data: InsertWarehouseTransfer) {
  return storage.transferFromWarehouse(data);
}

export async function acceptWarehouseTransfer(id: string) {
  return storage.acceptWarehouseTransfer(id);
}

export async function rejectWarehouseTransfer(id: string, reason?: string) {
  return storage.rejectWarehouseTransfer(id, reason);
}
