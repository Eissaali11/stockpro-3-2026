import type { InventoryRequest, InsertInventoryRequest } from '../../../infrastructure/schemas';

export interface IInventoryRequestsCreateRepository {
  getByTechnicianId(technicianId: string): Promise<InventoryRequest[]>;
  create(data: InsertInventoryRequest): Promise<InventoryRequest>;
}
