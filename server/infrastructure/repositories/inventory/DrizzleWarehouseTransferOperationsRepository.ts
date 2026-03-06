import type {
  CreateWarehouseTransferOperationInput,
  IWarehouseTransferOperationsRepository,
  WarehouseTransferQueryFilters,
} from '../../../application/inventory/contracts/IWarehouseTransferOperationsRepository';
import { TransferRepository } from '../TransferRepository';

export class DrizzleWarehouseTransferOperationsRepository implements IWarehouseTransferOperationsRepository {
  private readonly repository = new TransferRepository();

  async getWarehouseTransfers(filters?: WarehouseTransferQueryFilters) {
    return this.repository.getWarehouseTransfers(
      filters?.warehouseId,
      filters?.technicianId,
      filters?.regionId,
      filters?.limit
    );
  }

  async createWarehouseTransfer(input: CreateWarehouseTransferOperationInput) {
    return this.repository.transferFromWarehouse(input as any);
  }

  async acceptWarehouseTransfer(transferId: string, performedBy?: string) {
    return this.repository.acceptWarehouseTransfer(transferId, performedBy);
  }

  async rejectWarehouseTransfer(transferId: string, reason: string, performedBy?: string) {
    return this.repository.rejectWarehouseTransfer(transferId, reason, performedBy);
  }
}