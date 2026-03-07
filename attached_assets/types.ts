export type StorageBucketType = "warehouse" | "technician";

export interface ProductItemType {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  isVisible: boolean;
  unitsPerBox?: number | null;
  sku?: string | null;
  barcode?: string | null;
}

export interface InventoryEntryLike {
  itemTypeId: string;
  boxes: number;
  units: number;
}

export interface WarehouseInventoryLike {
  entries?: InventoryEntryLike[];
  [key: string]: unknown;
}

export interface WarehouseProductSource {
  id: string;
  name: string;
  inventory?: WarehouseInventoryLike | null;
}

export interface TechnicianInventoryLike {
  entries?: InventoryEntryLike[];
  [key: string]: unknown;
}

export interface TechnicianProductSource {
  technicianId: string;
  technicianName: string;
  fixedInventory?: TechnicianInventoryLike | null;
  movingInventory?: TechnicianInventoryLike | null;
}

export interface ProductDistributionRow {
  itemTypeId: string;
  nameAr: string;
  nameEn: string;
  sku: string;
  warehouseQty: number;
  technicianQty: number;
  totalQty: number;
  trendPoints: number[];
}

export interface StorageBreakdownRow {
  id: string;
  label: string;
  quantity: number;
}

export interface ProductScanRecord {
  id: string;
  itemTypeId: string;
  itemNameAr: string;
  scannedValue: string;
  storageType: StorageBucketType;
  storageId: string;
  storageName: string;
  quantity: number;
  createdAt: string;
}
