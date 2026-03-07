import type { Express } from "express";
import { registerInventoryRoutes } from "./inventory.routes";
import { registerTransactionsRoutes } from "./transactions.routes";
import { registerWarehousesRoutes } from "./warehouses.routes";
import { registerDevicesRoutes } from "./devices.routes";
import { registerWarehouseTransferOperationsRoutes } from "./warehouse-transfer-operations.routes";
import { registerWarehouseStockMovementRoutes } from "./warehouse-stock-movements.routes";
import { registerWarehouseBatchOperationsRoutes } from "./warehouse-batch-operations.routes";
import { registerWarehouseTransferAdminRoutes } from "./warehouse-transfer-admin.routes";
import { registerInventoryRequestsManagementRoutes } from "./inventory-requests-management.routes";
import { registerInventoryRequestsApprovalRoutes } from "./inventory-requests-approval.routes";
import { registerWarehouseInventoryEntriesRoutes } from "./inventory-entries-warehouse.routes";
import { registerTechnicianInventoryEntriesRoutes } from "./inventory-entries-technician.routes";
import { registerInventoryEntriesMigrationRoutes } from "./inventory-entries-migration.routes";
import { registerTechniciansAdminRoutes } from "./technicians-admin.routes";
import { registerInventoryScanRoutes } from "./inventory-scan.routes";

/**
 * Common/System Routes
 * Shared operational routes across roles
 */
export function registerCommonRoleRoutes(app: Express): void {
  registerInventoryRoutes(app);
  registerTransactionsRoutes(app);
  registerWarehousesRoutes(app);
  registerDevicesRoutes(app);

  registerWarehouseTransferOperationsRoutes(app);
  registerWarehouseTransferAdminRoutes(app);
  registerWarehouseStockMovementRoutes(app);
  registerWarehouseBatchOperationsRoutes(app);

  registerInventoryRequestsManagementRoutes(app);
  registerInventoryRequestsApprovalRoutes(app);
  registerWarehouseInventoryEntriesRoutes(app);
  registerTechnicianInventoryEntriesRoutes(app);
  registerInventoryEntriesMigrationRoutes(app);
  registerInventoryScanRoutes(app);

  registerTechniciansAdminRoutes(app);
}
