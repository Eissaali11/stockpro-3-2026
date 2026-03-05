import type { Express } from "express";
import { registerAdminRoutes } from "./admin.routes";
import { registerUsersRoutes } from "./users.routes";
import { registerRegionsRoutes } from "./regions.routes";
import { registerItemTypesRoutes } from "./item-types.routes";
import { registerSystemRoutes } from "./system.routes";
import { registerDashboardRoutes } from "./dashboard.routes";

/**
 * Admin Role Routes
 * Routes grouped by admin responsibility
 */
export function registerAdminRoleRoutes(app: Express): void {
  registerAdminRoutes(app);
  registerUsersRoutes(app);
  registerRegionsRoutes(app);
  registerItemTypesRoutes(app);
  registerSystemRoutes(app);
  registerDashboardRoutes(app);
}
