import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  RefreshCw,
  Router,
  Search,
  Truck,
  Warehouse,
} from "lucide-react";
import { useActiveItemTypes } from "@/hooks/use-item-types";
import type { TechnicianFixedInventoryEntry, TechnicianMovingInventoryEntry } from "@shared/schema";

type ProductTab = "available" | "delivered";

type ReceivedDevice = {
  id: string;
  terminalId: string;
  serialNumber: string;
  itemTypeId: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  technicianId: string;
};

type WarehouseTransfer = {
  id: string;
  itemType: string;
  technicianId: string;
  status: string;
  createdAt: string;
};

type ProductOperationRow = {
  id: string;
  productName: string;
  serial: string;
  status: string;
  statusClass: string;
  datetime: string;
};

function createMockOperations(productName: string): ProductOperationRow[] {
  const now = Date.now();
  const inStockClass = "text-orange-400 bg-orange-500/10 border border-orange-500/20";
  const deliveredClass = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";

  return [
    {
      id: "mock-1",
      productName,
      serial: "SN-9382-AX11",
      status: "في المخزون",
      statusClass: inStockClass,
      datetime: formatDateTime(new Date(now - 1000 * 60 * 15).toISOString()),
    },
    {
      id: "mock-2",
      productName,
      serial: "SN-9382-AX12",
      status: "في المخزون",
      statusClass: inStockClass,
      datetime: formatDateTime(new Date(now - 1000 * 60 * 40).toISOString()),
    },
    {
      id: "mock-3",
      productName,
      serial: "SN-9382-AX13",
      status: "تم التسليم",
      statusClass: deliveredClass,
      datetime: formatDateTime(new Date(now - 1000 * 60 * 90).toISOString()),
    },
    {
      id: "mock-4",
      productName,
      serial: "SN-9382-AX14",
      status: "تم التسليم",
      statusClass: deliveredClass,
      datetime: formatDateTime(new Date(now - 1000 * 60 * 180).toISOString()),
    },
  ];
}

function arNumber(value: number): string {
  return new Intl.NumberFormat("ar-SA").format(value);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("ar-SA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalize(value?: string | null): string {
  return (value || "").trim().toLowerCase();
}

function statusUi(status: string): { text: string; className: string; delivered: boolean } {
  const normalized = normalize(status);

  if (normalized === "approved" || normalized === "accepted" || normalized === "completed") {
    return {
      text: "تم التسليم",
      className: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
      delivered: true,
    };
  }

  if (normalized === "rejected") {
    return {
      text: "مرفوض",
      className: "text-rose-400 bg-rose-500/10 border border-rose-500/20",
      delivered: false,
    };
  }

  if (normalized === "in-stock" || normalized === "available") {
    return {
      text: "في المخزون",
      className: "text-orange-400 bg-orange-500/10 border border-orange-500/20",
      delivered: false,
    };
  }

  return {
    text: "في المخزون",
    className: "text-orange-400 bg-orange-500/10 border border-orange-500/20",
    delivered: false,
  };
}

export default function TechnicianItemDetailsPage() {
  const [, params] = useRoute("/technician-details/:technicianId/item/:itemTypeId");
  const technicianId = params?.technicianId;
  const itemTypeId = params?.itemTypeId;

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<ProductTab>("available");

  const { data: technician } = useQuery<{ id: string; fullName: string; city?: string }>({
    queryKey: [`/api/technicians/${technicianId}`],
    enabled: !!technicianId,
  });

  const { data: itemTypes = [], isLoading: isLoadingItemTypes } = useActiveItemTypes();

  const { data: fixedEntries = [], isLoading: isLoadingFixed } = useQuery<TechnicianFixedInventoryEntry[]>({
    queryKey: [`/api/technicians/${technicianId}/fixed-inventory-entries`],
    enabled: !!technicianId,
  });

  const { data: movingEntries = [], isLoading: isLoadingMoving } = useQuery<TechnicianMovingInventoryEntry[]>({
    queryKey: [`/api/technicians/${technicianId}/moving-inventory-entries`],
    enabled: !!technicianId,
  });

  const { data: receivedDevices = [], isLoading: isLoadingReceived } = useQuery<ReceivedDevice[]>({
    queryKey: ["/api/received-devices"],
    enabled: !!technicianId,
  });

  const { data: warehouseTransfers = [] } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
    enabled: !!technicianId,
  });

  const isLoading = isLoadingItemTypes || isLoadingFixed || isLoadingMoving || isLoadingReceived;

  const itemType = useMemo(() => {
    return itemTypes.find((item) => item.id === itemTypeId);
  }, [itemTypeId, itemTypes]);

  const fixedEntry = fixedEntries.find((entry) => entry.itemTypeId === itemTypeId);
  const movingEntry = movingEntries.find((entry) => entry.itemTypeId === itemTypeId);

  const fixedTotal = Number(fixedEntry?.boxes || 0) + Number(fixedEntry?.units || 0);
  const movingTotal = Number(movingEntry?.boxes || 0) + Number(movingEntry?.units || 0);
  const totalStock = fixedTotal + movingTotal;

  const liveOperations = useMemo(() => {
    const productNameAr = itemType?.nameAr || "منتج";
    const productNameEn = itemType?.nameEn || "";

    const receivedRows: ProductOperationRow[] = receivedDevices
      .filter((device) => device.technicianId === technicianId)
      .filter((device) => {
        if (device.itemTypeId === itemTypeId) return true;
        if (!device.itemTypeId) {
          const source = normalize(device.terminalId);
          return source.includes(normalize(productNameAr)) || source.includes(normalize(productNameEn));
        }
        return false;
      })
      .map((device) => {
        const ui = statusUi(device.status);
        return {
          id: `rc-${device.id}`,
          productName: productNameAr,
          serial: device.serialNumber || "-",
          status: ui.text,
          statusClass: ui.className,
          datetime: formatDateTime(device.createdAt),
        };
      });

    const transferRows: ProductOperationRow[] = warehouseTransfers
      .filter((transfer) => transfer.technicianId === technicianId)
      .filter((transfer) => {
        const transferType = normalize(transfer.itemType);
        return transferType === normalize(itemTypeId) || transferType === normalize(productNameEn);
      })
      .map((transfer) => {
        const ui = statusUi(transfer.status);
        return {
          id: `tr-${transfer.id}`,
          productName: productNameAr,
          serial: "-",
          status: ui.text,
          statusClass: ui.className,
          datetime: formatDateTime(transfer.createdAt),
        };
      });

    const rows = [...receivedRows, ...transferRows];

    if (rows.length > 0) {
      return rows;
    }

    if (totalStock > 0) {
      return [
        {
          id: "summary-available",
          productName: productNameAr,
          serial: "-",
          status: "في المخزون",
          statusClass: "text-orange-400 bg-orange-500/10 border border-orange-500/20",
          datetime: formatDateTime(new Date().toISOString()),
        },
      ];
    }

    return [];
  }, [itemType, itemTypeId, movingTotal, receivedDevices, technicianId, totalStock, warehouseTransfers]);

  const hasLiveData = totalStock > 0 || liveOperations.length > 0;
  const useMockData = !hasLiveData;

  const fallbackItemName = itemType?.nameAr || "راوتر 5G";
  const productOperations = useMemo(() => {
    if (hasLiveData) return liveOperations;
    return createMockOperations(fallbackItemName);
  }, [fallbackItemName, hasLiveData, liveOperations]);

  const deliveredRows = productOperations.filter((row) => row.status === "تم التسليم");
  const availableRows = productOperations.filter((row) => row.status !== "تم التسليم");

  const shownRows = (tab === "available" ? availableRows : deliveredRows).filter((row) => {
    const term = normalize(search);
    if (!term) return true;

    return (
      normalize(row.productName).includes(term) ||
      normalize(row.serial).includes(term) ||
      normalize(row.status).includes(term)
    );
  });

  const deliveredCount = deliveredRows.length;
  const effectiveTotalStock = hasLiveData ? totalStock : 42;
  const urgentCount = effectiveTotalStock > 0 && effectiveTotalStock < 20 ? effectiveTotalStock : 0;
  const estimatedValue = effectiveTotalStock * 35;

  const displayTechnicianName = technician?.fullName || (useMockData ? "فني تجريبي" : "-");
  const displayItemName = itemType?.nameAr || (useMockData ? fallbackItemName : "غير معروف");

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [`/api/technicians/${technicianId}/fixed-inventory-entries`] }),
      queryClient.invalidateQueries({ queryKey: [`/api/technicians/${technicianId}/moving-inventory-entries`] }),
      queryClient.invalidateQueries({ queryKey: ["/api/received-devices"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/item-types/active"] }),
    ]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">عمليات المنتج</h2>
          <p className="text-slate-400 mt-1">عرض تفاصيل وحالة المنتج • {displayItemName}</p>
          <p className="text-xs text-cyan-300 mt-1">الفني: {displayTechnicianName}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={refreshData}
            variant="outline"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-400/10 text-cyan-300 border-cyan-400/20 font-bold text-sm hover:bg-cyan-400/20"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </Button>
          <Button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-400 text-slate-900 font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-cyan-400/20">
            <Plus className="h-4 w-4" />
            إضافة
          </Button>
          <Link href={`/technician-details/${technicianId}`}>
            <Button variant="outline" className="inline-flex items-center gap-2 border-slate-700 text-slate-200 hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              رجوع
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/60 border-cyan-400/10">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">إجمالي مخزون المنتج</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-black text-slate-100">{arNumber(effectiveTotalStock)}</h3>
              <span className="text-emerald-400 text-sm font-bold flex items-center gap-1 mb-1">+5%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-cyan-400/10">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">المخزون المسلم</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-black text-slate-100">{arNumber(deliveredCount)}</h3>
              <span className="text-emerald-400 text-sm font-bold flex items-center gap-1 mb-1">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-orange-500/20">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">إجمالي المخزون الباقي</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-black text-slate-100">{arNumber(effectiveTotalStock)}</h3>
              <span className="text-orange-400 text-sm font-bold flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3" />
                {urgentCount > 0 ? "عاجل" : "مستقر"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-cyan-400/10">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">إجمالي قيمة المنتج الباقي</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-black text-slate-100">{arNumber(estimatedValue)}</h3>
              <span className="text-cyan-300 text-xs font-bold mb-1">SAR</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="relative group">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search className="h-4 w-4 text-cyan-300/60" />
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full md:w-96 py-3 pr-11 pl-4 rounded-xl text-sm text-slate-100 bg-slate-900/60 border-cyan-400/20"
            placeholder="ابحث برقم السيريال..."
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-[10px] text-slate-600 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">Ctrl + K</span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as ProductTab)} className="w-full">
        <TabsList className="bg-transparent border-b border-cyan-400/10 mb-6 rounded-none p-0 h-auto gap-8">
          <TabsTrigger
            value="available"
            className="inline-flex items-center justify-center gap-2 pb-4 px-2 border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-300 text-slate-500 rounded-none leading-none"
          >
            <Warehouse className="h-4 w-4 shrink-0" />
            المخزون الموجود
          </TabsTrigger>
          <TabsTrigger
            value="delivered"
            className="inline-flex items-center justify-center gap-2 pb-4 px-2 border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-300 text-slate-500 rounded-none leading-none"
          >
            <Truck className="h-4 w-4 shrink-0" />
            المخزون المسلم
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-xl overflow-hidden border border-cyan-400/10 shadow-2xl shadow-black/20 bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-cyan-400/5 border-b border-cyan-400/10">
                <th className="px-6 py-4 text-slate-300 font-bold text-xs uppercase tracking-wider">اسم المنتج</th>
                <th className="px-6 py-4 text-slate-300 font-bold text-xs uppercase tracking-wider text-center">الرقم التسلسلي</th>
                <th className="px-6 py-4 text-slate-300 font-bold text-xs uppercase tracking-wider text-center">حالة المنتج</th>
                <th className="px-6 py-4 text-slate-300 font-bold text-xs uppercase tracking-wider text-center">التاريخ والوقت</th>
                <th className="px-6 py-4 text-slate-300 font-bold text-xs uppercase tracking-wider text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-400/5">
              {shownRows.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-slate-400" colSpan={5}>
                    لا توجد بيانات مطابقة
                  </td>
                </tr>
              ) : (
                shownRows.map((row) => (
                  <tr key={row.id} className="hover:bg-cyan-400/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
                          <Router className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{row.productName}</p>
                          <p className="text-[10px] text-slate-500">{itemType?.nameEn || "Product"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="font-mono text-xs text-cyan-300 bg-cyan-400/5 px-2 py-1 rounded">{row.serial}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-bold text-slate-100">{row.status}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${row.statusClass}`}>
                        {row.datetime}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-left">
                      <Button variant="ghost" size="icon" className="text-slate-500 hover:text-cyan-300">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-cyan-400/5 px-6 py-4 border-t border-cyan-400/10 flex items-center justify-between">
          <p className="text-xs text-slate-500">عرض {shownRows.length} من أصل {productOperations.length} عنصر</p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="w-8 h-8 border-cyan-400/20 text-slate-400" disabled>
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button size="icon" className="w-8 h-8 bg-cyan-400 text-slate-900 text-xs">1</Button>
            <Button variant="outline" size="icon" className="w-8 h-8 border-cyan-400/20 text-slate-400" disabled>
              <ChevronLeft className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl p-4 flex items-center justify-between border border-cyan-400/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-400/10 text-cyan-300">
              <RefreshCw className="h-4 w-4" />
            </div>
            <p className="text-xs text-slate-400">آخر مزامنة لقاعدة البيانات منذ دقائق</p>
          </div>
          <button className="text-[10px] font-bold text-cyan-300 underline underline-offset-4">تحديث يدوي</button>
        </div>
        <div className="rounded-xl p-4 flex items-center justify-between border border-cyan-400/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-400/10 text-cyan-300">
              <Boxes className="h-4 w-4" />
            </div>
            <p className="text-xs text-slate-400">المنتج الحالي مرتبط بمخزون الفني والمستودع</p>
          </div>
          <button className="text-[10px] font-bold text-cyan-300 underline underline-offset-4">دليل الاستخدام</button>
        </div>
      </div>
    </div>
  );
}
