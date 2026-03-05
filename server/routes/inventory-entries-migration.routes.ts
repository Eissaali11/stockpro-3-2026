import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";

/**
 * Inventory Entries Migration Routes - هجرة قيود المخزون (< 100 lines)
 * مجال المسؤولية: أدوات الهجرة والانتقال لقيود المخزون
 */
export function registerInventoryEntriesMigrationRoutes(app: Express): void {

  // هجرة قيود المخزون إلى البنية الجديدة
  app.post("/api/migrate-inventory-entries", requireAuth, async (req, res) => {
    try {
      await storage.migrateToInventoryEntries();
      res.json({ success: true, message: "Migration completed successfully" });
    } catch (error) {
      console.error("Error migrating inventory entries:", error);
      res.status(500).json({ message: "Migration failed" });
    }
  });
}