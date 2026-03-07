import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Package, User, Warehouse, TrendingUp, AlertCircle, Activity, ChevronLeft, Calendar, Eye, ArrowRight, LayoutDashboard, Search, X, FileDown } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import bannerImage from "@assets/Gemini_Generated_Image_r9bdc9r9bdc9r9bd_1762462520993.png";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import { NeoShellLayout } from "@/components/layout/neo-shell-layout";
import { useActiveItemTypes } from "@/hooks/use-item-types";

interface WarehouseTransfer {
  id: string;
  warehouseId: string;
  technicianId: string;
  itemType: string;
  packagingType: string;
  quantity: number;
  performedBy: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  respondedAt?: Date;
  createdAt: Date;
  warehouseName?: string;
  technicianName?: string;
  performedByName?: string;
  itemNameAr?: string;
}

export default function OperationsPage() {
  const { toast } = useToast();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchTechnician, setSearchTechnician] = useState("");

  // Fetch item types for dynamic names
  const { data: itemTypesData } = useActiveItemTypes();

  const { data: allTransfers, isLoading } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
  });

  const transfers = allTransfers?.filter(transfer => {
    if (searchTechnician === "") return true;
    return transfer.technicianName?.toLowerCase().includes(searchTechnician.toLowerCase());
  });

  const acceptMutation = useMutation({
    mutationFn: async (transferId: string) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      toast({
        title: "تم القبول",
        description: "تم قبول عملية النقل بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل قبول عملية النقل",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason?: string }) => {
      return apiRequest("POST", `/api/warehouse-transfers/${transferId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setRejectDialogOpen(false);
      setSelectedTransferId(null);
      setRejectionReason("");
      toast({
        title: "تم الرفض",
        description: "تم رفض عملية النقل",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل رفض عملية النقل",
        variant: "destructive",
      });
    },
  });

  const handleReject = (transferId: string) => {
    setSelectedTransferId(transferId);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedTransferId) {
      rejectMutation.mutate({ transferId: selectedTransferId, reason: rejectionReason });
    }
  };

  const getItemNameAr = (itemType: string) => {
    // First check if it's in dynamic item types
    if (itemTypesData) {
      const dynamicItem = itemTypesData.find(
        item => item.nameEn.toLowerCase() === itemType.toLowerCase() || item.id === itemType
      );
      if (dynamicItem) {
        return dynamicItem.nameAr;
      }
    }
    
    // Fallback to legacy item names
    const itemNames: Record<string, string> = {
      n950: "N950",
      i9000s: "I9000s",
      i9100: "I9100",
      rollPaper: "ورق",
      stickers: "ملصقات",
      newBatteries: "بطاريات جديدة",
      mobilySim: "شرائح موبايلي",
      stcSim: "شرائح STC",
      zainSim: "شرائح زين",
      lebara: "شرائح ليبارا",
      lebaraSim: "شرائح ليبارا",
    };
    return itemNames[itemType] || itemType;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 backdrop-blur-sm" data-testid="badge-status-pending">
            <Clock className="h-3 w-3 mr-1" />
            قيد الانتظار
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 backdrop-blur-sm" data-testid="badge-status-accepted">
            <CheckCircle className="h-3 w-3 mr-1" />
            مقبول
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30 backdrop-blur-sm" data-testid="badge-status-rejected">
            <XCircle className="h-3 w-3 mr-1" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingTransfers = transfers?.filter(t => t.status === 'pending') || [];
  const processedTransfers = transfers?.filter(t => t.status !== 'pending') || [];
  const acceptedCount = transfers?.filter(t => t.status === 'accepted').length || 0;
  const rejectedCount = transfers?.filter(t => t.status === 'rejected').length || 0;
  const totalTransfers = transfers?.length || 0;

  // Group pending transfers by warehouse + technician + day + notes
  const groupedPendingTransfers = pendingTransfers?.reduce((acc, transfer) => {
    const date = new Date(transfer.createdAt);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const key = `${transfer.warehouseId}-${dayKey}-${transfer.performedBy}-${transfer.notes || 'no-notes'}`;
    
    if (!acc[key]) {
      acc[key] = {
        groupId: key,
        warehouseId: transfer.warehouseId,
        warehouseName: transfer.warehouseName,
        technicianName: transfer.technicianName,
        technicianId: transfer.technicianId,
        createdAt: transfer.createdAt,
        notes: transfer.notes,
        status: transfer.status,
        performedBy: transfer.performedBy,
        items: [],
      };
    }
    acc[key].items.push({
      id: transfer.id,
      itemType: transfer.itemType,
      itemNameAr: getItemNameAr(transfer.itemType),
      packagingType: transfer.packagingType,
      quantity: transfer.quantity,
    });
    return acc;
  }, {} as Record<string, any>);

  const groupedPendingTransfersList = groupedPendingTransfers ? Object.values(groupedPendingTransfers) : [];

  const groupedProcessedTransfers = processedTransfers?.reduce((acc, transfer) => {
    const date = new Date(transfer.createdAt);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const key = `${transfer.warehouseId}-${dayKey}-${transfer.performedBy}-${transfer.status}-${transfer.notes || 'no-notes'}`;
    
    if (!acc[key]) {
      acc[key] = {
        groupId: key,
        warehouseId: transfer.warehouseId,
        warehouseName: transfer.warehouseName,
        technicianName: transfer.technicianName,
        technicianId: transfer.technicianId,
        createdAt: transfer.createdAt,
        respondedAt: transfer.respondedAt,
        notes: transfer.notes,
        status: transfer.status,
        rejectionReason: transfer.rejectionReason,
        performedBy: transfer.performedBy,
        items: [],
      };
    }
    acc[key].items.push({
      id: transfer.id,
      itemType: transfer.itemType,
      itemNameAr: getItemNameAr(transfer.itemType),
      packagingType: transfer.packagingType,
      quantity: transfer.quantity,
    });
    return acc;
  }, {} as Record<string, any>);

  const groupedProcessedTransfersList = groupedProcessedTransfers ? Object.values(groupedProcessedTransfers) : [];

  const exportToExcel = async () => {
    if (!transfers || transfers.length === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا توجد عمليات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('العمليات');
    worksheet.views = [{ rightToLeft: true }];

    const currentDate = new Date();
    const arabicDate = currentDate.toLocaleDateString('ar-SA', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const time = currentDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير العمليات - Operations Report';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF18B2B0' }
    };

    worksheet.mergeCells('A2:H2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `${arabicDate} - ${time}`;
    dateCell.font = { size: 12, bold: true };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0F7F7' }
    };

    worksheet.addRow([]);

    const headerRow = worksheet.addRow(['#', 'المستودع', 'الفني', 'الصنف', 'نوع التغليف', 'الكمية', 'الحالة', 'التاريخ']);
    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF18B2B0' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    transfers.forEach((transfer, index) => {
      const statusText = transfer.status === 'accepted' ? 'مقبول' : 
                        transfer.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار';
      
      const row = worksheet.addRow([
        index + 1,
        transfer.warehouseName || 'غير محدد',
        transfer.technicianName || 'غير محدد',
        getItemNameAr(transfer.itemType),
        transfer.packagingType === 'boxes' ? 'كرتون' : 'مفرد',
        transfer.quantity,
        statusText,
        format(new Date(transfer.createdAt), 'PPp', { locale: ar })
      ]);

      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 25;
      
      const bgColor = transfer.status === 'accepted' ? 'FFD1FAE5' : 
                      transfer.status === 'rejected' ? 'FFFECACA' : 'FFFEF3C7';
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
    });

    worksheet.columns = [
      { width: 8 },
      { width: 20 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 25 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = searchTechnician 
      ? `العمليات_${searchTechnician}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `العمليات_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${transfers.length} عملية بنجاح`,
    });
  };

  if (isLoading) {
    return (
      <NeoShellLayout title="إدارة العمليات">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              className="relative w-20 h-20 mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#18B2B0] border-r-[#18B2B0] shadow-lg shadow-[#18B2B0]/50"></div>
            </motion.div>
            <p className="text-white text-lg font-medium">جاري التحميل...</p>
          </div>
        </div>
      </NeoShellLayout>
    );
  }

  return (
    <NeoShellLayout title="إدارة العمليات">
        <div className="relative overflow-hidden h-80 shadow-2xl">
          <div className="absolute inset-0">
            <img
              src={bannerImage}
              alt="Operations Banner"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-[#18B2B0]/30 to-slate-900/75"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/50"></div>

          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#18B2B0]/20 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-400/15 rounded-full blur-3xl opacity-50"></div>

          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#18B2B0] to-transparent"></div>

          <div className="relative h-full flex flex-col justify-between px-6 py-6">
            <div>
              <Link href="/admin">
                <Button 
                  variant="secondary" 
                  className="bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/20 hover:border-[#18B2B0]/60 hover:shadow-[0_0_20px_rgba(24,178,176,0.3)] shadow-2xl transition-all duration-300"
                  data-testid="button-back-admin"
                >
                  <ArrowRight className="h-4 w-4 ml-2" />
                  <LayoutDashboard className="h-4 w-4 ml-2" />
                  العودة للقائمة الرئيسية
                </Button>
              </Link>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-[#18B2B0]/30 rounded-full blur-2xl"></div>
                
                <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 rounded-3xl border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent rounded-3xl"></div>
                  <Activity className="relative h-20 w-20 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>
              </div>

              <h1 className="text-5xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">
                إدارة العمليات
              </h1>
              <p className="text-xl text-white/95 font-semibold drop-shadow-lg">
                متابعة وإدارة عمليات النقل من المستودعات إلى الفنيين
              </p>
            </div>

            <div></div>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#18B2B0]/60 to-transparent"></div>
        </div>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0] via-teal-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-right text-white">
                      <p className="text-sm font-medium opacity-90 mb-1">إجمالي العمليات</p>
                      <p className="text-4xl font-bold" data-testid="stat-total-transfers">{totalTransfers}</p>
                      <p className="text-xs opacity-75 mt-2">عملية نقل</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                      <Activity className="h-10 w-10 text-white" />
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
              <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-right text-white">
                      <p className="text-sm font-medium opacity-90 mb-1">قيد الانتظار</p>
                      <p className="text-4xl font-bold" data-testid="stat-pending-transfers">{pendingTransfers.length}</p>
                      <p className="text-xs opacity-75 mt-2">تحتاج موافقة</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                      <Clock className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-right text-white">
                      <p className="text-sm font-medium opacity-90 mb-1">العمليات المقبولة</p>
                      <p className="text-4xl font-bold" data-testid="stat-accepted-transfers">{acceptedCount}</p>
                      <p className="text-xs opacity-75 mt-2">تمت الموافقة</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-right text-white">
                      <p className="text-sm font-medium opacity-90 mb-1">العمليات المرفوضة</p>
                      <p className="text-4xl font-bold" data-testid="stat-rejected-transfers">{rejectedCount}</p>
                      <p className="text-xs opacity-75 mt-2">تم رفضها</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                      <XCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 w-full sm:max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="h-5 w-5 text-[#18B2B0]" />
                      <h3 className="text-lg font-bold text-white">البحث</h3>
                    </div>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="ابحث باسم الفني..."
                        value={searchTechnician}
                        onChange={(e) => setSearchTechnician(e.target.value)}
                        className="pr-10 h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-[#18B2B0] focus:ring-[#18B2B0]"
                        data-testid="input-search-technician"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      {searchTechnician && (
                        <button
                          onClick={() => setSearchTechnician("")}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          data-testid="button-clear-search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {searchTechnician && (
                      <div className="mt-2 text-sm text-gray-300">
                        النتائج: {transfers?.length || 0} عملية (منها {pendingTransfers.length} قيد الانتظار)
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={exportToExcel}
                    className="bg-gradient-to-r from-[#18B2B0] to-[#16a09e] hover:from-[#16a09e] hover:to-[#18B2B0] text-white font-medium h-12 px-6 shadow-lg hover:shadow-[#18B2B0]/50 transition-all duration-300"
                    data-testid="button-export-operations"
                  >
                    <FileDown className="h-4 w-4 ml-2" />
                    تصدير إلى Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-white/10">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white">عمليات النقل المعلقة</div>
                    <div className="text-sm text-gray-300 font-normal mt-1">
                      {pendingTransfers.length} عملية تحتاج إلى موافقة
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {groupedPendingTransfersList.length === 0 ? (
                  <div className="text-center py-12" data-testid="text-no-pending">
                    <AlertCircle className="h-16 w-16 text-[#18B2B0]/50 mx-auto mb-4" />
                    <p className="text-white text-lg font-medium">لا توجد عمليات نقل معلقة</p>
                    <p className="text-gray-400 text-sm mt-2">جميع العمليات تمت معالجتها</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {groupedPendingTransfersList.map((group: any, index: number) => (
                      <motion.div
                        key={group.groupId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <Card 
                          className="relative overflow-hidden border-2 border-amber-500/30 bg-white/5 hover:border-amber-400/50 backdrop-blur-xl hover:shadow-2xl transition-all duration-300"
                          data-testid={`card-pending-${group.groupId}`}
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-600"></div>
                          
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl shadow-md bg-gradient-to-br from-amber-500 to-orange-600">
                                  <Warehouse className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-white">{group.warehouseName}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <User className="h-3 w-3 text-gray-400" />
                                    <p className="text-sm text-gray-300">{group.technicianName}</p>
                                  </div>
                                </div>
                              </div>
                              {getStatusBadge(group.status)}
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4 text-[#18B2B0]" />
                                <span className="text-sm font-semibold text-white">المنتجات ({group.items.length})</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {group.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between bg-[#18B2B0]/10 rounded-lg p-2">
                                    <span className="text-xs font-medium text-gray-300">{item.itemNameAr}</span>
                                    <Badge variant="outline" className="text-xs bg-[#18B2B0]/20 text-[#18B2B0] border-[#18B2B0]/30">
                                      {item.quantity} {item.packagingType === 'box' ? 'كرتونة' : 'قطعة'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-300">
                                  {format(new Date(group.createdAt), "dd MMM yyyy, HH:mm", { locale: ar })}
                                </span>
                              </div>
                            </div>

                            {group.notes && (
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 backdrop-blur-sm">
                                <p className="text-xs font-semibold text-blue-300 mb-1">ملاحظات:</p>
                                <p className="text-xs text-blue-200">{group.notes}</p>
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              <Button
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                                onClick={() => {
                                  group.items.forEach((item: any) => acceptMutation.mutate(item.id));
                                }}
                                disabled={acceptMutation.isPending}
                                data-testid={`button-accept-group-${group.groupId}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                قبول الكل ({group.items.length})
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md"
                                onClick={() => {
                                  group.items.forEach((item: any) => rejectMutation.mutate({ transferId: item.id }));
                                }}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-group-${group.groupId}`}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                رفض الكل ({group.items.length})
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-[#18B2B0]/20 to-teal-500/20 border-b border-white/10">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="bg-gradient-to-br from-[#18B2B0] to-teal-600 p-3 rounded-xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white">سجل العمليات المعالجة</div>
                    <div className="text-sm text-gray-300 font-normal mt-1">
                      {groupedProcessedTransfersList.length} عملية مجمعة
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {groupedProcessedTransfersList.length === 0 ? (
                  <div className="text-center py-12" data-testid="text-no-processed">
                    <Activity className="h-16 w-16 text-[#18B2B0]/50 mx-auto mb-4" />
                    <p className="text-white text-lg font-medium">لا توجد عمليات معالجة</p>
                    <p className="text-gray-400 text-sm mt-2">سيتم عرض العمليات المعالجة هنا</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedProcessedTransfersList.map((group: any, index: number) => (
                      <motion.div
                        key={group.groupId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <Link href={`/operation-details/${encodeURIComponent(group.groupId)}`}>
                          <Card 
                            className={`
                              relative overflow-hidden border-2 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
                              ${group.status === 'accepted' ? 'border-green-500/30 bg-white/5 hover:border-green-400/50 backdrop-blur-xl' : 'border-red-500/30 bg-white/5 hover:border-red-400/50 backdrop-blur-xl'}
                            `}
                            data-testid={`card-processed-${group.groupId}`}
                          >
                            <div className={`absolute top-0 left-0 w-1 h-full ${group.status === 'accepted' ? 'bg-gradient-to-b from-green-500 to-emerald-600' : 'bg-gradient-to-b from-red-500 to-rose-600'}`}></div>
                            
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-3 rounded-xl shadow-md ${group.status === 'accepted' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                                    <Warehouse className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold text-white">{group.warehouseName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <User className="h-3 w-3 text-gray-400" />
                                      <p className="text-sm text-gray-300">{group.technicianName}</p>
                                    </div>
                                  </div>
                                </div>
                                {getStatusBadge(group.status)}
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <Package className="h-4 w-4 text-[#18B2B0]" />
                                  <span className="text-sm font-semibold text-white">المنتجات ({group.items.length})</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {group.items.slice(0, 4).map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between bg-[#18B2B0]/10 rounded-lg p-2">
                                      <span className="text-xs font-medium text-gray-300">{item.itemNameAr}</span>
                                      <Badge variant="outline" className="text-xs bg-[#18B2B0]/20 text-[#18B2B0] border-[#18B2B0]/30">
                                        {item.quantity} {item.packagingType === 'box' ? 'كرتونة' : 'قطعة'}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                                {group.items.length > 4 && (
                                  <p className="text-xs text-gray-400 mt-2 text-center">
                                    و {group.items.length - 4} منتج آخر...
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-300">
                                    {format(new Date(group.createdAt), "dd MMM yyyy", { locale: ar })}
                                  </span>
                                </div>
                                {group.respondedAt && (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                    <span className="text-gray-300">
                                      {format(new Date(group.respondedAt), "dd MMM", { locale: ar })}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {group.status === 'rejected' && group.rejectionReason && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
                                  <p className="text-xs font-semibold text-red-300 mb-1">سبب الرفض:</p>
                                  <p className="text-xs text-red-200">{group.rejectionReason}</p>
                                </div>
                              )}

                              {group.notes && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 backdrop-blur-sm">
                                  <p className="text-xs font-semibold text-blue-300 mb-1">ملاحظات:</p>
                                  <p className="text-xs text-blue-200">{group.notes}</p>
                                </div>
                              )}

                              <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10">
                                <Eye className="h-4 w-4 text-[#18B2B0]" />
                                <span className="text-sm font-semibold text-[#18B2B0]">عرض التفاصيل الكاملة</span>
                                <ChevronLeft className="h-4 w-4 text-[#18B2B0]" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-red-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-400 flex items-center gap-2">
              <XCircle className="h-6 w-6" />
              رفض عملية النقل
            </DialogTitle>
            <DialogDescription className="text-base text-gray-300">
              يرجى إدخال سبب الرفض (اختياري) لتوضيح القرار للفني
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="مثال: الكمية المطلوبة غير متوفرة في المستودع حالياً..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-red-500"
            data-testid="textarea-rejection-reason"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              data-testid="button-cancel-reject"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            >
              <XCircle className="h-4 w-4 ml-2" />
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NeoShellLayout>
  );
}
