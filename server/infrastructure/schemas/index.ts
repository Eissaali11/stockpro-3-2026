// Export all schema tables
export * from "./user.schema";
export * from "./system.schema";
export * from "./warehouse.schema";
export * from "./inventory.schema";
export * from "./device.schema";

// Import tables for relations
import { relations } from "drizzle-orm";
import { 
  users, 
  supervisorTechnicians, 
  supervisorWarehouses 
} from "./user.schema";
import { 
  regions, 
  itemTypes, 
  systemLogs, 
  transactions, 
  stockMovements 
} from "./system.schema";
import { 
  warehouses, 
  warehouseInventory, 
  warehouseInventoryEntries, 
  warehouseTransfers, 
  inventoryRequests 
} from "./warehouse.schema";
import { 
  inventoryItems, 
  techniciansInventory, 
  technicianFixedInventories, 
  technicianFixedInventoryEntries, 
  technicianMovingInventoryEntries 
} from "./inventory.schema";
import { 
  withdrawnDevices, 
  receivedDevices 
} from "./device.schema";

// Define all relations
export const regionsRelations = relations(regions, ({ many }) => ({
  users: many(users),
  inventoryItems: many(inventoryItems),
  warehouses: many(warehouses),
  systemLogs: many(systemLogs),
  withdrawnDevices: many(withdrawnDevices),
  receivedDevices: many(receivedDevices),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  region: one(regions, {
    fields: [users.regionId],
    references: [regions.id],
  }),
  createdWarehouses: many(warehouses),
  transactions: many(transactions),
  stockMovements: many(stockMovements, { relationName: "performer" }),
  technicianStockMovements: many(stockMovements, { relationName: "technician" }),
  supervisorTechnicians: many(supervisorTechnicians, { relationName: "supervisor" }),
  technicianSupervisors: many(supervisorTechnicians, { relationName: "technician" }),
  supervisorWarehouses: many(supervisorWarehouses),
  receivedDevices: many(receivedDevices, { relationName: "technician" }),
  approvedDevices: many(receivedDevices, { relationName: "approver" }),
  technicianFixedInventories: many(technicianFixedInventories),
  technicianFixedInventoryEntries: many(technicianFixedInventoryEntries),
  technicianMovingInventoryEntries: many(technicianMovingInventoryEntries),
  warehouseTransfers: many(warehouseTransfers, { relationName: "technician" }),
  performedTransfers: many(warehouseTransfers, { relationName: "performer" }),
  inventoryRequests: many(inventoryRequests),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  creator: one(users, {
    fields: [warehouses.createdBy],
    references: [users.id],
  }),
  region: one(regions, {
    fields: [warehouses.regionId],
    references: [regions.id],
  }),
  inventory: one(warehouseInventory, {
    fields: [warehouses.id],
    references: [warehouseInventory.warehouseId],
  }),
  inventoryEntries: many(warehouseInventoryEntries),
  transfers: many(warehouseTransfers),
  requests: many(inventoryRequests),
  supervisorWarehouses: many(supervisorWarehouses),
}));

export const itemTypesRelations = relations(itemTypes, ({ many }) => ({
  warehouseInventoryEntries: many(warehouseInventoryEntries),
  technicianFixedInventoryEntries: many(technicianFixedInventoryEntries),
  technicianMovingInventoryEntries: many(technicianMovingInventoryEntries),
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

export const technicianFixedInventoriesRelations = relations(technicianFixedInventories, ({ one }) => ({
  technician: one(users, {
    fields: [technicianFixedInventories.technicianId],
    references: [users.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  technician: one(users, {
    fields: [stockMovements.technicianId],
    references: [users.id],
    relationName: "technician",
  }),
  performer: one(users, {
    fields: [stockMovements.performedBy],
    references: [users.id],
    relationName: "performer",
  }),
}));

export const warehouseInventoryEntriesRelations = relations(warehouseInventoryEntries, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseInventoryEntries.warehouseId],
    references: [warehouses.id],
  }),
  itemType: one(itemTypes, {
    fields: [warehouseInventoryEntries.itemTypeId],
    references: [itemTypes.id],
  }),
}));

export const technicianFixedInventoryEntriesRelations = relations(technicianFixedInventoryEntries, ({ one }) => ({
  technician: one(users, {
    fields: [technicianFixedInventoryEntries.technicianId],
    references: [users.id],
  }),
  itemType: one(itemTypes, {
    fields: [technicianFixedInventoryEntries.itemTypeId],
    references: [itemTypes.id],
  }),
}));

export const technicianMovingInventoryEntriesRelations = relations(technicianMovingInventoryEntries, ({ one }) => ({
  technician: one(users, {
    fields: [technicianMovingInventoryEntries.technicianId],
    references: [users.id],
  }),
  itemType: one(itemTypes, {
    fields: [technicianMovingInventoryEntries.itemTypeId],
    references: [itemTypes.id],
  }),
}));

export const warehouseTransfersRelations = relations(warehouseTransfers, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseTransfers.warehouseId],
    references: [warehouses.id],
  }),
  technician: one(users, {
    fields: [warehouseTransfers.technicianId],
    references: [users.id],
    relationName: "technician",
  }),
  performer: one(users, {
    fields: [warehouseTransfers.performedBy],
    references: [users.id],
    relationName: "performer",
  }),
  request: one(inventoryRequests, {
    fields: [warehouseTransfers.requestId],
    references: [inventoryRequests.id],
  }),
}));

export const inventoryRequestsRelations = relations(inventoryRequests, ({ one, many }) => ({
  technician: one(users, {
    fields: [inventoryRequests.technicianId],
    references: [users.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryRequests.warehouseId],
    references: [warehouses.id],
  }),
  responder: one(users, {
    fields: [inventoryRequests.respondedBy],
    references: [users.id],
  }),
  transfers: many(warehouseTransfers),
}));

export const supervisorTechniciansRelations = relations(supervisorTechnicians, ({ one }) => ({
  supervisor: one(users, {
    fields: [supervisorTechnicians.supervisorId],
    references: [users.id],
    relationName: "supervisor",
  }),
  technician: one(users, {
    fields: [supervisorTechnicians.technicianId],
    references: [users.id],
    relationName: "technician",
  }),
}));

export const supervisorWarehousesRelations = relations(supervisorWarehouses, ({ one }) => ({
  supervisor: one(users, {
    fields: [supervisorWarehouses.supervisorId],
    references: [users.id],
  }),
  warehouse: one(warehouses, {
    fields: [supervisorWarehouses.warehouseId],
    references: [warehouses.id],
  }),
}));

export const withdrawnDevicesRelations = relations(withdrawnDevices, ({ one }) => ({
  creator: one(users, {
    fields: [withdrawnDevices.createdBy],
    references: [users.id],
  }),
  region: one(regions, {
    fields: [withdrawnDevices.regionId],
    references: [regions.id],
  }),
}));

export const receivedDevicesRelations = relations(receivedDevices, ({ one }) => ({
  technician: one(users, {
    fields: [receivedDevices.technicianId],
    references: [users.id],
    relationName: "technician",
  }),
  supervisor: one(users, {
    fields: [receivedDevices.supervisorId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [receivedDevices.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
  region: one(regions, {
    fields: [receivedDevices.regionId],
    references: [regions.id],
  }),
}));

export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  user: one(users, {
    fields: [systemLogs.userId],
    references: [users.id],
  }),
  region: one(regions, {
    fields: [systemLogs.regionId],
    references: [regions.id],
  }),
}));