import { storage } from "../storage";
import type { InsertInventoryItem, InventoryItemWithStatus } from "@shared/schema";

export async function getInventoryItems(): Promise<InventoryItemWithStatus[]> {
  return storage.getInventoryItems();
}

export async function getInventoryItem(id: string) {
  return storage.getInventoryItem(id);
}

export async function createInventoryItem(item: InsertInventoryItem) {
  return storage.createInventoryItem(item);
}

export async function updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>) {
  return storage.updateInventoryItem(id, updates);
}

export async function deleteInventoryItem(id: string) {
  return storage.deleteInventoryItem(id);
}
