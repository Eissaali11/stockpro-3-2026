import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getItemTypeVisuals, legacyFieldMapping, useActiveItemTypes } from "@/hooks/use-item-types";
import type { TechnicianMovingInventoryEntry, UserSafe } from "@shared/schema";

const formSchema = z.object({
  warehouseId: z.string().min(1, "يجب اختيار المستودع"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type TransferItem = {
  selected: boolean;
  quantity: number;
  packagingType: "box" | "unit";
};

type WarehouseOption = {
  id: string;
  name: string;
  location: string;
};

type LegacyMovingInventory = Record<string, number> & {
  id?: string;
};

interface WithdrawFromTechnicianModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicianId: string;
  technicianName: string;
}

export default function WithdrawFromTechnicianModal({
  open,
  onOpenChange,
  technicianId,
  technicianName,
}: WithdrawFromTechnicianModalProps) {
  const { toast } = useToast();
  const [itemTransfers, setItemTransfers] = useState<Record<string, TransferItem>>({});

  const { data: authData } = useQuery<{ user: UserSafe }>({
    queryKey: ["/api/auth/me"],
  });
  const currentUser = authData?.user;

  const { data: itemTypes, isLoading: itemTypesLoading } = useActiveItemTypes();

  const { data: movingEntries = [] } = useQuery<TechnicianMovingInventoryEntry[]>({
    queryKey: [`/api/technicians/${technicianId}/moving-inventory-entries`],
    enabled: open && !!technicianId,
  });

  const { data: legacyMovingInventory } = useQuery<LegacyMovingInventory | null>({
    queryKey: [`/api/supervisor/users/${technicianId}/moving-inventory`],
    enabled: open && !!technicianId,
  });

  const { data: warehouses = [] } = useQuery<WarehouseOption[]>({
    queryKey: currentUser?.role === "admin" ? ["/api/warehouses"] : ["/api/supervisor/warehouses"],
    enabled: open && !!currentUser,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warehouseId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setItemTransfers({});
      return;
    }

    if (itemTypes && itemTypes.length > 0) {
      const initialState: Record<string, TransferItem> = {};
      for (const itemType of itemTypes) {
        initialState[itemType.id] = {
          selected: false,
          quantity: 0,
          packagingType: "unit",
        };
      }
      setItemTransfers(initialState);
    }
  }, [open, form, itemTypes]);

  const movingEntryMap = useMemo(() => {
    return new Map(movingEntries.map((entry) => [entry.itemTypeId, entry]));
  }, [movingEntries]);

  const availableStock = (itemTypeId: string, packagingType: "box" | "unit") => {
    const entry = movingEntryMap.get(itemTypeId);
    if (entry) {
      return packagingType === "box" ? entry.boxes : entry.units;
    }

    if (!legacyMovingInventory) {
      return 0;
    }

    const legacy = legacyFieldMapping[itemTypeId];
    if (!legacy) {
      return 0;
    }

    return packagingType === "box"
      ? Number((legacyMovingInventory as any)[legacy.boxes] || 0)
      : Number((legacyMovingInventory as any)[legacy.units] || 0);
  };

  const visibleItems = useMemo(() => {
    if (!itemTypes) {
      return [];
    }

    const categoryCounter: Record<string, number> = {};

    return itemTypes
      .filter((itemType) => itemType.isActive && itemType.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((itemType) => {
        const categoryIndex = categoryCounter[itemType.category] || 0;
        categoryCounter[itemType.category] = categoryIndex + 1;
        const visuals = getItemTypeVisuals(itemType, categoryIndex);

        return {
          ...itemType,
          ...visuals,
        };
      });
  }, [itemTypes]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const selectedItems = Object.entries(itemTransfers)
        .filter(([, transfer]) => transfer.selected && transfer.quantity > 0)
        .map(([itemTypeId, transfer]) => ({
          itemTypeId,
          packagingType: transfer.packagingType,
          quantity: transfer.quantity,
        }));

      const response = await apiRequest(
        "POST",
        `/api/technicians/${technicianId}/withdraw-to-warehouse`,
        {
          warehouseId: data.warehouseId,
          notes: data.notes,
          items: selectedItems,
        }
      );

      return response.json();
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: [`/api/supervisor/users/${technicianId}/moving-inventory`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/technicians/${technicianId}/moving-inventory-entries`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/supervisor/warehouses"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/warehouse-inventory", variables.warehouseId] });
      await queryClient.invalidateQueries({ queryKey: ["/api/warehouses", variables.warehouseId, "inventory-entries"] });

      toast({
        title: "تم السحب بنجاح",
        description: "تم تحويل المخزون من الفني إلى المستودع",
      });

      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "فشل عملية السحب",
        description: error?.message || "حدث خطأ أثناء سحب المخزون",
        variant: "destructive",
      });
    },
  });

  const updateItemTransfer = (itemTypeId: string, field: keyof TransferItem, value: any) => {
    setItemTransfers((previous) => ({
      ...previous,
      [itemTypeId]: {
        ...previous[itemTypeId],
        [field]: value,
      },
    }));
  };

  const onSubmit = (data: FormData) => {
    const selected = Object.entries(itemTransfers).filter(([, transfer]) => transfer.selected && transfer.quantity > 0);

    if (selected.length === 0) {
      toast({
        title: "لا توجد أصناف محددة",
        description: "اختر صنفًا واحدًا على الأقل مع كمية صحيحة",
        variant: "destructive",
      });
      return;
    }

    for (const [itemTypeId, transfer] of selected) {
      const available = availableStock(itemTypeId, transfer.packagingType);
      if (transfer.quantity > available) {
        const itemName = visibleItems.find((item) => item.id === itemTypeId)?.nameAr || itemTypeId;
        toast({
          title: "كمية غير متاحة",
          description: `${itemName}: المطلوب ${transfer.quantity} والمتاح ${available}`,
          variant: "destructive",
        });
        return;
      }
    }

    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>سحب مخزون من الفني إلى المستودع</DialogTitle>
          <DialogDescription>
            سحب أصناف من مخزون الفني {technicianName} وإعادتها إلى المستودع
          </DialogDescription>
        </DialogHeader>

        {itemTypesLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اختر المستودع المستلم</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستودع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} - {warehouse.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ScrollArea className="h-[360px] pr-4">
                <div className="space-y-4">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const transfer = itemTransfers[item.id] || {
                      selected: false,
                      quantity: 0,
                      packagingType: "unit",
                    };
                    const availableBoxes = availableStock(item.id, "box");
                    const availableUnits = availableStock(item.id, "unit");

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
                              المتاح لدى الفني: {availableBoxes} كرتون، {availableUnits} وحدة
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
                                  <RadioGroupItem value="box" id={`${item.id}-box-withdraw`} />
                                  <Label htmlFor={`${item.id}-box-withdraw`}>كرتون ({availableBoxes})</Label>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <RadioGroupItem value="unit" id={`${item.id}-unit-withdraw`} />
                                  <Label htmlFor={`${item.id}-unit-withdraw`}>وحدة ({availableUnits})</Label>
                                </div>
                              </RadioGroup>
                            </div>

                            <div className="flex items-center gap-4">
                              <Label>الكمية:</Label>
                              <Input
                                type="number"
                                min="0"
                                max={availableStock(item.id, transfer.packagingType)}
                                value={transfer.quantity}
                                onChange={(event) => updateItemTransfer(item.id, "quantity", parseInt(event.target.value || "0", 10) || 0)}
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
                        placeholder="سبب السحب أو أي ملاحظات إضافية"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-3 space-x-reverse pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "جاري السحب..." : "سحب إلى المستودع"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={mutation.isPending}
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
