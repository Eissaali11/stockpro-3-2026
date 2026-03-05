import { AddInventoryStockUseCase } from '../application/inventory/use-cases/AddInventoryStock.use-case';
import { AcceptBulkWarehouseTransfersUseCase } from '../application/inventory/use-cases/AcceptBulkWarehouseTransfers.use-case';
import { AcceptWarehouseTransferBatchUseCase } from '../application/inventory/use-cases/AcceptWarehouseTransferBatch.use-case';
import { TransferStockUseCase } from '../application/inventory/use-cases/TransferStock.use-case';
import { WithdrawInventoryStockUseCase } from '../application/inventory/use-cases/WithdrawInventoryStock.use-case';
import { DrizzleInventoryUnitOfWork } from '../infrastructure/repositories/inventory/DrizzleInventoryUnitOfWork';

class InventoryContainer {
  private readonly unitOfWork = new DrizzleInventoryUnitOfWork();

  readonly addInventoryStockUseCase = new AddInventoryStockUseCase(this.unitOfWork);
  readonly withdrawInventoryStockUseCase = new WithdrawInventoryStockUseCase(this.unitOfWork);
  readonly transferStockUseCase = new TransferStockUseCase(this.unitOfWork);
  readonly acceptWarehouseTransferBatchUseCase = new AcceptWarehouseTransferBatchUseCase(this.unitOfWork);
  readonly acceptBulkWarehouseTransfersUseCase = new AcceptBulkWarehouseTransfersUseCase(this.unitOfWork);
}

export const inventoryContainer = new InventoryContainer();
