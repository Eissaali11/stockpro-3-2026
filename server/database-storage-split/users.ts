import { repositories } from '../infrastructure/repositories';
import type { InsertUser, SupervisorTechnician, User, UserSafe } from '../infrastructure/schemas';

export async function getUsers(): Promise<UserSafe[]> {
  return repositories.user.getUsers();
}

export async function getUser(id: string): Promise<UserSafe | undefined> {
  return repositories.user.getUser(id);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  return repositories.user.getUserByUsername(username);
}

export async function createUser(insertUser: InsertUser): Promise<UserSafe> {
  return repositories.user.createUser(insertUser);
}

export async function updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe> {
  return repositories.user.updateUser(id, updates);
}

export async function deleteUser(id: string): Promise<boolean> {
  return repositories.user.deleteUser(id);
}

export async function getSupervisorTechnicians(supervisorId: string): Promise<UserSafe[]> {
  return repositories.supervisor.getSupervisorTechnicians(supervisorId);
}

export async function getSupervisorTechnicianIds(supervisorId: string): Promise<string[]> {
  const technicians = await repositories.supervisor.getSupervisorTechnicians(supervisorId);
  return technicians.map((technician) => technician.id);
}

export async function assignTechnicianToSupervisor(supervisorId: string, technicianId: string): Promise<SupervisorTechnician> {
  return repositories.supervisor.assignTechnicianToSupervisor(supervisorId, technicianId);
}

export async function removeTechnicianFromSupervisor(supervisorId: string, technicianId: string): Promise<boolean> {
  return repositories.supervisor.removeTechnicianFromSupervisor(supervisorId, technicianId);
}
