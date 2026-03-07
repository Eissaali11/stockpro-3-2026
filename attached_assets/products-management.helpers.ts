import { getInventoryValueForItemType } from "@/hooks/use-item-types";
import type {
  ProductDistributionRow,
  ProductItemType,
  ProductScanRecord,
  StorageBreakdownRow,
  StorageBucketType,
  TechnicianProductSource,
  WarehouseProductSource,
} from "../types";

type QuantityOverrides = {
  warehouseByItem: Record<string, number>;
  technicianByItem: Record<string, number>;
};

export function resolveItemByScanValue(itemTypes: ProductItemType[], rawValue: string): ProductItemType | null {
  const scanned = rawValue.trim().toLowerCase();
  if (!scanned) return null;

  const direct = itemTypes.find((itemType) => {
    const tokens = [
      itemType.id,
      itemType.nameAr,
      itemType.nameEn,
      itemType.sku || "",
      itemType.barcode || "",
    ].map((value) => String(value || "").trim().toLowerCase());

    return tokens.some((value) => value && (value === scanned || value.includes(scanned)));
  });

  return direct || null;
}

export function computeWarehouseItemQuantity(warehouse: WarehouseProductSource, itemTypeId: string): number {
  if (!warehouse.inventory) return 0;
  const boxes = getInventoryValueForItemType(itemTypeId, warehouse.inventory.entries, warehouse.inventory as any, "boxes");
  const units = getInventoryValueForItemType(itemTypeId, warehouse.inventory.entries, warehouse.inventory as any, "units");
  return Number(boxes || 0) + Number(units || 0);
}

export function computeTechnicianItemQuantity(technician: TechnicianProductSource, itemTypeId: string): number {
  const fixedBoxes = getInventoryValueForItemType(itemTypeId, technician.fixedInventory?.entries, technician.fixedInventory as any, "boxes");
  const fixedUnits = getInventoryValueForItemType(itemTypeId, technician.fixedInventory?.entries, technician.fixedInventory as any, "units");
  const movingBoxes = getInventoryValueForItemType(itemTypeId, technician.movingInventory?.entries, technician.movingInventory as any, "boxes");
  const movingUnits = getInventoryValueForItemType(itemTypeId, technician.movingInventory?.entries, technician.movingInventory as any, "units");

  return (
    Number(fixedBoxes || 0) +
    Number(fixedUnits || 0) +
    Number(movingBoxes || 0) +
    Number(movingUnits || 0)
  );
}

function buildTrendPoints(itemTypeId: string, scans: ProductScanRecord[]): number[] {
  const now = new Date();
  const days = [...Array(7)].map((_, idx) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - idx));
    return date.toISOString().slice(0, 10);
  });

  return days.map((day) =>
    scans
      .filter((scan) => scan.itemTypeId === itemTypeId && scan.createdAt.slice(0, 10) === day)
      .reduce((sum, scan) => sum + Number(scan.quantity || 0), 0),
  );
}

export function buildProductDistributionRows(args: {
  itemTypes: ProductItemType[];
  warehouses: WarehouseProductSource[];
  technicians: TechnicianProductSource[];
  scans: ProductScanRecord[];
  overrides: QuantityOverrides;
}): ProductDistributionRow[] {
  const { itemTypes, warehouses, technicians, scans, overrides } = args;

  return itemTypes
    .filter((itemType) => itemType.isActive && itemType.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((itemType) => {
      const warehouseQtyBase = warehouses.reduce(
        (sum, warehouse) => sum + computeWarehouseItemQuantity(warehouse, itemType.id),
        0,
      );
      const technicianQtyBase = technicians.reduce(
        (sum, technician) => sum + computeTechnicianItemQuantity(technician, itemType.id),
        0,
      );

      const warehouseQty = warehouseQtyBase + Number(overrides.warehouseByItem[itemType.id] || 0);
      const technicianQty = technicianQtyBase + Number(overrides.technicianByItem[itemType.id] || 0);
      const totalQty = warehouseQty + technicianQty;

      return {
        itemTypeId: itemType.id,
        nameAr: itemType.nameAr,
        nameEn: itemType.nameEn,
        sku: itemType.sku || itemType.id,
        warehouseQty,
        technicianQty,
        totalQty,
        trendPoints: buildTrendPoints(itemType.id, scans),
      };
    });
}

export function buildWarehouseBreakdown(
  warehouses: WarehouseProductSource[],
  itemTypeId: string,
): StorageBreakdownRow[] {
  return warehouses
    .map((warehouse) => ({
      id: warehouse.id,
      label: warehouse.name,
      quantity: computeWarehouseItemQuantity(warehouse, itemTypeId),
    }))
    .filter((entry) => entry.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);
}

export function buildTechnicianBreakdown(
  technicians: TechnicianProductSource[],
  itemTypeId: string,
): StorageBreakdownRow[] {
  return technicians
    .map((technician) => ({
      id: technician.technicianId,
      label: technician.technicianName,
      quantity: computeTechnicianItemQuantity(technician, itemTypeId),
    }))
    .filter((entry) => entry.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);
}

export function toStorageOverrideBucket(storageType: StorageBucketType): "warehouseByItem" | "technicianByItem" {
  return storageType === "warehouse" ? "warehouseByItem" : "technicianByItem";
}

export function exportProductsCsv(rows: ProductDistributionRow[]): void {
  const header = ["المنتج", "SKU", "المستودعات الرئيسية", "بعهد الفنيين", "الإجمالي"];
  const lines = rows.map((row) => [
    row.nameAr,
    row.sku,
    String(row.warehouseQty),
    String(row.technicianQty),
    String(row.totalQty),
  ]);

  const csv = [header, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `products-distribution-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
