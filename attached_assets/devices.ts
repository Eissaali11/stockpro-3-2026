import { and, desc, eq, sql } from 'drizzle-orm';
import { getDatabase } from '../infrastructure/database/connection';
import {
  receivedDevices,
  techniciansInventory,
  withdrawnDevices,
  type InsertReceivedDevice,
  type InsertTechnicianInventory,
  type InsertWithdrawnDevice,
  type ReceivedDevice,
  type TechnicianInventory,
  type WithdrawnDevice,
} from '../infrastructure/schemas';

export async function getTechniciansInventory(): Promise<TechnicianInventory[]> {
  const db = getDatabase();
  return db
    .select()
    .from(techniciansInventory)
    .orderBy(desc(techniciansInventory.createdAt));
}

export async function createTechnicianInventory(data: InsertTechnicianInventory): Promise<TechnicianInventory> {
  const db = getDatabase();
  const [inventory] = await db
    .insert(techniciansInventory)
    .values(data)
    .returning();
  return inventory;
}

export async function deleteTechnicianInventory(id: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db
    .delete(techniciansInventory)
    .where(eq(techniciansInventory.id, id));
  return (result.rowCount || 0) > 0;
}

export async function getWithdrawnDevices(): Promise<WithdrawnDevice[]> {
  const db = getDatabase();
  return db
    .select()
    .from(withdrawnDevices)
    .orderBy(desc(withdrawnDevices.createdAt));
}

export async function getWithdrawnDevice(id: string): Promise<WithdrawnDevice | undefined> {
  const db = getDatabase();
  const [device] = await db
    .select()
    .from(withdrawnDevices)
    .where(eq(withdrawnDevices.id, id));
  return device || undefined;
}

export async function createWithdrawnDevice(data: InsertWithdrawnDevice): Promise<WithdrawnDevice> {
  const db = getDatabase();
  const [device] = await db
    .insert(withdrawnDevices)
    .values(data)
    .returning();
  return device;
}

export async function updateWithdrawnDevice(
  id: string,
  updates: Partial<InsertWithdrawnDevice>
): Promise<WithdrawnDevice> {
  const db = getDatabase();
  const [device] = await db
    .update(withdrawnDevices)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(withdrawnDevices.id, id))
    .returning();

  if (!device) {
    throw new Error(`Withdrawn device with id ${id} not found`);
  }
  return device;
}

export async function deleteWithdrawnDevice(id: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db
    .delete(withdrawnDevices)
    .where(eq(withdrawnDevices.id, id));
  return (result.rowCount || 0) > 0;
}

export async function getWithdrawnDevicesByRegion(regionId: string): Promise<WithdrawnDevice[]> {
  const db = getDatabase();
  return db
    .select()
    .from(withdrawnDevices)
    .where(eq(withdrawnDevices.regionId, regionId))
    .orderBy(desc(withdrawnDevices.createdAt));
}

export async function getReceivedDevices(filters?: {
  status?: string;
  technicianId?: string;
  supervisorId?: string;
  regionId?: string;
}): Promise<ReceivedDevice[]> {
  const db = getDatabase();
  let query = db.select().from(receivedDevices).$dynamic();

  if (filters) {
    const conditions = [];
    if (filters.status) {
      conditions.push(eq(receivedDevices.status, filters.status as any));
    }
    if (filters.technicianId) {
      conditions.push(eq(receivedDevices.technicianId, filters.technicianId));
    }
    if (filters.supervisorId) {
      conditions.push(eq(receivedDevices.supervisorId, filters.supervisorId));
    }
    if (filters.regionId) {
      conditions.push(eq(receivedDevices.regionId, filters.regionId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
  }

  return query.orderBy(desc(receivedDevices.createdAt));
}

export async function getReceivedDevice(id: string): Promise<ReceivedDevice | undefined> {
  const db = getDatabase();
  const [device] = await db
    .select()
    .from(receivedDevices)
    .where(eq(receivedDevices.id, id));
  return device || undefined;
}

export async function createReceivedDevice(data: InsertReceivedDevice): Promise<ReceivedDevice> {
  const db = getDatabase();
  const [device] = await db
    .insert(receivedDevices)
    .values(data)
    .returning();
  return device;
}

export async function updateReceivedDeviceStatus(
  id: string,
  status: string,
  approvedBy: string,
  adminNotes?: string
): Promise<ReceivedDevice> {
  const db = getDatabase();
  const [device] = await db
    .update(receivedDevices)
    .set({
      status: status as any,
      approvedBy,
      adminNotes,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(receivedDevices.id, id))
    .returning();

  if (!device) {
    throw new Error(`Received device with id ${id} not found`);
  }
  return device;
}

export async function deleteReceivedDevice(id: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db
    .delete(receivedDevices)
    .where(eq(receivedDevices.id, id));
  return (result.rowCount || 0) > 0;
}

export async function getPendingReceivedDevicesCount(
  supervisorId?: string,
  regionId?: string | null
): Promise<number> {
  const db = getDatabase();
  let query = db
    .select({ count: sql<number>`count(*)` })
    .from(receivedDevices)
    .$dynamic();

  const conditions = [eq(receivedDevices.status, 'pending')];

  if (supervisorId) {
    conditions.push(eq(receivedDevices.supervisorId, supervisorId));
  }

  if (regionId) {
    conditions.push(eq(receivedDevices.regionId, regionId));
  }

  query = query.where(and(...conditions));

  const [{ count }] = await query;
  return Number(count);
}
