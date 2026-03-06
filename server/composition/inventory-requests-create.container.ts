import { InventoryRequestsCreateUseCase } from '../application/inventory-requests/use-cases/InventoryRequestsCreate.use-case';
import { CreateSystemLogUseCase } from '../application/system-logs/use-cases/CreateSystemLog.use-case';
import { SystemLogsRepository } from '../infrastructure/repositories/SystemLogsRepository';
import { DrizzleInventoryRequestsCreateRepository } from '../infrastructure/repositories/inventory-requests/DrizzleInventoryRequestsCreateRepository';

class InventoryRequestsCreateContainer {
  private readonly requestsRepository = new DrizzleInventoryRequestsCreateRepository();
  private readonly systemLogsRepository = new SystemLogsRepository();

  readonly inventoryRequestsCreateUseCase = new InventoryRequestsCreateUseCase(this.requestsRepository);
  readonly createSystemLogUseCase = new CreateSystemLogUseCase(this.systemLogsRepository);
}

export const inventoryRequestsCreateContainer = new InventoryRequestsCreateContainer();
