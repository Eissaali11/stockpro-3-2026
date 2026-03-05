import { eq } from "drizzle-orm";
import { getDatabase } from "../database/connection";
import {
  users,
  User,
  UserSafe,
  InsertUser
} from "../schemas";

export interface IUserRepository {
  getUsers(): Promise<UserSafe[]>;
  getUser(id: string): Promise<UserSafe | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<UserSafe>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe>;
  deleteUser(id: string): Promise<boolean>;
  getUsersByRole(role: string): Promise<UserSafe[]>;
  getUsersByRegion(regionId: string): Promise<UserSafe[]>;
}

/**
 * User Repository Implementation (Core CRUD Operations)
 * Handles basic user management operations
 */
export class UserRepository implements IUserRepository {
  private get db() {
    return getDatabase();
  }

  async getUsers(): Promise<UserSafe[]> {
    const allUsers = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        profileImage: users.profileImage,
        city: users.city,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);
    return allUsers;
  }

  async getUser(id: string): Promise<UserSafe | undefined> {
    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        profileImage: users.profileImage,
        city: users.city,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<UserSafe> {
    // Check for duplicate username
    const existingUserByUsername = await this.getUserByUsername(insertUser.username);
    if (existingUserByUsername) {
      throw new Error("Username already exists");
    }
    
    // Check for duplicate email
    const [existingUserByEmail] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, insertUser.email));
    if (existingUserByEmail) {
      throw new Error("Email already exists");
    }

    const [user] = await this.db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || "technician",
        isActive: insertUser.isActive ?? true,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        profileImage: users.profileImage,
        city: users.city,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<UserSafe> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    // Check for duplicate username if username is being updated
    if (updates.username && updates.username !== existingUser.username) {
      const existingUserByUsername = await this.getUserByUsername(updates.username);
      if (existingUserByUsername) {
        throw new Error("Username already exists");
      }
    }
    
    // Check for duplicate email if email is being updated
    if (updates.email && updates.email !== existingUser.email) {
      const [existingUserByEmail] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, updates.email));
      if (existingUserByEmail) {
        throw new Error("Email already exists");
      }
    }

    const [user] = await this.db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        profileImage: users.profileImage,
        city: users.city,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return (result.rowCount || 0) > 0;
  }

  async getUsersByRole(role: string): Promise<UserSafe[]> {
    return await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        profileImage: users.profileImage,
        city: users.city,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.role, role as any));
  }

  async getUsersByRegion(regionId: string): Promise<UserSafe[]> {
    return await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        profileImage: users.profileImage,
        city: users.city,
        role: users.role,
        regionId: users.regionId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.regionId, regionId));
  }
}