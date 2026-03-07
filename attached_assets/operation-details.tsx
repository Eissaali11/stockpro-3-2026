import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Package, User, Warehouse, ArrowRight, Calendar, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import bannerImage from "@assets/Gemini_Generated_Image_r9bdc9r9bdc9r9bd_1762462520993.png";
import { useActiveItemTypes } from "@/hooks/use-item-types";
import { NeoShellLayout } from "@/components/layout/neo-shell-layout";

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

export default function OperationDetailsPage() {
  const [, params] = useRoute("/operation-details/:groupId");
  const groupId = params?.groupId ? decodeURIComponent(params.groupId) : '';

  // Fetch item types for dynamic names
  const { data: itemTypesData } = useActiveItemTypes();

  const { data: transfers, isLoading } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
  });

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

  // Group all transfers by the same logic
  const processedTransfers = transfers?.filter(t => t.status !== 'pending') || [];
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

  const operationGroup = groupedProcessedTransfers?.[groupId];

  if (isLoading) {
    return (
      <NeoShellLayout title="تفاصيل العملية">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
            <p className="text-slate-300 mt-4 text-lg">جارٍ التحميل...</p>
          </div>
        </div>
      </NeoShellLayout>
    );
  }

  if (!operationGroup) {
    return (
      <NeoShellLayout title="تفاصيل العملية">
        <Card className="max-w-md mx-auto shadow-xl bg-slate-900/60 border-slate-700 text-white mt-10">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">العملية غير موجودة</h2>
            <p className="text-slate-300 mb-6">لم يتم العثور على تفاصيل هذه العملية</p>
            <Link href="/operations">
              <Button className="bg-gradient-to-r from-cyan-500 to-teal-500">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للعمليات
              </Button>
            </Link>
          </CardContent>
        </Card>
      </NeoShellLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg px-4 py-2">
            <CheckCircle className="h-5 w-5 mr-2" />
            مقبول
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-lg px-4 py-2">
            <XCircle className="h-5 w-5 mr-2" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  const exportToExcel = async () => {
    if (!operationGroup) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تفاصيل العملية');
    worksheet.views = [{ rightToLeft: true }];

    const currentDate = new Date();
    const reportDate = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const reportTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير تفاصيل العملية';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:E2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `تاريخ التقرير: ${reportDate} | ${reportTime}`;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.font = { bold: true, size: 10 };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]);

    const createdDate = new Date(operationGroup.createdAt);
    const createdDateStr = createdDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const createdTimeStr = createdDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });

    const infoSection = [
      ['المستودع:', operationGroup.warehouseName, 'الفني:', operationGroup.technicianName],
      ['الحالة:', operationGroup.status === 'accepted' ? 'مقبول' : operationGroup.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار', '', ''],
      ['تاريخ الطلب:', `${createdDateStr} - ${createdTimeStr}`, '', ''],
    ];

    if (operationGroup.respondedAt) {
      const respondedDate = new Date(operationGroup.respondedAt);
      const respondedDateStr = respondedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
      const respondedTimeStr = respondedDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
      infoSection.push(['تاريخ المعالجة:', `${respondedDateStr} - ${respondedTimeStr}`, '', '']);
    }

    infoSection.forEach(rowData => {
      const row = worksheet.addRow(rowData);
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 25;
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        if (colNumber === 1 || colNumber === 3) {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE7F3FF' }
          };
        }
      });
    });

    worksheet.addRow([]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow(['#', 'اسم المنتج', 'نوع التغليف', 'الكمية']);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    let totalQuantity = 0;
    operationGroup.items.forEach((item: any, index: number) => {
      const row = worksheet.addRow([
        index + 1,
        item.itemNameAr,
        item.packagingType === 'box' ? 'كرتونة' : 'قطعة',
        item.quantity
      ]);
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 20;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
      totalQuantity += item.quantity;
    });

    const totalRow = worksheet.addRow(['', '', 'الإجمالي', totalQuantity]);
    totalRow.font = { bold: true, size: 11 };
    totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.height = 25;
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF92D050' }
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    if (operationGroup.notes) {
      worksheet.addRow([]);
      worksheet.addRow([]);
      const notesRow = worksheet.addRow(['ملاحظات:', operationGroup.notes]);
      worksheet.mergeCells(notesRow.number, 2, notesRow.number, 4);
      notesRow.alignment = { horizontal: 'right', vertical: 'middle' };
      notesRow.getCell(1).font = { bold: true };
      notesRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7F3FF' }
      };
    }

    if (operationGroup.status === 'rejected' && operationGroup.rejectionReason) {
      worksheet.addRow([]);
      const rejectionRow = worksheet.addRow(['سبب الرفض:', operationGroup.rejectionReason]);
      worksheet.mergeCells(rejectionRow.number, 2, rejectionRow.number, 4);
      rejectionRow.alignment = { horizontal: 'right', vertical: 'middle' };
      rejectionRow.getCell(1).font = { bold: true };
      rejectionRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFECACA' }
      };
    }

    worksheet.columns = [
      { width: 8 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 15 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `تفاصيل_العملية_${operationGroup.warehouseName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <NeoShellLayout title="تفاصيل العملية">
      {/* Animated Banner */}
      <div className="relative overflow-hidden h-64 shadow-2xl">
        {/* Background Image with Zoom Animation */}
        <div className="absolute inset-0 animate-[zoom-slow_20s_ease-in-out_infinite]">
          <img
            src={bannerImage}
            alt="RAS Saudi Banner"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#18B2B0]/40 via-transparent to-purple-600/30 animate-[gradient-shift_8s_ease-in-out_infinite]"></div>
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_3s_ease-in-out_infinite]"></div>
        </div>

        {/* Particles/Dots Effect */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-[float_6s_ease-in-out_infinite]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#102222] to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Back Button & Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#18B2B0]/20">
          <div className="flex items-center justify-between mb-4">
            <Link href="/operations">
              <Button variant="outline" className="hover:bg-[#18B2B0]/10 hover:border-[#18B2B0]">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للعمليات
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                onClick={exportToExcel}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg"
                data-testid="button-export-excel"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير Excel
              </Button>
              {getStatusBadge(operationGroup.status)}
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#18B2B0] via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            تفاصيل العملية
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            جميع المنتجات في هذه العملية
          </p>
        </div>

        {/* Operation Info Card */}
        <Card className="shadow-xl border-[#18B2B0]/20 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50 border-b border-[#18B2B0]/10">
            <CardTitle className="text-2xl text-[#18B2B0]">معلومات العملية</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Warehouse Info */}
              <div className="flex items-center gap-4 bg-[#18B2B0]/5 rounded-xl p-4">
                <div className="bg-gradient-to-br from-[#18B2B0] to-teal-600 p-4 rounded-xl shadow-lg">
                  <Warehouse className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">المستودع</p>
                  <p className="text-lg font-bold text-gray-800">{operationGroup.warehouseName}</p>
                </div>
              </div>

              {/* Technician Info */}
              <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">الفني</p>
                  <p className="text-lg font-bold text-gray-800">{operationGroup.technicianName}</p>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center gap-4 bg-purple-50 rounded-xl p-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">تاريخ الطلب</p>
                  <p className="text-lg font-bold text-gray-800">
                    {new Date(operationGroup.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric'
                    })}, {new Date(operationGroup.createdAt).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>

              {/* Responded Date */}
              {operationGroup.respondedAt && (
                <div className="flex items-center gap-4 bg-green-50 rounded-xl p-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">تاريخ المعالجة</p>
                    <p className="text-lg font-bold text-gray-800">
                      {new Date(operationGroup.respondedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}, {new Date(operationGroup.respondedAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {operationGroup.notes && (
              <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-700 mb-2">ملاحظات:</p>
                <p className="text-blue-800">{operationGroup.notes}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {operationGroup.status === 'rejected' && operationGroup.rejectionReason && (
              <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-700 mb-2">سبب الرفض:</p>
                <p className="text-red-800">{operationGroup.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="shadow-xl border-[#18B2B0]/20 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50 border-b border-[#18B2B0]/10">
            <CardTitle className="text-2xl text-[#18B2B0] flex items-center gap-2">
              <Package className="h-6 w-6" />
              المنتجات ({operationGroup.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="border-[#18B2B0]/20 bg-[#18B2B0]/5">
                  <TableHead className="text-right font-bold text-[#18B2B0]">#</TableHead>
                  <TableHead className="text-right font-bold text-[#18B2B0]">اسم المنتج</TableHead>
                  <TableHead className="text-right font-bold text-[#18B2B0]">نوع التغليف</TableHead>
                  <TableHead className="text-right font-bold text-[#18B2B0]">الكمية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operationGroup.items.map((item: any, index: number) => (
                  <TableRow key={item.id} className="hover:bg-[#18B2B0]/5 transition-colors">
                    <TableCell className="font-semibold text-gray-700">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-800">{item.itemNameAr}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#18B2B0]">
                        {item.packagingType === 'box' ? 'كرتونة' : 'قطعة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[#18B2B0]" />
                        <span className="font-bold text-[#18B2B0] text-lg">{item.quantity}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary */}
            <div className="mt-6 bg-gradient-to-r from-[#18B2B0]/10 to-teal-50/50 rounded-xl p-4 border-2 border-[#18B2B0]/20">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">إجمالي المنتجات:</span>
                <Badge className="bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white text-xl px-4 py-2">
                  {operationGroup.items.length} منتج
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </NeoShellLayout>
  );
}
