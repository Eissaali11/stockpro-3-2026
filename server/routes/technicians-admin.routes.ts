import type { Express } from "express";
import { techniciansController } from "../controllers/technicians.controller";
import { requireAuth, requireSupervisor } from "../middleware/auth";

/**
 * Technicians Supervisor Routes - نقاط خاصة بالمشرف (<100 سطر)
 */
export function registerTechniciansAdminRoutes(app: Express): void {
  // Supervisor: supervisors' technicians with inventories
  app.get(
    "/api/supervisor/technicians-inventory",
    requireAuth,
    requireSupervisor,
    techniciansController.getSupervisorTechniciansInventory
  );
}
