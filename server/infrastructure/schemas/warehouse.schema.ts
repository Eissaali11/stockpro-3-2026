import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Warehouses - Main storage facilities
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(), // Reference to users
  regionId: varchar("region_id"), // Reference to regions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouse Inventory - Legacy inventory tracking
export const warehouseInventory = pgTable("warehouse_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
  
  // Legacy device tracking
  n950Boxes: integer("n950_boxes").notNull().default(0),
  n950Units: integer("n950_units").notNull().default(0),
  i9000sBoxes: integer("i9000s_boxes").notNull().default(0),
  i9000sUnits: integer("i9000s_units").notNull().default(0),
  i9100Boxes: integer("i9100_boxes").notNull().default(0),
  i9100Units: integer("i9100_units").notNull().default(0),
  rollPaperBoxes: integer("roll_paper_boxes").notNull().default(0),
  rollPaperUnits: integer("roll_paper_units").notNull().default(0),
  stickersBoxes: integer("stickers_boxes").notNull().default(0),
  stickersUnits: integer("stickers_units").notNull().default(0),
  newBatteriesBoxes: integer("new_batteries_boxes").notNull().default(0),
  newBatteriesUnits: integer("new_batteries_units").notNull().default(0),
  mobilySimBoxes: integer("mobily_sim_boxes").notNull().default(0),
  mobilySimUnits: integer("mobily_sim_units").notNull().default(0),
  stcSimBoxes: integer("stc_sim_boxes").notNull().default(0),
  stcSimUnits: integer("stc_sim_units").notNull().default(0),
  zainSimBoxes: integer("zain_sim_boxes").notNull().default(0),
  zainSimUnits: integer("zain_sim_units").notNull().default(0),
  lebaraBoxes: integer("lebara_boxes").notNull().default(0),
  lebaraUnits: integer("lebara_units").notNull().default(0),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dynamic Warehouse Inventory Entries
export const warehouseInventoryEntries = pgTable("warehouse_inventory_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
  itemTypeId: varchar("item_type_id").notNull(), // Reference to itemTypes
  boxes: integer("boxes").notNull().default(0),
  units: integer("units").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouse Transfers
export const warehouseTransfers = pgTable("warehouse_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id"), // Reference to inventoryRequests
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  technicianId: varchar("technician_id").notNull(), // Reference to users
  itemType: text("item_type").notNull(),
  packagingType: text("packaging_type").notNull(),
  quantity: integer("quantity").notNull(),
  performedBy: varchar("performed_by").notNull(), // Reference to users
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory Requests
export const inventoryRequests = pgTable("inventory_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull(), // Reference to users
  warehouseId: varchar("warehouse_id").references(() => warehouses.id),
  
  // Legacy item requests
  n950Boxes: integer("n950_boxes").default(0),
  n950Units: integer("n950_units").default(0),
  i9000sBoxes: integer("i9000s_boxes").default(0),
  i9000sUnits: integer("i9000s_units").default(0),
  i9100Boxes: integer("i9100_boxes").default(0),
  i9100Units: integer("i9100_units").default(0),
  rollPaperBoxes: integer("roll_paper_boxes").default(0),
  rollPaperUnits: integer("roll_paper_units").default(0),
  stickersBoxes: integer("stickers_boxes").default(0),
  stickersUnits: integer("stickers_units").default(0),
  newBatteriesBoxes: integer("new_batteries_boxes").default(0),
  newBatteriesUnits: integer("new_batteries_units").default(0),
  mobilySimBoxes: integer("mobily_sim_boxes").default(0),
  mobilySimUnits: integer("mobily_sim_units").default(0),
  stcSimBoxes: integer("stc_sim_boxes").default(0),
  stcSimUnits: integer("stc_sim_units").default(0),
  zainSimBoxes: integer("zain_sim_boxes").default(0),
  zainSimUnits: integer("zain_sim_units").default(0),
  lebaraBoxes: integer("lebara_boxes").default(0),
  lebaraUnits: integer("lebara_units").default(0),
  
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  respondedBy: varchar("responded_by"), // Reference to users
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export const insertWarehouseInventorySchema = createInsertSchema(warehouseInventory).omit({
  id: true,
  updatedAt: true,
  warehouseId: true,
});

export const insertWarehouseInventoryEntrySchema = createInsertSchema(warehouseInventoryEntries).omit({
  id: true,
  updatedAt: true,
});

export const insertWarehouseTransferSchema = createInsertSchema(warehouseTransfers).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryRequestSchema = createInsertSchema(inventoryRequests).omit({
  id: true,
  createdAt: true,
  respondedBy: true,
  respondedAt: true,
});

// Types
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type WarehouseInventory = typeof warehouseInventory.$inferSelect;
export type InsertWarehouseInventory = z.infer<typeof insertWarehouseInventorySchema>;
export type WarehouseInventoryEntry = typeof warehouseInventoryEntries.$inferSelect;
export type InsertWarehouseInventoryEntry = z.infer<typeof insertWarehouseInventoryEntrySchema>;
export type WarehouseTransfer = typeof warehouseTransfers.$inferSelect;
export type InsertWarehouseTransfer = z.infer<typeof insertWarehouseTransferSchema>;
export type InventoryRequest = typeof inventoryRequests.$inferSelect;
export type InsertInventoryRequest = z.infer<typeof insertInventoryRequestSchema>;

// Enhanced types
export type WarehouseWithInventory = Warehouse & {
  inventory: WarehouseInventory | null;
  creatorName?: string;
  technicians?: any[]; // UserSafe[] - Reference to be resolved in relations
};

export type WarehouseWithStats = Warehouse & {
  inventory: WarehouseInventory | null;
  totalItems: number;
  lowStockItemsCount: number;
  creatorName?: string;
};

export type WarehouseTransferWithDetails = WarehouseTransfer & {
  warehouseName?: string;
  technicianName?: string;
  performedByName?: string;
  itemNameAr?: string;
};