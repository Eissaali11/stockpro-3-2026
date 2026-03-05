import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Regions table for managing different areas
export const regions = pgTable("regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Item Types table for managing inventory item categories
export const ITEM_TYPE_CATEGORIES = ["devices", "papers", "sim", "accessories"] as const;
export const itemTypeCategorySchema = z.enum(ITEM_TYPE_CATEGORIES);

export const itemTypes = pgTable("item_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  category: text("category").notNull(), // 'devices', 'papers', 'sim', 'accessories'
  unitsPerBox: integer("units_per_box").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  isVisible: boolean("is_visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueNameArIdx: uniqueIndex("item_types_name_ar_unique").on(table.nameAr),
  uniqueNameEnIdx: uniqueIndex("item_types_name_en_unique").on(table.nameEn),
}));

// System Activity Logs
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Reference to be added in relations
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(), // "admin", "supervisor", "technician"
  regionId: varchar("region_id").references(() => regions.id),
  action: text("action").notNull(), // "create", "update", "delete", etc.
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  entityName: text("entity_name"),
  details: text("details"),
  description: text("description").notNull(),
  severity: text("severity").notNull().default("info"),
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transaction log table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull(), // Reference to be added in relations
  userId: varchar("user_id"), // Reference to be added in relations
  type: text("type").notNull(), // "add", "withdraw"
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stock Movements
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull(), // Reference to be added
  itemType: text("item_type").notNull(),
  packagingType: text("packaging_type").notNull(),
  quantity: integer("quantity").notNull(),
  fromInventory: text("from_inventory").notNull(),
  toInventory: text("to_inventory").notNull(),
  reason: text("reason"),
  performedBy: varchar("performed_by").notNull(), // Reference to be added
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const baseInsertItemTypeSchema = createInsertSchema(itemTypes).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertItemTypeSchema = baseInsertItemTypeSchema.extend({
  nameAr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  category: itemTypeCategorySchema,
  unitsPerBox: z.number().int().positive(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

// Types
export type Region = typeof regions.$inferSelect;
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type ItemType = typeof itemTypes.$inferSelect;
export type InsertItemType = z.infer<typeof insertItemTypeSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

// Additional types for enhanced functionality
export type RegionWithStats = Region & {
  itemCount: number;
  totalQuantity: number;
  lowStockCount: number;
};

export type TransactionWithDetails = Transaction & {
  itemName?: string;
  userName?: string;
  regionName?: string;
};

export type StockMovementWithDetails = StockMovement & {
  technicianName?: string;
  performedByName?: string;
  itemNameAr?: string;
};

export type DashboardStats = {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  todayTransactions: number;
  totalRegions?: number;
  totalUsers?: number;
};

export type AdminStats = {
  totalRegions: number;
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  recentTransactions: TransactionWithDetails[];
};