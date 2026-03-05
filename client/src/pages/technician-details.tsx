import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  User, 
  MapPin, 
  Package,
  Box,
  FileText,
  Sticker,
  Battery,
  Smartphone,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TruckIcon,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Download
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { exportTechnicianToExcel } from "@/lib/exportToExcel";
import { useToast } from "@/hooks/use-toast";
import { useActiveItemTypes, getItemTypeVisuals, buildInventoryDisplayItems, type InventoryEntry } from "@/hooks/use-item-types";
import type { TechnicianFixedInventoryEntry, TechnicianMovingInventoryEntry } from "@shared/schema";
import WithdrawFromTechnicianModal from "@/components/withdraw-from-technician-modal";

interface TechnicianFixedInventory {
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
}

interface TechnicianMovingInventory {
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
}

interface ProductInfo {
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

export default function TechnicianDetailsPage() {
  const [match, params] = useRoute("/technician-details/:id");
  const technicianId = params?.id;
  const { toast } = useToast();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const { data: fixedInventory, isLoading: isLoadingFixed } = useQuery<TechnicianFixedInventory>({
    queryKey: [`/api/supervisor/users/${technicianId}/fixed-inventory`],
    enabled: !!technicianId,
  });

  const { data: movingInventory, isLoading: isLoadingMoving } = useQuery<TechnicianMovingInventory>({
    queryKey: [`/api/supervisor/users/${technicianId}/moving-inventory`],
    enabled: !!technicianId,
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

  const isLoading = isLoadingFixed || isLoadingMoving;

  const technicianName = fixedInventory?.technicianName || movingInventory?.technicianName || "غير معروف";
  const city = fixedInventory?.city || movingInventory?.city || "غير محدد";

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
    devices: Smartphone,
    papers: FileText,
    accessories: Battery,
    sim: Package,
    other: Box,
  };

  const categoryColorMap: Record<string, string[]> = {
    devices: ["#3b82f6", "#8b5cf6", "#ec4899", "#6366f1"],
    papers: ["#f59e0b", "#14b8a6"],
    accessories: ["#10b981", "#84cc16"],
    sim: ["#06b6d4", "#6366f1", "#f97316", "#ec4899", "#8b5cf6"],
    other: ["#6b7280"],
  };

  // useMemo must be called before any early returns to follow React hooks rules
  const products: ProductInfo[] = useMemo(() => {
    if (!itemTypes || itemTypes.length === 0) {
      return [];
    }

    const fixedEntryMap = new Map((fixedEntries || []).map(e => [e.itemTypeId, e]));
    const movingEntryMap = new Map((movingEntries || []).map(e => [e.itemTypeId, e]));

    return itemTypes
      .filter(it => it.isActive && it.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((itemType, index) => {
        const fixedEntry = fixedEntryMap.get(itemType.id);
        const movingEntry = movingEntryMap.get(itemType.id);
        const legacy = legacyFieldMapping[itemType.id];
        
        let fixedBoxes = fixedEntry?.boxes || 0;
        let fixedUnits = fixedEntry?.units || 0;
        let movingBoxes = movingEntry?.boxes || 0;
        let movingUnits = movingEntry?.units || 0;

        if (!fixedEntry && legacy && fixedInventory) {
          fixedBoxes = (fixedInventory as any)[legacy.boxes] || 0;
          fixedUnits = (fixedInventory as any)[legacy.units] || 0;
        }
        if (!movingEntry && legacy && movingInventory) {
          movingBoxes = (movingInventory as any)[legacy.boxes] || 0;
          movingUnits = (movingInventory as any)[legacy.units] || 0;
        }

        const colors = categoryColorMap[itemType.category] || categoryColorMap.other;

        return {
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
  }, [itemTypes, fixedInventory, movingInventory, fixedEntries, movingEntries]);

  const totalFixed = products.reduce((sum, p) => sum + p.fixedTotal, 0);
  const totalMoving = products.reduce((sum, p) => sum + p.movingTotal, 0);
  const grandTotal = totalFixed + totalMoving;

  const pieData = [
    { name: "المخزون الثابت", value: totalFixed, color: "#18B2B0" },
    { name: "المخزون المتحرك", value: totalMoving, color: "#10b981" },
  ];

  const barChartData = products.map(p => ({
    name: p.nameAr,
    ثابت: p.fixedTotal,
    متحرك: p.movingTotal,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = pieData.reduce((sum, item) => sum + item.value, 0);
      const percent = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-[#0a0a0f]/95 backdrop-blur-xl border border-[#18B2B0]/30 p-4 rounded-xl shadow-2xl">
          <p className="text-white font-bold mb-1">{payload[0].name}</p>
          <p className="text-[#18B2B0] font-semibold">
            {payload[0].value.toLocaleString()} وحدة
          </p>
          <p className="text-gray-400 text-sm">{percent}% من الإجمالي</p>
        </div>
      );
    }
    return null;
  };

  const getAlertLevel = (total: number) => {
    if (total === 0) return { level: 'critical', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: XCircle };
    if (total < 10) return { level: 'warning', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', icon: AlertTriangle };
    return { level: 'good', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', icon: CheckCircle };
  };

  // Early returns after all hooks have been called
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!fixedInventory && !movingInventory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white/5 border-red-500/30">
            <CardContent className="p-12 text-center">
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">لم يتم العثور على البيانات</h2>
              <p className="text-gray-400 mb-6">لا توجد بيانات متاحة لهذا الفني</p>
              <Link href="/home">
                <Button className="bg-[#18B2B0] hover:bg-[#0ea5a3]">
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة للوحة التحكم
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button
                variant="outline"
                className="border-[#18B2B0]/30 text-[#18B2B0] hover:bg-[#18B2B0]/10"
                data-testid="button-back"
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">تفاصيل الفني</h1>
              <p className="text-gray-400 text-sm">المخزون الشامل</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!technicianId}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
              data-testid="button-withdraw-to-warehouse"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              سحب من الفني إلى المستودع
            </Button>

            <Button
              onClick={async () => {
                try {
                  // Use dynamic item types if available, otherwise fallback to legacy
                  await exportTechnicianToExcel({
                    technicianName,
                    city,
                    // Pass dynamic item types
                    itemTypes: itemTypes?.map(it => ({ id: it.id, nameAr: it.nameAr, nameEn: it.nameEn })),
                    fixedEntries: fixedEntries?.map(e => ({ itemTypeId: e.itemTypeId, boxes: e.boxes, units: e.units })),
                    movingEntries: movingEntries?.map(e => ({ itemTypeId: e.itemTypeId, boxes: e.boxes, units: e.units })),
                    // Also pass legacy fields for backward compatibility
                    fixedInventory: fixedInventory ? {
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
                    } : undefined,
                    movingInventory: movingInventory ? {
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
                    } : undefined
                  });
                  toast({
                    title: "تم التصدير بنجاح",
                    description: "تم تصدير بيانات الفني إلى ملف Excel",
                  });
                } catch (error) {
                  toast({
                    title: "فشل التصدير",
                    description: "حدث خطأ أثناء تصدير البيانات",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!fixedInventory || !movingInventory}
              className="bg-gradient-to-r from-[#18B2B0] to-teal-600 hover:from-[#16a09e] hover:to-teal-700 text-white shadow-lg"
              data-testid="button-export"
            >
              <Download className="ml-2 h-4 w-4" />
              تصدير Excel
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-[#18B2B0]/20 to-[#18B2B0]/10 border-[#18B2B0]/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">اسم الفني</p>
                    <p className="text-xl font-bold text-white" data-testid="text-technician-name">
                      {technicianName}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-xl">
                    <User className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">المدينة</p>
                    <p className="text-xl font-bold text-white" data-testid="text-city">
                      {city}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">المخزون الثابت</p>
                    <p className="text-xl font-bold text-white" data-testid="text-fixed-total">
                      {totalFixed} وحدة
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">المخزون المتحرك</p>
                    <p className="text-xl font-bold text-white" data-testid="text-moving-total">
                      {totalMoving} وحدة
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                    <TruckIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[#18B2B0]" />
                  توزيع المخزون
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grandTotal > 0 ? (
                  <div className="h-[300px]" data-testid="chart-inventory-distribution">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-400">لا توجد بيانات متاحة</p>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-[#18B2B0]/10 border border-[#18B2B0]/30 rounded-lg p-3">
                    <p className="text-sm text-gray-400">ثابت</p>
                    <p className="text-lg font-bold text-[#18B2B0]">{totalFixed}</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-gray-400">متحرك</p>
                    <p className="text-lg font-bold text-green-400">{totalMoving}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#18B2B0]" />
                  مقارنة المنتجات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grandTotal > 0 ? (
                  <div className="h-[300px]" data-testid="chart-products-comparison">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis type="number" stroke="#9ca3af" />
                        <YAxis dataKey="name" type="category" width={80} stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0a0a0f', 
                            border: '1px solid rgba(24, 178, 176, 0.3)',
                            borderRadius: '12px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="ثابت" fill="#18B2B0" radius={[0, 8, 8, 0]} />
                        <Bar dataKey="متحرك" fill="#10b981" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-400">لا توجد بيانات متاحة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Table with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#18B2B0]" />
                تفاصيل المخزون الشاملة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 mb-6">
                  <TabsTrigger value="all" data-testid="tab-all">الجميع</TabsTrigger>
                  <TabsTrigger value="fixed" data-testid="tab-fixed">الثابت</TabsTrigger>
                  <TabsTrigger value="moving" data-testid="tab-moving">المتحرك</TabsTrigger>
                </TabsList>

                {/* All Inventory Tab */}
                <TabsContent value="all">
                  <div className="rounded-lg overflow-x-auto border border-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                          <TableHead className="text-right text-gray-300 font-bold">المنتج</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">ثابت (ك)</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">ثابت (م)</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">متحرك (ك)</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">متحرك (م)</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">الإجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product, idx) => {
                          const Icon = product.icon;
                          const alert = getAlertLevel(product.grandTotal);
                          const AlertIcon = alert.icon;
                          
                          return (
                            <TableRow 
                              key={idx} 
                              className="border-b border-white/5 hover:bg-white/5 transition-colors"
                              data-testid={`row-all-${product.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <TableCell className="text-right">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="p-2 rounded-lg flex-shrink-0"
                                    style={{ backgroundColor: `${product.color}20` }}
                                  >
                                    <Icon 
                                      className="h-5 w-5" 
                                      style={{ color: product.color }}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">{product.nameAr}</p>
                                    <p className="text-xs text-gray-400">{product.nameEn}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-white/10 text-white border-white/20">
                                  {product.fixedBoxes}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-white/10 text-white border-white/20">
                                  {product.fixedUnits}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-white/10 text-white border-white/20">
                                  {product.movingBoxes}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-white/10 text-white border-white/20">
                                  {product.movingUnits}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Badge 
                                    className={`font-bold ${alert.bgColor} ${alert.borderColor}`}
                                    style={{ color: product.color }}
                                  >
                                    {product.grandTotal}
                                  </Badge>
                                  <AlertIcon className={`h-4 w-4 ${alert.color}`} />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Fixed Inventory Tab */}
                <TabsContent value="fixed">
                  <div className="rounded-lg overflow-x-auto border border-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                          <TableHead className="text-right text-gray-300 font-bold">المنتج</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">كراتين</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">مفرد</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">الإجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product, idx) => {
                          const Icon = product.icon;
                          const alert = getAlertLevel(product.fixedTotal);
                          const AlertIcon = alert.icon;
                          
                          return (
                            <TableRow 
                              key={idx} 
                              className="border-b border-white/5 hover:bg-white/5 transition-colors"
                              data-testid={`row-fixed-${product.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <TableCell className="text-right">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: `${product.color}20` }}
                                  >
                                    <Icon 
                                      className="h-5 w-5" 
                                      style={{ color: product.color }}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">{product.nameAr}</p>
                                    <p className="text-xs text-gray-400">{product.nameEn}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-white/10 text-white border-white/20">
                                  {product.fixedBoxes}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-white/10 text-white border-white/20">
                                  {product.fixedUnits}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Badge 
                                    className={`font-bold ${alert.bgColor} ${alert.borderColor}`}
                                    style={{ color: product.color }}
                                  >
                                    {product.fixedTotal}
                                  </Badge>
                                  <AlertIcon className={`h-4 w-4 ${alert.color}`} />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Moving Inventory Tab */}
                <TabsContent value="moving">
                  <div className="rounded-lg overflow-x-auto border border-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                          <TableHead className="text-right text-gray-300 font-bold">المنتج</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">كراتين</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">مفرد</TableHead>
                          <TableHead className="text-center text-gray-300 font-bold">الإجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product, idx) => {
                          const Icon = product.icon;
                          const alert = getAlertLevel(product.movingTotal);
                          const AlertIcon = alert.icon;
                          
                          return (
                            <TableRow 
                              key={idx} 
                              className="border-b border-white/5 hover:bg-white/5 transition-colors"
                              data-testid={`row-moving-${product.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <TableCell className="text-right">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: `${product.color}20` }}
                                  >
                                    <Icon 
                                      className="h-5 w-5" 
                                      style={{ color: product.color }}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">{product.nameAr}</p>
                                    <p className="text-xs text-gray-400">{product.nameEn}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-white/10 text-white border-white/20">
                                  {product.movingBoxes}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-white/10 text-white border-white/20">
                                  {product.movingUnits}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Badge 
                                    className={`font-bold ${alert.bgColor} ${alert.borderColor}`}
                                    style={{ color: product.color }}
                                  >
                                    {product.movingTotal}
                                  </Badge>
                                  <AlertIcon className={`h-4 w-4 ${alert.color}`} />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {technicianId && (
        <WithdrawFromTechnicianModal
          open={showWithdrawModal}
          onOpenChange={setShowWithdrawModal}
          technicianId={technicianId}
          technicianName={technicianName}
        />
      )}
    </div>
  );
}
