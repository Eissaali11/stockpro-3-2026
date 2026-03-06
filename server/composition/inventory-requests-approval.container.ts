import { ApproveInventoryRequestUseCase } from '../application/inventory-requests/use-cases/ApproveInventoryRequest.use-case';
import { RejectInventoryRequestUseCase } from '../application/inventory-requests/use-cases/RejectInventoryRequest.use-case';
import { DrizzleInventoryRequestApprovalUnitOfWork } from '../infrastructure/repositories/inventory-requests/DrizzleInventoryRequestApprovalUnitOfWork';

class InventoryRequestsApprovalContainer {
  private readonly unitOfWork = new DrizzleInventoryRequestApprovalUnitOfWork();

  readonly approveInventoryRequestUseCase = new ApproveInventoryRequestUseCase(this.unitOfWork);
  readonly rejectInventoryRequestUseCase = new RejectInventoryRequestUseCase(this.unitOfWork);
}

export const inventoryRequestsApprovalContainer = new InventoryRequestsApprovalContainer();
