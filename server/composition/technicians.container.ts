import {
  GetAllTechniciansInventoryUseCase,
  GetTechniciansInventoryByActorUseCase,
} from '../application/technicians/use-cases/GetTechniciansInventoryByActor.use-case';
import { DrizzleTechniciansInventoryReadRepository } from '../infrastructure/repositories/technicians/DrizzleTechniciansInventoryReadRepository';

class TechniciansContainer {
  private readonly repository = new DrizzleTechniciansInventoryReadRepository();

  readonly getAllTechniciansInventoryUseCase = new GetAllTechniciansInventoryUseCase(this.repository);
  readonly getTechniciansInventoryByActorUseCase = new GetTechniciansInventoryByActorUseCase(this.repository);
}

export const techniciansContainer = new TechniciansContainer();
