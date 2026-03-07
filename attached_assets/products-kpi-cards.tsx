import { Boxes, Warehouse, Wrench } from "lucide-react";

type ProductsKpiCardsProps = {
  totalStock: number;
  techniciansStock: number;
  warehousesStock: number;
};

function KpiCard({
  title,
  value,
  icon,
  colorClass,
  strokePercent,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  strokePercent: number;
}) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-xl p-6 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/15 rounded-full blur-2xl group-hover:bg-cyan-500/25 transition-all" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-slate-300 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-wider">{value.toLocaleString("ar-SA")}</h3>
        </div>

        <div className="w-12 h-12 rounded-full border-2 border-slate-600/60 flex items-center justify-center relative">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-700"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray="100, 100"
              strokeWidth="3"
            />
            <path
              className={colorClass}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${strokePercent}, 100`}
              strokeWidth="3"
            />
          </svg>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function ProductsKpiCards({
  totalStock,
  techniciansStock,
  warehousesStock,
}: ProductsKpiCardsProps) {
  const safeTotal = Math.max(totalStock, 1);
  const techniciansPercent = Math.min(100, Math.round((techniciansStock / safeTotal) * 100));
  const warehousesPercent = Math.min(100, Math.round((warehousesStock / safeTotal) * 100));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <KpiCard
        title="المخزون الكلي"
        value={totalStock}
        icon={<Boxes className="h-5 w-5 text-cyan-400" />}
        colorClass="text-cyan-500"
        strokePercent={85}
      />

      <KpiCard
        title="مخزون الفنيين"
        value={techniciansStock}
        icon={<Wrench className="h-5 w-5 text-orange-400" />}
        colorClass="text-orange-500"
        strokePercent={techniciansPercent}
      />

      <KpiCard
        title="مخزون المستودعات"
        value={warehousesStock}
        icon={<Warehouse className="h-5 w-5 text-purple-400" />}
        colorClass="text-purple-500"
        strokePercent={warehousesPercent}
      />
    </div>
  );
}
