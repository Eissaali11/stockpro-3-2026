import type { Express } from "express";

export async function registerRefactoredRoutes(app: Express) {
  const { registerAdminRoleRoutes } = await import("./role-admin.routes");
  registerAdminRoleRoutes(app);

  const { registerSupervisorRoleRoutes } = await import("./role-supervisor.routes");
  registerSupervisorRoleRoutes(app);

  const { registerTechnicianRoleRoutes } = await import("./role-technician.routes");
  registerTechnicianRoleRoutes(app);

  const { registerCommonRoleRoutes } = await import("./role-common.routes");
  registerCommonRoleRoutes(app);
}
