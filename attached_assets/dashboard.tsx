import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import dashboardBg from "@assets/image_1762515061799.png";
import rasscoLogo from "@assets/image_1762442473114.png";
import type { TechnicianWithBothInventories, WarehouseWithStats, TechnicianFixedInventory, TechnicianInventory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Battery,
  Bell,
  CheckCircle,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Package,
  Smartphone,
  TruckIcon,
  User,
  UserCircle,
  Users,
  Warehouse,
  Search,
  FileDown
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { GridBackground } from "@/components/dashboard/GridBackground";
import { Navbar } from "@/components/dashboard/Navbar";
import { InventoryPieCard } from "@/components/dashboard/InventoryPieCard";
import { InventoryBarCard } from "@/components/dashboard/InventoryBarCard";
import { TechnicianDashboardCard } from "@/components/dashboard/TechnicianDashboardCard";
import { WarehouseDashboardCard } from "@/components/dashboard/WarehouseDashboardCard";
import { CompactWarehouseCard } from "@/components/dashboard/CompactWarehouseCard";
import { ProductCard } from "@/components/dashboard/ProductCard";
import { GlobalInventoryChart } from "@/components/dashboard/GlobalInventoryChart";
import RequestInventoryModal from "@/components/request-inventory-modal";
import { CreditCard, FileText, Sticker } from "lucide-react";
import { getRoleLabel } from "@shared/roles";
import { useActiveItemTypes, getItemTypeVisuals, getInventoryValueForItemType, legacyFieldMapping, InventoryEntry } from "@/hooks/use-item-types";

interface WarehouseTransfer {
  id: string;
  technicianId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRequestInventoryModal, setShowRequestInventoryModal] = useState(false);
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState("");
  const [technicianSearchQuery, setTechnicianSearchQuery] = useState("");

  const { data: itemTypes } = useActiveItemTypes();

  const getInventoryValue = (inv: any, entries: InventoryEntry[] | undefined, itemTypeId: string, field: 'boxes' | 'units'): number => {
    return getInventoryValueForItemType(itemTypeId, entries, inv, field);
  };

  const { data: pendingTransfers = [] } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
    enabled: !!user?.id && user?.role !== 'admin',
    select: (data) => data.filter(t => t.status === 'pending'),
  });

  const { data: techniciansData } = useQuery<{ technicians: TechnicianWithBothInventories[] }>({
    queryKey: user?.role === 'admin' ? ["/api/admin/all-technicians-inventory"] : ["/api/supervisor/technicians-inventory"],
    enabled: !!user?.id && (user?.role === 'admin' || user?.role === 'supervisor'),
  });

  const { data: warehousesData } = useQuery<WarehouseWithStats[]>({
    queryKey: user?.role === 'admin' ? ["/api/warehouses"] : ["/api/supervisor/warehouses"],
    enabled: !!user?.id && (user?.role === 'admin' || user?.role === 'supervisor'),
  });

  const { data: myFixedInventory = null, isLoading: fixedLoading } = useQuery<TechnicianFixedInventory | null>({
    queryKey: ["/api/my-fixed-inventory"],
    enabled: !!user?.id,
  });

  const { data: myMovingInventory = null, isLoading: movingLoading } = useQuery<TechnicianInventory | null>({
    queryKey: ["/api/my-moving-inventory"],
    enabled: !!user?.id,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // حساب إجمالي المخزون الثابت
  const getFixedInventoryTotal = () => {
    const activeTypes = itemTypes?.filter(t => t.isActive && t.isVisible) || [];
    
    // إذا كان المستخدم Admin أو Supervisor، احسب إجمالي المخزون الثابت لجميع الفنيين
    if ((user?.role === 'admin' || user?.role === 'supervisor') && techniciansData?.technicians) {
      return techniciansData.technicians.reduce((total, tech) => {
        if (!tech.fixedInventory) return total;
        const entries = (tech.fixedInventory as any)?.entries;
        return total + activeTypes.reduce((sum, itemType) => {
          return sum + getInventoryValue(tech.fixedInventory, entries, itemType.id, 'boxes') + 
                       getInventoryValue(tech.fixedInventory, entries, itemType.id, 'units');
        }, 0);
      }, 0);
    }
    
    // للفنيين، احسب المخزون الشخصي
    if (!myFixedInventory) return 0;
    const entries = (myFixedInventory as any)?.entries;
    return activeTypes.reduce((sum, itemType) => {
      return sum + getInventoryValue(myFixedInventory, entries, itemType.id, 'boxes') + 
                   getInventoryValue(myFixedInventory, entries, itemType.id, 'units');
    }, 0);
  };

  // حساب إجمالي المخزون المتحرك
  const getMovingInventoryTotal = () => {
    const activeTypes = itemTypes?.filter(t => t.isActive && t.isVisible) || [];
    
    // إذا كان المستخدم Admin أو Supervisor، احسب إجمالي المخزون المتحرك لجميع الفنيين
    if ((user?.role === 'admin' || user?.role === 'supervisor') && techniciansData?.technicians) {
      return techniciansData.technicians.reduce((total, tech) => {
        if (!tech.movingInventory) return total;
        const entries = (tech.movingInventory as any)?.entries;
        return total + activeTypes.reduce((sum, itemType) => {
          return sum + getInventoryValue(tech.movingInventory, entries, itemType.id, 'boxes') + 
                       getInventoryValue(tech.movingInventory, entries, itemType.id, 'units');
        }, 0);
      }, 0);
    }
    
    // للفنيين، احسب المخزون الشخصي
    if (!myMovingInventory) return 0;
    const entries = (myMovingInventory as any)?.entries;
    return activeTypes.reduce((sum, itemType) => {
      return sum + getInventoryValue(myMovingInventory, entries, itemType.id, 'boxes') + 
                   getInventoryValue(myMovingInventory, entries, itemType.id, 'units');
    }, 0);
  };

  // إنشاء object مجمّع لجميع المخزون الثابت (للأدمن والمشرف) - مع memoization
  const aggregatedFixedInventory = useMemo(() => {
    const activeTypes = itemTypes?.filter(t => t.isActive && t.isVisible) || [];
    
    if ((user?.role === 'admin' || user?.role === 'supervisor') && techniciansData?.technicians) {
      const agg: Record<string, number> = {};
      techniciansData.technicians.forEach(tech => {
        if (!tech.fixedInventory) return;
        const entries = (tech.fixedInventory as any)?.entries;
        activeTypes.forEach(itemType => {
          const legacy = legacyFieldMapping[itemType.id];
          if (legacy) {
            agg[legacy.boxes] = (agg[legacy.boxes] || 0) + getInventoryValue(tech.fixedInventory, entries, itemType.id, 'boxes');
            agg[legacy.units] = (agg[legacy.units] || 0) + getInventoryValue(tech.fixedInventory, entries, itemType.id, 'units');
          }
        });
      });
      return agg as Partial<TechnicianFixedInventory>;
    }
    return myFixedInventory;
  }, [user?.role, techniciansData?.technicians, myFixedInventory, itemTypes]);

  // إنشاء object مجمّع لجميع المخزون المتحرك (للأدمن والمشرف) - مع memoization
  const aggregatedMovingInventory = useMemo(() => {
    const activeTypes = itemTypes?.filter(t => t.isActive && t.isVisible) || [];
    
    if ((user?.role === 'admin' || user?.role === 'supervisor') && techniciansData?.technicians) {
      const agg: Record<string, number> = {};
      techniciansData.technicians.forEach(tech => {
        if (!tech.movingInventory) return;
        const entries = (tech.movingInventory as any)?.entries;
        activeTypes.forEach(itemType => {
          const legacy = legacyFieldMapping[itemType.id];
          if (legacy) {
            agg[legacy.boxes] = (agg[legacy.boxes] || 0) + getInventoryValue(tech.movingInventory, entries, itemType.id, 'boxes');
            agg[legacy.units] = (agg[legacy.units] || 0) + getInventoryValue(tech.movingInventory, entries, itemType.id, 'units');
          }
        });
      });
      return agg as Partial<TechnicianInventory>;
    }
    return myMovingInventory;
  }, [user?.role, techniciansData?.technicians, myMovingInventory, itemTypes]);

  // فلترة المستودعات بناءً على البحث
  const filteredWarehouses = useMemo(() => {
    if (!warehousesData) return [];
    if (!warehouseSearchQuery.trim()) return warehousesData;
    
    const query = warehouseSearchQuery.toLowerCase().trim();
    return warehousesData.filter(warehouse => 
      warehouse.name.toLowerCase().includes(query) ||
      (warehouse.location && warehouse.location.toLowerCase().includes(query))
    );
  }, [warehousesData, warehouseSearchQuery]);

  // فلترة الفنيين بناءً على البحث
  const filteredTechnicians = useMemo(() => {
    if (!techniciansData?.technicians) return [];
    if (!technicianSearchQuery.trim()) return techniciansData.technicians;
    
    const query = technicianSearchQuery.toLowerCase().trim();
    return techniciansData.technicians.filter(tech => 
      tech.technicianName.toLowerCase().includes(query) ||
      tech.city.toLowerCase().includes(query)
    );
  }, [techniciansData?.technicians, technicianSearchQuery]);

  // Helper function to get total
  const getTotalForItem = (boxes: number, units: number) => {
    return (boxes || 0) + (units || 0);
  };

  // Create inventory worksheet (Fixed/Moving, Boxes/Units)
  const createInventoryWorksheet = (
    workbook: ExcelJS.Workbook, 
    sheetName: string, 
    inventoryType: 'fixed' | 'moving',
    metric: 'boxes' | 'units'
  ) => {
    if (!techniciansData?.technicians) return;
    
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.views = [{ rightToLeft: true }];

    const currentDate = new Date();
    const arabicDate = currentDate.toLocaleDateString('ar-SA', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const englishDate = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const time = currentDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    const numCols = 12;
    worksheet.mergeCells(1, 1, 1, numCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = 'Technician Inventory Management System';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells(2, 1, 2, numCols);
    const dateCell = worksheet.getCell(2, 1);
    dateCell.value = `تاريخ التقرير: ${arabicDate} | Report Date: ${englishDate} | ${time}`;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.font = { bold: true, size: 10 };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]);

    const metricLabel = metric === 'boxes' ? 'Box' : 'Unit';
    const headerRow = worksheet.addRow([
      '#',
      'Technician Name',
      'City',
      `N950 ${metricLabel}`,
      `I9000s ${metricLabel}`,
      `I9100 ${metricLabel}`,
      `Roll ${metricLabel}`,
      `Sticker ${metricLabel}`,
      `Battery ${metricLabel}`,
      `Mobily ${metricLabel}`,
      `STC ${metricLabel}`,
      `Zain ${metricLabel}`
    ]);
    
    headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 30;
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

    let totals = {
      n950: 0,
      i9000s: 0,
      i9100: 0,
      roll: 0,
      sticker: 0,
      battery: 0,
      mobily: 0,
      stc: 0,
      zain: 0
    };

    techniciansData.technicians.forEach((tech, index) => {
      const inv = inventoryType === 'fixed' ? tech.fixedInventory : tech.movingInventory;
      
      const data = [
        index + 1,
        tech.technicianName,
        tech.city,
        metric === 'boxes' ? (inv?.n950Boxes || 0) : (inv?.n950Units || 0),
        metric === 'boxes' ? (inv?.i9000sBoxes || 0) : (inv?.i9000sUnits || 0),
        metric === 'boxes' ? (inv?.i9100Boxes || 0) : (inv?.i9100Units || 0),
        metric === 'boxes' ? (inv?.rollPaperBoxes || 0) : (inv?.rollPaperUnits || 0),
        metric === 'boxes' ? (inv?.stickersBoxes || 0) : (inv?.stickersUnits || 0),
        metric === 'boxes' ? (inv?.newBatteriesBoxes || 0) : (inv?.newBatteriesUnits || 0),
        metric === 'boxes' ? (inv?.mobilySimBoxes || 0) : (inv?.mobilySimUnits || 0),
        metric === 'boxes' ? (inv?.stcSimBoxes || 0) : (inv?.stcSimUnits || 0),
        metric === 'boxes' ? (inv?.zainSimBoxes || 0) : (inv?.zainSimUnits || 0)
      ];

      totals.n950 += Number(data[3]);
      totals.i9000s += Number(data[4]);
      totals.i9100 += Number(data[5]);
      totals.roll += Number(data[6]);
      totals.sticker += Number(data[7]);
      totals.battery += Number(data[8]);
      totals.mobily += Number(data[9]);
      totals.stc += Number(data[10]);
      totals.zain += Number(data[11]);

      const row = worksheet.addRow(data);
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 20;
      
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
        if (colNumber === 1) cell.font = { bold: true };
      });
    });

    const totalRow = worksheet.addRow([
      '',
      'Total',
      '',
      totals.n950,
      totals.i9000s,
      totals.i9100,
      totals.roll,
      totals.sticker,
      totals.battery,
      totals.mobily,
      totals.stc,
      totals.zain
    ]);
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

    worksheet.columns = [
      { width: 5 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];
  };

  // Create total worksheet (combined fixed + moving)
  const createTotalWorksheet = (workbook: ExcelJS.Workbook, sheetName: string) => {
    if (!techniciansData?.technicians) return;
    
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.views = [{ rightToLeft: true }];

    const currentDate = new Date();
    const arabicDate = currentDate.toLocaleDateString('ar-SA', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const englishDate = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const time = currentDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Technician Inventory Management System';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:L2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `تاريخ التقرير: ${arabicDate} | Report Date: ${englishDate} | ${time}`;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.font = { bold: true, size: 10 };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      '#',
      'Technician Name',
      'City',
      'N950 Devices',
      'I9000s Devices',
      'I9100 Devices',
      'Roll Sheets',
      'Madal Stickers',
      'New Batteries',
      'SIM Mobily',
      'SIM STC',
      'SIM Zain'
    ]);
    
    headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 30;
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

    let totals = {
      n950: 0,
      i9000s: 0,
      i9100: 0,
      rollPaper: 0,
      stickers: 0,
      newBatteries: 0,
      mobilySim: 0,
      stcSim: 0,
      zainSim: 0
    };

    techniciansData.technicians.forEach((tech, index) => {
      const data = [
        index + 1,
        tech.technicianName,
        tech.city,
        getTotalForItem(
          (tech.fixedInventory?.n950Boxes || 0) + (tech.movingInventory?.n950Boxes || 0),
          (tech.fixedInventory?.n950Units || 0) + (tech.movingInventory?.n950Units || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.i9000sBoxes || 0) + (tech.movingInventory?.i9000sBoxes || 0),
          (tech.fixedInventory?.i9000sUnits || 0) + (tech.movingInventory?.i9000sUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.i9100Boxes || 0) + (tech.movingInventory?.i9100Boxes || 0),
          (tech.fixedInventory?.i9100Units || 0) + (tech.movingInventory?.i9100Units || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.rollPaperBoxes || 0) + (tech.movingInventory?.rollPaperBoxes || 0),
          (tech.fixedInventory?.rollPaperUnits || 0) + (tech.movingInventory?.rollPaperUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.stickersBoxes || 0) + (tech.movingInventory?.stickersBoxes || 0),
          (tech.fixedInventory?.stickersUnits || 0) + (tech.movingInventory?.stickersUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.newBatteriesBoxes || 0) + (tech.movingInventory?.newBatteriesBoxes || 0),
          (tech.fixedInventory?.newBatteriesUnits || 0) + (tech.movingInventory?.newBatteriesUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.mobilySimBoxes || 0) + (tech.movingInventory?.mobilySimBoxes || 0),
          (tech.fixedInventory?.mobilySimUnits || 0) + (tech.movingInventory?.mobilySimUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.stcSimBoxes || 0) + (tech.movingInventory?.stcSimBoxes || 0),
          (tech.fixedInventory?.stcSimUnits || 0) + (tech.movingInventory?.stcSimUnits || 0)
        ),
        getTotalForItem(
          (tech.fixedInventory?.zainSimBoxes || 0) + (tech.movingInventory?.zainSimBoxes || 0),
          (tech.fixedInventory?.zainSimUnits || 0) + (tech.movingInventory?.zainSimUnits || 0)
        )
      ];

      totals.n950 += Number(data[3]);
      totals.i9000s += Number(data[4]);
      totals.i9100 += Number(data[5]);
      totals.rollPaper += Number(data[6]);
      totals.stickers += Number(data[7]);
      totals.newBatteries += Number(data[8]);
      totals.mobilySim += Number(data[9]);
      totals.stcSim += Number(data[10]);
      totals.zainSim += Number(data[11]);

      const row = worksheet.addRow(data);
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 20;
      
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
        if (colNumber === 1) cell.font = { bold: true };
      });
    });

    const totalRow = worksheet.addRow([
      '',
      'Total',
      '',
      totals.n950.toFixed(1),
      totals.i9000s.toFixed(1),
      totals.i9100.toFixed(1),
      totals.rollPaper,
      totals.stickers,
      totals.newBatteries,
      totals.mobilySim,
      totals.stcSim,
      totals.zainSim
    ]);
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

    worksheet.columns = [
      { width: 5 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];
  };

  // Export technicians inventory to Excel with 5 sheets
  const exportTechniciansToExcel = async () => {
    if (!techniciansData?.technicians || techniciansData.technicians.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    
    createTotalWorksheet(workbook, 'مخزون شامل - Total');
    createInventoryWorksheet(workbook, 'ثابت كراتين - Fixed Boxes', 'fixed', 'boxes');
    createInventoryWorksheet(workbook, 'ثابت مفردات - Fixed Units', 'fixed', 'units');
    createInventoryWorksheet(workbook, 'متحرك كراتين - Moving Boxes', 'moving', 'boxes');
    createInventoryWorksheet(workbook, 'متحرك مفردات - Moving Units', 'moving', 'units');

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `تقرير_المخزون_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // حساب إجمالي وحدات المستودع
  const getWarehouseTotalUnits = (warehouse: WarehouseWithStats) => {
    if (!warehouse.inventory) return 0;
    const inv = warehouse.inventory;
    return (
      (inv.n950Boxes || 0) + (inv.n950Units || 0) +
      (inv.i9000sBoxes || 0) + (inv.i9000sUnits || 0) +
      (inv.i9100Boxes || 0) + (inv.i9100Units || 0) +
      (inv.rollPaperBoxes || 0) + (inv.rollPaperUnits || 0) +
      (inv.stickersBoxes || 0) + (inv.stickersUnits || 0) +
      (inv.newBatteriesBoxes || 0) + (inv.newBatteriesUnits || 0) +
      (inv.mobilySimBoxes || 0) + (inv.mobilySimUnits || 0) +
      (inv.stcSimBoxes || 0) + (inv.stcSimUnits || 0) +
      (inv.zainSimBoxes || 0) + (inv.zainSimUnits || 0)
    );
  };


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
                  {t('dashboard.app_name')}
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
                      {getRoleLabel(user?.role || '')}
                    </p>
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#0f0f15] border-[#18B2B0]/20 backdrop-blur-xl" align="start">
                <DropdownMenuLabel className="text-white">{t('dashboard.account')}</DropdownMenuLabel>
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
                    <span className="font-medium">{t('logout')}</span>
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
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-8"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-[#18B2B0] to-white bg-clip-text text-transparent px-4">
            {t('dashboard.welcome')}, {user?.fullName}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base">
            {user?.role === 'admin' ? t('dashboard.admin_panel') : t('dashboard.personal_panel')}
          </p>
          
          {/* زر طلب مخزون للفنيين فقط */}
          {user?.role === 'technician' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 md:mt-6"
            >
              <Button
                onClick={() => setShowRequestInventoryModal(true)}
                className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 text-white px-6 py-4 md:px-8 md:py-6 text-base md:text-lg shadow-lg shadow-[#18B2B0]/20"
                data-testid="button-request-inventory"
              >
                <Package className="h-4 w-4 md:h-5 md:w-5 ml-2" />
                {t('actions.request_inventory')}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* المخزون الثابت والمتحرك - للفني فقط */}
        {user?.role === 'technician' && (
          <Tabs defaultValue="fixed" className="w-full" dir="rtl">
            {/* Tab Bar - Sticky */}
            <div className="sticky top-0 z-20 bg-gradient-to-b from-[#1a1625] via-[#1a1625]/95 to-transparent pb-4 mb-6">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-xl border border-white/20 h-12 md:h-14 p-1">
                <TabsTrigger 
                  value="fixed" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-white text-gray-300 font-bold text-sm md:text-base transition-all duration-300"
                >
                  <Package className="h-4 w-4 ml-2" />
                  {t('dashboard.fixed_inventory')}
                </TabsTrigger>
                <TabsTrigger 
                  value="moving" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-gray-300 font-bold text-sm md:text-base transition-all duration-300"
                >
                  <TruckIcon className="h-4 w-4 ml-2" />
                  {t('dashboard.moving_inventory')}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content - Fixed Inventory */}
            <TabsContent value="fixed" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
              >
                <div className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-2xl md:rounded-3xl border border-[#18B2B0]/30 p-4 md:p-6 overflow-hidden shadow-2xl mb-4 md:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 to-transparent" />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 5, 0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="p-3 bg-gradient-to-br from-[#18B2B0] to-teal-600 rounded-xl shadow-lg"
                      >
                        <Package className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white">{t('dashboard.fixed_inventory')}</h3>
                        <p className="text-gray-400 text-xs md:text-sm">{t('dashboard.all_fixed_products')}</p>
                      </div>
                    </div>
                    <Link href="/my-fixed-inventory">
                      <Button size="sm" className="bg-[#18B2B0] hover:bg-[#159a98] shadow-lg">
                        <span className="hidden sm:inline">{t('actions.view_details')}</span>
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

              {fixedLoading ? (
                <div className="text-center py-12 md:py-16">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-[#18B2B0]"></div>
                  <p className="text-gray-400 text-xs md:text-sm mt-4">{t('messages.loading_products')}</p>
                </div>
              ) : myFixedInventory && getFixedInventoryTotal() > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {(() => {
                    const fixedEntries = (myFixedInventory as any)?.entries;
                    return (
                      <>
                        <ProductCard
                          icon={<Smartphone className="h-6 w-6" />}
                          title="جهاز N950"
                          boxes={getInventoryValue(myFixedInventory, fixedEntries, 'n950', 'boxes')}
                          units={getInventoryValue(myFixedInventory, fixedEntries, 'n950', 'units')}
                          color="#3b82f6"
                          gradient="from-blue-500/20 via-blue-600/10 to-transparent"
                          index={0}
                        />
                        <ProductCard
                          icon={<Smartphone className="h-6 w-6" />}
                          title="جهاز i9000S"
                          boxes={getInventoryValue(myFixedInventory, fixedEntries, 'i9000s', 'boxes')}
                          units={getInventoryValue(myFixedInventory, fixedEntries, 'i9000s', 'units')}
                          color="#8b5cf6"
                          gradient="from-violet-500/20 via-violet-600/10 to-transparent"
                          index={1}
                        />
                        <ProductCard
                          icon={<Smartphone className="h-6 w-6" />}
                          title="جهاز i9100"
                          boxes={getInventoryValue(myFixedInventory, fixedEntries, 'i9100', 'boxes')}
                          units={getInventoryValue(myFixedInventory, fixedEntries, 'i9100', 'units')}
                          color="#06b6d4"
                          gradient="from-cyan-500/20 via-cyan-600/10 to-transparent"
                          index={2}
                        />
                        <ProductCard
                          icon={<FileText className="h-6 w-6" />}
                          title="ورق حراري"
                          boxes={getInventoryValue(myFixedInventory, fixedEntries, 'rollPaper', 'boxes')}
                          units={getInventoryValue(myFixedInventory, fixedEntries, 'rollPaper', 'units')}
                          color="#10b981"
                          gradient="from-emerald-500/20 via-emerald-600/10 to-transparent"
                          index={3}
                        />
                        <ProductCard
                          icon={<Sticker className="h-6 w-6" />}
                          title="ملصقات"
                          boxes={getInventoryValue(myFixedInventory, fixedEntries, 'stickers', 'boxes')}
                          units={getInventoryValue(myFixedInventory, fixedEntries, 'stickers', 'units')}
                          color="#f59e0b"
                          gradient="from-amber-500/20 via-amber-600/10 to-transparent"
                          index={4}
                        />
                        <ProductCard
                          icon={<Battery className="h-6 w-6" />}
                          title="بطاريات جديدة"
                          boxes={getInventoryValue(myFixedInventory, fixedEntries, 'newBatteries', 'boxes')}
                          units={getInventoryValue(myFixedInventory, fixedEntries, 'newBatteries', 'units')}
                          color="#eab308"
                          gradient="from-yellow-500/20 via-yellow-600/10 to-transparent"
                          index={5}
                        />
                        <ProductCard
                          icon={<CreditCard className="h-6 w-6" />}
                          title="شريحة موبايلي"
                          boxes={getInventoryValue(myFixedInventory, fixedEntries, 'mobilySim', 'boxes')}
                          units={getInventoryValue(myFixedInventory, fixedEntries, 'mobilySim', 'units')}
                          color="#22c55e"
                          gradient="from-green-500/20 via-green-600/10 to-transparent"
                          index={6}
                        />
                        <ProductCard
                          icon={<CreditCard className="h-6 w-6" />}
                          title="شريحة STC"
                          boxes={getInventoryValue(myFixedInventory, fixedEntries, 'stcSim', 'boxes')}
                          units={getInventoryValue(myFixedInventory, fixedEntries, 'stcSim', 'units')}
                          color="#a855f7"
                          gradient="from-purple-500/20 via-purple-600/10 to-transparent"
                          index={7}
                        />
                        <ProductCard
                          icon={<CreditCard className="h-6 w-6" />}
                          title="شريحة زين"
                          boxes={getInventoryValue(myFixedInventory, fixedEntries, 'zainSim', 'boxes')}
                          units={getInventoryValue(myFixedInventory, fixedEntries, 'zainSim', 'units')}
                          color="#ec4899"
                          gradient="from-pink-500/20 via-pink-600/10 to-transparent"
                          index={8}
                        />
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 md:py-16 bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-white/10">
                  <Package className="h-12 w-12 md:h-16 md:w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-base md:text-lg font-medium px-4">{t('dashboard.no_fixed_inventory')}</p>
                  <p className="text-gray-500 text-xs md:text-sm mt-2 px-4">{t('dashboard.request_inventory_hint')}</p>
                </div>
              )}
              </motion.div>
            </TabsContent>

            {/* Tab Content - Moving Inventory */}
            <TabsContent value="moving" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
              >
                <div className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-2xl md:rounded-3xl border border-emerald-500/30 p-4 md:p-6 overflow-hidden shadow-2xl mb-4 md:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 5, 0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg"
                      >
                        <TruckIcon className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white">{t('dashboard.moving_inventory')}</h3>
                        <p className="text-gray-400 text-xs md:text-sm">{t('dashboard.all_moving_products')}</p>
                      </div>
                    </div>
                    <Link href="/my-moving-inventory">
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 shadow-lg">
                        <span className="hidden sm:inline">{t('actions.view_details')}</span>
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

              {movingLoading ? (
                <div className="text-center py-12 md:py-16">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-emerald-500"></div>
                  <p className="text-gray-400 text-xs md:text-sm mt-4">{t('messages.loading_products')}</p>
                </div>
              ) : myMovingInventory && getMovingInventoryTotal() > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {itemTypes?.filter(t => t.isActive && t.isVisible).sort((a, b) => a.sortOrder - b.sortOrder).map((itemType, index) => {
                    const visuals = getItemTypeVisuals(itemType, index);
                    const IconComponent = visuals.icon;
                    const movingEntries = (myMovingInventory as any)?.entries;
                    return (
                      <ProductCard
                        key={itemType.id}
                        icon={<IconComponent className="h-6 w-6" />}
                        title={itemType.nameAr}
                        boxes={getInventoryValue(myMovingInventory, movingEntries, itemType.id, 'boxes')}
                        units={getInventoryValue(myMovingInventory, movingEntries, itemType.id, 'units')}
                        color={visuals.color}
                        gradient={`${visuals.gradient.replace('to-', 'to-transparent via-').split(' ')[0]}/20 via-${visuals.gradient.split(' ')[0].replace('from-', '').replace('-500', '-600')}/10 to-transparent`}
                        index={index}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 md:py-16 bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-white/10">
                  <TruckIcon className="h-12 w-12 md:h-16 md:w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-base md:text-lg font-medium px-4">{t('dashboard.no_moving_inventory')}</p>
                  <p className="text-gray-500 text-xs md:text-sm mt-2 px-4">{t('dashboard.moving_inventory_hint')}</p>
                </div>
              )}
              </motion.div>
            </TabsContent>
          </Tabs>
        )}

        {/* Global Inventory Chart - للأدمن والمشرف */}
        {(user?.role === 'admin' || user?.role === 'supervisor') && (
          <GlobalInventoryChart
            technicians={techniciansData?.technicians}
            warehouses={warehousesData}
          />
        )}

        {/* المستودعات - للأدمن والمشرف */}
        {(user?.role === 'admin' || user?.role === 'supervisor') && warehousesData && warehousesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl rounded-3xl border border-orange-500/30 p-6 md:p-8 overflow-hidden shadow-2xl mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
            
            <div className="relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Warehouse className="h-6 w-6 text-orange-500" />
                  <h2 className="text-xl md:text-2xl font-bold text-white">{t('dashboard.warehouses')}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 md:min-w-[300px]">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={t('dashboard.search_placeholder')}
                      value={warehouseSearchQuery}
                      onChange={(e) => setWarehouseSearchQuery(e.target.value)}
                      className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500/50"
                      data-testid="warehouse-search-input"
                    />
                  </div>
                  <Link href="/warehouses">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-sm md:text-base whitespace-nowrap">
                      {t('dashboard.warehouse_management')}
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {filteredWarehouses.length > 0 ? (
                <div className="space-y-4">
                  {filteredWarehouses.map((warehouse, index) => (
                    <CompactWarehouseCard
                      key={warehouse.id}
                      warehouse={warehouse}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <Warehouse className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-medium">{t('dashboard.no_warehouses_found')}</p>
                  <p className="text-gray-500 text-sm mt-2">{t('dashboard.try_other_search')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Dashboard - Charts - للفنيين فقط */}
        {user?.role === 'technician' && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <InventoryPieCard 
              fixedTotal={getFixedInventoryTotal()}
              movingTotal={getMovingInventoryTotal()}
            />
            <InventoryBarCard
              fixedInventory={aggregatedFixedInventory || undefined}
              movingInventory={aggregatedMovingInventory || undefined}
              title="تفاصيل المخزون حسب الفئة"
            />
          </div>
        )}

        {/* Technicians Dashboard */}
        {(user?.role === 'admin' || user?.role === 'supervisor') && techniciansData?.technicians && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-2xl shadow-lg"
                    animate={{ rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Users className="h-7 w-7 text-white drop-shadow-md" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{t('dashboard.technicians_panel')}</h2>
                    <p className="text-gray-400 text-sm">{t('dashboard.technicians_overview')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={exportTechniciansToExcel}
                    className="bg-gradient-to-r from-[#18B2B0] to-[#16a09e] hover:from-[#16a09e] hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                    data-testid="button-export-technicians"
                  >
                    <FileDown className="h-4 w-4 ml-2" />
                    {t('actions.export_excel')}
                  </Button>
                  <div className="relative flex-1 md:min-w-[300px]">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={t('dashboard.search_placeholder')}
                      value={technicianSearchQuery}
                      onChange={(e) => setTechnicianSearchQuery(e.target.value)}
                      className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#18B2B0]/50"
                      data-testid="technician-search-input"
                    />
                  </div>
                  <Badge className="bg-[#18B2B0]/20 text-[#18B2B0] border-[#18B2B0]/30 px-4 py-2 whitespace-nowrap">
                    {filteredTechnicians.length} {t('users.technician')}
                  </Badge>
                </div>
              </div>

              {filteredTechnicians.length > 0 ? (
                <div className="space-y-4">
                  {filteredTechnicians.map((tech, index) => (
                    <TechnicianDashboardCard 
                      key={tech.technicianId} 
                      technician={tech} 
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-medium">{t('dashboard.no_technicians_found')}</p>
                  <p className="text-gray-500 text-sm mt-2">{t('dashboard.try_other_search')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Request Inventory Modal */}
      <RequestInventoryModal 
        open={showRequestInventoryModal} 
        onOpenChange={setShowRequestInventoryModal} 
      />
    </div>
  );
}
