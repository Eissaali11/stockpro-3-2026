import { repositories } from '../infrastructure/repositories';
import type { WarehouseTransfer, InsertWarehouseTransfer, WarehouseTransferWithDetails } from '../infrastructure/schemas';

export async function getWarehouseTransfers(
  warehouseId?: string,
  technicianId?: string,
  regionId?: string,
  limit?: number
): Promise<WarehouseTransferWithDetails[]> {
  return repositories.transfer.getWarehouseTransfers(warehouseId, technicianId, regionId, limit);
}

export async function transferFromWarehouse(data: InsertWarehouseTransfer): Promise<WarehouseTransfer> {
  return repositories.transfer.transferFromWarehouse(data);
}

export async function acceptWarehouseTransfer(transferId: string, performedBy?: string): Promise<WarehouseTransfer> {
  return repositories.transfer.acceptWarehouseTransfer(transferId, performedBy);
}

export async function rejectWarehouseTransfer(transferId: string, reason: string, performedBy?: string): Promise<WarehouseTransfer> {
  return repositories.transfer.rejectWarehouseTransfer(transferId, reason, performedBy);
}
