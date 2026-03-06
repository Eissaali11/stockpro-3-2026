import { StockTransferUseCase } from '../application/inventory/use-cases/StockTransfer.use-case';
import { CreateSystemLogUseCase } from '../application/system-logs/use-cases/CreateSystemLog.use-case';
import { SystemLogsRepository } from '../infrastructure/repositories/SystemLogsRepository';
import { DrizzleStockTransferRepository } from '../infrastructure/repositories/inventory/DrizzleStockTransferRepository';

class StockTransferContainer {
  private readonly repository = new DrizzleStockTransferRepository();
  private readonly systemLogsRepository = new SystemLogsRepository();

  readonly stockTransferUseCase = new StockTransferUseCase(this.repository);
  readonly createSystemLogUseCase = new CreateSystemLogUseCase(this.systemLogsRepository);
}

export const stockTransferContainer = new StockTransferContainer();
