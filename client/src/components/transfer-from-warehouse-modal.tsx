import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserSafe } from "@shared/schema";
import { useActiveItemTypes, getItemTypeVisuals, type ItemType, type InventoryEntry } from "@/hooks/use-item-types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  technicianId: z.string().min(1, "يجب اختيار فني"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ItemTransfer {
  selected: boolean;
  quantity: number;
  packagingType: "box" | "unit";
}

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
  lebara: { boxes: "lebaraBoxes", units: "lebaraUnits" },
};

interface TransferFromWarehouseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName: string;
  currentInventory: any | null;
  currentEntries?: InventoryEntry[];
  warehouseTechnicians?: { id: string; fullName: string; username?: string; city?: string | null }[];
}

export default function TransferFromWarehouseModal({ 
  open, 
  onOpenChange,
  warehouseId,
  warehouseName,
  currentInventory,
  currentEntries = [],
  warehouseTechnicians = [],
}: TransferFromWarehouseModalProps) {
  const { toast } = useToast();
  const { data: itemTypes, isLoading: itemTypesLoading } = useActiveItemTypes();

  const { data: authData } = useQuery<{ user: UserSafe }>({
    queryKey: ["/api/auth/me"],
  });
  
  const currentUser = authData?.user;

  const { data: users = [] } = useQuery<UserSafe[]>({
    queryKey: currentUser?.role === 'admin' ? ["/api/users"] : ["/api/supervisor/technicians"],
    enabled: !!currentUser,
  });

  // Prefer technicians passed from warehouse data when available (avoids additional API dependency)
  const employees = (warehouseTechnicians && warehouseTechnicians.length > 0)
    ? warehouseTechnicians as any
    : (currentUser?.role === 'admin'
      ? users.filter(user => user.role === "technician")
      : users);

  const [itemTransfers, setItemTransfers] = useState<{[key: string]: ItemTransfer}>({});

  const entryMap = useMemo(() => {
    return new Map(currentEntries.map((e) => [e.itemTypeId, e]));
  }, [currentEntries]);

  useEffect(() => {
    if (itemTypes && open) {
      const initial: {[key: string]: ItemTransfer} = {};
      itemTypes.forEach((itemType) => {
        initial[itemType.id] = { selected: false, quantity: 0, packagingType: "unit" };
      });
      setItemTransfers(initial);
    }
  }, [itemTypes, open]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      technicianId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const getAvailableStock = (itemTypeId: string, packagingType: "box" | "unit") => {
    const entry = entryMap.get(itemTypeId);
    if (entry) {
      return packagingType === "box" ? entry.boxes : entry.units;
    }

    if (currentInventory) {
      const legacy = legacyFieldMapping[itemTypeId];
      if (legacy) {
        return packagingType === "box" 
          ? (currentInventory[legacy.boxes] || 0)
          : (currentInventory[legacy.units] || 0);
      }
    }
    return 0;
  };

  const transferMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const transferData: any = {
        warehouseId,
        technicianId: data.technicianId,
        notes: data.notes,
      };

      Object.entries(itemTransfers).forEach(([itemKey, transfer]) => {
        if (transfer.selected && transfer.quantity > 0) {
          transferData[itemKey] = transfer.quantity;
          transferData[`${itemKey}PackagingType`] = transfer.packagingType;
        }
      });

      return await apiRequest("POST", "/api/warehouse-transfers", transferData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "inventory-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-inventory", warehouseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      toast({
        title: "تم النقل بنجاح",
        description: "تم نقل الأصناف إلى الفني المحدد",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في النقل",
        description: error.message || "حدث خطأ أثناء نقل الأصناف",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const hasSelectedItems = Object.values(itemTransfers).some(transfer => transfer.selected && transfer.quantity > 0);
    
    if (!hasSelectedItems) {
      toast({
        title: "لا توجد أصناف محددة",
        description: "يرجى اختيار صنف واحد على الأقل للنقل",
        variant: "destructive",
      });
      return;
    }

    const errors: string[] = [];
    Object.entries(itemTransfers).forEach(([itemKey, transfer]) => {
      if (transfer.selected) {
        const available = getAvailableStock(itemKey, transfer.packagingType);
        if (transfer.quantity > available) {
          const itemType = itemTypes?.find(t => t.id === itemKey);
          const itemName = itemType?.nameAr || itemKey;
          errors.push(`${itemName}: الكمية المطلوبة (${transfer.quantity}) أكبر من المتاح (${available})`);
        }
      }
    });

    if (errors.length > 0) {
      toast({
        title: "خطأ في الكميات",
        description: errors.join("\n"),
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate(data);
  };

  const updateItemTransfer = (itemKey: string, field: keyof ItemTransfer, value: any) => {
    setItemTransfers(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: value,
      }
    }));
  };

  const visibleItems = useMemo(() => {
    if (!itemTypes) return [];
    const categoryCounters: Record<string, number> = {};
    return itemTypes
      .filter((t) => t.isActive && t.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((itemType) => {
        const categoryIndex = categoryCounters[itemType.category] || 0;
        categoryCounters[itemType.category] = categoryIndex + 1;
        const visuals = getItemTypeVisuals(itemType, categoryIndex);
        return { ...itemType, ...visuals };
      });
  }, [itemTypes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>نقل من المستودع إلى فني</DialogTitle>
          <DialogDescription>
            نقل أصناف من {warehouseName} إلى فني
          </DialogDescription>
        </DialogHeader>
        
        {itemTypesLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="technicianId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اختر الفني</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفني" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.fullName} - {employee.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const transfer = itemTransfers[item.id] || { selected: false, quantity: 0, packagingType: "unit" };
                    const availableBoxes = getAvailableStock(item.id, "box");
                    const availableUnits = getAvailableStock(item.id, "unit");

                    return (
                      <div key={item.id} className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border">
                        <div className="flex items-center gap-3 mb-3">
                          <Checkbox
                            checked={transfer.selected}
                            onCheckedChange={(checked) => updateItemTransfer(item.id, "selected", checked)}
                          />
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${item.gradient} text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.nameAr}</h4>
                            <p className="text-xs text-muted-foreground">
                              متاح: {availableBoxes} كرتون، {availableUnits} وحدة
                            </p>
                          </div>
                        </div>

                        {transfer.selected && (
                          <div className="space-y-3 mr-8">
                            <div className="flex items-center gap-4">
                              <Label>نوع التغليف:</Label>
                              <RadioGroup
                                value={transfer.packagingType}
                                onValueChange={(value) => updateItemTransfer(item.id, "packagingType", value)}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <RadioGroupItem value="box" id={`${item.id}-box`} />
                                  <Label htmlFor={`${item.id}-box`}>كرتون ({availableBoxes})</Label>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <RadioGroupItem value="unit" id={`${item.id}-unit`} />
                                  <Label htmlFor={`${item.id}-unit`}>وحدة ({availableUnits})</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            <div className="flex items-center gap-4">
                              <Label>الكمية:</Label>
                              <Input
                                type="number"
                                min="0"
                                max={getAvailableStock(item.id, transfer.packagingType)}
                                value={transfer.quantity}
                                onChange={(e) => updateItemTransfer(item.id, "quantity", parseInt(e.target.value) || 0)}
                                className="w-32"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="أضف ملاحظات حول عملية النقل..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-3 space-x-reverse pt-4">
                <Button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="flex-1"
                >
                  {transferMutation.isPending ? "جاري النقل..." : "تأكيد النقل"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
