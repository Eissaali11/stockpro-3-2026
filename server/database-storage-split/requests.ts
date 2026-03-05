import { eq } from 'drizzle-orm';
import { getDatabase } from '../infrastructure/database/connection';
import { repositories } from '../infrastructure/repositories';
import { inventoryRequests } from '../infrastructure/schemas';
import type { InventoryRequest, InsertInventoryRequest } from '../infrastructure/schemas';

export async function getInventoryRequests(warehouseId?: string, technicianId?: string, status?: string): Promise<InventoryRequest[]> {
  return repositories.inventoryRequests.getInventoryRequests(warehouseId, technicianId, status);
}

export async function createInventoryRequest(request: InsertInventoryRequest): Promise<InventoryRequest> {
  return repositories.inventoryRequests.createInventoryRequest(request);
}

export async function getUserInventoryRequests(userId: string): Promise<InventoryRequest[]> {
  return repositories.inventoryRequests.getInventoryRequests(undefined, userId);
}

export async function updateInventoryRequest(id: string, updates: Partial<InsertInventoryRequest>): Promise<InventoryRequest> {
  return repositories.inventoryRequests.updateInventoryRequest(id, updates);
}

export async function updateInventoryRequestStatus(
  id: string,
  status: string,
  respondedBy: string,
  adminNotes?: string
): Promise<InventoryRequest> {
  const db = getDatabase();
  const [updated] = await db
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

export async function getPendingInventoryRequestsCount(): Promise<number> {
  const requests = await repositories.inventoryRequests.getInventoryRequests(undefined, undefined, 'pending');
  return requests.length;
}

export async function deleteInventoryRequest(id: string): Promise<boolean> {
  return repositories.inventoryRequests.deleteInventoryRequest(id);
}
