import type { Express } from "express";
import { registerSupervisorTechniciansListRoutes } from "./supervisor-technicians-list.routes";
import { registerSupervisorUsersRoutes } from "./supervisor-users.routes";
import { registerSupervisorRequestsRoutes } from "./supervisor-requests.routes";
import { registerSupervisorAssignmentsRoutes } from "./supervisor-assignments.routes";

/**
 * Supervisor Role Routes
 * Routes grouped by supervisor responsibility
 */
export function registerSupervisorRoleRoutes(app: Express): void {
  registerSupervisorTechniciansListRoutes(app);
  registerSupervisorUsersRoutes(app);
  registerSupervisorRequestsRoutes(app);
  registerSupervisorAssignmentsRoutes(app);
}
