import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for all user accounts
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  profileImage: text("profile_image"),
  city: text("city"),
  role: text("role").notNull().default("technician"), // "admin", "supervisor", "technician"
  regionId: varchar("region_id"), // Reference will be added in relations
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supervisor-Technician Assignments
export const supervisorTechnicians = pgTable("supervisor_technicians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supervisorId: varchar("supervisor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  technicianId: varchar("technician_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqSupervisorTechnician: sql`UNIQUE (${table.supervisorId}, ${table.technicianId})`,
}));

// Supervisor-Warehouse Assignments - Will be completed with warehouse reference
export const supervisorWarehouses = pgTable("supervisor_warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supervisorId: varchar("supervisor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  warehouseId: varchar("warehouse_id").notNull(), // Reference will be added later
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqSupervisorWarehouse: sql`UNIQUE (${table.supervisorId}, ${table.warehouseId})`,
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  role: z.enum(["admin", "supervisor", "technician"]),
});

export const insertSupervisorTechnicianSchema = createInsertSchema(supervisorTechnicians).omit({
  id: true,
  createdAt: true,
});

export const insertSupervisorWarehouseSchema = createInsertSchema(supervisorWarehouses).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserSafe = Omit<User, 'password'>;
export type SupervisorTechnician = typeof supervisorTechnicians.$inferSelect;
export type InsertSupervisorTechnician = z.infer<typeof insertSupervisorTechnicianSchema>;
export type SupervisorWarehouse = typeof supervisorWarehouses.$inferSelect;
export type InsertSupervisorWarehouse = z.infer<typeof insertSupervisorWarehouseSchema>;

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export type AuthResponse = {
  user: UserSafe;
  token?: string;
  success: boolean;
  message?: string;
};