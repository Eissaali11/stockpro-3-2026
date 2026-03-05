import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { exportSingleWarehouseToExcel } from "@/lib/exportToExcel";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveItemTypes, buildInventoryDisplayItems, type InventoryEntry } from "@/hooks/use-item-types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Warehouse, 
  MapPin, 
  Package,
  Trash2,
  ArrowRight,
  Box,
  FileText,
  Sticker,
  Battery,
  Smartphone,
  Send,
  History,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  XCircle,
  Search,
  AlertTriangle,
  Download,
  FileDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import UpdateWarehouseInventoryModal from "@/components/update-warehouse-inventory-modal";
import TransferFromWarehouseModal from "@/components/transfer-from-warehouse-modal";
import { GridBackground } from "@/components/dashboard/GridBackground";
import { Navbar } from "@/components/dashboard/Navbar";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import dashboardBg from "@assets/image_1762515061799.png";
import rasscoLogo from "@assets/image_1762442473114.png";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, UserCircle, LogOut } from "lucide-react";

interface WarehouseInventory {
  id: string;
  warehouseId: string;
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

interface WarehouseData {
  id: string;
  name: string;
  location: string;
  description: string | null;
  isActive: boolean;
  regionId: string | null;
  inventory: WarehouseInventory | null;
  technicians?: {
    id: string;
    fullName: string;
    username?: string;
    city?: string | null;
    profileImage?: string | null;
  }[];
}

interface WarehouseTransferRaw {
  id: string;
  warehouseId: string;
  technicianId: string;
  technicianName: string;
  itemType: string;
  packagingType: string;
  quantity: number;
  performedBy: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  respondedAt?: string;
  createdAt: string;
}

interface WarehouseTransfer {
  id: string;
  allIds: string[];
  warehouseId: string;
  technicianId: string;
  technicianName: string;
  n950?: number;
  n950PackagingType?: string;
  i9000s?: number;
  i9000sPackagingType?: string;
  i9100?: number;
  i9100PackagingType?: string;
  rollPaper?: number;
  rollPaperPackagingType?: string;
  stickers?: number;
  stickersPackagingType?: string;
  newBatteries?: number;
  newBatteriesPackagingType?: string;
  mobilySim?: number;
  mobilySimPackagingType?: string;
  stcSim?: number;
  stcSimPackagingType?: string;
  zainSim?: number;
  zainSimPackagingType?: string;
  lebaraSim?: number;
  lebaraSimPackagingType?: string;
  lebara?: number;
  lebaraPackagingType?: string;
  notes?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  respondedAt?: string;
  createdAt: string;
}

export default function WarehouseDetailsPage() {
  const [, params] = useRoute("/warehouses/:id");
  const warehouseId = params?.id || "";
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showUpdateInventoryModal, setShowUpdateInventoryModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteTransfersDialog, setShowDeleteTransfersDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransferIds, setSelectedTransferIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const { data: warehouse, isLoading: warehouseLoading } = useQuery<WarehouseData>({
    queryKey: ["/api/warehouses", warehouseId],
    enabled: !!warehouseId,
  });

  const { data: itemTypesData, isLoading: itemTypesLoading } = useActiveItemTypes();

  const { data: inventoryEntriesData } = useQuery<InventoryEntry[]>({
    queryKey: ["/api/warehouses", warehouseId, "inventory-entries"],
    enabled: !!warehouseId,
  });

  const { data: rawTransfers, isLoading: transfersLoading } = useQuery<WarehouseTransferRaw[]>({
    queryKey: ["/api/warehouse-transfers"],
  });

  const allTransfers: WarehouseTransfer[] = rawTransfers ? (() => {
    const filtered = rawTransfers.filter((t) => t.warehouseId === warehouseId);
    
    const grouped = filtered.reduce((acc, transfer) => {
      const timestamp = new Date(transfer.createdAt).getTime();
      const timeWindow = Math.floor(timestamp / 10000);
      const key = `${transfer.technicianId}-${timeWindow}-${transfer.performedBy}-${transfer.status}-${transfer.notes || 'no-notes'}`;
      
      if (!acc[key]) {
        acc[key] = {
          id: transfer.id,
          allIds: [],
          warehouseId: transfer.warehouseId,
          technicianId: transfer.technicianId,
          technicianName: transfer.technicianName,
          notes: transfer.notes,
          status: transfer.status,
          rejectionReason: transfer.rejectionReason,
          respondedAt: transfer.respondedAt,
          createdAt: transfer.createdAt,
        } as WarehouseTransfer;
      }
      
      acc[key].allIds.push(transfer.id);
      (acc[key] as any)[transfer.itemType] = transfer.quantity;
      (acc[key] as any)[`${transfer.itemType}PackagingType`] = transfer.packagingType;
      
      return acc;
    }, {} as Record<string, WarehouseTransfer>);
    
    return Object.values(grouped);
  })() : [];

  const transfers = allTransfers.filter(transfer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      transfer.technicianName.toLowerCase().includes(query) ||
      (transfer.notes && transfer.notes.toLowerCase().includes(query))
    );
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/warehouses/${warehouseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "تم حذف المستودع",
        description: "تم حذف المستودع بنجاح",
      });
      window.location.href = "/warehouses";
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف المستودع",
        variant: "destructive",
      });
    },
  });

  const deleteTransfersMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest("DELETE", "/api/warehouse-transfers", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setSelectedTransferIds(new Set());
      setShowDeleteTransfersDialog(false);
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف السجلات المحددة",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف السجلات",
        variant: "destructive",
      });
    },
  });

  const exportTransferToPDF = async (transfer: WarehouseTransfer) => {
    const transferDate = new Date(transfer.createdAt);
    const statusText = transfer.status === 'pending' ? 'معلقة' : transfer.status === 'accepted' ? 'مقبولة' : 'مرفوضة';
    const statusColor = transfer.status === 'accepted' ? '#22c55e' : transfer.status === 'rejected' ? '#ef4444' : '#eab308';
    
    // Legacy item type mapping for Arabic names
    const legacyItemNames: Record<string, { name: string; nameAr: string }> = {
      'n950': { name: 'N950', nameAr: 'N950' },
      'i9000s': { name: 'I9000s', nameAr: 'I9000s' },
      'i9100': { name: 'I9100', nameAr: 'I9100' },
      'rollPaper': { name: 'Roll Paper', nameAr: 'ورق رول' },
      'stickers': { name: 'Stickers', nameAr: 'ملصقات' },
      'newBatteries': { name: 'Batteries', nameAr: 'بطاريات' },
      'mobilySim': { name: 'Mobily SIM', nameAr: 'شريحة موبايلي' },
      'stcSim': { name: 'STC SIM', nameAr: 'شريحة STC' },
      'zainSim': { name: 'Zain SIM', nameAr: 'شريحة زين' },
      'lebaraSim': { name: 'Lebara SIM', nameAr: 'شريحة ليبارا' },
      'lebara': { name: 'Lebara SIM', nameAr: 'شريحة ليبارا' },
    };
    
    const items: {name: string, nameAr: string, quantity: number, type: string}[] = [];
    
    // Check all item types dynamically from transfer object
    const transferObj = transfer as any;
    
    // Get all keys from transfer object (dynamic item types)
    const transferKeys = Object.keys(transferObj).filter(
      k => !['id', 'allIds', 'warehouseId', 'technicianId', 'technicianName', 
             'notes', 'status', 'rejectionReason', 'respondedAt', 'createdAt'].includes(k) 
           && !k.endsWith('PackagingType')
    );
    
    // Check each key and find matching item type
    transferKeys.forEach(key => {
      const quantity = transferObj[key];
      const packagingType = transferObj[`${key}PackagingType`];
      
      if (quantity && quantity > 0) {
        // Try to find item type in dynamic list (case-insensitive)
        let itemName = key;
        let itemNameAr = key;
        
        if (itemTypesData) {
          const matchedType = itemTypesData.find(
            t => t.nameEn.toLowerCase() === key.toLowerCase() || t.id === key
          );
          if (matchedType) {
            itemName = matchedType.nameEn;
            itemNameAr = matchedType.nameAr;
          }
        }
        
        // Check legacy mapping
        if (legacyItemNames[key]) {
          itemName = legacyItemNames[key].name;
          itemNameAr = legacyItemNames[key].nameAr;
        }
        
        items.push({
          name: itemName,
          nameAr: itemNameAr,
          quantity: quantity,
          type: packagingType || 'box'
        });
      }
    });
    
    let totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    const container = document.createElement('div');
    container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 794px; background: white; font-family: "Noto Sans Arabic", Arial, sans-serif; direction: rtl;';
    
    container.innerHTML = `
      <div style="padding: 0;">
        <div style="background: linear-gradient(135deg, #18B2B0, #0f8a88); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">STOCKPRO</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">إيصال نقل المستودع</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-right: 4px solid #18B2B0;">
            <h3 style="color: #18B2B0; margin: 0 0 15px 0; font-size: 18px;">تفاصيل النقل</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px;">التاريخ:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">${transferDate.toLocaleDateString('ar-SA')} ${transferDate.toLocaleTimeString('ar-SA')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">الحالة:</td>
                <td style="padding: 8px 0;"><span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-weight: bold;">${statusText}</span></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">رقم العملية:</td>
                <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 12px;">${transfer.id}</td>
              </tr>
            </table>
          </div>
          
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; background: #f8f9fa; border-radius: 12px; padding: 20px; border-right: 4px solid #18B2B0;">
              <h3 style="color: #18B2B0; margin: 0 0 15px 0; font-size: 18px;">معلومات المستودع</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 80px;">الاسم:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${warehouse?.name || 'غير محدد'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">الموقع:</td>
                  <td style="padding: 8px 0; color: #333;">${warehouse?.location || 'غير محدد'}</td>
                </tr>
              </table>
            </div>
            
            <div style="flex: 1; background: #f8f9fa; border-radius: 12px; padding: 20px; border-right: 4px solid #18B2B0;">
              <h3 style="color: #18B2B0; margin: 0 0 15px 0; font-size: 18px;">معلومات الفني</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 80px;">الاسم:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${transfer.technicianName || 'غير محدد'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">المعرف:</td>
                  <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 11px;">${transfer.technicianId?.substring(0, 12) || 'غير محدد'}...</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-right: 4px solid #18B2B0;">
            <h3 style="color: #18B2B0; margin: 0 0 15px 0; font-size: 18px;">الأصناف المنقولة</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #18B2B0; color: white;">
                  <th style="padding: 12px; text-align: right; border-radius: 0 8px 0 0;">الصنف</th>
                  <th style="padding: 12px; text-align: center;">الكمية</th>
                  <th style="padding: 12px; text-align: center; border-radius: 8px 0 0 0;">النوع</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item, index) => `
                  <tr style="background: ${index % 2 === 0 ? 'white' : '#f0f0f0'};">
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.nameAr}</td>
                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee; font-weight: bold;">${item.quantity}</td>
                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.type === 'box' ? 'كرتون' : 'قطعة'}</td>
                  </tr>
                `).join('')}
                <tr style="background: #18B2B0; color: white; font-weight: bold;">
                  <td style="padding: 12px; border-radius: 0 0 8px 0;">الإجمالي</td>
                  <td style="padding: 12px; text-align: center;">${totalItems}</td>
                  <td style="padding: 12px; border-radius: 0 0 0 8px;"></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          ${transfer.notes ? `
          <div style="background: #fff3cd; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-right: 4px solid #ffc107;">
            <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">ملاحظات</h3>
            <p style="margin: 0; color: #856404;">${transfer.notes}</p>
          </div>
          ` : ''}
        </div>
        
        <div style="background: #18B2B0; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 12px;">STOCKPRO - نظام إدارة مخزون راس السعودية</p>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 11px;">تم الإنشاء: ${new Date().toLocaleString('ar-SA')}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (imgHeight <= pageHeight) {
        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;
        
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
          position = -pageHeight + (imgHeight - heightLeft - pageHeight);
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      const dateStr = transferDate.toISOString().split('T')[0];
      const fileName = `transfer_${dateStr}_${transfer.id.substring(0, 8)}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "تم التحميل بنجاح",
        description: "تم حفظ إيصال النقل",
      });
    } finally {
      document.body.removeChild(container);
    }
  };

  const inventoryItems = useMemo(() => {
    if (!itemTypesData) return [];
    return buildInventoryDisplayItems(
      itemTypesData,
      inventoryEntriesData || [],
      warehouse?.inventory as any
    );
  }, [itemTypesData, inventoryEntriesData, warehouse?.inventory]);

  const handleExportToExcel = async () => {
    if (!warehouse) return;

    const transfersData = allTransfers.map(transfer => {
      const items: string[] = [];
      const transferObj = transfer as any;
      
      // Legacy item type mapping
      const legacyItems: Record<string, string> = {
        'n950': 'N950', 'i9000s': 'I9000s', 'i9100': 'I9100',
        'rollPaper': 'ورق', 'stickers': 'ملصقات', 'newBatteries': 'بطاريات',
        'mobilySim': 'موبايلي', 'stcSim': 'STC', 'zainSim': 'زين',
        'lebaraSim': 'ليبارا', 'lebara': 'ليبارا'
      };
      
      // Get all keys from transfer object (dynamic item types)
      const transferKeys = Object.keys(transferObj).filter(
        k => !['id', 'allIds', 'warehouseId', 'technicianId', 'technicianName', 
               'notes', 'status', 'rejectionReason', 'respondedAt', 'createdAt'].includes(k) 
             && !k.endsWith('PackagingType')
      );
      
      // Check each key and find matching item type
      transferKeys.forEach(key => {
        const quantity = transferObj[key];
        const packagingType = transferObj[`${key}PackagingType`];
        
        if (quantity && quantity > 0) {
          // Try to find item type in dynamic list (case-insensitive)
          let itemName = key;
          if (itemTypesData) {
            const matchedType = itemTypesData.find(
              t => t.nameEn.toLowerCase() === key.toLowerCase() || t.id === key
            );
            if (matchedType) {
              itemName = matchedType.nameAr;
            }
          }
          
          // Check legacy mapping
          if (legacyItems[key]) {
            itemName = legacyItems[key];
          }
          
          items.push(`${itemName}: ${quantity} ${packagingType === 'box' ? 'كرتون' : 'قطعة'}`);
        }
      });

      const statusText = transfer.status === 'pending' ? 'معلقة' : 
                        transfer.status === 'accepted' ? 'مقبولة' : 'مرفوضة';

      return {
        technicianName: transfer.technicianName,
        items: items.join(' | '),
        status: statusText,
        createdAt: transfer.createdAt,
        notes: transfer.notes
      };
    });

    await exportSingleWarehouseToExcel({
      warehouse: {
        name: warehouse.name,
        location: warehouse.location,
        description: warehouse.description
      },
      inventory: warehouse.inventory,
      itemTypes: itemTypesData?.filter(t => t.isActive && t.isVisible),
      entries: inventoryEntriesData,
      transfers: transfersData
    });

    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير بيانات المستودع إلى ملف Excel",
    });
  };

  if (warehouseLoading) {
    return (
      <div
        className="min-h-screen text-white overflow-hidden relative"
        dir="rtl"
        style={{
          backgroundImage: `url(${dashboardBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/90 via-[#050508]/85 to-[#050508]/90 backdrop-blur-[2px] z-0" />
        <GridBackground />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full bg-white/10" />
            <Skeleton className="h-96 w-full bg-white/10" />
            <Skeleton className="h-96 w-full bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div
        className="min-h-screen text-white overflow-hidden relative flex items-center justify-center"
        dir="rtl"
        style={{
          backgroundImage: `url(${dashboardBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/90 via-[#050508]/85 to-[#050508]/90 backdrop-blur-[2px] z-0" />
        <GridBackground />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white mb-6">
            <Warehouse className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">المستودع غير موجود</h2>
          <Link href="/warehouses">
            <Button className="bg-gradient-to-r from-[#18B2B0] to-teal-500" data-testid="button-back-warehouses">
              العودة للمستودعات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalInventory = inventoryItems.reduce((sum, item) => sum + item.boxes + item.units, 0);

  return (
    <div
      className="min-h-screen text-white overflow-hidden relative"
      dir="rtl"
      style={{
        backgroundImage: `url(${dashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/90 via-[#050508]/85 to-[#050508]/90 backdrop-blur-[2px] z-0" />
      <GridBackground />

      {/* Header */}
      <div className="relative z-10 border-b border-[#18B2B0]/20 bg-gradient-to-r from-[#0a0a0f]/90 via-[#0f0f15]/90 to-[#0a0a0f]/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="relative p-3 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-lg"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(24, 178, 176, 0.3)",
                    "0 0 40px rgba(24, 178, 176, 0.5)",
                    "0 0 20px rgba(24, 178, 176, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <img src={rasscoLogo} alt="RASSCO" className="h-8 w-auto" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#18B2B0] via-[#0ea5a3] to-[#18B2B0] bg-clip-text text-transparent">
                  STOCKPRO نظام إدارة المخزون
                </h1>
                <p className="text-xs text-gray-400 font-mono">
                  {currentTime.toLocaleTimeString('ar-SA', { hour12: false })} • النظام متصل
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 transition-all border border-[#18B2B0]/20"
                  whileHover={{ scale: 1.05, borderColor: "rgba(24, 178, 176, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="button-user-avatar"
                >
                  <UserCircle className="h-5 w-5 text-[#18B2B0]" />
                  <div className="hidden sm:block text-right">
                    <p className="text-white font-semibold text-sm">{user?.fullName}</p>
                    <p className="text-gray-400 text-xs">
                      {user?.role === 'admin' ? 'مدير' : 'فني'}
                    </p>
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#0f0f15] border-[#18B2B0]/20 backdrop-blur-xl" align="start">
                <DropdownMenuLabel className="text-white">الحساب</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#18B2B0]/20" />
                <DropdownMenuItem className="cursor-default focus:bg-white/5">
                  <div className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4 text-[#18B2B0]" />
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium text-white">{user?.fullName}</p>
                      <p className="text-xs text-gray-400">@{user?.username}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-right focus:bg-red-500/20 text-red-400"
                  onClick={handleLogout}
                  data-testid="dropdown-logout"
                >
                  <div className="flex items-center gap-2 w-full justify-end">
                    <span className="font-medium">تسجيل الخروج</span>
                    <LogOut className="h-4 w-4" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Warehouse Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-[#18B2B0]/30 p-8 overflow-hidden shadow-2xl mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
          
          <motion.div
            className="absolute inset-0 rounded-3xl"
            animate={{
              boxShadow: [
                "0 0 30px rgba(24, 178, 176, 0.1)",
                "0 0 50px rgba(24, 178, 176, 0.2)",
                "0 0 30px rgba(24, 178, 176, 0.1)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <div className="relative">
            <Link href="/warehouses">
              <Button 
                variant="secondary" 
                className="mb-6 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                data-testid="button-back-warehouses"
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                <Warehouse className="h-4 w-4 ml-2" />
                العودة للمستودعات
              </Button>
            </Link>

            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Circular Progress */}
              <div className="flex-shrink-0">
                <CircularProgress
                  percentage={Math.min(100, (totalInventory / 1000) * 100)}
                  label={warehouse.name}
                  value={totalInventory.toString()}
                  color="#f97316"
                  size={180}
                />
              </div>

              {/* Warehouse Info */}
              <div className="flex-1 text-center lg:text-right">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                  <Warehouse className="h-8 w-8 text-[#18B2B0]" />
                  <h1 className="text-4xl font-bold text-white" data-testid="text-warehouse-name">
                    {warehouse.name}
                  </h1>
                  <Badge 
                    className={warehouse.isActive 
                      ? "bg-green-500/20 text-green-400 border-green-500/30" 
                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                    data-testid="badge-warehouse-status"
                  >
                    {warehouse.isActive ? "● نشط" : "○ غير نشط"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-400 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span data-testid="text-warehouse-location">{warehouse.location}</span>
                </div>

                {warehouse.description && (
                  <p className="text-gray-300 mb-4 max-w-2xl" data-testid="text-warehouse-description">
                    {warehouse.description}
                  </p>
                )}

                <div className="flex items-center justify-center lg:justify-start gap-2 text-[#18B2B0]">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-bold">إجمالي المخزون:</span>
                  <span className="text-2xl font-black">{totalInventory}</span>
                  <span>قطعة</span>
                </div>

                {/* Technicians list if provided by the API */}
                {warehouse.technicians && warehouse.technicians.length > 0 && (
                  <div className="mt-4 text-right">
                    <h3 className="text-white font-semibold mb-2">الفنيون المرتبطون</h3>
                    <div className="flex gap-2 flex-wrap justify-center lg:justify-start">
                      {warehouse.technicians.map((t) => (
                        <Link key={t.id} href={`/supervisor/users/${t.id}`}>
                          <Badge className="cursor-pointer" data-testid={`badge-tech-${t.id}`}>
                            {t.fullName}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center flex-wrap mt-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleExportToExcel}
                  disabled={!warehouse || warehouseLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                  data-testid="button-export-excel"
                >
                  <Download className="h-4 w-4 ml-2" />
                  تصدير Excel
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowUpdateInventoryModal(true)}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  data-testid="button-update-inventory"
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  تحديث المخزون
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600"
                  data-testid="button-transfer-to-technician"
                >
                  <Send className="h-4 w-4 ml-2" />
                  نقل إلى فني
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  data-testid="button-delete-warehouse"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف المستودع
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Inventory Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-[#18B2B0]/30 p-8 overflow-hidden shadow-2xl mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#18B2B0] to-teal-500">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">المخزون الحالي</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventoryItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 p-6 overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#18B2B0]/40 transition-all"
                  data-testid={`inventory-item-${index}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{
                      boxShadow: [
                        `0 0 20px ${item.color}20`,
                        `0 0 40px ${item.color}40`,
                        `0 0 20px ${item.color}20`,
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${item.gradient} text-white shadow-md`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-lg text-white">{item.nameAr}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                        <p className="text-xs text-gray-400 font-semibold mb-1">كراتين</p>
                        <p className="text-2xl font-black text-blue-400" data-testid={`boxes-${index}`}>{item.boxes}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
                        <p className="text-xs text-gray-400 font-semibold mb-1">وحدات</p>
                        <p className="text-2xl font-black text-purple-400" data-testid={`units-${index}`}>{item.units}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 text-center">
                      <p className="text-xs text-gray-400 font-semibold mb-1">الإجمالي</p>
                      <p className="text-3xl font-black bg-gradient-to-r from-[#18B2B0] to-teal-500 bg-clip-text text-transparent" data-testid={`total-${index}`}>
                        {item.boxes + item.units}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Transfer History */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-[#18B2B0]/30 p-8 overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
          
          <div className="relative">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-[#18B2B0] to-teal-500">
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">سجل النقل</h2>
                </div>
                <Badge className="bg-[#18B2B0] text-white">{allTransfers.length} عملية</Badge>
              </div>
              
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="ابحث عن عملية بالفني أو الملاحظات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#18B2B0] focus:ring-[#18B2B0]"
                    data-testid="input-search-transfers"
                  />
                </div>
                
                {selectedTransferIds.size > 0 && (
                  <Button
                    onClick={() => setShowDeleteTransfersDialog(true)}
                    variant="destructive"
                    className="flex items-center gap-2"
                    data-testid="button-delete-selected-transfers"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف ({selectedTransferIds.size})
                  </Button>
                )}
              </div>
            </div>

            {transfersLoading ? (
              <Skeleton className="h-64 w-full bg-white/10" />
            ) : transfers.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-white/10 to-white/5 mb-4">
                  <History className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-lg text-gray-400 font-semibold">
                  لا توجد عمليات نقل حتى الآن
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-right text-gray-400 w-12"></TableHead>
                      <TableHead className="text-right text-gray-400">الفني</TableHead>
                      <TableHead className="text-right text-gray-400">الأصناف</TableHead>
                      <TableHead className="text-right text-gray-400">الحالة</TableHead>
                      <TableHead className="text-right text-gray-400">التاريخ</TableHead>
                      <TableHead className="text-right text-gray-400">الملاحظات</TableHead>
                      <TableHead className="text-right text-gray-400">تصدير</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => {
                      // Build items array dynamically from itemTypesData
                      const items: Array<{name: string, quantity: number, type: string}> = [];
                      const transferObj = transfer as any;
                      
                      // Legacy item type mapping
                      const legacyItems: Record<string, string> = {
                        'n950': 'N950', 'i9000s': 'I9000s', 'i9100': 'I9100',
                        'rollPaper': 'ورق', 'stickers': 'ملصقات', 'newBatteries': 'بطاريات',
                        'mobilySim': 'موبايلي', 'stcSim': 'STC', 'zainSim': 'زين',
                        'lebaraSim': 'ليبارا', 'lebara': 'ليبارا'
                      };
                      
                      // Get all keys from transfer object (dynamic item types)
                      const transferKeys = Object.keys(transferObj).filter(
                        k => !['id', 'allIds', 'warehouseId', 'technicianId', 'technicianName', 
                               'notes', 'status', 'rejectionReason', 'respondedAt', 'createdAt'].includes(k) 
                             && !k.endsWith('PackagingType')
                      );
                      
                      // Check each key and find matching item type
                      transferKeys.forEach(key => {
                        const quantity = transferObj[key];
                        const packagingType = transferObj[`${key}PackagingType`];
                        
                        if (quantity && quantity > 0) {
                          // Try to find item type in dynamic list (case-insensitive)
                          let itemName = key;
                          if (itemTypesData) {
                            const matchedType = itemTypesData.find(
                              t => t.nameEn.toLowerCase() === key.toLowerCase() || t.id === key
                            );
                            if (matchedType) {
                              itemName = matchedType.nameAr;
                            }
                          }
                          
                          // Check legacy mapping
                          if (legacyItems[key]) {
                            itemName = legacyItems[key];
                          }
                          
                          items.push({
                            name: itemName,
                            quantity: quantity,
                            type: packagingType || 'box'
                          });
                        }
                      });

                      return (
                        <TableRow key={transfer.id} className="border-white/10 hover:bg-white/5 transition-colors">
                          <TableCell>
                            <Checkbox
                              checked={selectedTransferIds.has(transfer.id)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedTransferIds);
                                if (checked) {
                                  transfer.allIds.forEach(id => newSet.add(id));
                                } else {
                                  transfer.allIds.forEach(id => newSet.delete(id));
                                }
                                setSelectedTransferIds(newSet);
                              }}
                              className="border-white/20"
                            />
                          </TableCell>
                          <TableCell className="text-white font-medium">{transfer.technicianName}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {items.map((item, idx) => (
                                <Badge key={idx} className="bg-[#18B2B0]/20 text-[#18B2B0] border-[#18B2B0]/30 text-xs">
                                  {item.name}: {item.quantity} {item.type === 'box' ? 'كرتون' : 'قطعة'}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {transfer.status === 'pending' && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                <AlertTriangle className="h-3 w-3 ml-1" />
                                معلقة
                              </Badge>
                            )}
                            {transfer.status === 'accepted' && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="h-3 w-3 ml-1" />
                                مقبولة
                              </Badge>
                            )}
                            {transfer.status === 'rejected' && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                <XCircle className="h-3 w-3 ml-1" />
                                مرفوضة
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true, locale: ar })}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm max-w-xs truncate">
                            {transfer.notes || '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportTransferToPDF(transfer)}
                              className="text-[#18B2B0] hover:text-[#18B2B0]/80 hover:bg-[#18B2B0]/10"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <UpdateWarehouseInventoryModal
        open={showUpdateInventoryModal}
        onOpenChange={setShowUpdateInventoryModal}
        warehouseId={warehouseId}
        currentInventory={warehouse.inventory}
        currentEntries={inventoryEntriesData || []}
      />

      <TransferFromWarehouseModal
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        warehouseId={warehouseId}
        warehouseName={warehouse.name}
        currentInventory={warehouse.inventory}
        currentEntries={inventoryEntriesData || []}
        warehouseTechnicians={warehouse.technicians}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              سيتم حذف المستودع نهائياً ولن يمكن استرجاعه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWarehouseMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteTransfersDialog} onOpenChange={setShowDeleteTransfersDialog}>
        <AlertDialogContent className="bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف السجلات المحددة</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              سيتم حذف {selectedTransferIds.size} سجل نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTransfersMutation.mutate(Array.from(selectedTransferIds))}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
