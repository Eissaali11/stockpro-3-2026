import { eq } from 'drizzle-orm';
import { getDatabase } from '../infrastructure/database/connection';
import { repositories } from '../infrastructure/repositories';
import {
  supervisorTechnicians,
  type SupervisorWarehouse,
  type WarehouseWithStats,
} from '../infrastructure/schemas';

export async function getWarehousesByRegion(regionId: string): Promise<WarehouseWithStats[]> {
  const warehouses = await repositories.warehouse.getWarehouses();
  return warehouses.filter((warehouse) => warehouse.regionId === regionId);
}

export async function getWarehousesBySupervisor(supervisorId: string): Promise<WarehouseWithStats[]> {
  const assignments = await repositories.supervisor.getSupervisorWarehouses(supervisorId);
  if (!assignments.length) {
    return [];
  }

  const warehouses = await repositories.warehouse.getWarehouses();
  const warehouseIds = new Set(assignments.map((assignment) => assignment.warehouseId));
  return warehouses.filter((warehouse) => warehouseIds.has(warehouse.id));
}

export async function assignWarehouseToSupervisor(
  supervisorId: string,
  warehouseId: string
): Promise<SupervisorWarehouse> {
  return repositories.supervisor.assignWarehouseToSupervisor(supervisorId, warehouseId);
}

export async function removeWarehouseFromSupervisor(supervisorId: string, warehouseId: string): Promise<boolean> {
  return repositories.supervisor.removeWarehouseFromSupervisor(supervisorId, warehouseId);
}

export async function getSupervisorWarehouses(supervisorId: string): Promise<string[]> {
  const rows = await repositories.supervisor.getSupervisorWarehouses(supervisorId);
  return rows.map((row) => row.warehouseId);
}

export async function getTechnicianSupervisor(technicianId: string): Promise<string | null> {
  const db = getDatabase();
  const [row] = await db
    .select({ supervisorId: supervisorTechnicians.supervisorId })
    .from(supervisorTechnicians)
    .where(eq(supervisorTechnicians.technicianId, technicianId));

  return row?.supervisorId || null;
}
