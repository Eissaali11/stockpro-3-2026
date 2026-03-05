
import { repositories as infraRepos } from "../infrastructure/repositories";
import type { InsertUser, UserSafe } from "@shared/schema";

export async function getUsers(): Promise<UserSafe[]> {
  return infraRepos.user.getUsers();
}

export async function getUser(id: string): Promise<UserSafe | undefined> {
  return infraRepos.user.getUser(id);
}

export async function getUserByUsername(username: string) {
  return infraRepos.user.getUserByUsername(username);
}

export async function createUser(user: InsertUser): Promise<UserSafe> {
  return infraRepos.user.createUser(user);
}

export async function updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe> {
  return infraRepos.user.updateUser(id, updates);
}

export async function deleteUser(id: string): Promise<boolean> {
  return infraRepos.user.deleteUser(id);
}

export async function getUsersByRole(role: string) {
  return infraRepos.user.getUsersByRole(role);
}

export async function getUsersByRegion(regionId: string) {
  return infraRepos.user.getUsersByRegion(regionId);
}
