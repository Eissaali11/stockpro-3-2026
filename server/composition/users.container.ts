import { UserManagementUseCase } from '../application/users/use-cases/UserManagement.use-case';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

class UsersContainer {
  private readonly repository = new UserRepository();

  readonly userManagementUseCase = new UserManagementUseCase(this.repository);
}

export const usersContainer = new UsersContainer();