import { db } from "../db";
import { 
  withdrawnDevices,
  receivedDevices,
  users,
  type WithdrawnDevice,
  type ReceivedDevice,
  type InsertWithdrawnDevice,
  type InsertReceivedDevice
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Devices Management Service
 * Handles withdrawn and received devices operations
 */
export class DevicesService {

  /**
   * Get all withdrawn devices
   */
  async getWithdrawnDevices(): Promise<WithdrawnDevice[]> {
    return db
      .select()
      .from(withdrawnDevices)
      .orderBy(desc(withdrawnDevices.createdAt));
  }

  /**
   * Get withdrawn devices by region
   */
  async getWithdrawnDevicesByRegion(regionId: string): Promise<WithdrawnDevice[]> {
    return db
      .select()
      .from(withdrawnDevices)
      .where(eq(withdrawnDevices.regionId, regionId))
      .orderBy(desc(withdrawnDevices.createdAt));
  }

  /**
   * Get single withdrawn device
   */
  async getWithdrawnDevice(id: string): Promise<WithdrawnDevice | undefined> {
    const [device] = await db
      .select()
      .from(withdrawnDevices)
      .where(eq(withdrawnDevices.id, id))
      .limit(1);

    return device || undefined;
  }

  /**
   * Create withdrawn device entry
   */
  async createWithdrawnDevice(data: InsertWithdrawnDevice): Promise<WithdrawnDevice> {
    const [newDevice] = await db
      .insert(withdrawnDevices)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!newDevice) {
      throw new Error("Failed to create withdrawn device entry");
    }

    return newDevice;
  }

  /**
   * Update withdrawn device
   */
  async updateWithdrawnDevice(id: string, updates: Partial<InsertWithdrawnDevice>): Promise<WithdrawnDevice> {
    const [updatedDevice] = await db
      .update(withdrawnDevices)
      .set({ 
        ...updates, 
        updatedAt: new Date() 
      })
      .where(eq(withdrawnDevices.id, id))
      .returning();

    if (!updatedDevice) {
      throw new Error("Withdrawn device not found");
    }

    return updatedDevice;
  }

  /**
   * Delete withdrawn device
   */
  async deleteWithdrawnDevice(id: string): Promise<boolean> {
    const result = await db
      .delete(withdrawnDevices)
      .where(eq(withdrawnDevices.id, id));

    return ((result as any).rowCount || (result as any).changes || 0) > 0;
  }

  /**
   * Get received devices with filters
   */
  async getReceivedDevices(filters?: { 
    status?: string; 
    technicianId?: string; 
    supervisorId?: string; 
    regionId?: string 
  }): Promise<ReceivedDevice[]> {
    let query = db
      .select()
      .from(receivedDevices)
      .$dynamic();

    const conditions: any[] = [];

    if (filters?.status) {
      conditions.push(eq(receivedDevices.status, filters.status));
    }
    if (filters?.technicianId) {
      conditions.push(eq(receivedDevices.technicianId, filters.technicianId));
    }
    if (filters?.supervisorId) {
      conditions.push(eq(receivedDevices.supervisorId, filters.supervisorId));
    }
    if (filters?.regionId) {
      conditions.push(eq(receivedDevices.regionId, filters.regionId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return query.orderBy(desc(receivedDevices.createdAt));
  }

  /**
   * Get single received device
   */
  async getReceivedDevice(id: string): Promise<ReceivedDevice | undefined> {
    const [device] = await db
      .select()
      .from(receivedDevices)
      .where(eq(receivedDevices.id, id))
      .limit(1);

    return device || undefined;
  }

  /**
   * Create received device entry
   */
  async createReceivedDevice(data: InsertReceivedDevice): Promise<ReceivedDevice> {
    const [newDevice] = await db
      .insert(receivedDevices)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!newDevice) {
      throw new Error("Failed to create received device entry");
    }

    return newDevice;
  }

  /**
   * Update received device status
   */
  async updateReceivedDeviceStatus(
    id: string, 
    status: string, 
    approvedBy: string, 
    adminNotes?: string
  ): Promise<ReceivedDevice> {
    const [updatedDevice] = await db
      .update(receivedDevices)
      .set({
        status,
        approvedBy,
        adminNotes,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(receivedDevices.id, id))
      .returning();

    if (!updatedDevice) {
      throw new Error("Received device not found");
    }

    return updatedDevice;
  }

  /**
   * Delete received device
   */
  async deleteReceivedDevice(id: string): Promise<boolean> {
    const result = await db
      .delete(receivedDevices)
      .where(eq(receivedDevices.id, id));

    return ((result as any).rowCount || (result as any).changes || 0) > 0;
  }

  /**
   * Count pending received devices
   */
  async getPendingReceivedDevicesCount(
    supervisorId?: string,
    regionId?: string | null,
  ): Promise<number> {
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

  /**
   * Get devices summary by region
   */
  async getDevicesSummaryByRegion(regionId: string) {
    const [withdrawnSummary] = await db
      .select({
        totalWithdrawn: sql<number>`COUNT(*)`,
        pendingWithdrawn: sql<number>`0`,
        approvedWithdrawn: sql<number>`0`,
        rejectedWithdrawn: sql<number>`0`
      })
      .from(withdrawnDevices)
      .where(eq(withdrawnDevices.regionId, regionId));

    const [receivedSummary] = await db
      .select({
        totalReceived: sql<number>`COUNT(*)`,
        pendingReceived: sql<number>`COUNT(CASE WHEN ${receivedDevices.status} = 'pending' THEN 1 END)`,
        approvedReceived: sql<number>`COUNT(CASE WHEN ${receivedDevices.status} = 'approved' THEN 1 END)`,
        rejectedReceived: sql<number>`COUNT(CASE WHEN ${receivedDevices.status} = 'rejected' THEN 1 END)`
      })
      .from(receivedDevices)
      .where(eq(receivedDevices.regionId, regionId));

    return {
      ...withdrawnSummary,
      ...receivedSummary
    };
  }

  /**
   * Get devices by technician
   */
  async getDevicesByTechnician(technicianId: string) {
    const [technician] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, technicianId))
      .limit(1);

    const withdrawn = await db
      .select()
      .from(withdrawnDevices)
      .where(eq(withdrawnDevices.technicianName, technician?.fullName || ""))
      .orderBy(desc(withdrawnDevices.createdAt));

    const received = await db
      .select()
      .from(receivedDevices)
      .where(eq(receivedDevices.technicianId, technicianId))
      .orderBy(desc(receivedDevices.createdAt));

    return {
      withdrawn,
      received
    };
  }

  /**
   * Get pending devices for approval
   */
  async getPendingDevicesForApproval(supervisorId?: string) {
    let receivedQuery = db
      .select({
        id: receivedDevices.id,
        technicianId: receivedDevices.technicianId,
        terminalId: receivedDevices.terminalId,
        serialNumber: receivedDevices.serialNumber,
        status: receivedDevices.status,
        createdAt: receivedDevices.createdAt,
        technicianName: users.fullName,
        technicianCity: users.city,
        type: sql<string>`'received'`
      })
      .from(receivedDevices)
      .leftJoin(users, eq(receivedDevices.technicianId, users.id))
      .where(eq(receivedDevices.status, 'pending'))
      .$dynamic();

    if (supervisorId) {
      receivedQuery = receivedQuery.where(eq(receivedDevices.supervisorId, supervisorId));
    }

    const received = await receivedQuery;

    return [...received].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  /**
   * Approve multiple devices
   */
  async approveDevicesBatch(deviceIds: string[], approvedBy: string, type: 'withdrawn' | 'received') {
    if (type === 'withdrawn') {
      return db
        .update(withdrawnDevices)
        .set({ 
          updatedAt: new Date() 
        })
        .where(sql`${withdrawnDevices.id} = ANY(${deviceIds})`);
    } else {
      return db
        .update(receivedDevices)
        .set({ 
          status: 'approved', 
          approvedBy,
          approvedAt: new Date(),
          updatedAt: new Date() 
        })
        .where(sql`${receivedDevices.id} = ANY(${deviceIds})`);
    }
  }

  /**
   * Reject multiple devices
   */
  async rejectDevicesBatch(deviceIds: string[], approvedBy: string, adminNotes: string, type: 'withdrawn' | 'received') {
    if (type === 'withdrawn') {
      return db
        .update(withdrawnDevices)
        .set({ 
          notes: adminNotes,
          updatedAt: new Date() 
        })
        .where(sql`${withdrawnDevices.id} = ANY(${deviceIds})`);
    } else {
      return db
        .update(receivedDevices)
        .set({ 
          status: 'rejected', 
          approvedBy,
          adminNotes,
          approvedAt: new Date(),
          updatedAt: new Date() 
        })
        .where(sql`${receivedDevices.id} = ANY(${deviceIds})`);
    }
  }
}