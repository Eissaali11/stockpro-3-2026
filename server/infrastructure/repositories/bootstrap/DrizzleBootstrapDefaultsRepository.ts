import type { IBootstrapDefaultsRepository } from '../../../application/bootstrap/contracts/IBootstrapDefaultsRepository';
import type { InsertRegion, InsertUser, Region, UserSafe } from '../../../infrastructure/schemas';
import { ItemTypesService } from '../../../services/item-types.service';
import { DrizzleRegionRepository } from '../DrizzleRegionRepository';
import { UserRepository } from '../UserRepository';

export class DrizzleBootstrapDefaultsRepository implements IBootstrapDefaultsRepository {
  private readonly usersRepository = new UserRepository();
  private readonly regionRepository = new DrizzleRegionRepository();
  private readonly itemTypesService = new ItemTypesService();

  async getUsers(): Promise<UserSafe[]> {
    return this.usersRepository.getUsers();
  }

  async getRegions(): Promise<Region[]> {
    return this.regionRepository.findAll();
  }

  async createRegion(data: InsertRegion): Promise<Region> {
    return this.regionRepository.create(data);
  }

  async createUser(data: InsertUser): Promise<UserSafe> {
    return this.usersRepository.createUser(data);
  }

  async seedDefaultItemTypes(): Promise<void> {
    await this.itemTypesService.seedDefaultItemTypes();
  }
}
