import type {
  TechnicianInventory,
  TechnicianMovingInventoryEntry,
} from '../../../infrastructure/schemas';

export interface ITechnicianMovingInventoryReadRepository {
  getTechnicianInventory(technicianId: string): Promise<TechnicianInventory | undefined>;
  getTechnicianMovingInventoryEntries(technicianId: string): Promise<TechnicianMovingInventoryEntry[]>;
}
