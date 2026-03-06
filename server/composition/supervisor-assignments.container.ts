import { SupervisorAssignmentsUseCase } from '../application/users/use-cases/SupervisorAssignments.use-case';
import { SupervisorRepository } from '../infrastructure/repositories/SupervisorRepository';

class SupervisorAssignmentsContainer {
  private readonly repository = new SupervisorRepository();

  readonly supervisorAssignmentsUseCase = new SupervisorAssignmentsUseCase(this.repository);
}

export const supervisorAssignmentsContainer = new SupervisorAssignmentsContainer();
