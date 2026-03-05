import { storage } from "../storage";
import { logger } from "../utils/logger";
import { hashPassword } from "../utils/password";

/**
 * Initialize default data on startup (moved out of routes index to keep file small)
 */
export async function initializeDefaults() {
  try {
    const users = await storage.getUsers();

    if (users.length === 0) {
      logger.info("No users found. Creating default data...", { source: "init" });

      const regions = await storage.getRegions();
      let defaultRegionId: string;

      if (regions.length === 0) {
        const defaultRegion = await storage.createRegion({
          name: "المنطقة الرئيسية",
          description: "المنطقة الافتراضية للنظام",
          isActive: true,
        });
        defaultRegionId = defaultRegion.id;
        logger.info("Created default region", { source: "init" });
      } else {
        defaultRegionId = regions[0].id;
      }

      const adminPassword = await hashPassword("admin123");
      const techPassword = await hashPassword("tech123");
      const supervisorPassword = await hashPassword("super123");

      await storage.createUser({
        username: "admin",
        email: "admin@company.com",
        password: adminPassword,
        fullName: "مدير النظام",
        city: "الرياض",
        role: "admin",
        regionId: defaultRegionId,
        isActive: true,
      });

      await storage.createUser({
        username: "tech1",
        email: "tech1@company.com",
        password: techPassword,
        fullName: "فني تجريبي",
        city: "جدة",
        role: "technician",
        regionId: defaultRegionId,
        isActive: true,
      });

      await storage.createUser({
        username: "supervisor1",
        email: "supervisor1@company.com",
        password: supervisorPassword,
        fullName: "مشرف تجريبي",
        city: "الرياض",
        role: "supervisor",
        regionId: defaultRegionId,
        isActive: true,
      });

      logger.info("Created default users: admin, tech1, supervisor1", {
        source: "init",
      });
    }

    await storage.seedDefaultItemTypes();
    logger.info("Item types initialized", { source: "init" });
  } catch (error) {
    logger.error("Error initializing defaults", error, { source: "init" });
    console.error("Initialization error details:", error);
  }
}
