import { WithdrawTechnicianInventoryToWarehouseUseCase } from '../application/inventory/use-cases/WithdrawTechnicianInventoryToWarehouse.use-case';
import { DrizzleWithdrawTechnicianInventoryToWarehouseRepository } from '../infrastructure/repositories/technicians/DrizzleWithdrawTechnicianInventoryToWarehouseRepository';

export function createWithdrawTechnicianInventoryToWarehouseUseCase(): WithdrawTechnicianInventoryToWarehouseUseCase {
  const repository = new DrizzleWithdrawTechnicianInventoryToWarehouseRepository();
  return new WithdrawTechnicianInventoryToWarehouseUseCase(repository);
}
