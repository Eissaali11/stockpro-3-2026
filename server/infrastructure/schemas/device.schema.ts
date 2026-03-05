import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  createdBy: varchar("created_by"), // Reference to users
  regionId: varchar("region_id"), // Reference to regions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Received devices table - tracking devices received by technicians with supervisor approval
export const receivedDevices = pgTable("received_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id").notNull(), // Reference to users
  supervisorId: varchar("supervisor_id"), // Reference to users
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
  approvedBy: varchar("approved_by"), // Reference to users
  approvedAt: timestamp("approved_at"),
  regionId: varchar("region_id"), // Reference to regions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas
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

// Types
export type WithdrawnDevice = typeof withdrawnDevices.$inferSelect;
export type InsertWithdrawnDevice = z.infer<typeof insertWithdrawnDeviceSchema>;
export type ReceivedDevice = typeof receivedDevices.$inferSelect;
export type InsertReceivedDevice = z.infer<typeof insertReceivedDeviceSchema>;

// Enhanced types for device management
export type WithdrawnDeviceWithDetails = WithdrawnDevice & {
  creatorName?: string;
  regionName?: string;
};

export type ReceivedDeviceWithDetails = ReceivedDevice & {
  technicianName?: string;
  supervisorName?: string;
  approverName?: string;
  regionName?: string;
};

export type DeviceManagementStats = {
  totalWithdrawn: number;
  totalReceived: number;
  pendingApprovals: number;
  approvedToday: number;
  rejectedToday: number;
  devicesWithGoodBattery: number;
  devicesWithBadBattery: number;
  devicesWithSim: number;
  devicesWithoutSim: number;
};