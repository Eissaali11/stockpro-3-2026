import { getDatabase } from '../infrastructure/database/connection';
import { itemTypes } from '../infrastructure/schemas';
import type { ItemType, InsertItemType } from '../infrastructure/schemas';
import { and, eq, ne, sql } from 'drizzle-orm';

export async function getItemTypes(): Promise<ItemType[]> {
  const db = getDatabase();
  return await db.select().from(itemTypes).orderBy(itemTypes.sortOrder);
}

export async function getActiveItemTypes(): Promise<ItemType[]> {
  const db = getDatabase();
  return await db.select().from(itemTypes).where(and(eq(itemTypes.isActive, true), eq(itemTypes.isVisible, true))).orderBy(itemTypes.sortOrder);
}

export async function getItemTypeById(id: string): Promise<ItemType | undefined> {
  const db = getDatabase();
  const result = await db.select().from(itemTypes).where(eq(itemTypes.id, id));
  return result[0];
}

export async function createItemType(data: InsertItemType): Promise<ItemType> {
  const db = getDatabase();
  const normalizedData: InsertItemType = {
    ...data,
    nameAr: data.nameAr.trim(),
    nameEn: data.nameEn.trim(),
  };

  const [duplicateNameAr] = await db
    .select({ id: itemTypes.id })
    .from(itemTypes)
    .where(sql`lower(${itemTypes.nameAr}) = lower(${normalizedData.nameAr})`)
    .limit(1);

  if (duplicateNameAr) {
    throw new Error('Item type Arabic name already exists');
  }

  const [duplicateNameEn] = await db
    .select({ id: itemTypes.id })
    .from(itemTypes)
    .where(sql`lower(${itemTypes.nameEn}) = lower(${normalizedData.nameEn})`)
    .limit(1);

  if (duplicateNameEn) {
    throw new Error('Item type English name already exists');
  }

  const [itemType] = await db.insert(itemTypes).values(normalizedData).returning();
  return itemType;
}

export async function updateItemType(id: string, data: Partial<InsertItemType>): Promise<ItemType | undefined> {
  const db = getDatabase();
  const normalizedData: Partial<InsertItemType> = {
    ...data,
    ...(typeof data.nameAr === 'string' ? { nameAr: data.nameAr.trim() } : {}),
    ...(typeof data.nameEn === 'string' ? { nameEn: data.nameEn.trim() } : {}),
  };

  if (normalizedData.nameAr) {
    const [duplicateNameAr] = await db
      .select({ id: itemTypes.id })
      .from(itemTypes)
      .where(and(
        ne(itemTypes.id, id),
        sql`lower(${itemTypes.nameAr}) = lower(${normalizedData.nameAr})`
      ))
      .limit(1);

    if (duplicateNameAr) {
      throw new Error('Item type Arabic name already exists');
    }
  }

  if (normalizedData.nameEn) {
    const [duplicateNameEn] = await db
      .select({ id: itemTypes.id })
      .from(itemTypes)
      .where(and(
        ne(itemTypes.id, id),
        sql`lower(${itemTypes.nameEn}) = lower(${normalizedData.nameEn})`
      ))
      .limit(1);

    if (duplicateNameEn) {
      throw new Error('Item type English name already exists');
    }
  }

  const [updated] = await db.update(itemTypes).set({ ...normalizedData, updatedAt: new Date() }).where(eq(itemTypes.id, id)).returning();
  return updated;
}

export async function deleteItemType(id: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db.delete(itemTypes).where(eq(itemTypes.id, id));
  return (result.rowCount || 0) > 0;
}

export async function toggleItemTypeActive(id: string, isActive: boolean): Promise<ItemType | undefined> {
  const db = getDatabase();
  const [updated] = await db.update(itemTypes).set({ isActive, updatedAt: new Date() }).where(eq(itemTypes.id, id)).returning();
  return updated;
}

export async function toggleItemTypeVisibility(id: string, isVisible: boolean): Promise<ItemType | undefined> {
  const db = getDatabase();
  const [updated] = await db.update(itemTypes).set({ isVisible, updatedAt: new Date() }).where(eq(itemTypes.id, id)).returning();
  return updated;
}

export async function seedDefaultItemTypes(): Promise<void> {
  const db = getDatabase();
  const existingTypes = await db.select().from(itemTypes);
  if (existingTypes.length > 0) return;

  const defaultTypes: InsertItemType[] = [
    { id: 'n950', nameAr: 'N950', nameEn: 'N950', category: 'devices', unitsPerBox: 10, isActive: true, isVisible: true, sortOrder: 1 },
    { id: 'i9000s', nameAr: 'I9000S', nameEn: 'I9000S', category: 'devices', unitsPerBox: 10, isActive: true, isVisible: true, sortOrder: 2 },
    { id: 'i9100', nameAr: 'I9100', nameEn: 'I9100', category: 'devices', unitsPerBox: 10, isActive: true, isVisible: true, sortOrder: 3 },
    { id: 'rollPaper', nameAr: 'ورق الطباعة', nameEn: 'Roll Paper', category: 'papers', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 4 },
    { id: 'stickers', nameAr: 'الملصقات', nameEn: 'Stickers', category: 'papers', unitsPerBox: 100, isActive: true, isVisible: true, sortOrder: 5 },
    { id: 'newBatteries', nameAr: 'البطاريات الجديدة', nameEn: 'New Batteries', category: 'accessories', unitsPerBox: 20, isActive: true, isVisible: true, sortOrder: 6 },
    { id: 'mobilySim', nameAr: 'شريحة موبايلي', nameEn: 'Mobily SIM', category: 'sim', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 7 },
    { id: 'stcSim', nameAr: 'شريحة STC', nameEn: 'STC SIM', category: 'sim', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 8 },
    { id: 'zainSim', nameAr: 'شريحة زين', nameEn: 'Zain SIM', category: 'sim', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 9 },
    { id: 'lebaraSim', nameAr: 'شريحة ليبارا', nameEn: 'Lebara SIM', category: 'sim', unitsPerBox: 50, isActive: true, isVisible: true, sortOrder: 10 }
  ];

  await db.insert(itemTypes).values(defaultTypes);
}
