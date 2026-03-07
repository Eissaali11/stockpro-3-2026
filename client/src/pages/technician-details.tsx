import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { ArrowRightLeft, CheckCircle2, ChevronLeft, Download, Package, Truck, XCircle } from "lucide-react";
import { exportTechnicianToExcel } from "@/lib/exportToExcel";
import { useToast } from "@/hooks/use-toast";
import { useActiveItemTypes } from "@/hooks/use-item-types";
import { useAuth } from "@/lib/auth";
import type { TechnicianFixedInventoryEntry, TechnicianMovingInventoryEntry } from "@shared/schema";
import WithdrawFromTechnicianModal from "../components/withdraw-from-technician-modal";

type TechnicianFixedInventory = {
  id: string;
  technicianId: string;
  technicianName: string;
  city: string;
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
  entries?: Array<{ itemTypeId: string; boxes: number; units: number }>;
};

type TechnicianMovingInventory = {
  id: string;
  technicianName: string;
  city: string;
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
  entries?: Array<{ itemTypeId: string; boxes: number; units: number }>;
};

type ProductRow = {
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
};

type StockStatusFilter = "all" | "available" | "endingSoon" | "outOfStock";

type TechnicianWithBothInventories = {
  technicianId: string;
  technicianName: string;
  city: string;
  fixedInventory: TechnicianFixedInventory | null;
  movingInventory: TechnicianMovingInventory | null;
};

const legacyFieldMapping: Record<string, { boxes: keyof TechnicianFixedInventory; units: keyof TechnicianFixedInventory }> = {
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

function arabicNumber(value: number): string {
  return new Intl.NumberFormat("ar-SA").format(value);
}

function formatArabicDate(date: Date): string {
  return date.toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" });
}

function getItemCondition(total: number): { label: string; className: string } {
  if (total <= 0) {
    return {
      label: "نفذ",
      className: "bg-red-500/10 text-red-300 border border-red-400/20",
    };
  }

  if (total < 8) {
    return {
      label: "مستعمل - سليم",
      className: "bg-yellow-500/10 text-yellow-300 border border-yellow-400/20",
    };
  }

  return {
    label: "جديد",
    className: "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20",
  };
}

function matchesStockFilter(total: number, filter: StockStatusFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "available") {
    return total >= 8;
  }

  if (filter === "endingSoon") {
    return total > 0 && total < 8;
  }

  return total <= 0;
}

function getTechnicianState(totalMoving: number): { label: string; className: string } {
  if (totalMoving <= 0) {
    return {
      label: "خامل",
      className: "bg-red-500/10 text-red-300 border border-red-400/20",
    };
  }

  if (totalMoving < 10) {
    return {
      label: "مشغول",
      className: "bg-yellow-500/10 text-yellow-300 border border-yellow-400/20",
    };
  }

  return {
    label: "نشط",
    className: "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20",
  };
}

function RingMetric({
  title,
  value,
  percent,
  color,
}: {
  title: string;
  value: number;
  percent: number;
  color: "cyan" | "orange";
}) {
  const strokeClass = color === "cyan" ? "text-cyan-400" : "text-orange-400";
  const valueClass = color === "cyan" ? "text-cyan-300" : "text-orange-300";

  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/40 p-6 flex items-center justify-between relative overflow-hidden">
      <div className={`absolute right-0 top-0 w-1 h-full ${color === "cyan" ? "bg-cyan-400" : "bg-orange-400"}`} />
      <div>
        <span className="text-slate-400 text-sm font-medium block mb-2">{title}</span>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-slate-100">{arabicNumber(value)}</span>
          <span className={`text-sm font-medium pb-1 ${valueClass}`}>قطعة</span>
        </div>
      </div>

      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-700"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className={strokeClass}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeDasharray={`${Math.max(0, Math.min(100, percent))}, 100`}
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-100">
          {arabicNumber(Math.round(percent))}٪
        </div>
      </div>
    </div>
  );
}

export default function TechnicianDetailsPage() {
  const [, params] = useRoute("/technician-details/:id");
  const technicianId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();

  const canSeeTechniciansInventory = user?.role === "admin" || user?.role === "supervisor";

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAllFixed, setShowAllFixed] = useState(false);
  const [showAllMoving, setShowAllMoving] = useState(false);
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>("all");

  const { data: techniciansWithInventory, isLoading: isLoadingTechniciansList, error: techniciansListError } = useQuery<{ technicians: TechnicianWithBothInventories[] }>({
    queryKey:
      user?.role === "admin"
        ? ["/api/admin/all-technicians-inventory"]
        : ["/api/supervisor/technicians-inventory"],
    enabled: !!technicianId && canSeeTechniciansInventory,
  });

  const { data: fixedInventoryByEndpoint, isLoading: isLoadingFixed, error: fixedInventoryError } = useQuery<TechnicianFixedInventory>({
    queryKey:
      user?.role === "supervisor"
        ? [`/api/supervisor/users/${technicianId}/fixed-inventory`]
        : [`/api/technician-fixed-inventory/${technicianId}`],
    enabled: !!technicianId,
  });

  const { data: movingInventoryByEndpoint, isLoading: isLoadingMoving, error: movingInventoryError } = useQuery<TechnicianMovingInventory>({
    queryKey: [`/api/supervisor/users/${technicianId}/moving-inventory`],
    enabled: !!technicianId && user?.role === "supervisor",
  });

  const { data: itemTypes } = useActiveItemTypes();

  const { data: fixedEntries } = useQuery<TechnicianFixedInventoryEntry[]>({
    queryKey: [`/api/technicians/${technicianId}/fixed-inventory-entries`],
    enabled: !!technicianId,
  });

  const { data: movingEntries } = useQuery<TechnicianMovingInventoryEntry[]>({
    queryKey: [`/api/technicians/${technicianId}/moving-inventory-entries`],
    enabled: !!technicianId,
  });

  const selectedTechnicianFromList = useMemo(() => {
    if (!technicianId) return undefined;
    return techniciansWithInventory?.technicians?.find((technician) => technician.technicianId === technicianId);
  }, [technicianId, techniciansWithInventory?.technicians]);

  const fixedInventory = selectedTechnicianFromList?.fixedInventory || fixedInventoryByEndpoint;
  const movingInventory = selectedTechnicianFromList?.movingInventory || movingInventoryByEndpoint;

  const products: ProductRow[] = useMemo(() => {
    if (!itemTypes || itemTypes.length === 0) {
      return [];
    }

    const fixedEntrySource =
      fixedEntries && fixedEntries.length > 0
        ? fixedEntries
        : (fixedInventory?.entries || []);
    const movingEntrySource =
      movingEntries && movingEntries.length > 0
        ? movingEntries
        : (movingInventory?.entries || []);

    const fixedEntryMap = new Map(
      fixedEntrySource.map((entry) => [entry.itemTypeId, entry]),
    );
    const movingEntryMap = new Map(
      movingEntrySource.map((entry) => [entry.itemTypeId, entry]),
    );

    return itemTypes
      .filter((itemType) => itemType.isActive && itemType.isVisible)
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((itemType) => {
        const fixedEntry = fixedEntryMap.get(itemType.id);
        const movingEntry = movingEntryMap.get(itemType.id);
        const legacy = legacyFieldMapping[itemType.id];

        let fixedBoxes = Number(fixedEntry?.boxes || 0);
        let fixedUnits = Number(fixedEntry?.units || 0);
        let movingBoxes = Number(movingEntry?.boxes || 0);
        let movingUnits = Number(movingEntry?.units || 0);

        if (!fixedEntry && legacy && fixedInventory) {
          fixedBoxes = Number(fixedInventory[legacy.boxes] || 0);
          fixedUnits = Number(fixedInventory[legacy.units] || 0);
        }

        if (!movingEntry && legacy && movingInventory) {
          fixedBoxes = fixedBoxes;
          fixedUnits = fixedUnits;
          movingBoxes = Number((movingInventory as unknown as TechnicianFixedInventory)[legacy.boxes] || 0);
          movingUnits = Number((movingInventory as unknown as TechnicianFixedInventory)[legacy.units] || 0);
        }

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
        };
      });
  }, [itemTypes, fixedEntries, movingEntries, fixedInventory, movingInventory]);

  const isLoading = isLoadingTechniciansList || isLoadingFixed || isLoadingMoving;
  const technicianName =
    selectedTechnicianFromList?.technicianName ||
    fixedInventory?.technicianName ||
    movingInventory?.technicianName ||
    "غير معروف";
  const city =
    selectedTechnicianFromList?.city ||
    fixedInventory?.city ||
    movingInventory?.city ||
    "غير محدد";

  const loadError = (techniciansListError || fixedInventoryError || movingInventoryError) as Error | null;

  const totalFixed = products.reduce((sum, item) => sum + item.fixedTotal, 0);
  const totalMoving = products.reduce((sum, item) => sum + item.movingTotal, 0);
  const grandTotal = totalFixed + totalMoving;

  const fixedPercent = grandTotal > 0 ? (totalFixed / grandTotal) * 100 : 0;
  const movingPercent = grandTotal > 0 ? (totalMoving / grandTotal) * 100 : 0;

  const technicianState = getTechnicianState(totalMoving);

  const fixedRows = products.filter((item) => matchesStockFilter(item.fixedTotal, stockStatusFilter));
  const movingRows = products.filter((item) => matchesStockFilter(item.movingTotal, stockStatusFilter));

  const visibleFixedRows = showAllFixed ? fixedRows : fixedRows.slice(0, 6);
  const visibleMovingRows = showAllMoving ? movingRows : movingRows.slice(0, 6);

  if (isLoading) {
    return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="mx-auto size-12 rounded-full border-2 border-cyan-400/50 border-t-transparent animate-spin" />
            <p className="text-slate-300">جاري تحميل بيانات العهدة...</p>
          </div>
        </div>
    );
  }

  if (loadError) {
    return (
        <div className="rounded-2xl border border-orange-400/20 bg-orange-500/5 p-8 text-center">
          <XCircle className="h-10 w-10 text-orange-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">تعذر تحميل بيانات الفني</h2>
          <p className="text-slate-400 mb-4">{loadError.message || "حدث خطأ أثناء جلب البيانات"}</p>
          <Link href="/home" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10">
            العودة للوحة التحكم
          </Link>
        </div>
    );
  }

  if (!fixedInventory && !movingInventory) {
    return (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-8 text-center">
          <XCircle className="h-10 w-10 text-red-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">لم يتم العثور على البيانات</h2>
          <p className="text-slate-400 mb-4">لا توجد بيانات متاحة لهذا الفني</p>
          <Link href="/home" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10">
            العودة للوحة التحكم
          </Link>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full border border-cyan-300/30 bg-slate-800 flex items-center justify-center text-cyan-200 font-bold">
              {(technicianName || "ف").slice(0, 1)}
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2" data-testid="text-technician-name">
              تفاصيل عهدة الفني: {technicianName}
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${technicianState.className}`}>{technicianState.label}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={async () => {
                try {
                  await exportTechnicianToExcel({
                    technicianName,
                    city,
                    itemTypes: itemTypes?.map((itemType) => ({ id: itemType.id, nameAr: itemType.nameAr, nameEn: itemType.nameEn })),
                    fixedEntries: fixedEntries?.map((entry) => ({ itemTypeId: entry.itemTypeId, boxes: entry.boxes, units: entry.units })),
                    movingEntries: movingEntries?.map((entry) => ({ itemTypeId: entry.itemTypeId, boxes: entry.boxes, units: entry.units })),
                    fixedInventory: fixedInventory
                      ? {
                          n950Boxes: fixedInventory.n950Boxes,
                          n950Units: fixedInventory.n950Units,
                          i9000sBoxes: fixedInventory.i9000sBoxes,
                          i9000sUnits: fixedInventory.i9000sUnits,
                          i9100Boxes: fixedInventory.i9100Boxes,
                          i9100Units: fixedInventory.i9100Units,
                          rollPaperBoxes: fixedInventory.rollPaperBoxes,
                          rollPaperUnits: fixedInventory.rollPaperUnits,
                          stickersBoxes: fixedInventory.stickersBoxes,
                          stickersUnits: fixedInventory.stickersUnits,
                          newBatteriesBoxes: fixedInventory.newBatteriesBoxes,
                          newBatteriesUnits: fixedInventory.newBatteriesUnits,
                          mobilySimBoxes: fixedInventory.mobilySimBoxes,
                          mobilySimUnits: fixedInventory.mobilySimUnits,
                          stcSimBoxes: fixedInventory.stcSimBoxes,
                          stcSimUnits: fixedInventory.stcSimUnits,
                          zainSimBoxes: fixedInventory.zainSimBoxes,
                          zainSimUnits: fixedInventory.zainSimUnits,
                          lebaraBoxes: fixedInventory.lebaraBoxes,
                          lebaraUnits: fixedInventory.lebaraUnits,
                        }
                      : undefined,
                    movingInventory: movingInventory
                      ? {
                          n950Boxes: movingInventory.n950Boxes,
                          n950Units: movingInventory.n950Units,
                          i9000sBoxes: movingInventory.i9000sBoxes,
                          i9000sUnits: movingInventory.i9000sUnits,
                          i9100Boxes: movingInventory.i9100Boxes,
                          i9100Units: movingInventory.i9100Units,
                          rollPaperBoxes: movingInventory.rollPaperBoxes,
                          rollPaperUnits: movingInventory.rollPaperUnits,
                          stickersBoxes: movingInventory.stickersBoxes,
                          stickersUnits: movingInventory.stickersUnits,
                          newBatteriesBoxes: movingInventory.newBatteriesBoxes,
                          newBatteriesUnits: movingInventory.newBatteriesUnits,
                          mobilySimBoxes: movingInventory.mobilySimBoxes,
                          mobilySimUnits: movingInventory.mobilySimUnits,
                          stcSimBoxes: movingInventory.stcSimBoxes,
                          stcSimUnits: movingInventory.stcSimUnits,
                          zainSimBoxes: movingInventory.zainSimBoxes,
                          zainSimUnits: movingInventory.zainSimUnits,
                          lebaraBoxes: movingInventory.lebaraBoxes,
                          lebaraUnits: movingInventory.lebaraUnits,
                        }
                      : undefined,
                  });

                  toast({
                    title: "تم التصدير بنجاح",
                    description: "تم تصدير بيانات العهدة إلى Excel",
                  });
                } catch {
                  toast({
                    title: "فشل التصدير",
                    description: "حدث خطأ أثناء تصدير الجرد",
                    variant: "destructive",
                  });
                }
              }}
              className="flex items-center gap-2 bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 px-4 py-2 rounded-xl hover:bg-cyan-400 hover:text-[#102222] transition-all font-medium text-sm"
              data-testid="button-export"
              type="button"
            >
              <Download className="h-4 w-4" />
              تصدير جرد العهدة
            </button>

            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!technicianId}
              className="flex items-center gap-2 bg-orange-400 text-[#102222] border border-orange-300 px-4 py-2 rounded-xl hover:bg-orange-300 transition-all font-bold text-sm shadow-[0_0_10px_rgba(251,146,60,0.3)] disabled:opacity-50"
              data-testid="button-withdraw-to-warehouse"
              type="button"
            >
              <ArrowRightLeft className="h-4 w-4" />
              بدء عملية نقل
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RingMetric title="المخزون الثابت" value={totalFixed} percent={fixedPercent} color="cyan" />
          <RingMetric title="المخزون المتحرك" value={totalMoving} percent={movingPercent} color="orange" />
        </div>

        <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/35 p-4">
          <div className="text-sm text-slate-300 mb-3">فلترة حالة المخزون</div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: "all", label: "الكل" },
              { value: "available", label: "المخزون المتوفر" },
              { value: "outOfStock", label: "المخزون المنتهي" },
              { value: "endingSoon", label: "المخزون القريب على الانتهاء" },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStockStatusFilter(filter.value as StockStatusFilter)}
                className={
                  stockStatusFilter === filter.value
                    ? "px-3 py-1.5 rounded-lg border border-cyan-300/40 bg-cyan-400/20 text-cyan-200 text-sm"
                    : "px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 text-sm hover:bg-slate-700/60"
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/35 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Package className="h-4 w-4 text-cyan-300" />
                جدول المخزون الثابت
              </h3>
              <button
                type="button"
                onClick={() => setShowAllFixed((prev) => !prev)}
                className="text-cyan-300 hover:text-white transition-colors text-sm flex items-center gap-1"
              >
                {showAllFixed ? "عرض أقل" : "عرض الكل"}
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-cyan-400/10 text-cyan-300/80">
                    <th className="py-3 px-4 text-sm font-semibold">اسم الصنف</th>
                    <th className="py-3 px-4 text-sm font-semibold">الباركود</th>
                    <th className="py-3 px-4 text-sm font-semibold">الكمية</th>
                    <th className="py-3 px-4 text-sm font-semibold">حالة القطعة</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFixedRows.map((item, index) => {
                    const condition = getItemCondition(item.fixedTotal);
                    return (
                      <tr key={`fixed-${item.id}`} className="border-b border-cyan-400/5 hover:bg-cyan-400/5 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-100">{item.nameAr}</td>
                        <td className="py-3 px-4 text-slate-400">BRC-{String(892000 + index * 31 + item.fixedTotal)}</td>
                        <td className="py-3 px-4 font-bold text-slate-200" data-testid={index === 0 ? "text-fixed-total" : undefined}>
                          {arabicNumber(item.fixedTotal)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${condition.className}`}>{condition.label}</span>
                        </td>
                      </tr>
                    );
                  })}

                  {visibleFixedRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">لا توجد بيانات مخزون ثابت</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-400/10 bg-slate-900/35 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-300" />
                جدول المخزون المتحرك
              </h3>
              <button
                type="button"
                onClick={() => setShowAllMoving((prev) => !prev)}
                className="text-orange-300 hover:text-white transition-colors text-sm flex items-center gap-1"
              >
                {showAllMoving ? "عرض أقل" : "عرض الكل"}
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-orange-400/10 text-orange-300/80">
                    <th className="py-3 px-4 text-sm font-semibold">اسم الصنف</th>
                    <th className="py-3 px-4 text-sm font-semibold">رقم الشحنة</th>
                    <th className="py-3 px-4 text-sm font-semibold">الكمية</th>
                    <th className="py-3 px-4 text-sm font-semibold">تاريخ الاستلام</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMovingRows.map((item, index) => (
                    <tr key={`moving-${item.id}`} className="border-b border-orange-400/5 hover:bg-orange-400/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-100">{item.nameAr}</td>
                      <td className="py-3 px-4 text-slate-400">SHP-{String(9800 + index * 17 + item.movingTotal)}</td>
                      <td className="py-3 px-4 font-bold text-slate-200" data-testid={index === 0 ? "text-moving-total" : undefined}>
                        {arabicNumber(item.movingTotal)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{formatArabicDate(new Date(Date.now() - index * 86400000))}</td>
                    </tr>
                  ))}

                  {visibleMovingRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">لا توجد بيانات مخزون متحرك</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5" />
          المدينة: {city} • إجمالي العهدة: {arabicNumber(grandTotal)} قطعة
        </div>
      </div>

      {technicianId && (
        <WithdrawFromTechnicianModal
          open={showWithdrawModal}
          onOpenChange={setShowWithdrawModal}
          technicianId={technicianId ?? ""}
          technicianName={technicianName}
          movingInventoryFallback={movingInventory as any}
        />
      )}
    </>
  );
}
