import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Cable,
  CheckCircle2,
  CircleEllipsis,
  FileSpreadsheet,
  Filter,
  PackageX,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Trash2,
  TriangleAlert,
  User,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WithdrawnDevice } from "@shared/schema";
import AddWithdrawnDeviceModal from "@/components/add-withdrawn-device-modal";
import EditWithdrawnDeviceModal from "@/components/edit-withdrawn-device-modal";
import ExcelJS from 'exceljs';

type DeviceReviewStatus = "pending" | "approved" | "rejected";

const statusConfig: Record<
  DeviceReviewStatus,
  {
    text: string;
    cardClass: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    text: "قيد المراجعة",
    cardClass: "border-amber-500/25",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: TriangleAlert,
  },
  approved: {
    text: "موافق عليها",
    cardClass: "border-emerald-500/25",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  rejected: {
    text: "مرفوضة",
    cardClass: "border-rose-500/25",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: XCircle,
  },
};

const normalize = (value?: string | null): string => (value || "").trim().toLowerCase();

const inferDeviceReviewStatus = (device: WithdrawnDevice): DeviceReviewStatus => {
  const combined = `${normalize(device.notes)} ${normalize(device.damagePart)}`;

  if (/(مرفوض|رفض|rejected|reject)/i.test(combined)) {
    return "rejected";
  }

  if (/(موافق|تمت\s*الموافقة|approved|accept|مقبول)/i.test(combined)) {
    return "approved";
  }

  return "pending";
};

const hasAccessory = (value?: string | null): boolean => {
  const normalized = normalize(value);

  if (!normalized) return false;

  if (
    /^(لا|no|false|0|بدون)$/i.test(normalized) ||
    /(غير\s*موجود|غير\s*متوفر|غير\s*مرفق|cancel|none|n\/a)/i.test(normalized)
  ) {
    return false;
  }

  return true;
};

const formatCardDate = (value?: unknown): string => {
  if (!value) return "-";
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("ar-SA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function WithdrawnDevicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<DeviceReviewStatus>("pending");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<WithdrawnDevice | null>(null);

  const { data: devices, isLoading } = useQuery<WithdrawnDevice[]>({
    queryKey: ["/api/withdrawn-devices"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/withdrawn-devices/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawn-devices"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الجهاز المسحوب",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف الجهاز",
        variant: "destructive",
      });
    },
  });

  const allDevices = devices || [];

  const stats = useMemo(() => {
    return allDevices.reduce(
      (acc, device) => {
        const status = inferDeviceReviewStatus(device);
        acc[status] += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 } as Record<DeviceReviewStatus, number>
    );
  }, [allDevices]);

  const filteredDevices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allDevices
      .filter((device) => {
        if (!term) return true;

        return (
          device.technicianName.toLowerCase().includes(term) ||
          device.city.toLowerCase().includes(term) ||
          device.terminalId.toLowerCase().includes(term) ||
          device.serialNumber.toLowerCase().includes(term)
        );
      })
      .map((device) => ({
        ...device,
        reviewStatus: inferDeviceReviewStatus(device),
      }))
      .filter((device) => device.reviewStatus === activeTab);
  }, [activeTab, allDevices, searchTerm]);

  const handleEdit = (device: WithdrawnDevice) => {
    setSelectedDevice(device);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف بيانات هذا الجهاز؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = async () => {
    if (!filteredDevices || filteredDevices.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "يجب أن يكون هناك بيانات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الأجهزة المسحوبة');
    
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Add title row
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير الأجهزة المسحوبة';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 35;
    
    // Add date row
    worksheet.mergeCells('A2:L2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `تاريخ التقرير: ${currentDate}`;
    dateCell.font = { size: 12, bold: true };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    worksheet.getRow(2).height = 25;
    
    // Add header row
    const headerRow = worksheet.getRow(4);
    headerRow.values = [
      '#',
      'المدينة',
      'اسم الفني',
      'رقم الجهاز',
      'الرقم التسلسلي',
      'البطارية',
      'كابل الشاحن',
      'رأس الشاحن',
      'وجود شريحة',
      'نوع الشريحة',
      'الضرر',
      'ملاحظات'
    ];
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
    
    // Add borders to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Add device data
    filteredDevices.forEach((device, index) => {
      const row = worksheet.addRow([
        index + 1,
        device.city,
        device.technicianName,
        device.terminalId,
        device.serialNumber,
        device.battery,
        device.chargerCable,
        device.chargerHead,
        device.hasSim,
        device.simCardType || '-',
        device.damagePart || '-',
        device.notes || '-'
      ]);
      
      row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      row.height = 22;
      
      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
      
      // Add borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
      
      // Right align text columns
      row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      row.getCell(12).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
    });
    
    // Add statistics section
    const statsStartRow = worksheet.lastRow!.number + 2;
    
    // Stats title
    worksheet.mergeCells(`A${statsStartRow}:L${statsStartRow}`);
    const statsTitle = worksheet.getCell(`A${statsStartRow}`);
    statsTitle.value = 'الإحصائيات الإجمالية';
    statsTitle.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    statsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    statsTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(statsStartRow).height = 30;
    
    // Stats data
    const statsRow = worksheet.getRow(statsStartRow + 1);
    statsRow.values = ['', 'إجمالي عدد الأجهزة المسحوبة', filteredDevices.length];
    statsRow.height = 25;
    statsRow.getCell(2).font = { bold: true };
    statsRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
    statsRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    statsRow.getCell(3).font = { bold: true, color: { argb: 'FF1E40AF' } };
    statsRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Set column widths
    worksheet.columns = [
      { width: 6 },   // #
      { width: 18 },  // المدينة
      { width: 25 },  // اسم الفني
      { width: 18 },  // رقم الجهاز
      { width: 22 },  // الرقم التسلسلي
      { width: 14 },  // البطارية
      { width: 16 },  // كابل الشاحن
      { width: 16 },  // رأس الشاحن
      { width: 14 },  // وجود شريحة
      { width: 16 },  // نوع الشريحة
      { width: 25 },  // الضرر
      { width: 35 },  // ملاحظات
    ];
    
    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الأجهزة_المسحوبة_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "تم تصدير التقرير بنجاح",
      description: `تم تصدير ${filteredDevices.length} سجل بتنسيق احترافي`,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-300">جاري التحميل...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/50 backdrop-blur-md p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-800/70 hover:text-white">
                <Link href="/home" data-testid="button-back-home">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  <span>العودة للرئيسية</span>
                </Link>
              </Button>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <PackageX className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">إدارة الأجهزة المسحوبة</h2>
                  <p className="text-sm text-slate-400">متابعة وفهرسة الأجهزة المرتجعة من الفنيين</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <div className="relative w-full md:w-80">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="ابحث برقم الجهاز أو الفني..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pr-9 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500"
                    data-testid="input-search"
                  />
                </div>

                <Button variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" type="button">
                  <Filter className="h-4 w-4" />
                </Button>

                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  data-testid="button-export"
                >
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  تصدير
                </Button>

                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white"
                  data-testid="button-add"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة جهاز
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-amber-500/25 bg-slate-900/50">
            <div className="p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">قيد المراجعة</p>
                <h3 className="text-3xl font-bold text-white">{stats.pending}</h3>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <TriangleAlert className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="border-emerald-500/25 bg-slate-900/50">
            <div className="p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">موافق عليها</p>
                <h3 className="text-3xl font-bold text-white">{stats.approved}</h3>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="border-rose-500/25 bg-slate-900/50">
            <div className="p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">مرفوضة</p>
                <h3 className="text-3xl font-bold text-white">{stats.rejected}</h3>
              </div>
              <div className="h-10 w-10 rounded-lg bg-rose-500/15 text-rose-300 flex items-center justify-center">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </section>

        <section className="border-b border-slate-700/60 flex gap-1 overflow-x-auto">
          {([
            { key: "pending", label: "قيد المراجعة", count: stats.pending },
            { key: "approved", label: "موافق", count: stats.approved },
            { key: "rejected", label: "مرفوضة", count: stats.rejected },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "px-5 py-3 text-sm font-bold text-cyan-300 border-b-2 border-cyan-300 whitespace-nowrap"
                  : "px-5 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 whitespace-nowrap"
              }
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </section>

        {filteredDevices.length > 0 ? (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredDevices.map((device) => {
              const cfg = statusConfig[device.reviewStatus as DeviceReviewStatus];
              const StatusIcon = cfg.icon;
              const hasBattery = hasAccessory(device.battery);
              const hasCable = hasAccessory(device.chargerCable);
              const hasHead = hasAccessory(device.chargerHead);
              const hasSim = hasAccessory(device.hasSim);

              return (
                <Card key={device.id} className={`bg-slate-900/50 border ${cfg.cardClass} overflow-hidden`} data-testid={`card-device-${device.id}`}>
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded border ${cfg.badgeClass}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {cfg.text}
                          </span>
                          <span className="text-xs text-slate-400">التاريخ: {formatCardDate(device.createdAt)}</span>
                        </div>
                        <h4 className="text-base md:text-lg font-bold text-cyan-300" dir="ltr">
                          ID: {device.terminalId} | SN: {device.serialNumber}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <User className="h-4 w-4 text-cyan-300" />
                      <span>{device.technicianName}</span>
                      <span className="text-slate-500">•</span>
                      <span>{device.city}</span>
                    </div>

                    <div className="bg-slate-950/35 border border-white/10 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-2 font-medium">الملحقات المرفقة:</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          {hasBattery ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                          <span className={!hasBattery ? "line-through text-slate-500" : ""}>بطارية</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          {hasCable ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                          <span className={!hasCable ? "line-through text-slate-500" : ""}>كابل</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          {hasHead ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                          <span className={!hasHead ? "line-through text-slate-500" : ""}>رأس</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          {hasSim ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                          <span className={!hasSim ? "line-through text-slate-500" : ""}>SIM</span>
                        </div>
                      </div>
                      {device.simCardType && (
                        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5" />
                          نوع الشريحة: {device.simCardType}
                        </div>
                      )}
                    </div>

                    {device.damagePart && (
                      <div className="flex items-start gap-2 text-sm bg-rose-500/10 text-rose-300 p-3 rounded-lg border border-rose-500/20">
                        <TriangleAlert className="h-4 w-4 mt-0.5" />
                        <div>
                          <p className="font-semibold mb-1">ملاحظات الأضرار:</p>
                          <p>{device.damagePart}</p>
                        </div>
                      </div>
                    )}

                    {device.notes && (
                      <div className="bg-slate-950/35 border border-white/10 rounded-lg p-3 text-sm text-slate-300">
                        <p className="text-xs text-slate-400 mb-1">ملاحظات:</p>
                        <p>{device.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-950/40 border-t border-white/10 flex justify-end gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                      data-testid={`button-details-${device.id}`}
                    >
                      <Link href={`/withdrawn-devices/${device.id}`}>
                        <CircleEllipsis className="h-4 w-4 ml-1" />
                        تفاصيل
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(device.id)}
                      className="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      data-testid={`button-delete-${device.id}`}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                    <Button
                      onClick={() => handleEdit(device)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      data-testid={`button-edit-${device.id}`}
                    >
                      <Pencil className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                  </div>
                </Card>
              );
            })}
          </section>
        ) : (
          <Card className="bg-slate-900/40 border-white/10">
            <div className="py-14 text-center">
              <p className="text-slate-300 text-lg mb-3">لا توجد أجهزة ضمن هذا التصنيف حالياً</p>
              <p className="text-slate-500 text-sm mb-5">جرّب تغيير الفلتر أو إضافة جهاز جديد</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول جهاز
              </Button>
            </div>
          </Card>
        )}
      </div>

      <AddWithdrawnDeviceModal open={showAddModal} onOpenChange={setShowAddModal} />
      <EditWithdrawnDeviceModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        device={selectedDevice}
      />
    </>
  );
}
