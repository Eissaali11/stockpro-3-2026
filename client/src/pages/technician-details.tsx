import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Handshake,
  MapPin,
  Search,
  TrendingDown,
  TrendingUp,
  Truck,
  XCircle,
} from "lucide-react";
import { exportTechnicianToExcel } from "@/lib/exportToExcel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useActiveItemTypes } from "@/hooks/use-item-types";
import type { TechnicianFixedInventoryEntry, TechnicianMovingInventoryEntry } from "@shared/schema";

interface TechnicianFixedInventory {
  id: string;
  technicianId: string;
  technicianName?: string;
  city?: string;
  n950Boxes: number;
  n950Units: number;
  i9000sBoxes: number;
  i9000sUnits: number;
  i9100Boxes: number;
  i9100Units: number;
  rollPaperBoxes: number;
  rollPaperUnits: number;
  stickersBoxes: number;
  stickersUnits: number;
  newBatteriesBoxes: number;
  newBatteriesUnits: number;
  mobilySimBoxes: number;
  mobilySimUnits: number;
  stcSimBoxes: number;
  stcSimUnits: number;
  zainSimBoxes: number;
  zainSimUnits: number;
  lebaraBoxes: number;
  lebaraUnits: number;
}

interface TechnicianMovingInventory {
  id: string;
  technicianName?: string;
  city?: string;
  n950Boxes: number;
  n950Units: number;
  i9000sBoxes: number;
  i9000sUnits: number;
  i9100Boxes: number;
  i9100Units: number;
  rollPaperBoxes: number;
  rollPaperUnits: number;
  stickersBoxes: number;
  stickersUnits: number;
  newBatteriesBoxes: number;
  newBatteriesUnits: number;
  mobilySimBoxes: number;
  mobilySimUnits: number;
  stcSimBoxes: number;
  stcSimUnits: number;
  zainSimBoxes: number;
  zainSimUnits: number;
  lebaraBoxes: number;
  lebaraUnits: number;
}

interface LegacyInventoryPayload {
  n950Boxes: number;
  n950Units: number;
  i9000sBoxes: number;
  i9000sUnits: number;
  i9100Boxes: number;
  i9100Units: number;
  rollPaperBoxes: number;
  rollPaperUnits: number;
  stickersBoxes: number;
  stickersUnits: number;
  newBatteriesBoxes: number;
  newBatteriesUnits: number;
  mobilySimBoxes: number;
  mobilySimUnits: number;
  stcSimBoxes: number;
  stcSimUnits: number;
  zainSimBoxes: number;
  zainSimUnits: number;
  lebaraBoxes: number;
  lebaraUnits: number;
}

interface ProductInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  fixedBoxes: number;
  fixedUnits: number;
  fixedTotal: number;
  movingBoxes: number;
  movingUnits: number;
  movingTotal: number;
  grandTotal: number;
  icon: any;
  color: string;
}

type InventoryEntryLike = {
  itemTypeId: string;
  boxes: number;
  units: number;
};

type TechnicianWithBothInventories = {
  technicianId: string;
  technicianName: string;
  city: string;
  fixedInventory: (Partial<TechnicianFixedInventory> & { entries?: InventoryEntryLike[] }) | null;
  movingInventory: (Partial<TechnicianMovingInventory> & { entries?: InventoryEntryLike[] }) | null;
};

type InventoryTab = "all" | "fixed" | "moving";

function arNumber(value: number): string {
  return new Intl.NumberFormat("ar-SA").format(value);
}

function toLegacyInventoryPayload(
  inventory?: Partial<LegacyInventoryPayload> | null,
): LegacyInventoryPayload {
  return {
    n950Boxes: inventory?.n950Boxes ?? 0,
    n950Units: inventory?.n950Units ?? 0,
    i9000sBoxes: inventory?.i9000sBoxes ?? 0,
    i9000sUnits: inventory?.i9000sUnits ?? 0,
    i9100Boxes: inventory?.i9100Boxes ?? 0,
    i9100Units: inventory?.i9100Units ?? 0,
    rollPaperBoxes: inventory?.rollPaperBoxes ?? 0,
    rollPaperUnits: inventory?.rollPaperUnits ?? 0,
    stickersBoxes: inventory?.stickersBoxes ?? 0,
    stickersUnits: inventory?.stickersUnits ?? 0,
    newBatteriesBoxes: inventory?.newBatteriesBoxes ?? 0,
    newBatteriesUnits: inventory?.newBatteriesUnits ?? 0,
    mobilySimBoxes: inventory?.mobilySimBoxes ?? 0,
    mobilySimUnits: inventory?.mobilySimUnits ?? 0,
    stcSimBoxes: inventory?.stcSimBoxes ?? 0,
    stcSimUnits: inventory?.stcSimUnits ?? 0,
    zainSimBoxes: inventory?.zainSimBoxes ?? 0,
    zainSimUnits: inventory?.zainSimUnits ?? 0,
    lebaraBoxes: inventory?.lebaraBoxes ?? 0,
    lebaraUnits: inventory?.lebaraUnits ?? 0,
  };
}

function getStockStatus(total: number): { label: string; className: string } {
  if (total <= 0) {
    return {
      label: "منخفض جداً",
      className: "bg-red-500/10 text-red-300 border border-red-400/30",
    };
  }

  if (total < 10) {
    return {
      label: "منخفض",
      className: "bg-yellow-500/10 text-yellow-300 border border-yellow-400/30",
    };
  }

  if (total < 40) {
    return {
      label: "نشط",
      className: "bg-blue-500/10 text-blue-300 border border-blue-400/30",
    };
  }

  return {
    label: "متوفر بكثرة",
    className: "bg-emerald-500/10 text-emerald-300 border border-emerald-400/30",
  };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export default function TechnicianDetailsPage() {
  const [, params] = useRoute("/technician-details/:id");
  const technicianId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const canSeeTechniciansInventory = user?.role === "admin" || user?.role === "supervisor";

  const [activeTab, setActiveTab] = useState<InventoryTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const {
    data: techniciansWithInventory,
    isLoading: isLoadingTechniciansInventory,
  } = useQuery<{ technicians: TechnicianWithBothInventories[] }>({
    queryKey:
      user?.role === "admin"
        ? ["/api/admin/all-technicians-inventory"]
        : ["/api/supervisor/technicians-inventory"],
    enabled: !!technicianId && canSeeTechniciansInventory,
  });

  const { data: fixedInventory, isLoading: isLoadingFixed } = useQuery<TechnicianFixedInventory>({
    queryKey: [`/api/technician-fixed-inventory/${technicianId}`],
    enabled: !!technicianId,
  });

  const { data: movingInventory, isLoading: isLoadingMoving } = useQuery<TechnicianMovingInventory>({
    queryKey: [`/api/supervisor/users/${technicianId}/moving-inventory`],
    enabled: !!technicianId && user?.role === "supervisor",
  });

  const { data: technicianProfile, isLoading: isLoadingProfile } = useQuery<{
    id: string;
    fullName?: string;
    city?: string;
  }>({
    queryKey: [`/api/technicians/${technicianId}`],
    enabled: !!technicianId,
  });

  const { data: itemTypes } = useActiveItemTypes();

  const { data: fixedEntries, isLoading: isLoadingFixedEntries } = useQuery<TechnicianFixedInventoryEntry[]>({
    queryKey: [`/api/technicians/${technicianId}/fixed-inventory-entries`],
    enabled: !!technicianId,
  });

  const { data: movingEntries, isLoading: isLoadingMovingEntries } = useQuery<TechnicianMovingInventoryEntry[]>({
    queryKey: [`/api/technicians/${technicianId}/moving-inventory-entries`],
    enabled: !!technicianId,
  });

  const isLoading =
    isLoadingTechniciansInventory ||
    isLoadingFixed ||
    isLoadingMoving ||
    isLoadingProfile ||
    isLoadingFixedEntries ||
    isLoadingMovingEntries;

  const selectedTechnician = useMemo(() => {
    if (!technicianId) {
      return null;
    }

    return (
      techniciansWithInventory?.technicians?.find((technician) => technician.technicianId === technicianId) || null
    );
  }, [techniciansWithInventory?.technicians, technicianId]);

  const effectiveFixedInventory = selectedTechnician?.fixedInventory || fixedInventory;
  const effectiveMovingInventory = selectedTechnician?.movingInventory || movingInventory;

  const technicianName =
    selectedTechnician?.technicianName ||
    technicianProfile?.fullName ||
    effectiveFixedInventory?.technicianName ||
    effectiveMovingInventory?.technicianName ||
    "غير معروف";

  const city = selectedTechnician?.city || effectiveFixedInventory?.city || effectiveMovingInventory?.city || technicianProfile?.city || "غير محدد";

  const legacyFieldMapping: Record<string, { boxes: string; units: string }> = {
    n950: { boxes: "n950Boxes", units: "n950Units" },
    i9000s: { boxes: "i9000sBoxes", units: "i9000sUnits" },
    i9100: { boxes: "i9100Boxes", units: "i9100Units" },
    rollPaper: { boxes: "rollPaperBoxes", units: "rollPaperUnits" },
    stickers: { boxes: "stickersBoxes", units: "stickersUnits" },
    newBatteries: { boxes: "newBatteriesBoxes", units: "newBatteriesUnits" },
    mobilySim: { boxes: "mobilySimBoxes", units: "mobilySimUnits" },
    stcSim: { boxes: "stcSimBoxes", units: "stcSimUnits" },
    zainSim: { boxes: "zainSimBoxes", units: "zainSimUnits" },
    lebaraSim: { boxes: "lebaraBoxes", units: "lebaraUnits" },
  };

  const categoryIconMap: Record<string, any> = {
    devices: Truck,
    papers: Boxes,
    accessories: AlertTriangle,
    sim: Handshake,
    other: Boxes,
  };

  const categoryColorMap: Record<string, string[]> = {
    devices: ["#3b82f6", "#8b5cf6", "#ec4899", "#6366f1"],
    papers: ["#f59e0b", "#14b8a6"],
    accessories: ["#10b981", "#84cc16"],
    sim: ["#06b6d4", "#6366f1", "#f97316", "#ec4899", "#8b5cf6"],
    other: ["#6b7280"],
  };

  const products: ProductInfo[] = useMemo(() => {
    if (!itemTypes || itemTypes.length === 0) {
      return [];
    }

    const fixedEntryMap = new Map((fixedEntries || []).map((entry) => [entry.itemTypeId, entry]));
    const movingEntryMap = new Map((movingEntries || []).map((entry) => [entry.itemTypeId, entry]));

    return itemTypes
      .filter((itemType) => itemType.isActive && itemType.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((itemType, index) => {
        const fixedEntry = fixedEntryMap.get(itemType.id);
        const movingEntry = movingEntryMap.get(itemType.id);
        const legacy = legacyFieldMapping[itemType.id];
        const preferSnapshot = Boolean(selectedTechnician);

        let fixedBoxes = 0;
        let fixedUnits = 0;
        let movingBoxes = 0;
        let movingUnits = 0;

        const fixedInventoryEntry = Array.isArray((effectiveFixedInventory as any)?.entries)
          ? ((effectiveFixedInventory as any).entries as InventoryEntryLike[]).find((entry) => entry.itemTypeId === itemType.id)
          : undefined;

        const movingInventoryEntry = Array.isArray((effectiveMovingInventory as any)?.entries)
          ? ((effectiveMovingInventory as any).entries as InventoryEntryLike[]).find((entry) => entry.itemTypeId === itemType.id)
          : undefined;

        if (preferSnapshot) {
          if (fixedInventoryEntry) {
            fixedBoxes = Number(fixedInventoryEntry.boxes || 0);
            fixedUnits = Number(fixedInventoryEntry.units || 0);
          } else if (legacy && effectiveFixedInventory) {
            fixedBoxes = Number((effectiveFixedInventory as any)[legacy.boxes] || 0);
            fixedUnits = Number((effectiveFixedInventory as any)[legacy.units] || 0);
          } else if (fixedEntry) {
            fixedBoxes = Number(fixedEntry.boxes || 0);
            fixedUnits = Number(fixedEntry.units || 0);
          }

          if (movingInventoryEntry) {
            movingBoxes = Number(movingInventoryEntry.boxes || 0);
            movingUnits = Number(movingInventoryEntry.units || 0);
          } else if (legacy && effectiveMovingInventory) {
            movingBoxes = Number((effectiveMovingInventory as any)[legacy.boxes] || 0);
            movingUnits = Number((effectiveMovingInventory as any)[legacy.units] || 0);
          } else if (movingEntry) {
            movingBoxes = Number(movingEntry.boxes || 0);
            movingUnits = Number(movingEntry.units || 0);
          }
        } else {
          if (fixedEntry) {
            fixedBoxes = Number(fixedEntry.boxes || 0);
            fixedUnits = Number(fixedEntry.units || 0);
          } else if (fixedInventoryEntry) {
            fixedBoxes = Number(fixedInventoryEntry.boxes || 0);
            fixedUnits = Number(fixedInventoryEntry.units || 0);
          } else if (legacy && effectiveFixedInventory) {
            fixedBoxes = Number((effectiveFixedInventory as any)[legacy.boxes] || 0);
            fixedUnits = Number((effectiveFixedInventory as any)[legacy.units] || 0);
          }

          if (movingEntry) {
            movingBoxes = Number(movingEntry.boxes || 0);
            movingUnits = Number(movingEntry.units || 0);
          } else if (movingInventoryEntry) {
            movingBoxes = Number(movingInventoryEntry.boxes || 0);
            movingUnits = Number(movingInventoryEntry.units || 0);
          } else if (legacy && effectiveMovingInventory) {
            movingBoxes = Number((effectiveMovingInventory as any)[legacy.boxes] || 0);
            movingUnits = Number((effectiveMovingInventory as any)[legacy.units] || 0);
          }
        }

        const colors = categoryColorMap[itemType.category] || categoryColorMap.other;

        return {
          id: itemType.id,
          nameAr: itemType.nameAr,
          nameEn: itemType.nameEn,
          fixedBoxes,
          fixedUnits,
          fixedTotal: fixedBoxes + fixedUnits,
          movingBoxes,
          movingUnits,
          movingTotal: movingBoxes + movingUnits,
          grandTotal: fixedBoxes + fixedUnits + movingBoxes + movingUnits,
          icon: categoryIconMap[itemType.category] || categoryIconMap.other,
          color: colors[index % colors.length],
        };
      });
  }, [itemTypes, effectiveFixedInventory, effectiveMovingInventory, fixedEntries, movingEntries, selectedTechnician]);

  const totalFixed = products.reduce((sum, product) => sum + product.fixedTotal, 0);
  const totalMoving = products.reduce((sum, product) => sum + product.movingTotal, 0);
  const grandTotal = totalFixed + totalMoving;

  const totalBoxes = products.reduce((sum, product) => sum + product.fixedBoxes + product.movingBoxes, 0);
  const movingBoxes = products.reduce((sum, product) => sum + product.movingBoxes, 0);

  const hasAnyData = Boolean(
    technicianProfile ||
      selectedTechnician ||
      effectiveFixedInventory ||
      effectiveMovingInventory ||
      (fixedEntries?.length ?? 0) > 0 ||
      (movingEntries?.length ?? 0) > 0,
  );

  const fixedShare = grandTotal > 0 ? (totalFixed / grandTotal) * 100 : 0;
  const movingShare = grandTotal > 0 ? (totalMoving / grandTotal) * 100 : 0;
  const movingBoxesShare = totalBoxes > 0 ? (movingBoxes / totalBoxes) * 100 : 0;

  const rowsByTab = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const buildRows = (tab: InventoryTab) => {
      return products
        .map((product) => {
          if (tab === "fixed") {
            return {
              ...product,
              boxes: product.fixedBoxes,
              units: product.fixedUnits,
              total: product.fixedTotal,
            };
          }

          if (tab === "moving") {
            return {
              ...product,
              boxes: product.movingBoxes,
              units: product.movingUnits,
              total: product.movingTotal,
            };
          }

          return {
            ...product,
            boxes: product.fixedBoxes + product.movingBoxes,
            units: product.fixedUnits + product.movingUnits,
            total: product.grandTotal,
          };
        })
        .filter((row) => {
          if (!search) return true;

          return (
            row.nameAr.toLowerCase().includes(search) ||
            row.nameEn.toLowerCase().includes(search)
          );
        });
    };

    return {
      all: buildRows("all"),
      fixed: buildRows("fixed"),
      moving: buildRows("moving"),
    };
  }, [products, searchTerm]);

  const activeRows = rowsByTab[activeTab];

  const expandedRow =
    activeRows.find((row) => row.id === expandedProductId) ||
    activeRows[0] ||
    null;

  const lowStockAlertsCount = products.filter((product) => product.grandTotal < 10).length;
  const inventoryAccuracy =
    products.length > 0 ? (products.filter((product) => product.grandTotal > 0).length / products.length) * 100 : 0;

  const movementBars = expandedRow
    ? [45, 62, 88, 73, 58, 95, 70].map((ratio) => Math.max(16, Math.round((expandedRow.total * ratio) / Math.max(expandedRow.total, 1))))
    : [40, 55, 80, 60, 48, 76, 52];

  const canTransferToWarehouse = user?.role === "admin" || user?.role === "supervisor";

  const handleExport = async () => {
    try {
      await exportTechnicianToExcel({
        technicianName,
        city,
        itemTypes: (itemTypes || []).map((itemType) => ({
          id: itemType.id,
          nameAr: itemType.nameAr,
          nameEn: itemType.nameEn,
        })),
        fixedEntries: fixedEntries || [],
        movingEntries: movingEntries || [],
        fixedInventory: toLegacyInventoryPayload(effectiveFixedInventory),
        movingInventory: toLegacyInventoryPayload(effectiveMovingInventory),
      });

      toast({
        title: "تم التصدير بنجاح",
        description: "تم إنشاء ملف Excel لبيانات المندوب",
      });
    } catch (error) {
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-[460px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-white/5 p-12 text-center">
        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">لم يتم العثور على البيانات</h2>
        <p className="text-slate-400 mb-6">لا توجد بيانات متاحة لهذا المندوب</p>
        <Link href="/home">
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للوحة التحكم
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-900/35 backdrop-blur-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">لوحة إدارة المخزون</h1>
          <p className="text-slate-400 mt-1">
            ملف المندوب: <span className="text-cyan-300 font-semibold">{technicianName}</span> · {city}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canTransferToWarehouse ? (
            <Link href="/operations">
              <Button className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold px-6">
                <Truck className="ml-2 h-4 w-4" />
                تحويل للمستودع
              </Button>
            </Link>
          ) : null}

          <Button
            onClick={handleExport}
            className="bg-slate-900/50 border border-slate-600/80 text-cyan-300 hover:bg-cyan-400/10"
            data-testid="button-export"
          >
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>

          <Link href="/home">
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
              <ArrowLeft className="ml-2 h-4 w-4" />
              رجوع
            </Button>
          </Link>

          <Button variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-800/60" disabled>
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/35 p-6 backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">إجمالي المخزون</p>
              <h3 className="text-3xl font-bold text-slate-100">{arNumber(grandTotal)}</h3>
            </div>
            <div className="size-11 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-300">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
            <div className="h-full bg-cyan-400" style={{ width: `${clampPercent(inventoryAccuracy)}%` }} />
          </div>
          <div className="mt-3 text-xs text-emerald-300 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            تغطية الأصناف {arNumber(Number(inventoryAccuracy.toFixed(1)))}%
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/35 p-6 backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">مخزون التسليم</p>
              <h3 className="text-3xl font-bold text-slate-100">{arNumber(totalBoxes)}</h3>
            </div>
            <div className="size-11 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-300">
              <Handshake className="h-5 w-5" />
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
            <div className="h-full bg-emerald-400" style={{ width: `${clampPercent(movingBoxesShare)}%` }} />
          </div>
          <div className="mt-3 text-xs text-emerald-300 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            المخزون المتحرك {arNumber(Number(movingBoxesShare.toFixed(1)))}%
          </div>
        </div>

        <div className="rounded-2xl border border-blue-400/20 bg-slate-900/35 p-6 backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">مخزون ثابت متبقي</p>
              <h3 className="text-3xl font-bold text-slate-100">{arNumber(totalFixed)}</h3>
            </div>
            <div className="size-11 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-300">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${clampPercent(fixedShare)}%` }} />
          </div>
          <div className="mt-3 text-xs text-blue-300 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            يمثل {arNumber(Number(fixedShare.toFixed(1)))}% من الإجمالي
          </div>
        </div>

        <div className="rounded-2xl border border-purple-400/20 bg-slate-900/35 p-6 backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">مخزون متنقل متبقي</p>
              <h3 className="text-3xl font-bold text-slate-100">{arNumber(totalMoving)}</h3>
            </div>
            <div className="size-11 rounded-full bg-purple-400/10 flex items-center justify-center text-purple-300">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
            <div className="h-full bg-purple-400" style={{ width: `${clampPercent(movingShare)}%` }} />
          </div>
          <div className="mt-3 text-xs text-purple-300 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            يمثل {arNumber(Number(movingShare.toFixed(1)))}% من الإجمالي
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/35 backdrop-blur-xl overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as InventoryTab)}
          className="w-full"
        >
          <div className="px-6 py-4 border-b border-slate-700/60 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <TabsList className="bg-slate-800/70 border border-slate-700/70">
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="fixed">ثابت</TabsTrigger>
              <TabsTrigger value="moving">متحرك</TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="بحث في المنتجات..."
                  className="pr-10 bg-slate-900/60 border-slate-700 text-slate-200"
                />
              </div>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Filter className="ml-2 h-4 w-4" />
                تصفية
              </Button>
            </div>
          </div>

          {["all", "fixed", "moving"].map((tabValue) => {
            const tab = tabValue as InventoryTab;
            const rows = rowsByTab[tab];

            return (
              <TabsContent value={tab} key={tab} className="m-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/60 border-slate-700/70 hover:bg-slate-800/60">
                        <TableHead className="text-right text-slate-300">اسم المنتج</TableHead>
                        <TableHead className="text-center text-slate-300">الكراتين</TableHead>
                        <TableHead className="text-center text-slate-300">الوحدات</TableHead>
                        <TableHead className="text-center text-slate-300">الإجمالي</TableHead>
                        <TableHead className="text-center text-slate-300">الحالة</TableHead>
                        <TableHead className="text-center text-slate-300">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow className="border-slate-700/60">
                          <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                            لا توجد نتائج مطابقة
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => {
                          const ItemIcon = row.icon;
                          const status = getStockStatus(row.total);

                          return (
                            <TableRow key={row.id} className="border-slate-700/50 hover:bg-cyan-400/5">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center" style={{ color: row.color }}>
                                    <ItemIcon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-100">{row.nameAr}</p>
                                    <p className="text-xs text-slate-400">{row.nameEn}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-slate-200">{arNumber(row.boxes)}</TableCell>
                              <TableCell className="text-center text-slate-200">{arNumber(row.units)}</TableCell>
                              <TableCell className="text-center font-bold text-slate-100">{arNumber(row.total)}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={status.className}>{status.label}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-700 text-slate-300 hover:text-cyan-300 hover:bg-cyan-400/10"
                                >
                                  <Link href={`/technician-details/${technicianId}/item/${row.id}`}>
                                    <span className="ml-1">التفاصيل</span>
                                    <ChevronLeft className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {expandedRow ? (
          <div className="border-t border-slate-700/60 bg-cyan-400/5 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="text-cyan-300 font-bold text-sm">تفاصيل التوزيع</h4>
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 text-sm">المخزون الثابت:</span>
                <span className="font-bold text-slate-100">{arNumber(expandedRow.fixedTotal)} وحدة</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 text-sm">المخزون المتحرك:</span>
                <span className="font-bold text-slate-100">{arNumber(expandedRow.movingTotal)} وحدة</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-cyan-300 font-bold text-sm">حركة الصنف (آخر 7 أيام)</h4>
              <div className="h-32 flex items-end gap-2 px-2 pb-2">
                {movementBars.map((value, index) => (
                  <div
                    key={`${expandedRow.id}-bar-${index}`}
                    className={`w-full rounded-t-sm ${index === 2 || index === 5 ? "bg-cyan-300" : "bg-cyan-400/35"}`}
                    style={{ height: `${clampPercent(value)}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-cyan-300 font-bold text-sm">إجراءات سريعة</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="text-xs border-slate-700 text-slate-200 hover:bg-cyan-500/10">طلب توريد</Button>
                <Button variant="outline" className="text-xs border-slate-700 text-slate-200 hover:bg-cyan-500/10">جرد يدوي</Button>
                <Button variant="outline" className="text-xs border-slate-700 text-slate-200 hover:bg-cyan-500/10">تعديل التنبيهات</Button>
                <Button variant="outline" className="text-xs border-slate-700 text-slate-200 hover:bg-cyan-500/10">عرض السجل</Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <footer className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/35 p-6 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h5 className="text-slate-400 text-sm mb-1">دقة المخزون الفعلي</h5>
            <p className="text-2xl font-bold text-slate-100">{arNumber(Number(inventoryAccuracy.toFixed(1)))}%</p>
          </div>
          <div className="size-16 rounded-full border-4 border-emerald-400 border-t-transparent flex items-center justify-center text-emerald-300 text-xs font-bold">
            {inventoryAccuracy >= 85 ? "عالية" : inventoryAccuracy >= 60 ? "جيدة" : "متوسطة"}
          </div>
        </div>

        <div className="rounded-2xl border border-red-400/20 bg-slate-900/35 p-6 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h5 className="text-slate-400 text-sm mb-1">تنبيهات انخفاض المخزون</h5>
            <p className="text-2xl font-bold text-red-300">{arNumber(lowStockAlertsCount)} أصناف</p>
          </div>
          <Button variant="outline" className="border-red-400/30 text-red-300 hover:bg-red-500/10">
            مراجعة الآن
          </Button>
        </div>
      </footer>
    </div>
  );
}

