import { BootstrapDefaultsUseCase } from '../application/bootstrap/use-cases/BootstrapDefaults.use-case';
import { DrizzleBootstrapDefaultsRepository } from '../infrastructure/repositories/bootstrap/DrizzleBootstrapDefaultsRepository';

class BootstrapDefaultsContainer {
  private readonly repository = new DrizzleBootstrapDefaultsRepository();

  readonly bootstrapDefaultsUseCase = new BootstrapDefaultsUseCase(this.repository);
}

export const bootstrapDefaultsContainer = new BootstrapDefaultsContainer();
