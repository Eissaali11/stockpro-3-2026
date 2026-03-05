import { db } from "../db";
import { 
  itemTypes,
  type ItemType,
  type InsertItemType
} from "@shared/schema";
import { eq, and, sql, count } from "drizzle-orm";

/**
 * Item Types Management Service
 * Handles item types and their configurations
 */
export class ItemTypesService {

  /**
   * Get all item types
   */
  async getItemTypes(): Promise<ItemType[]> {
    return db
      .select()
      .from(itemTypes)
      .orderBy(itemTypes.sortOrder, itemTypes.nameAr);
  }

  /**
   * Get active item types only
   */
  async getActiveItemTypes(): Promise<ItemType[]> {
    return db
      .select()
      .from(itemTypes)
      .where(and(eq(itemTypes.isActive, true), eq(itemTypes.isVisible, true)))
      .orderBy(itemTypes.sortOrder, itemTypes.nameAr);
  }

  /**
   * Get single item type by ID
   */
  async getItemTypeById(id: string): Promise<ItemType | undefined> {
    const [itemType] = await db
      .select()
      .from(itemTypes)
      .where(eq(itemTypes.id, id))
      .limit(1);

    return itemType || undefined;
  }

  /**
   * Create new item type
   */
  async createItemType(data: InsertItemType): Promise<ItemType> {
    const [newItemType] = await db
      .insert(itemTypes)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!newItemType) {
      throw new Error("Failed to create item type");
    }

    return newItemType;
  }

  /**
   * Update item type
   */
  async updateItemType(id: string, updates: Partial<InsertItemType>): Promise<ItemType> {
    const [updatedItemType] = await db
      .update(itemTypes)
      .set({ 
        ...updates, 
        updatedAt: new Date() 
      })
      .where(eq(itemTypes.id, id))
      .returning();

    if (!updatedItemType) {
      throw new Error("Item type not found");
    }

    return updatedItemType;
  }

  /**
   * Delete item type (soft delete by setting isActive to false)
   */
  async deleteItemType(id: string): Promise<ItemType> {
    return this.updateItemType(id, { isActive: false });
  }

  /**
   * Toggle item type visibility
   */
  async toggleItemTypeVisibility(id: string): Promise<ItemType> {
    const itemType = await this.getItemTypeById(id);
    if (!itemType) {
      throw new Error("Item type not found");
    }

    return this.updateItemType(id, { isVisible: !itemType.isVisible });
  }

  /**
   * Toggle item type active status
   */
  async toggleItemTypeStatus(id: string): Promise<ItemType> {
    const itemType = await this.getItemTypeById(id);
    if (!itemType) {
      throw new Error("Item type not found");
    }

    return this.updateItemType(id, { isActive: !itemType.isActive });
  }

  /**
   * Get item types by category
   */
  async getItemTypesByCategory(category: string): Promise<ItemType[]> {
    return db
      .select()
      .from(itemTypes)
      .where(and(eq(itemTypes.category, category), eq(itemTypes.isActive, true)))
      .orderBy(itemTypes.sortOrder, itemTypes.nameAr);
  }

  /**
   * Reorder item types
   */
  async reorderItemTypes(reorderedItems: { id: string; sortOrder: number }[]): Promise<void> {
    const updates = reorderedItems.map(item => 
      db.update(itemTypes)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(itemTypes.id, item.id))
    );

    await Promise.all(updates);
  }

  /**
   * Search item types
   */
  async searchItemTypes(query: string): Promise<ItemType[]> {
    return db
      .select()
      .from(itemTypes)
      .where(
        and(
          eq(itemTypes.isActive, true),
          sql`(${itemTypes.nameAr} ILIKE ${`%${query}%`} OR ${itemTypes.nameEn} ILIKE ${`%${query}%`})`
        )
      )
      .orderBy(itemTypes.sortOrder, itemTypes.nameAr);
  }

  /**
   * Seed default item types
   */
  async seedDefaultItemTypes(): Promise<void> {
    const defaultItemTypes = [
      {
        id: 'n950',
        nameAr: 'N950',
        nameEn: 'N950',
        category: 'devices' as const,
        unitsPerBox: 1,
        isActive: true,
        isVisible: true,
        sortOrder: 1,
        icon: '📱',
        color: '#3B82F6'
      },
      {
        id: 'i9000s',
        nameAr: 'i9000s',
        nameEn: 'i9000s',
        category: 'devices' as const,
        unitsPerBox: 1,
        isActive: true,
        isVisible: true,
        sortOrder: 2,
        icon: '📱',
        color: '#10B981'
      },
      {
        id: 'i9100',
        nameAr: 'i9100',
        nameEn: 'i9100',
        category: 'devices' as const,
        unitsPerBox: 1,
        isActive: true,
        isVisible: true,
        sortOrder: 3,
        icon: '📱',
        color: '#8B5CF6'
      },
      {
        id: 'rollPaper',
        nameAr: 'ورق الطباعة',
        nameEn: 'rollPaper',
        category: 'papers' as const,
        unitsPerBox: 50,
        isActive: true,
        isVisible: true,
        sortOrder: 4,
        icon: '📄',
        color: '#F59E0B'
      },
      {
        id: 'stickers',
        nameAr: 'الملصقات',
        nameEn: 'stickers',
        category: 'papers' as const,
        unitsPerBox: 100,
        isActive: true,
        isVisible: true,
        sortOrder: 5,
        icon: '🏷️',
        color: '#EF4444'
      },
      {
        id: 'newBatteries',
        nameAr: 'البطاريات الجديدة',
        nameEn: 'newBatteries',
        category: 'accessories' as const,
        unitsPerBox: 10,
        isActive: true,
        isVisible: true,
        sortOrder: 6,
        icon: '🔋',
        color: '#06B6D4'
      },
      {
        id: 'mobilySim',
        nameAr: 'شرائح موبايلي',
        nameEn: 'mobilySim',
        category: 'sim' as const,
        unitsPerBox: 20,
        isActive: true,
        isVisible: true,
        sortOrder: 7,
        icon: '📲',
        color: '#84CC16'
      },
      {
        id: 'stcSim',
        nameAr: 'شرائح STC',
        nameEn: 'stcSim',
        category: 'sim' as const,
        unitsPerBox: 20,
        isActive: true,
        isVisible: true,
        sortOrder: 8,
        icon: '📲',
        color: '#F97316'
      },
      {
        id: 'zainSim',
        nameAr: 'شرائح زين',
        nameEn: 'zainSim',
        category: 'sim' as const,
        unitsPerBox: 20,
        isActive: true,
        isVisible: true,
        sortOrder: 9,
        icon: '📲',
        color: '#EC4899'
      }
    ];

    for (const itemType of defaultItemTypes) {
      // Check if item type already exists
      const existing = await this.getItemTypeById(itemType.id);
      if (!existing) {
        await this.createItemType(itemType);
      }
    }
  }

  /**
   * Get item type statistics
   */
  async getItemTypeStatistics() {
    const [stats] = await db
      .select({
        totalItemTypes: sql<number>`COUNT(*)`,
        activeItemTypes: sql<number>`COUNT(CASE WHEN ${itemTypes.isActive} = true THEN 1 END)`,
        visibleItemTypes: sql<number>`COUNT(CASE WHEN ${itemTypes.isVisible} = true THEN 1 END)`,
        deviceTypes: sql<number>`COUNT(CASE WHEN ${itemTypes.category} = 'devices' THEN 1 END)`,
        paperTypes: sql<number>`COUNT(CASE WHEN ${itemTypes.category} = 'papers' THEN 1 END)`,
        simTypes: sql<number>`COUNT(CASE WHEN ${itemTypes.category} = 'sim' THEN 1 END)`,
        accessoryTypes: sql<number>`COUNT(CASE WHEN ${itemTypes.category} = 'accessories' THEN 1 END)`
      })
      .from(itemTypes);

    return stats;
  }

  /**
   * Bulk update item types
   */
  async bulkUpdateItemTypes(updates: { id: string; updates: Partial<InsertItemType> }[]): Promise<void> {
    const updatePromises = updates.map(({ id, updates: itemUpdates }) =>
      this.updateItemType(id, itemUpdates)
    );

    await Promise.all(updatePromises);
  }

  /**
   * Get item types with pagination
   */
  async getItemTypesWithPagination(
    page: number = 1, 
    pageSize: number = 10,
    filters?: {
      category?: string;
      isActive?: boolean;
      isVisible?: boolean;
    }
  ) {
    const offset = (page - 1) * pageSize;
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(itemTypes.category, filters.category));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(itemTypes.isActive, filters.isActive));
    }
    if (filters?.isVisible !== undefined) {
      conditions.push(eq(itemTypes.isVisible, filters.isVisible));
    }

    let query = db.select().from(itemTypes).$dynamic();
    let countQuery = db.select({ count: count() }).from(itemTypes).$dynamic();

    if (conditions.length > 0) {
      const whereClause = and(...conditions);
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const [totalCount] = await countQuery;
    const itemTypesData = await query
      .orderBy(itemTypes.sortOrder, itemTypes.nameAr)
      .limit(pageSize)
      .offset(offset);

    return {
      data: itemTypesData,
      pagination: {
        page,
        pageSize,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / pageSize)
      }
    };
  }
}