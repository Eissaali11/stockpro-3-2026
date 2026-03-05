import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Legacy inventory items table
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "devices", "sim", "papers"
  unit: text("unit").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minThreshold: integer("min_threshold").notNull().default(5),
  technicianName: text("technician_name"),
  city: text("city"),
  regionId: varchar("region_id"), // Reference to regions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Technicians Moving Inventory - Legacy tracking
export const techniciansInventory = pgTable("technicians_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianName: text("technician_name").notNull(),
  city: text("city").notNull(),
  
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
  
  notes: text("notes"),
  createdBy: varchar("created_by"), // Reference to users
  regionId: varchar("region_id"), // Reference to regions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Technician Fixed Inventories
export const technicianFixedInventories = pgTable("technician_fixed_inventories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull(), // Reference to users
  
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
  
  // Alert thresholds
  lowStockThreshold: integer("low_stock_threshold").notNull().default(30),
  criticalStockThreshold: integer("critical_stock_threshold").notNull().default(70),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dynamic Technician Fixed Inventory Entries
export const technicianFixedInventoryEntries = pgTable("technician_fixed_inventory_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull(), // Reference to users
  itemTypeId: varchar("item_type_id").notNull(), // Reference to itemTypes
  boxes: integer("boxes").notNull().default(0),
  units: integer("units").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dynamic Technician Moving Inventory Entries
export const technicianMovingInventoryEntries = pgTable("technician_moving_inventory_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull(), // Reference to users
  itemTypeId: varchar("item_type_id").notNull(), // Reference to itemTypes
  boxes: integer("boxes").notNull().default(0),
  units: integer("units").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas
export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTechnicianInventorySchema = createInsertSchema(techniciansInventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTechnicianFixedInventorySchema = createInsertSchema(technicianFixedInventories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTechnicianFixedInventoryEntrySchema = createInsertSchema(technicianFixedInventoryEntries).omit({
  id: true,
  updatedAt: true,
});

export const insertTechnicianMovingInventoryEntrySchema = createInsertSchema(technicianMovingInventoryEntries).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type TechnicianInventory = typeof techniciansInventory.$inferSelect;
export type InsertTechnicianInventory = z.infer<typeof insertTechnicianInventorySchema>;
export type TechnicianFixedInventory = typeof technicianFixedInventories.$inferSelect;
export type InsertTechnicianFixedInventory = z.infer<typeof insertTechnicianFixedInventorySchema>;
export type TechnicianFixedInventoryEntry = typeof technicianFixedInventoryEntries.$inferSelect;
export type InsertTechnicianFixedInventoryEntry = z.infer<typeof insertTechnicianFixedInventoryEntrySchema>;
export type TechnicianMovingInventoryEntry = typeof technicianMovingInventoryEntries.$inferSelect;
export type InsertTechnicianMovingInventoryEntry = z.infer<typeof insertTechnicianMovingInventoryEntrySchema>;

// Enhanced types
export type InventoryItemWithStatus = InventoryItem & {
  status: 'available' | 'low' | 'out';
  regionName?: string;
};

export type TechnicianWithFixedInventory = {
  technicianId: string;
  technicianName: string;
  city: string;
  fixedInventory: TechnicianFixedInventory | null;
  alertLevel: 'good' | 'warning' | 'critical';
};

export type TechnicianWithBothInventories = {
  technicianId: string;
  technicianName: string;
  city: string;
  regionId?: string | null;
  fixedInventory: TechnicianFixedInventory | null;
  movingInventory: TechnicianInventory | null;
  alertLevel: 'good' | 'warning' | 'critical';
};

export type FixedInventoryItemStatus = {
  itemType: string;
  itemNameAr: string;
  boxes: number;
  units: number;
  total: number;
  alertLevel: 'good' | 'warning' | 'critical';
};

export type FixedInventorySummary = {
  totalN950: number;
  totalI9000s: number;
  totalI9100: number;
  totalRollPaper: number;
  totalStickers: number;
  totalNewBatteries: number;
  totalMobilySim: number;
  totalStcSim: number;
  totalZainSim: number;
  techniciansWithCriticalStock: number;
  techniciansWithWarningStock: number;
  techniciansWithGoodStock: number;
};