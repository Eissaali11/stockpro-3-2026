import type { IInventoryRequestsCreateRepository } from '../../../application/inventory-requests/contracts/IInventoryRequestsCreateRepository';
import type { InventoryRequest, InsertInventoryRequest } from '../../../infrastructure/schemas';
import { InventoryRequestsRepository } from '../InventoryRequestsRepository';

export class DrizzleInventoryRequestsCreateRepository implements IInventoryRequestsCreateRepository {
  private readonly repository = new InventoryRequestsRepository();

  async getByTechnicianId(technicianId: string): Promise<InventoryRequest[]> {
    return this.repository.getInventoryRequests(undefined, technicianId);
  }

  async create(data: InsertInventoryRequest): Promise<InventoryRequest> {
    return this.repository.createInventoryRequest(data);
  }
}
