/**
 * Devices controller (Withdrawn & Received)
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import {
  insertWithdrawnDeviceSchema,
  insertReceivedDeviceSchema,
} from "@shared/schema";
import { NotFoundError } from "../utils/errors";
import { z } from "zod";
import { repositories } from "../infrastructure/repositories";
import { DevicesService } from "../services/devices.service";

const devicesService = new DevicesService();

export class DevicesController {
  /**
   * GET /api/withdrawn-devices
   * Get all withdrawn devices
   */
  getWithdrawnDevices = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    let devices;

    if (user.role === "supervisor" && user.regionId) {
      devices = await devicesService.getWithdrawnDevicesByRegion(user.regionId);
    } else {
      devices = await devicesService.getWithdrawnDevices();
    }

    res.json(devices);
  });

  /**
   * GET /api/withdrawn-devices/:id
   * Get single withdrawn device
   */
  getWithdrawnDevice = asyncHandler(async (req: Request, res: Response) => {
    const device = await devicesService.getWithdrawnDevice(req.params.id);
    if (!device) {
      throw new NotFoundError("Device not found");
    }
    res.json(device);
  });

  /**
   * POST /api/withdrawn-devices
   * Create withdrawn device
   */
  createWithdrawnDevice = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const validatedData = insertWithdrawnDeviceSchema.parse(req.body);
    
    const device = await devicesService.createWithdrawnDevice({
      ...validatedData,
      createdBy: user.id,
      regionId: user.regionId,
    });

    // Log the activity
    await repositories.systemLogs.createSystemLog({
      userId: user.id,
      userName: user.username,
      userRole: user.role,
      regionId: user.regionId,
      action: "create",
      entityType: "device",
      entityId: device.id,
      entityName: device.serialNumber,
      description: `تم سحب جهاز: ${device.serialNumber}`,
      severity: "info",
      success: true,
    });

    res.status(201).json(device);
  });

  /**
   * PATCH /api/withdrawn-devices/:id
   * Update withdrawn device
   */
  updateWithdrawnDevice = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const updates = insertWithdrawnDeviceSchema.partial().parse(req.body);
    const device = await devicesService.updateWithdrawnDevice(req.params.id, updates);

    // Log the activity
    await repositories.systemLogs.createSystemLog({
      userId: user.id,
      userName: user.username,
      userRole: user.role,
      regionId: device.regionId,
      action: "update",
      entityType: "device",
      entityId: device.id,
      entityName: device.serialNumber,
      description: `تم تحديث جهاز مسحوب: ${device.serialNumber}`,
      severity: "info",
      success: true,
    });

    res.json(device);
  });

  /**
   * DELETE /api/withdrawn-devices/:id
   * Delete withdrawn device
   */
  deleteWithdrawnDevice = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const device = await devicesService.getWithdrawnDevice(req.params.id);
    if (!device) {
      throw new NotFoundError("Device not found");
    }

    const deleted = await devicesService.deleteWithdrawnDevice(req.params.id);
    if (!deleted) {
      throw new NotFoundError("Device not found");
    }

    // Log the activity
    await repositories.systemLogs.createSystemLog({
      userId: user.id,
      userName: user.username,
      userRole: user.role,
      regionId: device.regionId,
      action: "delete",
      entityType: "device",
      entityId: req.params.id,
      entityName: device.serialNumber,
      description: `تم حذف جهاز مسحوب: ${device.serialNumber}`,
      severity: "warn",
      success: true,
    });

    res.json({ message: "Device deleted successfully" });
  });

  /**
   * GET /api/received-devices
   * Get received devices
   */
  getReceivedDevices = asyncHandler(async (req: Request, res: Response) => {
    const { status, technicianId, supervisorId, regionId } = req.query;
    const user = req.user!;

    const filters: any = {
      status: status as string,
      technicianId: technicianId as string,
      supervisorId: supervisorId as string,
      regionId: (regionId as string) || (user.role === "supervisor" ? user.regionId : undefined),
    };

    const devices = await devicesService.getReceivedDevices(filters);
    res.json(devices);
  });

  /**
   * GET /api/received-devices/pending/count
   * Get count of pending received devices
   */
  getPendingReceivedDevicesCount = asyncHandler(
    async (req: Request, res: Response) => {
      const user = req.user!;
      const count = await devicesService.getPendingReceivedDevicesCount(
        user.role === "supervisor" ? user.id : undefined,
        user.regionId
      );
      res.json({ count });
    }
  );

  /**
   * GET /api/received-devices/:id
   * Get single received device
   */
  getReceivedDevice = asyncHandler(async (req: Request, res: Response) => {
    const device = await devicesService.getReceivedDevice(req.params.id);
    if (!device) {
      throw new NotFoundError("Device not found");
    }
    res.json(device);
  });

  /**
   * POST /api/received-devices
   * Create received device
   */
  createReceivedDevice = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const validatedData = insertReceivedDeviceSchema.parse(req.body);

    const device = await devicesService.createReceivedDevice({
      ...validatedData,
      technicianId: validatedData.technicianId || user.id,
      supervisorId: user.role === "supervisor" ? user.id : null,
      regionId: user.regionId,
    });

    // Log the activity
    await repositories.systemLogs.createSystemLog({
      userId: user.id,
      userName: user.username,
      userRole: user.role,
      regionId: user.regionId,
      action: "create",
      entityType: "device",
      entityId: device.id,
      entityName: device.serialNumber,
      description: `تم استلام جهاز: ${device.serialNumber}`,
      severity: "info",
      success: true,
    });

    res.status(201).json(device);
  });

  /**
   * PATCH /api/received-devices/:id/status
   * Update received device status
   */
  updateReceivedDeviceStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const user = req.user!;
      const schema = z.object({
        status: z.enum(["pending", "approved", "rejected"]),
        adminNotes: z.string().optional(),
      });
      const { status, adminNotes } = schema.parse(req.body);

      const device = await devicesService.updateReceivedDeviceStatus(
        req.params.id,
        status,
        user.id,
        adminNotes
      );

      // Log the activity
      await repositories.systemLogs.createSystemLog({
        userId: user.id,
        userName: user.username,
        userRole: user.role,
        regionId: device.regionId,
        action: status === "approved" ? "approve" : "reject",
        entityType: "device",
        entityId: device.id,
        entityName: device.serialNumber,
        description: `تم ${status === "approved" ? "الموافقة على" : "رفض"} استلام جهاز: ${device.serialNumber}`,
        severity: "info",
        success: true,
      });

      res.json(device);
    }
  );

  /**
   * DELETE /api/received-devices/:id
   * Delete received device
   */
  deleteReceivedDevice = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const device = await devicesService.getReceivedDevice(req.params.id);
    if (!device) {
      throw new NotFoundError("Device not found");
    }

    const deleted = await devicesService.deleteReceivedDevice(req.params.id);
    if (!deleted) {
      throw new NotFoundError("Device not found");
    }

    // Log the activity
    await repositories.systemLogs.createSystemLog({
      userId: user.id,
      userName: user.username,
      userRole: user.role,
      regionId: device.regionId,
      action: "delete",
      entityType: "device",
      entityId: req.params.id,
      entityName: device.serialNumber,
      description: `تم حذف جهاز مستلم: ${device.serialNumber}`,
      severity: "warn",
      success: true,
    });

    res.json({ message: "Device deleted successfully" });
  });
}

export const devicesController = new DevicesController();
