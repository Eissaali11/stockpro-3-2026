import { Button } from "@/components/ui/button";
import type {
  ProductDistributionRow,
  StorageBreakdownRow,
} from "../types";
import { ChevronDown, Eye, RefreshCw, Warehouse, Wrench } from "lucide-react";

type ProductsDistributionTableProps = {
  rows: ProductDistributionRow[];
  expandedProductId: string | null;
  onToggleExpand: (itemTypeId: string) => void;
  onReceiveFromRow: (itemTypeId: string) => void;
  warehouseBreakdownByItem: Record<string, StorageBreakdownRow[]>;
  technicianBreakdownByItem: Record<string, StorageBreakdownRow[]>;
};

function buildSparklinePath(points: number[]): string {
  if (points.length === 0) return "M0 10 L80 10";
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(1, max - min);

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 80;
      const y = 18 - ((point - min) / range) * 16;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function ProductsDistributionTable({
  rows,
  expandedProductId,
  onToggleExpand,
  onReceiveFromRow,
  warehouseBreakdownByItem,
  technicianBreakdownByItem,
}: ProductsDistributionTableProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700/60 mb-2">
        <div className="col-span-3">المنتج</div>
        <div className="col-span-2 text-center">المستودعات الرئيسية</div>
        <div className="col-span-2 text-center">بعهد الفنيين</div>
        <div className="col-span-2 text-center">الإجمالي الكلي</div>
        <div className="col-span-2 text-center">الحركة (7 أيام)</div>
        <div className="col-span-1 text-center">إجراءات</div>
      </div>

      {rows.map((row) => {
        const isExpanded = expandedProductId === row.itemTypeId;
        const warehouseBreakdown = warehouseBreakdownByItem[row.itemTypeId] || [];
        const technicianBreakdown = technicianBreakdownByItem[row.itemTypeId] || [];

        return (
          <div
            key={row.itemTypeId}
            className={`bg-slate-900/60 backdrop-blur-md border rounded-xl p-4 transition-all relative overflow-hidden ${
              isExpanded
                ? "border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.08)]"
                : "border-slate-700/60 hover:border-white/20"
            }`}
          >
            {isExpanded && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />}

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-slate-400 text-xs font-mono">SKU</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-base">{row.nameAr}</h4>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">SKU: {row.sku}</p>
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-center gap-2">
                <Warehouse className="h-4 w-4 text-purple-400" />
                <span className="text-slate-300 font-mono text-sm">{row.warehouseQty.toLocaleString("ar-SA")}</span>
              </div>

              <div className="col-span-2 flex items-center justify-center gap-2">
                <Wrench className="h-4 w-4 text-orange-400" />
                <span className="text-slate-300 font-mono text-sm">{row.technicianQty.toLocaleString("ar-SA")}</span>
              </div>

              <div className="col-span-2 flex justify-center">
                <span className="text-white font-bold font-mono text-base px-3 py-1 bg-cyan-500/10 rounded border border-cyan-500/20 text-cyan-400">
                  {row.totalQty.toLocaleString("ar-SA")}
                </span>
              </div>

              <div className="col-span-2 flex justify-center items-center h-8">
                <svg className="stroke-cyan-500" width="80" height="20" viewBox="0 0 80 20">
                  <path d={buildSparklinePath(row.trendPoints)} fill="none" strokeLinecap="round" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="col-span-1 flex justify-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-white/5 border-white/15 text-slate-300 hover:bg-white/10"
                  onClick={() => onToggleExpand(row.itemTypeId)}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-cyan-500/10 border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20"
                  onClick={() => onReceiveFromRow(row.itemTypeId)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-white/5 border-white/15 text-slate-300 hover:bg-white/10"
                  onClick={() => onToggleExpand(row.itemTypeId)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-2 gap-6 pl-4 pr-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-purple-400" />
                    تفاصيل المستودعات ({row.warehouseQty.toLocaleString("ar-SA")})
                  </h5>

                  <div className="space-y-2">
                    {warehouseBreakdown.length === 0 ? (
                      <div className="text-xs text-slate-500 bg-black/30 px-3 py-2 rounded">لا توجد كميات حالية.</div>
                    ) : (
                      warehouseBreakdown.slice(0, 6).map((entry) => (
                        <div key={entry.id} className="flex justify-between items-center text-sm bg-black/30 px-3 py-2 rounded">
                          <span className="text-slate-300">{entry.label}</span>
                          <span className="font-mono text-white">{entry.quantity.toLocaleString("ar-SA")}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-orange-400" />
                    أعلى الفنيين عهدة ({row.technicianQty.toLocaleString("ar-SA")})
                  </h5>

                  <div className="space-y-2">
                    {technicianBreakdown.length === 0 ? (
                      <div className="text-xs text-slate-500 bg-black/30 px-3 py-2 rounded">لا توجد كميات حالية.</div>
                    ) : (
                      technicianBreakdown.slice(0, 6).map((entry, idx) => (
                        <div
                          key={entry.id}
                          className={`flex justify-between items-center text-sm bg-black/30 px-3 py-2 rounded ${
                            idx === 0 ? "border-l-2 border-orange-500/50" : ""
                          }`}
                        >
                          <span className="text-slate-300">{entry.label}</span>
                          <span className="font-mono text-white">{entry.quantity.toLocaleString("ar-SA")}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
