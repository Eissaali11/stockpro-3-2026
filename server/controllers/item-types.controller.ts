/**
 * Item Types controller
 */

import type { Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validation";
import { z } from "zod";
import { NotFoundError, ConflictError } from "../utils/errors";
import { CreateItemTypeUseCase } from "../application/item-types/use-cases/CreateItemType.use-case";
import {
  DuplicateItemTypeNameError,
  ItemTypeIdAlreadyExistsError,
} from "../domain/item-types/item-type.entity";
import type { InsertItemType } from "@shared/schema";

const createItemTypeSchema = z.object({
  id: z.string().optional(),
  nameAr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  category: z.enum(["devices", "papers", "sim", "accessories"]),
  unitsPerBox: z.number().int().positive(),
  isActive: z.boolean().optional().default(true),
  isVisible: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const updateItemTypeSchema = z.object({
  nameAr: z.string().trim().min(1).optional(),
  nameEn: z.string().trim().min(1).optional(),
  category: z.enum(["devices", "papers", "sim", "accessories"]).optional(),
  unitsPerBox: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const toggleActiveSchema = z.object({
  isActive: z.boolean(),
});

const toggleVisibilitySchema = z.object({
  isVisible: z.boolean(),
});

const createItemTypeUseCase = new CreateItemTypeUseCase({
  getById: (id) => storage.getItemTypeById(id),
  getAll: () => storage.getItemTypes(),
  create: (data) => storage.createItemType(data),
});

export class ItemTypesController {
  private normalizeName(name: string): string {
    return name.trim().toLocaleLowerCase();
  }

  /**
   * GET /api/item-types
   * Get all item types (admin view - shows all including inactive)
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const types = await storage.getItemTypes();
    res.json(types);
  });

  /**
   * GET /api/item-types/active
   * Get active item types only
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const types = await storage.getActiveItemTypes();
    res.json(types);
  });

  /**
   * GET /api/item-types/:id
   * Get single item type
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.getItemTypeById(req.params.id);
    if (!type) {
      throw new NotFoundError("Item type not found");
    }
    res.json(type);
  });

  /**
   * POST /api/item-types
   * Create new item type
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const data = createItemTypeSchema.parse(req.body);
    try {
      const type = await createItemTypeUseCase.execute(data as InsertItemType);
      res.status(201).json(type);
    } catch (error) {
      if (
        error instanceof ItemTypeIdAlreadyExistsError ||
        error instanceof DuplicateItemTypeNameError
      ) {
        throw new ConflictError(error.message);
      }

      throw error;
    }
  });

  /**
   * PATCH /api/item-types/:id
   * Update item type
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const data = updateItemTypeSchema.parse(req.body);
    const normalizedData = {
      ...data,
      ...(typeof data.nameAr === 'string' ? { nameAr: data.nameAr.trim() } : {}),
      ...(typeof data.nameEn === 'string' ? { nameEn: data.nameEn.trim() } : {}),
    };

    if (normalizedData.nameAr || normalizedData.nameEn) {
      const existingTypes = await storage.getItemTypes();

      if (normalizedData.nameAr) {
        const duplicateNameAr = existingTypes.find((type) =>
          type.id !== req.params.id &&
          this.normalizeName(type.nameAr) === this.normalizeName(normalizedData.nameAr!)
        );
        if (duplicateNameAr) {
          throw new ConflictError("Item type Arabic name already exists");
        }
      }

      if (normalizedData.nameEn) {
        const duplicateNameEn = existingTypes.find((type) =>
          type.id !== req.params.id &&
          this.normalizeName(type.nameEn) === this.normalizeName(normalizedData.nameEn!)
        );
        if (duplicateNameEn) {
          throw new ConflictError("Item type English name already exists");
        }
      }
    }

    const type = await storage.updateItemType(req.params.id, normalizedData);

    if (!type) {
      throw new NotFoundError("Item type not found");
    }

    res.json(type);
  });

  /**
   * PATCH /api/item-types/:id/toggle-active
   * Toggle item type active status
   */
  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { isActive } = toggleActiveSchema.parse(req.body);
    const type = await storage.toggleItemTypeActive(req.params.id, isActive);

    if (!type) {
      throw new NotFoundError("Item type not found");
    }

    res.json(type);
  });

  /**
   * PATCH /api/item-types/:id/toggle-visibility
   * Toggle item type visibility
   */
  toggleVisibility = asyncHandler(async (req: Request, res: Response) => {
    const { isVisible } = toggleVisibilitySchema.parse(req.body);
    const type = await storage.toggleItemTypeVisibility(req.params.id, isVisible);

    if (!type) {
      throw new NotFoundError("Item type not found");
    }

    res.json(type);
  });

  /**
   * DELETE /api/item-types/:id
   * Delete item type (soft delete)
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    // Soft delete by setting isActive to false
    const type = await storage.toggleItemTypeActive(req.params.id, false);

    if (!type) {
      throw new NotFoundError("Item type not found");
    }

    res.json({ success: true, message: "Item type disabled successfully" });
  });

  /**
   * POST /api/item-types/seed
   * Seed default item types
   */
  seed = asyncHandler(async (req: Request, res: Response) => {
    await storage.seedDefaultItemTypes();
    res.json({ success: true, message: "Default item types seeded successfully" });
  });
}

export const itemTypesController = new ItemTypesController();
