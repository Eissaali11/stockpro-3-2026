import type { Express } from "express";
import { requireAuth, requireSupervisor } from "../middleware/auth";
import { storage } from "../storage";

/**
 * Supervisor User Detail & Inventories - تفاصيل المستخدم ومخزونه (<100 سطر)
 */
export function registerSupervisorUsersRoutes(app: Express): void {
  // عرض تفاصيل مستخدم في المنطقة
  app.get("/api/supervisor/users/:userId", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user.regionId) {
        return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
      }

      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Supervisors can only access users in their region
      if (targetUser.regionId !== user.regionId) {
        return res.status(403).json({ message: "لا يمكنك الوصول إلى مستخدمين خارج منطقتك" });
      }

      res.json(targetUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // عرض المخزون الثابت للفني
  app.get("/api/supervisor/users/:userId/fixed-inventory", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user.regionId) {
        return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
      }

      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser || targetUser.regionId !== user.regionId) {
        return res.status(403).json({ message: "لا يمكنك الوصول إلى مستخدمين خارج منطقتك" });
      }

      const inventory = await storage.getTechnicianFixedInventory(req.params.userId);
      
      const result = inventory ? {
        ...inventory,
        technicianName: targetUser.fullName,
        city: targetUser.city || "غير محدد"
      } : null;

      res.json(result);
    } catch (error) {
      console.error("Error fetching fixed inventory:", error);
      res.status(500).json({ message: "Failed to fetch fixed inventory" });
    }
  });

  // عرض المخزون المتنقل للفني
  app.get("/api/supervisor/users/:userId/moving-inventory", requireAuth, requireSupervisor, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user.regionId) {
        return res.status(400).json({ message: "المشرف يجب أن يكون مرتبط بمنطقة" });
      }

      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser || targetUser.regionId !== user.regionId) {
        return res.status(403).json({ message: "لا يمكنك الوصول إلى مستخدمين خارج منطقتك" });
      }

      const inventory = await storage.getTechnicianInventory(req.params.userId);
      res.json(inventory || null);
    } catch (error) {
      console.error("Error fetching moving inventory:", error);
      res.status(500).json({ message: "Failed to fetch moving inventory" });
    }
  });
}
