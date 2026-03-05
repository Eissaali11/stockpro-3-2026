import type { Express } from "express";
import { techniciansController } from "../controllers/technicians.controller";
import { requireAuth, requireSupervisor } from "../middleware/auth";

/**
 * Technicians Admin/Supervisor Routes - نقاط خاصة بالمشرف/الأدمن (<100 سطر)
 */
export function registerTechniciansAdminRoutes(app: Express): void {
  // Admin: all technicians inventory
  app.get(
    "/api/admin/all-technicians-inventory",
    requireAuth,
    requireSupervisor,
    techniciansController.getAllTechniciansInventory
  );

  // Supervisor: supervisors' technicians with inventories
  app.get(
    "/api/supervisor/technicians-inventory",
    requireAuth,
    requireSupervisor,
    techniciansController.getSupervisorTechniciansInventory
  );
}
