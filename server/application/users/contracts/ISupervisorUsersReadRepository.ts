import type {
  TechnicianFixedInventory,
  TechnicianInventory,
  UserSafe,
} from '../../../infrastructure/schemas';

export interface ISupervisorUsersReadRepository {
  getUserById(id: string): Promise<UserSafe | undefined>;
  getTechnicianFixedInventory(technicianId: string): Promise<TechnicianFixedInventory | undefined>;
  getTechnicianMovingInventory(technicianId: string): Promise<TechnicianInventory | undefined>;
}