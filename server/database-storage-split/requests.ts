import { repositories } from '../infrastructure/repositories';
import type { InventoryRequest, InsertInventoryRequest } from '../infrastructure/schemas';

export async function getInventoryRequests(warehouseId?: string, technicianId?: string, status?: string): Promise<InventoryRequest[]> {
  return repositories.inventoryRequests.getInventoryRequests(warehouseId, technicianId, status);
}

export async function createInventoryRequest(request: InsertInventoryRequest): Promise<InventoryRequest> {
  return repositories.inventoryRequests.createInventoryRequest(request);
}

export async function updateInventoryRequest(id: string, updates: Partial<InsertInventoryRequest>): Promise<InventoryRequest> {
  return repositories.inventoryRequests.updateInventoryRequest(id, updates);
}

export async function deleteInventoryRequest(id: string): Promise<boolean> {
  return repositories.inventoryRequests.deleteInventoryRequest(id);
}
