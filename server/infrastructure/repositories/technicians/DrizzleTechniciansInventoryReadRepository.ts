import type { ITechniciansInventoryReadRepository } from '../../../application/technicians/contracts/ITechniciansInventoryReadRepository';
import { TechnicianService } from '../../../services/technician.service';

export class DrizzleTechniciansInventoryReadRepository implements ITechniciansInventoryReadRepository {
  private readonly technicianService = new TechnicianService();

  async getAllTechniciansWithBothInventories(): Promise<any[]> {
    return this.technicianService.getAllTechniciansWithBothInventories();
  }

  async getRegionTechniciansWithInventories(regionId: string): Promise<any[]> {
    return this.technicianService.getRegionTechniciansWithInventories(regionId);
  }
}
