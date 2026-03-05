import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpDown,
  Smartphone,
  FileText,
  CreditCard,
  Battery,
  Save,
  X,
  RefreshCw,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import type { ItemType as SchemaItemType } from "@shared/schema";

type ItemType = SchemaItemType;

const CATEGORIES = [
  { id: 'devices', nameAr: 'الأجهزة', nameEn: 'Devices', icon: Smartphone },
  { id: 'papers', nameAr: 'الورقيات', nameEn: 'Papers', icon: FileText },
  { id: 'sim', nameAr: 'شرائح الاتصال', nameEn: 'SIM Cards', icon: CreditCard },
  { id: 'accessories', nameAr: 'الإكسسوارات', nameEn: 'Accessories', icon: Battery },
];

export default function ItemTypesManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    nameAr: '',
    nameEn: '',
    category: 'devices' as string,
    unitsPerBox: 10,
    sortOrder: 0,
    icon: '',
    color: '',
  });

  const { data: itemTypes = [], isLoading, refetch } = useQuery<ItemType[]>({
    queryKey: ['/api/item-types'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: Record<string, any> = {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        category: data.category,
        unitsPerBox: data.unitsPerBox,
        sortOrder: data.sortOrder,
        isActive: true,
        isVisible: true,
      };
      if (data.id && data.id.trim()) {
        payload.id = data.id.trim();
      }
      return await apiRequest('POST', '/api/item-types', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].startsWith('/api/item-types'),
      });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الصنف الجديد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الصنف",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest('PATCH', `/api/item-types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].startsWith('/api/item-types'),
      });
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الصنف",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الصنف",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/item-types/${id}/toggle-active`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].startsWith('/api/item-types'),
      });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: string; isVisible: boolean }) => {
      return await apiRequest('PATCH', `/api/item-types/${id}/toggle-visibility`, { isVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].startsWith('/api/item-types'),
      });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/item-types/seed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].startsWith('/api/item-types'),
      });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الأصناف الافتراضية",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      id: '',
      nameAr: '',
      nameEn: '',
      category: 'devices',
      unitsPerBox: 10,
      sortOrder: 0,
      icon: '',
      color: '',
    });
  };

  const handleEdit = (item: ItemType) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      category: item.category,
      unitsPerBox: item.unitsPerBox,
      sortOrder: item.sortOrder,
      icon: item.icon || '',
      color: item.color || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        data: {
          nameAr: formData.nameAr,
          nameEn: formData.nameEn,
          category: formData.category,
          unitsPerBox: formData.unitsPerBox,
          sortOrder: formData.sortOrder,
          icon: formData.icon || undefined,
          color: formData.color || undefined,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  const groupedByCategory = itemTypes.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ItemType[]>);

  const sortedItemTypes = [...itemTypes].sort((a, b) => a.sortOrder - b.sortOrder);

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen bg-[#0F0F15]">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">غير مصرح</h2>
              <p className="text-gray-400">هذه الصفحة متاحة فقط لمدير النظام</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0F0F15]">
      <Sidebar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">إدارة الأصناف</h1>
              <p className="text-gray-400">إضافة وتعديل وإدارة أنواع الأصناف في النظام</p>
            </div>
            
            <div className="flex gap-3">
              {itemTypes.length === 0 && (
                <Button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className={`h-4 w-4 ml-2 ${seedMutation.isPending ? 'animate-spin' : ''}`} />
                  تحميل الأصناف الافتراضية
                </Button>
              )}
              <Button
                onClick={() => {
                  setEditingItem(null);
                  resetForm();
                  setIsDialogOpen(true);
                }}
                className="bg-[#18B2B0] hover:bg-[#18B2B0]/90"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة صنف جديد
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {CATEGORIES.map(cat => {
              const count = groupedByCategory[cat.id]?.length || 0;
              const activeCount = groupedByCategory[cat.id]?.filter(i => i.isActive).length || 0;
              const Icon = cat.icon;
              
              return (
                <Card key={cat.id} className="bg-[#1A1A24] border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#18B2B0]/20">
                        <Icon className="h-5 w-5 text-[#18B2B0]" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">{cat.nameAr}</p>
                        <p className="text-white font-bold text-lg">{count} <span className="text-sm text-gray-500">({activeCount} نشط)</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 bg-white/5" />
              ))}
            </div>
          ) : itemTypes.length === 0 ? (
            <Card className="bg-[#1A1A24] border-white/10">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">لا توجد أصناف</h3>
                <p className="text-gray-400 mb-4">قم بإضافة أصناف جديدة أو تحميل الأصناف الافتراضية</p>
                <Button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  className="bg-[#18B2B0] hover:bg-[#18B2B0]/90"
                >
                  <RefreshCw className={`h-4 w-4 ml-2 ${seedMutation.isPending ? 'animate-spin' : ''}`} />
                  تحميل الأصناف الافتراضية
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#1A1A24] border-white/10">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#18B2B0]" />
                  جميع الأصناف ({itemTypes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-right text-gray-400">الترتيب</TableHead>
                      <TableHead className="text-right text-gray-400">المعرف</TableHead>
                      <TableHead className="text-right text-gray-400">الاسم العربي</TableHead>
                      <TableHead className="text-right text-gray-400">الاسم الإنجليزي</TableHead>
                      <TableHead className="text-right text-gray-400">الفئة</TableHead>
                      <TableHead className="text-right text-gray-400">وحدات/كرتون</TableHead>
                      <TableHead className="text-right text-gray-400">التفعيل</TableHead>
                      <TableHead className="text-right text-gray-400">الإظهار</TableHead>
                      <TableHead className="text-right text-gray-400">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItemTypes.map((item) => {
                      const catInfo = getCategoryInfo(item.category);
                      const CatIcon = catInfo.icon;
                      
                      return (
                        <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-gray-400">
                            <Badge variant="outline" className="border-white/20">
                              {item.sortOrder}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white font-mono text-sm">{item.id}</TableCell>
                          <TableCell className="text-white font-medium">{item.nameAr}</TableCell>
                          <TableCell className="text-gray-400">{item.nameEn}</TableCell>
                          <TableCell>
                            <Badge className="bg-[#18B2B0]/20 text-[#18B2B0] border-[#18B2B0]/30">
                              <CatIcon className="h-3 w-3 ml-1" />
                              {catInfo.nameAr}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">{item.unitsPerBox}</TableCell>
                          <TableCell>
                            <Switch
                              checked={item.isActive}
                              onCheckedChange={(checked) => 
                                toggleActiveMutation.mutate({ id: item.id, isActive: checked })
                              }
                              className="data-[state=checked]:bg-green-500"
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={item.isVisible}
                              onCheckedChange={(checked) => 
                                toggleVisibilityMutation.mutate({ id: item.id, isVisible: checked })
                              }
                              className="data-[state=checked]:bg-blue-500"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="text-[#18B2B0] hover:text-[#18B2B0]/80 hover:bg-[#18B2B0]/10"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1A1A24] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingItem ? 'قم بتعديل بيانات الصنف' : 'أدخل بيانات الصنف الجديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingItem && (
              <div className="space-y-2">
                <Label className="text-gray-300">المعرف (ID) - اختياري</Label>
                <Input
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="اتركه فارغاً للإنشاء التلقائي"
                  className="bg-white/5 border-white/10 text-white"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500">اتركه فارغاً وسيتم إنشاء معرف تلقائي</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">الاسم العربي</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="اسم الصنف بالعربي"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">الاسم الإنجليزي</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Item Name"
                  className="bg-white/5 border-white/10 text-white"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">الفئة</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A24] border-white/10">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-white/10">
                      {cat.nameAr} ({cat.nameEn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">وحدات لكل كرتون</Label>
                <Input
                  type="number"
                  value={formData.unitsPerBox}
                  onChange={(e) => setFormData({ ...formData, unitsPerBox: parseInt(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">ترتيب العرض</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                  min={0}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingItem(null);
                resetForm();
              }}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              <X className="h-4 w-4 ml-2" />
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#18B2B0] hover:bg-[#18B2B0]/90"
            >
              <Save className="h-4 w-4 ml-2" />
              {editingItem ? 'حفظ التعديلات' : 'إضافة الصنف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
