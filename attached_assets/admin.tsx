import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, MapPin, Activity, Trash2, Edit, ArrowRight, LayoutDashboard, TrendingUp, Database, AlertTriangle, BarChart3, PieChart as PieChartIcon, Shield, CheckCircle, XCircle, Search, FileSpreadsheet } from "lucide-react";
import ExcelJS from 'exceljs';
import type { RegionWithStats, UserSafe, AdminStats, Region, InsertRegion, InsertUser, SystemLog } from "@shared/schema";
import { ROLES, ROLE_LABELS_AR } from "@shared/roles";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { StatsKpiCard } from "@/components/dashboard/stats-kpi-card";
import { TrendLineChart } from "@/components/dashboard/trend-line-chart";
import { StockCompositionPie } from "@/components/dashboard/stock-composition-pie";
import { RegionsBarChart } from "@/components/dashboard/regions-bar-chart";
import backgroundImage from "@assets/Gemini_Generated_Image_1iknau1iknau1ikn_1762469188250.png";

const regionFormSchema = z.object({
  name: z.string().min(1, "اسم المنطقة مطلوب"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const userFormSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  role: z.enum(["admin", "supervisor", "technician"]),
  regionId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function AdminPage() {
  const { toast } = useToast();
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editingUser, setEditingUser] = useState<UserSafe | null>(null);
  const [regionSearchTerm, setRegionSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: regions = [] } = useQuery<RegionWithStats[]>({
    queryKey: ["/api/regions"],
  });

  const { data: users = [] } = useQuery<UserSafe[]>({
    queryKey: ["/api/users"],
  });

  const { data: systemLogs = [] } = useQuery<SystemLog[]>({
    queryKey: ["/api/system-logs"],
  });

  const regionForm = useForm<z.infer<typeof regionFormSchema>>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      role: ROLES.TECHNICIAN,
      isActive: true,
    },
  });

  const createRegionMutation = useMutation({
    mutationFn: (data: InsertRegion) => apiRequest("POST", `/api/regions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowRegionModal(false);
      regionForm.reset();
      toast({ title: "تم إنشاء المنطقة بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء المنطقة", variant: "destructive" });
    },
  });

  const updateRegionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertRegion> }) =>
      apiRequest("PATCH", `/api/regions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      setShowRegionModal(false);
      setEditingRegion(null);
      regionForm.reset();
      toast({ title: "تم تحديث المنطقة بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في تحديث المنطقة", variant: "destructive" });
    },
  });

  const deleteRegionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/regions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "تم حذف المنطقة بنجاح" });
    },
    onError: (error) => {
      let message = "فشل في حذف المنطقة";
      if (error instanceof Error) {
        if (error.message.includes("Cannot delete region that has assigned users")) {
          message = "لا يمكن حذف هذه المنطقة لأنها مرتبطة بموظفين. يرجى نقل الموظفين إلى منطقة أخرى أولاً.";
        } else if (error.message.includes("Cannot delete region")) {
          message = "لا يمكن حذف هذه المنطقة لأنها مرتبطة ببيانات أخرى في النظام.";
        } else {
          message = error.message;
        }
      }
      toast({ 
        title: "تعذر حذف المنطقة", 
        description: message,
        variant: "destructive" 
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: InsertUser) => apiRequest("POST", `/api/users`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowUserModal(false);
      userForm.reset();
      toast({ title: "تم إنشاء حساب الموظف بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء حساب الموظف", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertUser> }) =>
      apiRequest("PATCH", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowUserModal(false);
      setEditingUser(null);
      userForm.reset();
      toast({ title: "تم تحديث بيانات الموظف بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في تحديث بيانات الموظف", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "تم حذف حساب الموظف بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في حذف حساب الموظف", variant: "destructive" });
    },
  });

  const handleRegionSubmit = (values: z.infer<typeof regionFormSchema>) => {
    if (editingRegion) {
      updateRegionMutation.mutate({ id: editingRegion.id, data: values });
    } else {
      createRegionMutation.mutate(values);
    }
  };

  const handleUserSubmit = (values: z.infer<typeof userFormSchema>) => {
    if (editingUser) {
      const { password, ...updateData } = values;
      const data = password ? values : updateData;
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(values);
    }
  };

  const handleEditRegion = (region: Region) => {
    setEditingRegion(region);
    regionForm.reset({
      name: region.name,
      description: region.description || "",
      isActive: region.isActive,
    });
    setShowRegionModal(true);
  };

  const handleEditUser = (user: UserSafe) => {
    setEditingUser(user);
    userForm.reset({
      username: user.username,
      email: user.email,
      password: "",
      fullName: user.fullName,
      role: user.role as "admin" | "supervisor" | "technician",
      regionId: user.regionId || "",
      isActive: user.isActive,
    });
    setShowUserModal(true);
  };

  const handleCloseRegionModal = () => {
    setShowRegionModal(false);
    setEditingRegion(null);
    regionForm.reset();
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    userForm.reset();
  };

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(regionSearchTerm.toLowerCase()) ||
    (region.description && region.description.toLowerCase().includes(regionSearchTerm.toLowerCase()))
  );

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleExportUsers = async () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "يجب أن يكون هناك موظفين لتصديرهم",
        variant: "destructive",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('بيانات الموظفين');
    
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير بيانات الموظفين';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18B2B0' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 35;
    
    worksheet.mergeCells('A2:H2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `تاريخ التقرير: ${currentDate}`;
    dateCell.font = { size: 12, bold: true };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    worksheet.getRow(2).height = 25;
    
    const headerRow = worksheet.getRow(4);
    headerRow.values = [
      '#',
      'اسم المستخدم',
      'البريد الإلكتروني',
      'الاسم الكامل',
      'الدور',
      'المنطقة',
      'الحالة',
      'تاريخ الإنشاء'
    ];
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
    
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    filteredUsers.forEach((user, index) => {
      const region = regions.find(r => r.id === user.regionId);
      const row = worksheet.addRow([
        index + 1,
        user.username,
        user.email,
        user.fullName,
        ROLE_LABELS_AR[user.role as keyof typeof ROLE_LABELS_AR],
        region?.name || '-',
        user.isActive ? 'نشط' : 'غير نشط',
        user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : '-'
      ]);
      
      row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      row.height = 22;
      
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
      
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
      
      row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
      
      if (!user.isActive) {
        row.getCell(7).font = { color: { argb: 'FFEF4444' }, bold: true };
      } else {
        row.getCell(7).font = { color: { argb: 'FF10B981' }, bold: true };
      }
    });
    
    const statsStartRow = worksheet.lastRow!.number + 2;
    
    worksheet.mergeCells(`A${statsStartRow}:H${statsStartRow}`);
    const statsTitle = worksheet.getCell(`A${statsStartRow}`);
    statsTitle.value = 'الإحصائيات الإجمالية';
    statsTitle.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    statsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    statsTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(statsStartRow).height = 30;
    
    const statsData = [
      ['', 'إجمالي عدد الموظفين', filteredUsers.length],
      ['', 'الموظفين النشطين', filteredUsers.filter(u => u.isActive).length],
      ['', 'الموظفين غير النشطين', filteredUsers.filter(u => !u.isActive).length],
      ['', 'المدراء', filteredUsers.filter(u => u.role === 'admin').length],
      ['', 'المشرفين', filteredUsers.filter(u => u.role === 'supervisor').length],
      ['', 'الفنيين', filteredUsers.filter(u => u.role === 'technician').length],
    ];
    
    statsData.forEach((stat, index) => {
      const statsRow = worksheet.getRow(statsStartRow + 1 + index);
      statsRow.values = stat;
      statsRow.height = 25;
      statsRow.getCell(2).font = { bold: true };
      statsRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
      statsRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      statsRow.getCell(3).font = { bold: true, color: { argb: 'FF1E40AF' } };
      statsRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    worksheet.columns = [
      { width: 6 },
      { width: 20 },
      { width: 30 },
      { width: 25 },
      { width: 15 },
      { width: 20 },
      { width: 12 },
      { width: 18 },
    ];
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الموظفين_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "تم تصدير التقرير بنجاح",
      description: `تم تصدير بيانات ${filteredUsers.length} موظف بتنسيق احترافي`,
    });
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      dir="rtl"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Glassmorphic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/90 via-[#050508]/85 to-[#050508]/90 backdrop-blur-[2px] z-0" />

      {/* Header with Glassmorphic Design */}
      <div className="relative z-10 border-b border-white/10 bg-gradient-to-r from-[#0a0a0f]/90 via-[#0f0f15]/90 to-[#0a0a0f]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Link href="/home">
                <Button 
                  variant="ghost" 
                  className="bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(24,178,176,0.3)] transition-all duration-300"
                  data-testid="button-back-dashboard"
                >
                  <ArrowRight className="h-4 w-4 ml-2" />
                  العودة
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-3 bg-gradient-to-br from-[#18B2B0] to-[#0ea5a3] rounded-2xl shadow-lg"
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Shield className="h-7 w-7 text-white drop-shadow-md" />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#18B2B0]">لوحة الإدارة</h1>
                  <p className="text-sm text-gray-400">التحكم الكامل في النظام</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Premium Glassmorphic Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/5 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-white/20">
            <TabsTrigger 
              value="dashboard" 
              data-testid="tab-dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-gray-900 data-[state=active]:shadow-xl font-bold rounded-xl transition-all duration-300 hover:bg-white/10 text-gray-300"
            >
              <LayoutDashboard className="h-4 w-4 ml-2" />
              لوحة المعلومات
            </TabsTrigger>
            <TabsTrigger 
              value="regions" 
              data-testid="tab-regions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-gray-900 data-[state=active]:shadow-xl font-bold rounded-xl transition-all duration-300 hover:bg-white/10 text-gray-300"
            >
              <MapPin className="h-4 w-4 ml-2" />
              إدارة المناطق
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              data-testid="tab-users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-gray-900 data-[state=active]:shadow-xl font-bold rounded-xl transition-all duration-300 hover:bg-white/10 text-gray-300"
            >
              <Users className="h-4 w-4 ml-2" />
              إدارة الموظفين
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              data-testid="tab-transactions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#18B2B0] data-[state=active]:to-teal-500 data-[state=active]:text-gray-900 data-[state=active]:shadow-xl font-bold rounded-xl transition-all duration-300 hover:bg-white/10 text-gray-300"
            >
              <Activity className="h-4 w-4 ml-2" />
              عمليات النظام
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8 mt-6">
            {/* Hero Stats Section */}
            {adminStats && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* المناطق */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/20 via-[#18B2B0]/10 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <Card className="relative h-full shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl hover:border-[#18B2B0]/40 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#18B2B0]/30 to-[#18B2B0]/10 border border-[#18B2B0]/20 group-hover:shadow-[0_0_30px_rgba(24,178,176,0.4)] transition-all duration-300">
                          <MapPin className="h-8 w-8 text-[#18B2B0]" />
                        </div>
                      </div>
                      <h3 className="text-gray-300 text-sm font-bold mb-2">إجمالي المناطق</h3>
                      <p className="text-[#18B2B0] text-5xl font-black mb-2">{adminStats.totalRegions}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          نشط
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* الموظفين */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <Card className="relative h-full shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl hover:border-purple-400/40 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-500/10 border border-purple-400/20 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300">
                          <Users className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                      <h3 className="text-gray-300 text-sm font-bold mb-2">إجمالي الموظفين</h3>
                      <p className="text-purple-400 text-5xl font-black mb-2">{adminStats.totalUsers}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-purple-400 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          مستخدم
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* النشطين */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <Card className="relative h-full shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl hover:border-green-400/40 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/30 to-green-500/10 border border-green-400/20 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all duration-300">
                          <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      <h3 className="text-gray-300 text-sm font-bold mb-2">الموظفين النشطين</h3>
                      <p className="text-green-400 text-5xl font-black mb-2">{adminStats.activeUsers}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {Math.round((adminStats.activeUsers / adminStats.totalUsers) * 100)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* العمليات */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <Card className="relative h-full shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl hover:border-amber-400/40 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-500/10 border border-amber-400/20 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-300">
                          <Activity className="h-8 w-8 text-amber-400" />
                        </div>
                      </div>
                      <h3 className="text-gray-300 text-sm font-bold mb-2">إجمالي العمليات</h3>
                      <p className="text-amber-400 text-5xl font-black mb-2">{adminStats.totalTransactions}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-amber-400 flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          عملية
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {regions && regions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <RegionsBarChart
                    title="إحصائيات المناطق"
                    description="مقارنة المستخدمين والأصناف حسب المنطقة"
                    data={regions.map(r => ({
                      name: r.name,
                      users: users.filter(u => u.regionId === r.id).length,
                      items: r.itemCount || 0,
                    }))}
                  />
                </motion.div>
              )}

              {adminStats && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <StockCompositionPie
                    title="حالة المستخدمين"
                    description="توزيع المستخدمين النشطين وغير النشطين"
                    data={[
                      { name: 'نشط', value: adminStats.activeUsers },
                      { name: 'غير نشط', value: adminStats.totalUsers - adminStats.activeUsers },
                    ]}
                    colors={['#10B981', '#EF4444']}
                  />
                </motion.div>
              )}
            </div>

            {/* Trend Chart */}
            {adminStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <TrendLineChart
                  title="اتجاه العمليات"
                  description="نمو العمليات والمستخدمين عبر الوقت"
                  data={[
                    { name: 'يناير', عمليات: Math.floor(adminStats.totalTransactions * 0.3), مستخدمين: Math.floor(adminStats.totalUsers * 0.6) },
                    { name: 'فبراير', عمليات: Math.floor(adminStats.totalTransactions * 0.5), مستخدمين: Math.floor(adminStats.totalUsers * 0.7) },
                    { name: 'مارس', عمليات: Math.floor(adminStats.totalTransactions * 0.7), مستخدمين: Math.floor(adminStats.totalUsers * 0.85) },
                    { name: 'أبريل', عمليات: Math.floor(adminStats.totalTransactions * 0.85), مستخدمين: Math.floor(adminStats.totalUsers * 0.95) },
                    { name: 'مايو', عمليات: adminStats.totalTransactions, مستخدمين: adminStats.totalUsers },
                  ]}
                  dataKeys={[
                    { key: 'عمليات', color: '#18B2B0', name: 'العمليات' },
                    { key: 'مستخدمين', color: '#A855F7', name: 'المستخدمين' },
                  ]}
                />
              </motion.div>
            )}
          </TabsContent>

          {/* Regions Tab */}
          <TabsContent value="regions" className="space-y-4 mt-6">
            <motion.div 
              className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-2xl font-black text-[#18B2B0]">المناطق</h2>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#18B2B0]/50 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="ابحث عن منطقة..."
                    value={regionSearchTerm}
                    onChange={(e) => setRegionSearchTerm(e.target.value)}
                    className="pr-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-[#18B2B0]/50"
                    data-testid="input-search-region"
                  />
                </div>
              </div>
              <Dialog open={showRegionModal} onOpenChange={setShowRegionModal}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setShowRegionModal(true)} 
                    data-testid="button-add-region"
                    className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300 font-bold"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة منطقة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl border border-white/20" data-testid="modal-region">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-[#18B2B0] font-black">{editingRegion ? "تحديث المنطقة" : "إضافة منطقة جديدة"}</DialogTitle>
                    <DialogDescription className="text-gray-300">
                      أدخل بيانات المنطقة
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...regionForm}>
                    <form onSubmit={regionForm.handleSubmit(handleRegionSubmit)} className="space-y-4">
                      <FormField
                        control={regionForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">اسم المنطقة</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل اسم المنطقة" {...field} data-testid="input-region-name" className="border-white/20 focus:border-white/40 focus:ring-2 focus:ring-[#18B2B0]/30 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl text-[#18B2B0] placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">الوصف (اختياري)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="أدخل وصف المنطقة" {...field} data-testid="input-region-description" className="border-white/20 focus:border-white/40 focus:ring-2 focus:ring-[#18B2B0]/30 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl text-[#18B2B0] placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regionForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-3 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl">
                            <div className="space-y-0.5">
                              <FormLabel className="text-[#18B2B0] font-bold">منطقة نشطة</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-region-active" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-4">
                        <Button 
                          type="submit" 
                          disabled={createRegionMutation.isPending || updateRegionMutation.isPending} 
                          data-testid="button-save-region"
                          className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 font-bold"
                        >
                          {editingRegion ? "تحديث" : "إضافة"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCloseRegionModal} data-testid="button-cancel-region" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-[#18B2B0]">
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-white/10 to-transparent border-b border-white/10">
                  <CardTitle className="text-[#18B2B0] text-2xl font-black">قائمة المناطق</CardTitle>
                  <CardDescription className="text-gray-300">جميع المناطق المسجلة في النظام</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-right font-bold text-[#18B2B0]">اسم المنطقة</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الوصف</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">عدد الأصناف</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">إجمالي الكمية</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الحالة</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center gap-3">
                                <Search className="w-12 h-12 text-gray-500" />
                                <p className="text-gray-400 text-lg">
                                  {regionSearchTerm ? 'لا توجد مناطق تطابق بحثك' : 'لا توجد مناطق'}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRegions.map((region, index) => (
                          <motion.tr 
                            key={region.id} 
                            data-testid={`row-region-${region.id}`}
                            className="border-white/5 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(24,178,176,0.1)] transition-all duration-300"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TableCell className="font-bold text-right text-[#18B2B0]">{region.name}</TableCell>
                            <TableCell className="text-right text-gray-300">{region.description || "لا يوجد وصف"}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="border-white/30 text-[#18B2B0] bg-[#18B2B0]/10">
                                {region.itemCount || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="border-white/30 text-green-400 bg-green-500/10">
                                {region.totalQuantity || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {region.isActive ? (
                                <Badge className="bg-green-500/20 text-green-400 border border-white/20">
                                  <CheckCircle className="h-3 w-3 ml-1" />
                                  نشط
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-white/20 text-gray-400 bg-gray-500/10">
                                  <XCircle className="h-3 w-3 ml-1" />
                                  غير نشط
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditRegion(region)} 
                                  data-testid={`button-edit-region-${region.id}`}
                                  className="text-[#18B2B0] hover:bg-[#18B2B0]/20 hover:text-[#18B2B0]"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف المنطقة "${region.name}"؟`)) {
                                      deleteRegionMutation.mutate(region.id);
                                    }
                                  }} 
                                  data-testid={`button-delete-region-${region.id}`}
                                  className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <motion.div 
              className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-2xl font-black text-[#18B2B0]">الموظفين</h2>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#18B2B0]/50 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="ابحث عن موظف..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pr-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-[#18B2B0]/50"
                    data-testid="input-search-user"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={handleExportUsers}
                  variant="outline"
                  data-testid="button-export-users"
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 font-bold"
                >
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  تصدير Excel
                </Button>
                <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => setShowUserModal(true)} 
                      data-testid="button-add-user"
                      className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300 font-bold"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة موظف جديد
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-md bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl border border-white/20" data-testid="modal-user">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-[#18B2B0] font-black">{editingUser ? "تحديث بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
                    <DialogDescription className="text-gray-300">
                      أدخل بيانات الموظف
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">اسم المستخدم</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل اسم المستخدم" {...field} data-testid="input-user-username" className="border-white/20 focus:border-white/40 focus:ring-2 focus:ring-[#18B2B0]/30 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl text-[#18B2B0] placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل الاسم الكامل" {...field} data-testid="input-user-fullname" className="border-white/20 focus:border-white/40 focus:ring-2 focus:ring-[#18B2B0]/30 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl text-[#18B2B0] placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} data-testid="input-user-email" className="border-white/20 focus:border-white/40 focus:ring-2 focus:ring-[#18B2B0]/30 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl text-[#18B2B0] placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">كلمة المرور {editingUser && "(اتركها فارغة للإبقاء على كلمة المرور الحالية)"}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="أدخل كلمة المرور" {...field} data-testid="input-user-password" className="border-white/20 focus:border-white/40 focus:ring-2 focus:ring-[#18B2B0]/30 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl text-[#18B2B0] placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">الدور</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} data-testid="select-user-role">
                              <FormControl>
                                <SelectTrigger className="border-white/20 focus:border-white/40 focus:ring-2 focus:ring-[#18B2B0]/30 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl text-[#18B2B0]">
                                  <SelectValue placeholder="اختر دور الموظف" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl border-white/20">
                                <SelectItem value="admin" className="text-[#18B2B0] hover:bg-white/10">{ROLE_LABELS_AR.admin}</SelectItem>
                                <SelectItem value="supervisor" className="text-[#18B2B0] hover:bg-white/10">{ROLE_LABELS_AR.supervisor}</SelectItem>
                                <SelectItem value="technician" className="text-[#18B2B0] hover:bg-white/10">{ROLE_LABELS_AR.technician}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="regionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#18B2B0] font-bold">المنطقة (للمشرفين والفنيين)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} data-testid="select-user-region">
                              <FormControl>
                                <SelectTrigger className="border-white/20 focus:border-white/40 focus:ring-2 focus:ring-[#18B2B0]/30 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl text-[#18B2B0]">
                                  <SelectValue placeholder="اختر المنطقة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl border-white/20">
                                {regions.map(region => (
                                  <SelectItem key={region.id} value={region.id} className="text-[#18B2B0] hover:bg-white/10">{region.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-3 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl">
                            <div className="space-y-0.5">
                              <FormLabel className="text-[#18B2B0] font-bold">حساب نشط</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-user-active" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-4">
                        <Button 
                          type="submit" 
                          disabled={createUserMutation.isPending || updateUserMutation.isPending} 
                          data-testid="button-save-user"
                          className="bg-gradient-to-r from-[#18B2B0] to-teal-500 hover:from-[#16a09e] hover:to-teal-600 font-bold"
                        >
                          {editingUser ? "تحديث" : "إضافة"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCloseUserModal} data-testid="button-cancel-user" className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-[#18B2B0]">
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-white/10 to-transparent border-b border-white/10">
                  <CardTitle className="text-[#18B2B0] text-2xl font-black">قائمة الموظفين</CardTitle>
                  <CardDescription className="text-gray-300">جميع الموظفين المسجلين في النظام</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-right font-bold text-[#18B2B0]">اسم المستخدم</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الاسم الكامل</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">البريد الإلكتروني</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الدور</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">المنطقة</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الحالة</TableHead>
                          <TableHead className="text-right font-bold text-[#18B2B0]">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <div className="flex flex-col items-center gap-3">
                                <Search className="w-12 h-12 text-gray-500" />
                                <p className="text-gray-400 text-lg">
                                  {userSearchTerm ? 'لا يوجد موظفون يطابقون بحثك' : 'لا يوجد موظفون'}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user, index) => (
                          <motion.tr 
                            key={user.id} 
                            data-testid={`row-user-${user.id}`}
                            className="border-white/5 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(24,178,176,0.1)] transition-all duration-300"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TableCell className="font-bold text-right text-[#18B2B0]">{user.username}</TableCell>
                            <TableCell className="text-right text-gray-300">{user.fullName}</TableCell>
                            <TableCell className="text-right text-gray-300">{user.email}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="border-white/30 text-[#18B2B0] bg-[#18B2B0]/10">
                                {ROLE_LABELS_AR[user.role as keyof typeof ROLE_LABELS_AR]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-gray-300">
                              {user.regionId ? regions.find(r => r.id === user.regionId)?.name || "غير محدد" : "بدون منطقة"}
                            </TableCell>
                            <TableCell className="text-right">
                              {user.isActive ? (
                                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                                  <CheckCircle className="h-3 w-3 ml-1" />
                                  نشط
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-white/20 text-gray-400 bg-gray-500/10">
                                  <XCircle className="h-3 w-3 ml-1" />
                                  غير نشط
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditUser(user)} 
                                  data-testid={`button-edit-user-${user.id}`}
                                  className="text-[#18B2B0] hover:bg-[#18B2B0]/20 hover:text-[#18B2B0]"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف حساب "${user.fullName}"؟`)) {
                                      deleteUserMutation.mutate(user.id);
                                    }
                                  }} 
                                  data-testid={`button-delete-user-${user.id}`}
                                  className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-white/10 to-transparent border-b border-white/10">
                  <CardTitle className="text-[#18B2B0] text-2xl font-black">عمليات النظام</CardTitle>
                  <CardDescription className="text-gray-300">سجل شامل لجميع العمليات التي تمت داخل النظام</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {systemLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">لا توجد عمليات مسجلة في النظام</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {systemLogs.slice(0, 20).map((log, index) => (
                        <motion.div
                          key={log.id}
                          className="bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl p-5 rounded-2xl border border-white/20 hover:border-white/30 hover:shadow-[0_0_20px_rgba(24,178,176,0.2)] transition-all duration-300"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          data-testid={`system-log-${log.id}`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-3 rounded-xl border ${
                                log.severity === 'error' ? 'bg-gradient-to-br from-red-500/30 to-red-500/10 border-red-500/20' :
                                log.severity === 'warn' ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-500/10 border-yellow-500/20' :
                                'bg-gradient-to-br from-[#18B2B0]/30 to-[#18B2B0]/10 border-[#18B2B0]/20'
                              }`}>
                                <Activity className={`h-6 w-6 ${
                                  log.severity === 'error' ? 'text-red-400' :
                                  log.severity === 'warn' ? 'text-yellow-400' :
                                  'text-[#18B2B0]'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <p className="text-[#18B2B0] font-bold text-lg mb-1">{log.description}</p>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-gray-300 flex items-center gap-1">
                                    <Shield className="h-3 w-3 text-[#18B2B0]" />
                                    {log.userName} ({log.userRole === 'admin' ? 'مدير' : log.userRole === 'supervisor' ? 'مشرف' : 'فني'})
                                  </span>
                                  {log.entityName && (
                                    <span className="text-gray-400 flex items-center gap-1">
                                      <span className="text-[#18B2B0]">•</span>
                                      {log.entityName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-left space-y-2">
                              <Badge variant="outline" className={`text-sm px-3 py-1 font-bold ${
                                log.action === 'create' ? 'border-white/30 text-green-400 bg-green-500/10' :
                                log.action === 'update' ? 'border-white/30 text-blue-400 bg-blue-500/10' :
                                log.action === 'delete' ? 'border-white/30 text-red-400 bg-red-500/10' :
                                'border-white/30 text-[#18B2B0] bg-[#18B2B0]/10'
                              }`}>
                                {log.action === 'create' ? 'إنشاء' : 
                                 log.action === 'update' ? 'تحديث' : 
                                 log.action === 'delete' ? 'حذف' :
                                 log.action === 'approve' ? 'موافقة' :
                                 log.action === 'reject' ? 'رفض' :
                                 log.action === 'login' ? 'تسجيل دخول' :
                                 log.action === 'logout' ? 'تسجيل خروج' :
                                 log.action}
                              </Badge>
                              <p className="text-gray-400 text-xs flex items-center justify-end gap-1">
                                <span className="text-white/40">📅</span>
                                {log.createdAt ? new Date(log.createdAt).toLocaleDateString('ar-SA', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'غير محدد'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
