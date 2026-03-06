import { InventoryRequestsManagementUseCase } from '../application/inventory-requests/use-cases/InventoryRequestsManagement.use-case';
import { CreateSystemLogUseCase } from '../application/system-logs/use-cases/CreateSystemLog.use-case';
import { SystemLogsRepository } from '../infrastructure/repositories/SystemLogsRepository';
import { DrizzleInventoryRequestsManagementRepository } from '../infrastructure/repositories/inventory-requests/DrizzleInventoryRequestsManagementRepository';

class InventoryRequestsManagementContainer {
  private readonly requestsRepository = new DrizzleInventoryRequestsManagementRepository();
  private readonly systemLogsRepository = new SystemLogsRepository();

  readonly inventoryRequestsManagementUseCase = new InventoryRequestsManagementUseCase(this.requestsRepository);
  readonly createSystemLogUseCase = new CreateSystemLogUseCase(this.systemLogsRepository);
}

export const inventoryRequestsManagementContainer = new InventoryRequestsManagementContainer();
