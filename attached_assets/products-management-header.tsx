import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";

type ProductsManagementHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
};

export function ProductsManagementHeader({
  searchValue,
  onSearchChange,
  onExport,
}: ProductsManagementHeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-slate-700/60 bg-slate-900/60 backdrop-blur-md">
      <h2 className="text-2xl font-bold text-white tracking-wide">إدارة وتوزيع المنتجات</h2>
      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full bg-white/5 border border-slate-700/70 text-white rounded-full py-2 pl-4 pr-10 text-sm placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
            placeholder="ابحث باسم المنتج..."
          />
        </div>

        <Button
          type="button"
          onClick={onExport}
          className="bg-emerald-400 text-black hover:bg-emerald-300 font-bold shadow-[0_0_15px_rgba(52,211,153,0.35)]"
        >
          <Download className="h-4 w-4 ml-2" />
          تصدير Excel
        </Button>
      </div>
    </header>
  );
}
