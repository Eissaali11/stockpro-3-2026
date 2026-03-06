import { StockFixedInventoryUseCase } from '../application/inventory/use-cases/StockFixedInventory.use-case';
import { CreateSystemLogUseCase } from '../application/system-logs/use-cases/CreateSystemLog.use-case';
import { UserManagementUseCase } from '../application/users/use-cases/UserManagement.use-case';
import { DrizzleStockFixedInventoryRepository } from '../infrastructure/repositories/inventory/DrizzleStockFixedInventoryRepository';
import { SystemLogsRepository } from '../infrastructure/repositories/SystemLogsRepository';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

class StockFixedInventoryContainer {
  private readonly repository = new DrizzleStockFixedInventoryRepository();
  private readonly usersRepository = new UserRepository();
  private readonly systemLogsRepository = new SystemLogsRepository();

  readonly stockFixedInventoryUseCase = new StockFixedInventoryUseCase(this.repository);
  readonly userManagementUseCase = new UserManagementUseCase(this.usersRepository);
  readonly createSystemLogUseCase = new CreateSystemLogUseCase(this.systemLogsRepository);
}

export const stockFixedInventoryContainer = new StockFixedInventoryContainer();
