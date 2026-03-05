import type { Express } from "express";
import { registerTechniciansProfileRoutes } from "./technicians-profile.routes";
import { registerTechniciansInventoryRoutes } from "./technicians-inventory.routes";
import { registerStockFixedInventoryRoutes } from "./stock-fixed-inventory.routes";
import { registerStockTransferRoutes } from "./stock-transfer.routes";
import { registerInventoryRequestsCreateRoutes } from "./inventory-requests-create.routes";

/**
 * Technician Role Routes
 * Routes grouped by technician responsibility
 */
export function registerTechnicianRoleRoutes(app: Express): void {
  registerTechniciansProfileRoutes(app);
  registerTechniciansInventoryRoutes(app);
  registerStockFixedInventoryRoutes(app);
  registerStockTransferRoutes(app);
  registerInventoryRequestsCreateRoutes(app);
}
