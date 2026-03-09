import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { getRoleLabel } from "@shared/roles";
import logo from "@/assets/logo.png";
import {
  Bell,
  Boxes,
  CircleHelp,
  ClipboardList,
  Home,
  Settings,
  Shapes,
  ShieldCheck,
  Undo2,
  LogOut,
  ScrollText,
  Search,
  Users,
  Warehouse,
  Calculator,
} from "lucide-react";

type NeoShellLayoutProps = {
  title: string;
  children: ReactNode;
};

interface InventoryRequest {
  id: string;
  status: "pending" | "approved" | "rejected";
}

interface ReceivedDeviceRequest {
  id: string;
  status: "pending" | "approved" | "rejected";
}

interface WarehouseTransfer {
  id: string;
  requestId?: string;
  technicianId: string;
  warehouseId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface GroupedTransfer {
  requestId: string;
  status: "pending" | "accepted" | "rejected";
}

function initials(fullName?: string | null): string {
  if (!fullName) return "م";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "م") + (parts[1]?.[0] || "");
}

export function NeoShellLayout({ title, children }: NeoShellLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdminOrSupervisor = user?.role === "admin" || user?.role === "supervisor";
  const isTechnician = user?.role === "technician";

  const { data: requests = [] } = useQuery<InventoryRequest[]>({
    queryKey: user?.role === "admin" ? ["/api/inventory-requests"] : ["/api/supervisor/inventory-requests"],
    enabled: isAdminOrSupervisor,
  });

  const { data: receivedDevices = [] } = useQuery<ReceivedDeviceRequest[]>({
    queryKey: ["/api/received-devices"],
    enabled: isAdminOrSupervisor,
  });

  const { data: transfers = [] } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
    enabled: isTechnician && !!user?.id,
  });

  const { data: myInventoryRequests = [] } = useQuery<InventoryRequest[]>({
    queryKey: ["/api/inventory-requests/my"],
    enabled: isTechnician && !!user?.id,
  });

  const groupedTransfers = useMemo(() => {
    if (!isTechnician) return [] as GroupedTransfer[];

    const groupMap = new Map<string, GroupedTransfer>();

    transfers.forEach((transfer) => {
      const key =
        transfer.requestId ||
        `${transfer.technicianId}-${transfer.warehouseId}-${new Date(transfer.createdAt).getTime()}-${transfer.status}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          requestId: key,
          status: transfer.status,
        });
      }
    });

    return Array.from(groupMap.values());
  }, [isTechnician, transfers]);

  const pendingNotificationsCount = isAdminOrSupervisor
    ? requests.filter((request) => request.status === "pending").length +
      receivedDevices.filter((device) => device.status === "pending").length
    : groupedTransfers.filter((group) => group.status === "pending").length +
      myInventoryRequests.filter((request) => request.status === "pending").length;

  const notificationBadgeLabel = pendingNotificationsCount > 99 ? "99+" : String(pendingNotificationsCount);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { href: "/home", label: "الصفحة الرئيسية", icon: Home, roles: ["admin", "supervisor", "technician"] },
    { href: user?.role === "technician" ? "/my-fixed-inventory" : "/admin-inventory-overview", label: "إدارة المخزون", icon: Boxes, roles: ["admin", "supervisor", "technician"] },
    { href: "/products-management", label: "إدارة المنتجات", icon: Shapes, roles: ["admin", "supervisor", "technician"] },
    { href: "/operations-search", label: "البحث", icon: Search, roles: ["admin", "supervisor", "technician"] },
    { href: "/operations", label: "العمليات", icon: ClipboardList, roles: ["admin", "supervisor"] },
    { href: "/warehouses", label: "إدارة المستودعات", icon: Warehouse, roles: ["admin", "supervisor"] },
    { href: "/withdrawn-devices", label: "الأصناف المرتجعة", icon: Undo2, roles: ["admin", "supervisor"] },
    { href: "/accounting", label: "قسم المحاسبة", icon: Calculator, roles: ["admin", "supervisor", "accountant", "finance_manager", "auditor"] },
    { href: "/admin", label: "إدارة المستخدمين", icon: Users, roles: ["admin"] },
    { href: "/system-logs", label: "سجل النظام", icon: ScrollText, roles: ["admin", "supervisor"] },
    { href: "/backup", label: "النسخ الاحتياطية", icon: ShieldCheck, roles: ["admin"] },
    { href: "/item-types", label: "إدارة الأصناف", icon: Shapes, roles: ["admin"] },
  ].filter((item) => item.roles.includes(user?.role || "technician"));

  return (
    <div dir="rtl" className="min-h-screen bg-[#102222] text-slate-100 flex">
      <aside className="w-72 shrink-0 border-l border-slate-700/60 bg-[#1a3636] flex flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-700/60">
          <div className="h-16 w-16 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center overflow-hidden shrink-0">
            <img src={logo} alt="ستوك" className="h-14 w-14 object-contain" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">إدارة المخزون</h1>
        </div>

        <div className="p-4 flex flex-col gap-5 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
            <div className="size-11 rounded-full bg-cyan-300/20 text-cyan-200 flex items-center justify-center border border-cyan-300/40 font-semibold">
              {initials(user?.fullName)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{user?.fullName || "المستخدم"}</span>
              <span className="text-xs text-slate-400">{getRoleLabel(user?.role || "technician")}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                location === item.href ||
                (item.href !== "/home" && location.startsWith(item.href));

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={
                    active
                      ? "flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-400/20 text-cyan-300 font-medium"
                      : "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/70 transition-colors font-medium"
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-700/60">
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/70 transition-colors font-medium" href="#">
            <CircleHelp className="h-4 w-4" />
            المساعدة
          </a>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-2 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-300 hover:bg-rose-500/10 transition-colors font-medium disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-slate-700/60 bg-[#143030]/90 backdrop-blur-md flex items-center justify-between px-8 shrink-0 sticky top-0 z-10">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex items-center gap-5">
            <button
              className="relative p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-300"
              type="button"
              onClick={() => setLocation("/notifications")}
              aria-label="فتح الإشعارات"
            >
              <Bell className="h-5 w-5" />
              {pendingNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 bg-red-500 text-white text-[10px] leading-none font-bold rounded-full border border-[#143030] flex items-center justify-center">
                  {notificationBadgeLabel}
                </span>
              )}
            </button>
            <div className="text-slate-300">
              <Settings className="h-5 w-5" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
