import type { InsertRegion, InsertUser, Region, UserSafe } from '../../../infrastructure/schemas';

export interface IBootstrapDefaultsRepository {
  getUsers(): Promise<UserSafe[]>;
  getRegions(): Promise<Region[]>;
  createRegion(data: InsertRegion): Promise<Region>;
  createUser(data: InsertUser): Promise<UserSafe>;
  seedDefaultItemTypes(): Promise<void>;
}
