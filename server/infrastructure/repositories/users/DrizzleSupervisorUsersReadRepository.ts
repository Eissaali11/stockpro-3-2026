import type { ISupervisorUsersReadRepository } from '../../../application/users/contracts/ISupervisorUsersReadRepository';
import type {
  TechnicianFixedInventory,
  TechnicianInventory,
  UserSafe,
} from '../../../infrastructure/schemas';
import { UserRepository } from '../UserRepository';
import { DrizzleStockFixedInventoryRepository } from '../inventory/DrizzleStockFixedInventoryRepository';
import { TechnicianInventoryRepository } from '../TechnicianInventoryRepository';

export class DrizzleSupervisorUsersReadRepository implements ISupervisorUsersReadRepository {
  private readonly users = new UserRepository();
  private readonly fixedInventory = new DrizzleStockFixedInventoryRepository();
  private readonly technicianInventory = new TechnicianInventoryRepository();

  async getUserById(id: string): Promise<UserSafe | undefined> {
    return this.users.getUser(id);
  }

  async getTechnicianFixedInventory(technicianId: string): Promise<TechnicianFixedInventory | undefined> {
    return this.fixedInventory.getTechnicianFixedInventory(technicianId);
  }

  async getTechnicianMovingInventory(technicianId: string): Promise<TechnicianInventory | undefined> {
    return this.technicianInventory.getTechnicianInventory(technicianId);
  }
}