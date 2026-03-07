import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductScanRecord, StorageBucketType } from "../types";
import { ScanLine } from "lucide-react";

type StorageOption = {
  id: string;
  label: string;
};

type ProductsScanReceiverProps = {
  scannedValue: string;
  onScannedValueChange: (value: string) => void;
  quantity: number;
  onQuantityChange: (value: number) => void;
  storageType: StorageBucketType;
  onStorageTypeChange: (value: StorageBucketType) => void;
  storageId: string;
  onStorageIdChange: (value: string) => void;
  warehouseOptions: StorageOption[];
  technicianOptions: StorageOption[];
  onReceive: () => void;
  latestScans: ProductScanRecord[];
};

export function ProductsScanReceiver({
  scannedValue,
  onScannedValueChange,
  quantity,
  onQuantityChange,
  storageType,
  onStorageTypeChange,
  storageId,
  onStorageIdChange,
  warehouseOptions,
  technicianOptions,
  onReceive,
  latestScans,
}: ProductsScanReceiverProps) {
  const storageOptions = storageType === "warehouse" ? warehouseOptions : technicianOptions;

  return (
    <section className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-bold">استقبال المنتجات عبر الماسح</h3>
        <div className="inline-flex items-center gap-2 text-cyan-300 text-sm">
          <ScanLine className="h-4 w-4" />
          يدعم ماسح الجوال وماسح الباركود المباشر
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Input
          value={scannedValue}
          onChange={(event) => onScannedValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onReceive();
            }
          }}
          placeholder="امسح الكود أو اكتب SKU/اسم المنتج"
          className="md:col-span-2 bg-black/30 border-slate-700 text-white"
        />

        <Select value={storageType} onValueChange={(value) => onStorageTypeChange(value as StorageBucketType)}>
          <SelectTrigger className="bg-black/30 border-slate-700 text-white">
            <SelectValue placeholder="اختر نوع التخزين" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            <SelectItem value="warehouse">المستودعات</SelectItem>
            <SelectItem value="technician">عهدة الفنيين</SelectItem>
          </SelectContent>
        </Select>

        <Select value={storageId} onValueChange={onStorageIdChange}>
          <SelectTrigger className="bg-black/30 border-slate-700 text-white">
            <SelectValue placeholder="اختر موقع التخزين" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            {storageOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => onQuantityChange(Number(event.target.value || 1))}
            className="w-24 bg-black/30 border-slate-700 text-white"
          />
          <Button onClick={onReceive} className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/30">
            استقبال
          </Button>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-700/60 pt-4">
        <p className="text-xs text-slate-400 mb-2">آخر المنتجات المستقبلة عبر المسح</p>
        <div className="max-h-36 overflow-y-auto space-y-2">
          {latestScans.length === 0 ? (
            <div className="text-xs text-slate-500">لا توجد عمليات مسح بعد.</div>
          ) : (
            latestScans.slice(0, 8).map((scan) => (
              <div key={scan.id} className="text-xs bg-black/30 border border-slate-700/60 rounded px-3 py-2 flex items-center justify-between">
                <span className="text-slate-300">{scan.itemNameAr} • {scan.storageName}</span>
                <span className="text-cyan-300 font-mono">+{scan.quantity}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
