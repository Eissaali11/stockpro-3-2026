import type { IInventoryRepository } from './IInventoryRepository';
import type { IInventoryTransactionLogRepository } from './IInventoryTransactionLogRepository';
import type { ITechnicianInventoryTransferRepository } from './ITechnicianInventoryTransferRepository';
import type { IStockMovementRepository } from './IStockMovementRepository';
import type { IWarehouseTransferBatchRepository } from './IWarehouseTransferBatchRepository';

export type InventoryTransactionalContext = {
  inventoryRepository: IInventoryRepository;
  transactionLogRepository: IInventoryTransactionLogRepository;
  technicianInventoryTransferRepository?: ITechnicianInventoryTransferRepository;
  stockMovementRepository?: IStockMovementRepository;
  warehouseTransferBatchRepository?: IWarehouseTransferBatchRepository;
};

export interface IInventoryUnitOfWork {
  execute<T>(work: (context: InventoryTransactionalContext) => Promise<T>): Promise<T>;
}
