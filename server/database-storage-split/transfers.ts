import { repositories } from '../infrastructure/repositories';
import type { InsertWarehouseTransfer, WarehouseTransfer, WarehouseTransferWithDetails } from '../infrastructure/schemas';

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

export async function rejectWarehouseTransferBatch(transferIds: string[], reason?: string): Promise<WarehouseTransfer[]> {
  const results: WarehouseTransfer[] = [];
  for (const transferId of transferIds) {
    results.push(await rejectWarehouseTransfer(transferId, reason || 'Rejected'));
  }
  return results;
}

export async function rejectWarehouseTransfersBulk(
  criteria?: {
    warehouseId?: string;
    technicianId?: string;
    regionId?: string;
    limit?: number;
  },
  reason?: string
): Promise<WarehouseTransfer[]> {
  const transfers = await getWarehouseTransfers(
    criteria?.warehouseId,
    criteria?.technicianId,
    criteria?.regionId,
    criteria?.limit
  );

  const pending = transfers.filter((transfer) => transfer.status === 'pending');
  const results: WarehouseTransfer[] = [];

  for (const transfer of pending) {
    results.push(await rejectWarehouseTransfer(transfer.id, reason || 'Rejected'));
  }

  return results;
}

export async function acceptWarehouseTransferByRequestId(requestId: string): Promise<WarehouseTransfer> {
  const transfers = await getWarehouseTransfers();
  const transfer = transfers.find((item) => item.requestId === requestId);

  if (!transfer) {
    throw new Error(`Warehouse transfer with request id ${requestId} not found`);
  }

  return acceptWarehouseTransfer(transfer.id);
}

export async function rejectWarehouseTransferByRequestId(requestId: string, reason?: string): Promise<WarehouseTransfer> {
  const transfers = await getWarehouseTransfers();
  const transfer = transfers.find((item) => item.requestId === requestId);

  if (!transfer) {
    throw new Error(`Warehouse transfer with request id ${requestId} not found`);
  }

  return rejectWarehouseTransfer(transfer.id, reason || 'Rejected');
}
