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

export type InsertItemType = z.infer<typeof insertItemTypeSchema>;
export type ItemType = typeof itemTypes.$inferSelect;

// Users table for all user accounts
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  profileImage: text("profile_image"),
  city: text("city"),
  role: text("role").notNull().default("technician"), // "admin" (مدير النظام), "supervisor" (مشرف), "technician" (فني)
  regionId: varchar("region_id").references(() => regions.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "devices", "sim", "papers"
  unit: text("unit").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minThreshold: integer("min_threshold").notNull().default(5),
  technicianName: text("technician_name"),
  city: text("city"),
  regionId: varchar("region_id").references(() => regions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Technicians inventory table - المخزون المتحرك (يتتبع الكراتين والوحدات منفصلة)
export const techniciansInventory = pgTable("technicians_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianName: text("technician_name").notNull(),
  city: text("city").notNull(),
  
  // N950 devices
  n950Boxes: integer("n950_boxes").notNull().default(0),
  n950Units: integer("n950_units").notNull().default(0),
  
  // I9000s devices
  i9000sBoxes: integer("i9000s_boxes").notNull().default(0),
  i9000sUnits: integer("i9000s_units").notNull().default(0),
  
  // I9100 devices
  i9100Boxes: integer("i9100_boxes").notNull().default(0),
  i9100Units: integer("i9100_units").notNull().default(0),
  
  // Roll Paper
  rollPaperBoxes: integer("roll_paper_boxes").notNull().default(0),
  rollPaperUnits: integer("roll_paper_units").notNull().default(0),
  
  // Stickers
  stickersBoxes: integer("stickers_boxes").notNull().default(0),
  stickersUnits: integer("stickers_units").notNull().default(0),
  
  // New Batteries
  newBatteriesBoxes: integer("new_batteries_boxes").notNull().default(0),
  newBatteriesUnits: integer("new_batteries_units").notNull().default(0),
  
  // Mobily SIM
  mobilySimBoxes: integer("mobily_sim_boxes").notNull().default(0),
  mobilySimUnits: integer("mobily_sim_units").notNull().default(0),
  
  // STC SIM
  stcSimBoxes: integer("stc_sim_boxes").notNull().default(0),
  stcSimUnits: integer("stc_sim_units").notNull().default(0),
  
  // Zain SIM
  zainSimBoxes: integer("zain_sim_boxes").notNull().default(0),
  zainSimUnits: integer("zain_sim_units").notNull().default(0),
  
  // Lebara SIM
  lebaraBoxes: integer("lebara_boxes").notNull().default(0),
  lebaraUnits: integer("lebara_units").notNull().default(0),
  
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  regionId: varchar("region_id").references(() => regions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => inventoryItems.id),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // "add", "withdraw"
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Withdrawn devices table - tracking devices pulled from service
export const withdrawnDevices = pgTable("withdrawn_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: text("city").notNull(),
  technicianName: text("technician_name").notNull(),
  terminalId: text("terminal_id").notNull(),
  serialNumber: text("serial_number").notNull(),
  battery: text("battery").notNull(), // "جيدة", "متوسطة", "سيئة"
  chargerCable: text("charger_cable").notNull(), // "موجود", "غير موجود"
  chargerHead: text("charger_head").notNull(), // "موجود", "غير موجود"
  hasSim: text("has_sim").notNull(), // "نعم", "لا"
  simCardType: text("sim_card_type"), // "Mobily", "STC", "غير محدد"
  damagePart: text("damage_part"), // وصف الضرر
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  regionId: varchar("region_id").references(() => regions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Received devices table - tracking devices received by technicians with supervisor approval
export const receivedDevices = pgTable("received_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull().references(() => users.id),
  supervisorId: varchar("supervisor_id").references(() => users.id),
  terminalId: text("terminal_id").notNull(),
  serialNumber: text("serial_number").notNull(),
  battery: boolean("battery").notNull().default(false),
  chargerCable: boolean("charger_cable").notNull().default(false),
  chargerHead: boolean("charger_head").notNull().default(false),
  hasSim: boolean("has_sim").notNull().default(false),
  simCardType: text("sim_card_type"),
  damagePart: text("damage_part").default(""),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  adminNotes: text("admin_notes"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  regionId: varchar("region_id").references(() => regions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Technician Fixed Inventories - المخزون الثابت لكل فني
export const technicianFixedInventories = pgTable("technician_fixed_inventories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull().references(() => users.id),
  
  // N950 devices
  n950Boxes: integer("n950_boxes").notNull().default(0),
  n950Units: integer("n950_units").notNull().default(0),
  
  // I9000s devices
  i9000sBoxes: integer("i9000s_boxes").notNull().default(0),
  i9000sUnits: integer("i9000s_units").notNull().default(0),
  
  // I9100 devices
  i9100Boxes: integer("i9100_boxes").notNull().default(0),
  i9100Units: integer("i9100_units").notNull().default(0),
  
  // Roll Paper
  rollPaperBoxes: integer("roll_paper_boxes").notNull().default(0),
  rollPaperUnits: integer("roll_paper_units").notNull().default(0),
  
  // Stickers
  stickersBoxes: integer("stickers_boxes").notNull().default(0),
  stickersUnits: integer("stickers_units").notNull().default(0),
  
  // New Batteries
  newBatteriesBoxes: integer("new_batteries_boxes").notNull().default(0),
  newBatteriesUnits: integer("new_batteries_units").notNull().default(0),
  
  // Mobily SIM
  mobilySimBoxes: integer("mobily_sim_boxes").notNull().default(0),
  mobilySimUnits: integer("mobily_sim_units").notNull().default(0),
  
  // STC SIM
  stcSimBoxes: integer("stc_sim_boxes").notNull().default(0),
  stcSimUnits: integer("stc_sim_units").notNull().default(0),
  
  // Zain SIM
  zainSimBoxes: integer("zain_sim_boxes").notNull().default(0),
  zainSimUnits: integer("zain_sim_units").notNull().default(0),
  
  // Lebara SIM
  lebaraBoxes: integer("lebara_boxes").notNull().default(0),
  lebaraUnits: integer("lebara_units").notNull().default(0),
  
  // Alert thresholds (percentage)
  lowStockThreshold: integer("low_stock_threshold").notNull().default(30),
  criticalStockThreshold: integer("critical_stock_threshold").notNull().default(70),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock Movements - سجل حركات النقل بين المخزون الثابت والمتحرك
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull().references(() => users.id),
  itemType: text("item_type").notNull(), // "n950", "i9000s", "i9100", "rollPaper", "stickers", "newBatteries", "mobilySim", "stcSim", "zainSim"
  packagingType: text("packaging_type").notNull(), // "box", "unit"
  quantity: integer("quantity").notNull(), // الكمية المنقولة
  fromInventory: text("from_inventory").notNull(), // "fixed", "moving"
  toInventory: text("to_inventory").notNull(), // "fixed", "moving"
  reason: text("reason"), // سبب النقل
  performedBy: varchar("performed_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Warehouses - المستودعات الرئيسية لتخزين المخزون
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  regionId: varchar("region_id").references(() => regions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supervisor-Technician Assignments - ربط المشرف بالفنيين
export const supervisorTechnicians = pgTable("supervisor_technicians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supervisorId: varchar("supervisor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  technicianId: varchar("technician_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqSupervisorTechnician: sql`UNIQUE (${table.supervisorId}, ${table.technicianId})`,
}));

// Supervisor-Warehouse Assignments - ربط المشرف بالمستودعات
export const supervisorWarehouses = pgTable("supervisor_warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supervisorId: varchar("supervisor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqSupervisorWarehouse: sql`UNIQUE (${table.supervisorId}, ${table.warehouseId})`,
}));

// Warehouse Inventory - مخزون المستودع (يتتبع الكراتين والوحدات منفصلة)
export const warehouseInventory = pgTable("warehouse_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
  
  // N950 devices
  n950Boxes: integer("n950_boxes").notNull().default(0),
  n950Units: integer("n950_units").notNull().default(0),
  
  // I9000s devices
  i9000sBoxes: integer("i9000s_boxes").notNull().default(0),
  i9000sUnits: integer("i9000s_units").notNull().default(0),
  
  // I9100 devices
  i9100Boxes: integer("i9100_boxes").notNull().default(0),
  i9100Units: integer("i9100_units").notNull().default(0),
  
  // Roll Paper
  rollPaperBoxes: integer("roll_paper_boxes").notNull().default(0),
  rollPaperUnits: integer("roll_paper_units").notNull().default(0),
  
  // Stickers
  stickersBoxes: integer("stickers_boxes").notNull().default(0),
  stickersUnits: integer("stickers_units").notNull().default(0),
  
  // New Batteries
  newBatteriesBoxes: integer("new_batteries_boxes").notNull().default(0),
  newBatteriesUnits: integer("new_batteries_units").notNull().default(0),
  
  // Mobily SIM
  mobilySimBoxes: integer("mobily_sim_boxes").notNull().default(0),
  mobilySimUnits: integer("mobily_sim_units").notNull().default(0),
  
  // STC SIM
  stcSimBoxes: integer("stc_sim_boxes").notNull().default(0),
  stcSimUnits: integer("stc_sim_units").notNull().default(0),
  
  // Zain SIM
  zainSimBoxes: integer("zain_sim_boxes").notNull().default(0),
  zainSimUnits: integer("zain_sim_units").notNull().default(0),
  
  // Lebara SIM
  lebaraBoxes: integer("lebara_boxes").notNull().default(0),
  lebaraUnits: integer("lebara_units").notNull().default(0),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dynamic Warehouse Inventory Entries - مخزون المستودع الديناميكي
export const warehouseInventoryEntries = pgTable("warehouse_inventory_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
  itemTypeId: varchar("item_type_id").notNull().references(() => itemTypes.id, { onDelete: 'cascade' }),
  boxes: integer("boxes").notNull().default(0),
  units: integer("units").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dynamic Technician Fixed Inventory Entries - المخزون الثابت الديناميكي للفني
export const technicianFixedInventoryEntries = pgTable("technician_fixed_inventory_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemTypeId: varchar("item_type_id").notNull().references(() => itemTypes.id, { onDelete: 'cascade' }),
  boxes: integer("boxes").notNull().default(0),
  units: integer("units").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dynamic Technician Moving Inventory Entries - المخزون المتحرك الديناميكي للفني
export const technicianMovingInventoryEntries = pgTable("technician_moving_inventory_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemTypeId: varchar("item_type_id").notNull().references(() => itemTypes.id, { onDelete: 'cascade' }),
  boxes: integer("boxes").notNull().default(0),
  units: integer("units").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouse Transfers - سجل نقل البضائع من المستودع إلى الفني
export const warehouseTransfers = pgTable("warehouse_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").references(() => inventoryRequests.id), // ID الطلب الأصلي لتجميع الطلبات
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  technicianId: varchar("technician_id").notNull().references(() => users.id),
  itemType: text("item_type").notNull(), // "n950", "i9000s", "i9100", "rollPaper", "stickers", "newBatteries", "mobilySim", "stcSim", "zainSim"
  packagingType: text("packaging_type").notNull(), // "box", "unit"
  quantity: integer("quantity").notNull(),
  performedBy: varchar("performed_by").notNull().references(() => users.id),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected"
  rejectionReason: text("rejection_reason"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory Requests - طلبات المخزون من الفنيين
export const inventoryRequests = pgTable("inventory_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull().references(() => users.id),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id),
  
  // Items requested
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
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  adminNotes: text("admin_notes"),
  respondedBy: varchar("responded_by").references(() => users.id),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Activity Logs - سجل شامل لجميع عمليات النظام
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(), // "admin", "supervisor", "technician"
  regionId: varchar("region_id").references(() => regions.id),
  action: text("action").notNull(), // "create", "update", "delete", "approve", "reject", "login", "logout", "transfer"
  entityType: text("entity_type").notNull(), // "region", "user", "inventory", "warehouse", "request", "transfer", "auth"
  entityId: varchar("entity_id"),
  entityName: text("entity_name"),
  details: text("details"), // تفاصيل العملية بصيغة JSON
  description: text("description").notNull(), // وصف العملية بالعربية
  severity: text("severity").notNull().default("info"), // "info", "warn", "error"
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for regions
export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  role: z.enum(["admin", "supervisor", "technician"]),
});

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

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawnDeviceSchema = createInsertSchema(withdrawnDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReceivedDeviceSchema = createInsertSchema(receivedDevices, {
  technicianId: z.string(),
  supervisorId: z.string().nullable().optional(),
  regionId: z.string().nullable().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
  adminNotes: true,
  status: true,
});

export const insertTechnicianFixedInventorySchema = createInsertSchema(technicianFixedInventories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

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

// Dynamic inventory entry schemas
export const insertWarehouseInventoryEntrySchema = createInsertSchema(warehouseInventoryEntries).omit({
  id: true,
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

export const insertSupervisorTechnicianSchema = createInsertSchema(supervisorTechnicians).omit({
  id: true,
  createdAt: true,
});

export const insertSupervisorWarehouseSchema = createInsertSchema(supervisorWarehouses).omit({
  id: true,
  createdAt: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertTechnicianInventory = z.infer<typeof insertTechnicianInventorySchema>;
export type TechnicianInventory = typeof techniciansInventory.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertWithdrawnDevice = z.infer<typeof insertWithdrawnDeviceSchema>;
export type WithdrawnDevice = typeof withdrawnDevices.$inferSelect;
export type InsertReceivedDevice = z.infer<typeof insertReceivedDeviceSchema>;
export type ReceivedDevice = typeof receivedDevices.$inferSelect;
export type InsertTechnicianFixedInventory = z.infer<typeof insertTechnicianFixedInventorySchema>;
export type TechnicianFixedInventory = typeof technicianFixedInventories.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouseInventory = z.infer<typeof insertWarehouseInventorySchema>;
export type WarehouseInventory = typeof warehouseInventory.$inferSelect;
export type InsertWarehouseInventoryEntry = z.infer<typeof insertWarehouseInventoryEntrySchema>;
export type WarehouseInventoryEntry = typeof warehouseInventoryEntries.$inferSelect;
export type InsertTechnicianFixedInventoryEntry = z.infer<typeof insertTechnicianFixedInventoryEntrySchema>;
export type TechnicianFixedInventoryEntry = typeof technicianFixedInventoryEntries.$inferSelect;
export type InsertTechnicianMovingInventoryEntry = z.infer<typeof insertTechnicianMovingInventoryEntrySchema>;
export type TechnicianMovingInventoryEntry = typeof technicianMovingInventoryEntries.$inferSelect;
export type InsertWarehouseTransfer = z.infer<typeof insertWarehouseTransferSchema>;
export type WarehouseTransfer = typeof warehouseTransfers.$inferSelect;
export type InsertInventoryRequest = z.infer<typeof insertInventoryRequestSchema>;
export type InventoryRequest = typeof inventoryRequests.$inferSelect;
export type InsertSupervisorTechnician = z.infer<typeof insertSupervisorTechnicianSchema>;
export type SupervisorTechnician = typeof supervisorTechnicians.$inferSelect;
export type InsertSupervisorWarehouse = z.infer<typeof insertSupervisorWarehouseSchema>;
export type SupervisorWarehouse = typeof supervisorWarehouses.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

// Additional types for API responses
export type InventoryItemWithStatus = InventoryItem & {
  status: 'available' | 'low' | 'out';
  regionName?: string;
};

export type RegionWithStats = Region & {
  itemCount: number;
  totalQuantity: number;
  lowStockCount: number;
};

export type UserSafe = Omit<User, 'password'>;

export type TransactionWithDetails = Transaction & {
  itemName?: string;
  userName?: string;
  regionName?: string;
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

// Fixed Inventory Dashboard Types
export type TechnicianWithFixedInventory = {
  technicianId: string;
  technicianName: string;
  city: string;
  fixedInventory: TechnicianFixedInventory | null;
  alertLevel: 'good' | 'warning' | 'critical'; // Overall alert level
};

export type TechnicianWithBothInventories = {
  technicianId: string;
  technicianName: string;
  city: string;
  regionId?: string | null;
  fixedInventory: TechnicianFixedInventory | null;
  movingInventory: TechnicianInventory | null;
  alertLevel: 'good' | 'warning' | 'critical'; // Overall alert level
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

export type StockMovementWithDetails = StockMovement & {
  technicianName?: string;
  performedByName?: string;
  itemNameAr?: string;
};

// Warehouse Types
export type WarehouseWithInventory = Warehouse & {
  inventory: WarehouseInventory | null;
  creatorName?: string;
  technicians?: UserSafe[];
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

// Define relations for better queries
export const regionsRelations = relations(regions, ({ many }) => ({
  users: many(users),
  inventoryItems: many(inventoryItems),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  region: one(regions, {
    fields: [users.regionId],
    references: [regions.id],
  }),
  transactions: many(transactions),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  region: one(regions, {
    fields: [inventoryItems.regionId],
    references: [regions.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [transactions.itemId],
    references: [inventoryItems.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));
