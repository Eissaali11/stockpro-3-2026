import { inventoryContainer } from '../composition/inventory.container';
import type {
  InventoryItem,
  InsertSystemLog,
  StockMovement,
  SystemLog,
  TechnicianFixedInventory,
  WarehouseTransfer,
} from '../infrastructure/schemas';
import * as logsModule from './logs';

export async function getSystemLogs(filters?: {
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

export async function createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
  return logsModule.createSystemLog(log);
}

export async function logSystemActivity(log: InsertSystemLog): Promise<SystemLog> {
  return createSystemLog(log);
}

export async function addStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
  return inventoryContainer.addInventoryStockUseCase.execute({
    itemId,
    quantity,
    reason,
    userId,
  });
}

export async function withdrawStock(itemId: string, quantity: number, reason?: string, userId?: string): Promise<InventoryItem> {
  return inventoryContainer.withdrawInventoryStockUseCase.execute({
    itemId,
    quantity,
    reason,
    userId,
  });
}

export async function transferStock(params: {
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
  return inventoryContainer.transferStockUseCase.execute({
    technicianId: params.technicianId,
    itemType: params.itemType,
    packagingType: params.packagingType as 'box' | 'unit',
    quantity: params.quantity,
    fromInventory: params.fromInventory as 'fixed' | 'moving',
    toInventory: params.toInventory as 'fixed' | 'moving',
    performedBy: params.performedBy,
    reason: params.reason,
    notes: params.notes,
  });
}

export async function acceptWarehouseTransferBatch(transferIds: string[]): Promise<WarehouseTransfer[]> {
  return inventoryContainer.acceptWarehouseTransferBatchUseCase.execute(transferIds);
}

export async function acceptWarehouseTransfersBulk(criteria?: {
  warehouseId?: string;
  technicianId?: string;
  regionId?: string;
  limit?: number;
}): Promise<WarehouseTransfer[]> {
  return inventoryContainer.acceptBulkWarehouseTransfersUseCase.execute(criteria);
}
