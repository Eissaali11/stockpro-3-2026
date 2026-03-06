import type { TechnicianInventory, TechnicianMovingInventoryEntry } from '../../schemas';
import type { ITechnicianMovingInventoryReadRepository } from '../../../application/technicians/contracts/ITechnicianMovingInventoryReadRepository';
import { TechnicianInventoryRepository } from '../TechnicianInventoryRepository';

export class DrizzleTechnicianMovingInventoryReadRepository implements ITechnicianMovingInventoryReadRepository {
  private readonly technicianInventory = new TechnicianInventoryRepository();

  async getTechnicianInventory(technicianId: string): Promise<TechnicianInventory | undefined> {
    return this.technicianInventory.getTechnicianInventory(technicianId);
  }

  async getTechnicianMovingInventoryEntries(
    technicianId: string,
  ): Promise<TechnicianMovingInventoryEntry[]> {
    return this.technicianInventory.getTechnicianMovingInventoryEntries(technicianId);
  }
}
