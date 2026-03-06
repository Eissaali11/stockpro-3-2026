import { SupervisorUsersReadUseCase } from '../application/users/use-cases/SupervisorUsersRead.use-case';
import { DrizzleSupervisorUsersReadRepository } from '../infrastructure/repositories/users/DrizzleSupervisorUsersReadRepository';

class SupervisorUsersContainer {
  private readonly repository = new DrizzleSupervisorUsersReadRepository();

  readonly supervisorUsersReadUseCase = new SupervisorUsersReadUseCase(this.repository);
}

export const supervisorUsersContainer = new SupervisorUsersContainer();