import { storage } from "../storage";
import type { InsertTechnicianFixedInventory } from "@shared/schema";

export async function getTechnicianFixedInventory(technicianId: string) {
  return storage.getTechnicianFixedInventory(technicianId);
}

export async function createTechnicianFixedInventory(inventory: InsertTechnicianFixedInventory) {
  return storage.createTechnicianFixedInventory(inventory);
}

export async function updateTechnicianFixedInventory(technicianId: string, updates: Partial<InsertTechnicianFixedInventory>) {
  return storage.updateTechnicianFixedInventory(technicianId, updates);
}

export async function deleteTechnicianFixedInventory(technicianId: string) {
  return storage.deleteTechnicianFixedInventory(technicianId);
}
