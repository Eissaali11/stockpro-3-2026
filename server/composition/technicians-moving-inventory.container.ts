import { GetTechnicianMovingInventoryUseCase } from '../application/technicians/use-cases/GetTechnicianMovingInventory.use-case';
import { DrizzleTechnicianMovingInventoryReadRepository } from '../infrastructure/repositories/technicians/DrizzleTechnicianMovingInventoryReadRepository';

export function createGetTechnicianMovingInventoryUseCase(): GetTechnicianMovingInventoryUseCase {
  const repository = new DrizzleTechnicianMovingInventoryReadRepository();
  return new GetTechnicianMovingInventoryUseCase(repository);
}
