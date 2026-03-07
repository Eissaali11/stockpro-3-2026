import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  Bell, 
  Check, 
  X, 
  Package, 
  User, 
  Calendar,
  MapPin,
  AtSign,
  FileText,
  AlertCircle,
  Warehouse,
  TrendingUp,
  CheckSquare,
  Square,
  Smartphone,
  ArrowRight,
  Clock3,
  ChevronDown,
  ShieldAlert,
  SlidersHorizontal
} from "lucide-react";
import { GridBackground } from "@/components/dashboard/GridBackground";
import { Navbar } from "@/components/dashboard/Navbar";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  return (
    <NeoShellLayout title="مركز التنبيهات الذكي">
      <div className="space-y-6">
        <div className="rounded-3xl border border-cyan-400/20 bg-slate-900/45 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">مركز التنبيهات الذكي</h2>
              <p className="text-slate-400 text-sm mt-1">
                {isAdminOrSupervisor ? "إدارة ومتابعة طلبات المخزون وسحب الأجهزة" : "إدارة طلبات النقل والإشعارات المرتبطة بالعهدة"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            className="bg-cyan-400/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20"
            type="button"
          >
            <Check className="h-4 w-4 ml-2" />
            تحديد الكل كمقروء
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'الكل', count: allCount },
            { value: 'pending', label: 'قيد الانتظار', count: pendingCount },
            { value: 'approved', label: 'مقبول', count: approvedCount },
            { value: 'rejected', label: 'مرفوض', count: rejectedCount },
          ].map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              variant={filter === tab.value ? 'default' : 'outline'}
              className={
                filter === tab.value
                  ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/40'
                  : 'bg-slate-900/50 border-slate-700/60 text-slate-300 hover:bg-slate-800/60'
              }
              data-testid={`button-filter-${tab.value}`}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>

        {!isAdminOrSupervisor && filter === 'pending' && notificationSettings.daily && pendingBatches.length > 0 && (
          <div className="p-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06]">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Button
                  onClick={toggleSelectAll}
                  variant="outline"
                  size="sm"
                  className="bg-slate-900/50 border-slate-700 text-slate-200 hover:bg-slate-800/60"
                  data-testid="button-select-all"
                >
                  {isAllSelected ? (
                    <><CheckSquare className="h-4 w-4 ml-2" /> إلغاء تحديد الكل</>
                  ) : (
                    <><Square className="h-4 w-4 ml-2" /> تحديد الكل</>
                  )}
                </Button>
                {selectedBatchIds.length > 0 && (
                  <Badge className="bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                    {selectedBatchIds.length} محدد
                  </Badge>
                )}
              </div>

              {selectedBatchIds.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={bulkApproveMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-bulk-approve"
                  >
                    <Check className="h-4 w-4 ml-2" />
                    قبول المحدد ({selectedBatchIds.length})
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    disabled={bulkRejectMutation.isPending}
                    variant="outline"
                    className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                    data-testid="button-bulk-reject"
                  >
                    <X className="h-4 w-4 ml-2" />
                    رفض المحدد ({selectedBatchIds.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-4">
            {isLoading ? (
              <div className="text-center py-12 rounded-2xl border border-slate-700/60 bg-slate-900/40">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400" />
                <p className="mt-4 text-slate-400">جاري تحميل الإشعارات...</p>
              </div>
            ) : (
              <>
                {isAdminOrSupervisor ? (
                  <>
                    {notificationSettings.stock && (
                      <Card className="bg-slate-900/45 border-slate-700/60 overflow-hidden">
                        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white font-semibold">
                            <Package className="h-4 w-4 text-cyan-300" />
                            طلبات المخزون
                          </div>
                          <Badge className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            {filteredInventoryRequests.length}
                          </Badge>
                        </div>

                        <div className="p-4 space-y-3">
                          {filteredInventoryRequests.length === 0 ? (
                            <div className="text-center py-6 text-slate-500">لا توجد طلبات مخزون مطابقة للفلترة</div>
                          ) : (
                            filteredInventoryRequests.map((request) => {
                              const cardId = `stock-${request.id}`;
                              const unread = isUnreadCard(cardId, request.status);

                              return (
                                <div
                                  key={request.id}
                                  onClick={() => setReadNotificationIds((current) => Array.from(new Set([...current, cardId])))}
                                  className={`rounded-xl border p-4 transition-all ${
                                    unread
                                      ? 'border-cyan-400/40 bg-cyan-500/[0.06] border-r-4 border-r-cyan-400'
                                      : 'border-slate-700/60 bg-slate-950/30 hover:bg-slate-900/40'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-white font-bold text-base">طلب مخزون من {request.technicianName}</h3>
                                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ar })}
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 mt-3">
                                        {getRequestedItems(request).slice(0, 5).map((itemText, idx) => (
                                          <Badge key={idx} className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 text-xs">
                                            {itemText}
                                          </Badge>
                                        ))}
                                        {getRequestedItems(request).length > 5 && (
                                          <Badge className="bg-slate-700/50 text-slate-300 border border-slate-600 text-xs">
                                            +{getRequestedItems(request).length - 5}
                                          </Badge>
                                        )}
                                      </div>
                                      {request.notes && (
                                        <p className="text-xs text-slate-400 mt-3 flex items-start gap-1">
                                          <FileText className="h-3.5 w-3.5 mt-0.5" />
                                          {request.notes}
                                        </p>
                                      )}
                                    </div>
                                    {getStatusBadge(request.status)}
                                  </div>

                                  {request.status === 'pending' && (
                                    <div className="flex gap-2 mt-4">
                                      <Button
                                        onClick={() => handleApproveClick(request)}
                                        disabled={approveMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        data-testid={`button-approve-${request.id}`}
                                      >
                                        <Check className="h-4 w-4 ml-1" />
                                        موافقة
                                      </Button>
                                      <Button
                                        onClick={() => handleRejectClick(request)}
                                        disabled={rejectMutation.isPending}
                                        variant="outline"
                                        className="flex-1 bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                                        data-testid={`button-reject-${request.id}`}
                                      >
                                        <X className="h-4 w-4 ml-1" />
                                        رفض
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </Card>
                    )}

                    {notificationSettings.daily && (
                      <Card className="bg-slate-900/45 border-slate-700/60 overflow-hidden">
                        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white font-semibold">
                            <Smartphone className="h-4 w-4 text-cyan-300" />
                            طلبات سحب الأجهزة
                          </div>
                          <Badge className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            {filteredReceivedDevices.length}
                          </Badge>
                        </div>

                        <div className="p-4 space-y-3">
                          {filteredReceivedDevices.length === 0 ? (
                            <div className="text-center py-6 text-slate-500">لا توجد طلبات أجهزة مطابقة للفلترة</div>
                          ) : (
                            filteredReceivedDevices.map((device) => {
                              const cardId = `device-${device.id}`;
                              const unread = isUnreadCard(cardId, device.status);

                              return (
                                <div
                                  key={device.id}
                                  onClick={() => setReadNotificationIds((current) => Array.from(new Set([...current, cardId])))}
                                  className={`rounded-xl border p-4 transition-all ${
                                    unread
                                      ? 'border-cyan-400/40 bg-cyan-500/[0.06] border-r-4 border-r-cyan-400'
                                      : 'border-slate-700/60 bg-slate-950/30 hover:bg-slate-900/40'
                                  }`}
                                  data-testid={`received-device-request-${device.id}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-white font-bold text-base">طلب سحب جهاز: {device.terminalId}</h3>
                                      <p className="text-xs text-slate-400 mt-1">الرقم التسلسلي: {device.serialNumber}</p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        الفني: {technicianNameById.get(device.technicianId) || `فني #${device.technicianId.slice(0, 8)}`}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {formatDistanceToNow(new Date(device.createdAt), { addSuffix: true, locale: ar })}
                                      </p>
                                      {(device.damagePart || device.adminNotes) && (
                                        <p className="text-xs text-slate-400 mt-2">{device.damagePart || device.adminNotes}</p>
                                      )}
                                    </div>
                                    {getStatusBadge(device.status)}
                                  </div>

                                  <div className="flex gap-2 mt-4">
                                    {device.status === 'pending' && (
                                      <>
                                        <Button
                                          onClick={() => handleDeviceActionClick(device, 'approve')}
                                          disabled={reviewDeviceStatusMutation.isPending}
                                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                          data-testid={`button-approve-device-${device.id}`}
                                        >
                                          <Check className="h-4 w-4 ml-1" />
                                          موافقة
                                        </Button>
                                        <Button
                                          onClick={() => handleDeviceActionClick(device, 'reject')}
                                          disabled={reviewDeviceStatusMutation.isPending}
                                          variant="outline"
                                          className="flex-1 bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                                          data-testid={`button-reject-device-${device.id}`}
                                        >
                                          <X className="h-4 w-4 ml-1" />
                                          رفض
                                        </Button>
                                      </>
                                    )}

                                    <Button
                                      onClick={() => window.location.href = `/received-devices/${device.id}`}
                                      variant="outline"
                                      className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                      type="button"
                                    >
                                      <ArrowRight className="h-4 w-4 ml-1" />
                                      فتح
                                    </Button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </Card>
                    )}
                  </>
                ) : (
                  <>
                    {notificationSettings.daily && (
                      <Card className="bg-slate-900/45 border-slate-700/60 overflow-hidden">
                        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white font-semibold">
                            <Warehouse className="h-4 w-4 text-cyan-300" />
                            طلبات النقل من المستودعات
                          </div>
                          <Badge className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            {filteredGroupedTransfers.length}
                          </Badge>
                        </div>

                        <div className="p-4 space-y-3">
                          {filteredGroupedTransfers.length === 0 ? (
                            <div className="text-center py-6 text-slate-500">لا توجد طلبات نقل مطابقة للفلترة</div>
                          ) : (
                            filteredGroupedTransfers.map((groupedTransfer) => {
                              const cardId = `transfer-${groupedTransfer.requestId}`;
                              const unread = isUnreadCard(cardId, groupedTransfer.status);

                              return (
                                <div
                                  key={groupedTransfer.requestId}
                                  onClick={() => setReadNotificationIds((current) => Array.from(new Set([...current, cardId])))}
                                  className={`rounded-xl border p-4 transition-all ${
                                    unread
                                      ? 'border-cyan-400/40 bg-cyan-500/[0.06] border-r-4 border-r-cyan-400'
                                      : 'border-slate-700/60 bg-slate-950/30 hover:bg-slate-900/40'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-white font-bold text-base">طلب نقل من {groupedTransfer.warehouseName}</h3>
                                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {formatDistanceToNow(new Date(groupedTransfer.createdAt), { addSuffix: true, locale: ar })}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5 mt-3">
                                        {getRequestedItems(groupedTransfer).slice(0, 5).map((itemText, idx) => (
                                          <Badge key={idx} className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 text-xs">
                                            {itemText}
                                          </Badge>
                                        ))}
                                        {getRequestedItems(groupedTransfer).length > 5 && (
                                          <Badge className="bg-slate-700/50 text-slate-300 border border-slate-600 text-xs">
                                            +{getRequestedItems(groupedTransfer).length - 5}
                                          </Badge>
                                        )}
                                      </div>
                                      {groupedTransfer.notes && (
                                        <p className="text-xs text-slate-400 mt-3">{groupedTransfer.notes}</p>
                                      )}
                                    </div>
                                    {getStatusBadge(groupedTransfer.status)}
                                  </div>

                                  {groupedTransfer.status === 'pending' && (
                                    <div className="flex gap-2 mt-4">
                                      <Button
                                        onClick={() => handleTechApproveBatchClick(groupedTransfer)}
                                        disabled={techApproveBatchMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        data-testid={`button-approve-${groupedTransfer.requestId}`}
                                      >
                                        <Check className="h-4 w-4 ml-1" />
                                        موافقة
                                      </Button>
                                      <Button
                                        onClick={() => handleTechRejectBatchClick(groupedTransfer)}
                                        disabled={techRejectBatchMutation.isPending}
                                        variant="outline"
                                        className="flex-1 bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                                        data-testid={`button-reject-${groupedTransfer.requestId}`}
                                      >
                                        <X className="h-4 w-4 ml-1" />
                                        رفض
                                      </Button>
                                    </div>
                                  )}

                                  {groupedTransfer.status === 'pending' && (
                                    <div className="mt-3">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleSelectBatch(groupedTransfer.requestId)}
                                        className={`w-full ${
                                          selectedBatchIds.includes(groupedTransfer.requestId)
                                            ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                        }`}
                                        data-testid={`checkbox-${groupedTransfer.requestId}`}
                                      >
                                        {selectedBatchIds.includes(groupedTransfer.requestId)
                                          ? <CheckSquare className="h-4 w-4 ml-1" />
                                          : <Square className="h-4 w-4 ml-1" />}
                                        {selectedBatchIds.includes(groupedTransfer.requestId) ? 'محدد' : 'تحديد'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </Card>
                    )}

                    {notificationSettings.stock && (
                      <Card className="bg-slate-900/45 border-slate-700/60 overflow-hidden">
                        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white font-semibold">
                            <Package className="h-4 w-4 text-cyan-300" />
                            طلبات المخزون الخاصة بي
                          </div>
                          <Badge className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            {filteredMyInventoryRequests.length}
                          </Badge>
                        </div>

                        <div className="p-4 space-y-3">
                          {filteredMyInventoryRequests.length === 0 ? (
                            <div className="text-center py-6 text-slate-500">لا توجد طلبات مخزون مطابقة للفلترة</div>
                          ) : (
                            filteredMyInventoryRequests.map((request) => {
                              const cardId = `mine-${request.id}`;
                              const unread = isUnreadCard(cardId, request.status);

                              return (
                                <div
                                  key={request.id}
                                  onClick={() => setReadNotificationIds((current) => Array.from(new Set([...current, cardId])))}
                                  className={`rounded-xl border p-4 transition-all ${
                                    unread
                                      ? 'border-cyan-400/40 bg-cyan-500/[0.06] border-r-4 border-r-cyan-400'
                                      : 'border-slate-700/60 bg-slate-950/30 hover:bg-slate-900/40'
                                  }`}
                                  data-testid={`my-request-${request.id}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-white font-bold text-base">طلب مخزون</h3>
                                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ar })}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5 mt-3">
                                        {getRequestedItems(request).slice(0, 4).map((itemText, idx) => (
                                          <Badge key={idx} className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 text-xs">
                                            {itemText}
                                          </Badge>
                                        ))}
                                      </div>
                                      {request.adminNotes && request.status !== 'pending' && (
                                        <p className="text-xs text-yellow-300 mt-3">رد المشرف: {request.adminNotes}</p>
                                      )}
                                    </div>
                                    {getStatusBadge(request.status)}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </Card>
                    )}
                  </>
                )}

                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                    عرض الإشعارات الأقدم
                  </button>
                </div>
              </>
            )}
          </div>

          <aside className="xl:col-span-4 rounded-3xl border border-slate-700/60 bg-slate-900/45 p-5 space-y-6 h-fit">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
              إعدادات التنبيهات
            </h3>

            <div className="space-y-4">
              {[
                { key: 'stock' as const, label: 'تنبيهات المخزون', hint: 'طلبات المخزون ومتابعتها' },
                { key: 'daily' as const, label: 'العمليات اليومية', hint: 'نقل المخزون وسحب الأجهزة' },
                { key: 'security' as const, label: 'تنبيهات الأمان', hint: 'محاولات الدخول والتنبيهات الحرجة' },
              ].map((setting) => {
                const enabled = notificationSettings[setting.key];
                return (
                  <div key={setting.key} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{setting.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{setting.hint}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotificationSetting(setting.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? 'bg-cyan-400' : 'bg-slate-700'}`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${enabled ? 'right-1' : 'right-6'}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-700/60 pt-5">
              <h4 className="text-sm font-semibold text-slate-300 mb-4">ملخص الأسبوع</h4>
              <div className="rounded-xl border border-slate-700/60 bg-black/20 p-4">
                <div className="flex items-end justify-between h-24 gap-1.5">
                  {weeklySummaryHeights.map((height, idx) => (
                    <div key={idx} className="w-full bg-cyan-400/15 rounded-t relative">
                      <div className="absolute bottom-0 w-full bg-cyan-400/80 rounded-t" style={{ height }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                  <span>السبت</span>
                  <span>الجمعة</span>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-300" />
                  إجمالي: {allCount}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  حرجة: {pendingCount}
                </div>
              </div>
            </div>

            {notificationSettings.security && (
              <div className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-3 text-xs text-slate-400 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-300 mt-0.5" />
                لا توجد تنبيهات أمان جديدة حالياً.
              </div>
            )}
          </aside>
        </div>
      </div>
  const handleTechApproveBatchClick = (batch: GroupedTransfer) => {
    setSelectedBatch(batch);
    setTechApproveDialogOpen(true);
  };

  const handleTechConfirmApprove = () => {
    if (selectedBatch) {
      const transferIds = selectedBatch.transfers.map(t => t.id);
      techApproveBatchMutation.mutate(transferIds);
    }
  };

  const handleTechRejectBatchClick = (batch: GroupedTransfer) => {
    setSelectedBatch(batch);
    setTechRejectDialogOpen(true);
  };

  const handleTechConfirmReject = () => {
    if (!techRejectionReason.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال سبب الرفض",
        variant: "destructive",
      });
      return;
    }

    if (selectedBatch) {
      const transferIds = selectedBatch.transfers.map(t => t.id);
      techRejectBatchMutation.mutate({ transferIds, reason: techRejectionReason });
    }
  };

  // Bulk selection handlers
  const pendingBatches = !isAdminOrSupervisor ? groupedTransfers.filter(g => g.status === 'pending') : [];
  
  const toggleSelectBatch = (requestId: string) => {
    setSelectedBatchIds(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBatchIds.length === pendingBatches.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(pendingBatches.map(b => b.requestId));
    }
  };

  const isAllSelected = selectedBatchIds.length > 0 && selectedBatchIds.length === pendingBatches.length;

  const handleBulkApprove = () => {
    if (selectedBatchIds.length === 0) return;
    setBulkApproveDialogOpen(true);
  };

  const handleConfirmBulkApprove = () => {
    bulkApproveMutation.mutate(selectedBatchIds);
  };

  const handleBulkReject = () => {
    if (selectedBatchIds.length === 0) return;
    setBulkRejectDialogOpen(true);
  };

  const handleConfirmBulkReject = () => {
    if (!bulkRejectionReason.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال سبب الرفض",
        variant: "destructive",
      });
      return;
    }
    bulkRejectMutation.mutate({ requestIds: selectedBatchIds, reason: bulkRejectionReason });
  };

  // Calculate total quantities from selected batches
  const getSelectedBatchesTotals = () => {
    const totals: Record<string, number> = {};
    
    const selectedBatches = groupedTransfers.filter(g => selectedBatchIds.includes(g.requestId));
    
    selectedBatches.forEach(batch => {
      batch.transfers.forEach(transfer => {
        const key = `${transfer.itemType}_${transfer.packagingType}`;
        totals[key] = (totals[key] || 0) + transfer.quantity;
      });
    });
    
    return totals;
  };

  const getItemDisplayName = (itemTypeId: string, packagingType: string, quantity: number) => {
    const itemType = itemTypes?.find(t => t.id === itemTypeId);
    const fallbackNames: Record<string, string> = {
      'n950': 'نوفا 950',
      'i9000s': 'i9000s',
      'i9100': 'i9100',
      'rollPaper': 'رول حراري',
      'stickers': 'ملصقات',
      'newBatteries': 'بطاريات',
      'mobilySim': 'موبايلي SIM',
      'stcSim': 'STC SIM',
      'zainSim': 'زين SIM',
      'lebara': 'ليبارا SIM',
      'lebaraSim': 'ليبارا SIM',
    };
    
    const displayName = itemType?.nameAr || fallbackNames[itemTypeId] || itemTypeId;
    const packaging = packagingType === 'box' ? 'كرتون' : 'قطعة';
    return `${displayName} (${packaging}): ${quantity}`;
  };

  const handleDeviceActionClick = (device: ReceivedDeviceRequest, action: 'approve' | 'reject') => {
    setSelectedDeviceRequest(device);
    setDeviceActionType(action);
    setDeviceAdminNotes("");
    setDeviceActionDialogOpen(true);
  };

  const handleConfirmDeviceAction = () => {
    if (!selectedDeviceRequest || !deviceActionType) return;

    if (deviceActionType === 'reject' && !deviceAdminNotes.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال سبب الرفض",
        variant: "destructive",
      });
      return;
    }

    reviewDeviceStatusMutation.mutate({
      id: selectedDeviceRequest.id,
      status: deviceActionType === 'approve' ? 'approved' : 'rejected',
      notes: deviceAdminNotes,
    });
  };

  const toggleNotificationSetting = (key: 'stock' | 'daily' | 'security') => {
    setNotificationSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const allVisibleNotificationIds = useMemo(() => {
    if (isAdminOrSupervisor) {
      const stockIds = notificationSettings.stock
        ? filteredInventoryRequests.map((request) => `stock-${request.id}`)
        : [];
      const deviceIds = notificationSettings.daily
        ? filteredReceivedDevices.map((device) => `device-${device.id}`)
        : [];
      return [...stockIds, ...deviceIds];
    }

    const transferIds = notificationSettings.daily
      ? filteredGroupedTransfers.map((group) => `transfer-${group.requestId}`)
      : [];
    const myRequestIds = notificationSettings.stock
      ? filteredMyInventoryRequests.map((request) => `mine-${request.id}`)
      : [];
    return [...transferIds, ...myRequestIds];
  }, [
    isAdminOrSupervisor,
    notificationSettings.stock,
    notificationSettings.daily,
    filteredInventoryRequests,
    filteredReceivedDevices,
    filteredGroupedTransfers,
    filteredMyInventoryRequests,
  ]);

  const handleMarkAllAsRead = () => {
    setReadNotificationIds((current) => Array.from(new Set([...current, ...allVisibleNotificationIds])));
    toast({
      title: "تم التحديث",
      description: "تم تحديد كل الإشعارات المعروضة كمقروءة",
    });
  };

  const isUnreadCard = (cardId: string, status: string) => {
    return status === 'pending' && !readNotificationIds.includes(cardId);
  };

  const allCount = isAdminOrSupervisor ? requests.length + receivedDevices.length : transfers.length;
  const pendingCount = isAdminOrSupervisor
    ? requests.filter(r => r.status === 'pending').length + receivedDevices.filter(d => d.status === 'pending').length
    : transfers.filter(t => t.status === 'pending').length;
  const approvedCount = isAdminOrSupervisor
    ? requests.filter(r => r.status === 'approved').length + receivedDevices.filter(d => d.status === 'approved').length
    : transfers.filter(t => t.status === 'accepted').length;
  const rejectedCount = isAdminOrSupervisor
    ? requests.filter(r => r.status === 'rejected').length + receivedDevices.filter(d => d.status === 'rejected').length
    : transfers.filter(t => t.status === 'rejected').length;

  const weeklySummaryHeights = useMemo(() => {
    const values = [
      allCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      Math.max(0, approvedCount - 1),
      Math.max(0, pendingCount - 1),
      Math.max(0, allCount - rejectedCount),
    ];
    const maxValue = Math.max(...values, 1);
    return values.map((value) => `${Math.max(12, Math.round((value / maxValue) * 100))}%`);
  }, [allCount, pendingCount, approvedCount, rejectedCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f15] to-[#0a0a0f] text-white relative overflow-hidden">
      <GridBackground />

      {/* Top Header */}
      <div className="relative z-20 border-b border-[#18B2B0]/20 bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="p-3 bg-gradient-to-br from-[#18B2B0] to-teal-500 rounded-xl shadow-lg shadow-[#18B2B0]/30"
            >
              <Bell className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                الإشعارات
              </h1>
              <p className="text-sm text-gray-400">
                {isAdminOrSupervisor ? 'طلبات المخزون وسحب الأجهزة من الفنيين' : 'طلبات النقل من المستودعات'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Received Devices Requests Hub (Admin/Supervisor) */}
        {isAdminOrSupervisor && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="relative bg-gradient-to-br from-cyan-500/10 via-blue-500/[0.07] to-indigo-500/[0.03] backdrop-blur-xl border-cyan-500/40 overflow-hidden group hover:border-cyan-500/60 transition-all duration-300" data-testid="card-received-devices-hub">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-indigo-500/5" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="p-4 bg-gradient-to-br from-[#0f0f15] via-[#1a1a24] to-[#0f0f15] rounded-2xl border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/30">
                        <Smartphone className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg">
                        {pendingReceivedDevices.length}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        طلبات سحب الأجهزة
                      </h3>
                      <p className="text-sm text-gray-400">
                        إدارة طلبات الفنيين الخاصة بالأجهزة مع الموافقة الفورية من الإشعارات
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-3 py-1.5">
                    {pendingReceivedDevices.length} بانتظار المراجعة
                  </Badge>
                </div>

                {receivedDevicesLoading ? (
                  <div className="text-center py-6 text-gray-400 text-sm">جاري تحميل طلبات سحب الأجهزة...</div>
                ) : filteredReceivedDevices.length === 0 ? (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-gray-400 text-center">
                    لا توجد طلبات أجهزة مطابقة لحالة الفلترة الحالية.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReceivedDevices.slice(0, 6).map((device) => (
                      <div
                        key={device.id}
                        className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                        data-testid={`received-device-request-${device.id}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-white font-semibold">جهاز: {device.terminalId}</p>
                            <p className="text-xs text-slate-400 mt-1">S/N: {device.serialNumber}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              الفني: {technicianNameById.get(device.technicianId) || `فني #${device.technicianId.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDistanceToNow(new Date(device.createdAt), { addSuffix: true, locale: ar })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {getStatusBadge(device.status)}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/received-devices/${device.id}`}
                              className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                            >
                              <ArrowRight className="h-4 w-4 ml-1" />
                              فتح
                            </Button>
                          </div>
                        </div>

                        {(device.damagePart || device.adminNotes) && (
                          <div className="mt-3 text-xs text-slate-400 p-2 rounded-lg bg-black/20 border border-white/5">
                            {device.damagePart || device.adminNotes}
                          </div>
                        )}

                        {device.status === 'pending' && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              onClick={() => handleDeviceActionClick(device, 'approve')}
                              disabled={reviewDeviceStatusMutation.isPending}
                              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                              data-testid={`button-approve-device-${device.id}`}
                            >
                              <Check className="h-4 w-4 ml-2" />
                              موافقة
                            </Button>
                            <Button
                              onClick={() => handleDeviceActionClick(device, 'reject')}
                              disabled={reviewDeviceStatusMutation.isPending}
                              variant="outline"
                              className="flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                              data-testid={`button-reject-device-${device.id}`}
                            >
                              <X className="h-4 w-4 ml-2" />
                              رفض
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    {filteredReceivedDevices.length > 6 && (
                      <div className="pt-2 text-center">
                        <Button
                          variant="outline"
                          onClick={() => window.location.href = '/received-devices/review'}
                          className="bg-white/5 border-white/10 text-cyan-300 hover:bg-white/10"
                        >
                          عرض جميع طلبات الأجهزة ({filteredReceivedDevices.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/received-devices/review'}
                    className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-500/60"
                  >
                    <ArrowRight className="h-5 w-5 ml-2" />
                    فتح مركز مراجعة الأجهزة
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Technician's Own Inventory Requests Section */}
        {!isAdminOrSupervisor && myInventoryRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="relative bg-gradient-to-br from-purple-500/10 via-violet-500/[0.07] to-fuchsia-500/[0.03] backdrop-blur-xl border-purple-500/40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-fuchsia-500/5" />
              
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl border border-purple-500/30">
                    <Package className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">طلبات المخزون الخاصة بي</h3>
                    <p className="text-sm text-gray-400">الطلبات التي أرسلتها للمشرف</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {myInventoryRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-gradient-to-br from-white/5 via-white/[0.03] to-white/[0.01] rounded-xl border border-white/10"
                      data-testid={`my-request-${request.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-300">
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ar })}
                          </span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {getRequestedItems(request).slice(0, 4).map((item, idx) => (
                          <Badge
                            key={idx}
                            className="bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs"
                          >
                            {item}
                          </Badge>
                        ))}
                        {getRequestedItems(request).length > 4 && (
                          <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs">
                            +{getRequestedItems(request).length - 4} المزيد
                          </Badge>
                        )}
                      </div>

                      {request.notes && (
                        <div className="flex items-start gap-2 mt-2 text-sm text-gray-400">
                          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{request.notes}</span>
                        </div>
                      )}

                      {request.adminNotes && request.status !== 'pending' && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-white/5 rounded-lg">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-400" />
                          <span className="text-sm text-yellow-300">رد المشرف: {request.adminNotes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {myInventoryRequests.length > 5 && (
                  <div className="mt-4 text-center">
                    <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      +{myInventoryRequests.length - 5} طلبات أخرى
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
        
        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'الكل', count: allCount },
              { value: 'pending', label: 'قيد الانتظار', count: pendingCount },
              { value: 'approved', label: 'مقبول', count: approvedCount },
              { value: 'rejected', label: 'مرفوض', count: rejectedCount },
            ].map((tab) => (
              <Button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                variant={filter === tab.value ? 'default' : 'outline'}
                className={filter === tab.value 
                  ? 'bg-gradient-to-r from-[#18B2B0] to-teal-500 text-white shadow-lg shadow-[#18B2B0]/30'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-[#18B2B0]/30'
                }
                data-testid={`button-filter-${tab.value}`}
              >
                {tab.label} ({tab.count})
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Bulk Actions Bar (Technician only) */}
        {!isAdminOrSupervisor && filter === 'pending' && pendingBatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-br from-white/10 via-white/[0.07] to-white/[0.03] backdrop-blur-xl border border-[#18B2B0]/30 rounded-xl"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Button
                  onClick={toggleSelectAll}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-[#18B2B0]/50"
                  data-testid="button-select-all"
                >
                  {isAllSelected ? (
                    <><CheckSquare className="h-4 w-4 ml-2" /> إلغاء تحديد الكل</>
                  ) : (
                    <><Square className="h-4 w-4 ml-2" /> تحديد الكل</>
                  )}
                </Button>
                {selectedBatchIds.length > 0 && (
                  <Badge className="bg-[#18B2B0]/20 text-[#18B2B0] border border-[#18B2B0]/40">
                    {selectedBatchIds.length} محدد
                  </Badge>
                )}
              </div>
              {selectedBatchIds.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={bulkApproveMutation.isPending}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/20"
                    data-testid="button-bulk-approve"
                  >
                    <Check className="h-4 w-4 ml-2" />
                    قبول المحدد ({selectedBatchIds.length})
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    disabled={bulkRejectMutation.isPending}
                    variant="outline"
                    className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                    data-testid="button-bulk-reject"
                  >
                    <X className="h-4 w-4 ml-2" />
                    رفض المحدد ({selectedBatchIds.length})
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#18B2B0]"></div>
            <p className="mt-4 text-gray-400">جاري تحميل الإشعارات...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="p-6 bg-white/5 rounded-full inline-block mb-4">
              <Bell className="h-16 w-16 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">لا توجد إشعارات</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => {
              const isRequest = 'technicianName' in item && 'technicianUsername' in item;
              const request = isRequest ? item as InventoryRequest : null;
              const groupedTransfer = !isRequest ? item as GroupedTransfer : null;

              return (
                <motion.div
                  key={request ? request.id : groupedTransfer?.requestId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card className="relative bg-gradient-to-br from-white/10 via-white/[0.07] to-white/[0.03] backdrop-blur-xl border-[#18B2B0]/30 overflow-hidden group hover:border-[#18B2B0]/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#18B2B0]/10 via-transparent to-violet-500/5" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#18B2B0]/10 rounded-full blur-3xl group-hover:bg-[#18B2B0]/20 transition-all duration-500" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-500" />
                    
                    {/* Checkbox for technician pending items */}
                    {!isAdminOrSupervisor && groupedTransfer && groupedTransfer.status === 'pending' && (
                      <div className="absolute top-4 left-4 z-10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSelectBatch(groupedTransfer.requestId)}
                          className={`p-2 ${
                            selectedBatchIds.includes(groupedTransfer.requestId)
                              ? 'bg-[#18B2B0]/30 border-[#18B2B0] text-[#18B2B0]'
                              : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                          }`}
                          data-testid={`checkbox-${groupedTransfer.requestId}`}
                        >
                          {selectedBatchIds.includes(groupedTransfer.requestId) ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    )}
                    
                    <div className="relative p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="p-4 bg-gradient-to-br from-[#0f0f15] via-[#1a1a24] to-[#0f0f15] rounded-2xl border-2 border-[#18B2B0]/40 shadow-lg shadow-[#18B2B0]/30 group-hover:shadow-[#18B2B0]/50 group-hover:border-[#18B2B0]/60 transition-all duration-300">
                              {request ? (
                                <User className="h-6 w-6 text-[#18B2B0] group-hover:text-teal-400 transition-colors duration-300" />
                              ) : (
                                <Warehouse className="h-6 w-6 text-[#18B2B0] group-hover:text-teal-400 transition-colors duration-300" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#18B2B0] to-teal-400 rounded-full border-2 border-[#0f0f15] shadow-md shadow-[#18B2B0]/50 animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#18B2B0] transition-colors duration-300">
                              {request ? request.technicianName : groupedTransfer?.warehouseName}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {request?.technicianUsername && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <AtSign className="h-3.5 w-3.5 text-[#18B2B0]" />
                                  <span>@{request.technicianUsername}</span>
                                </div>
                              )}
                              {request?.technicianCity && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <MapPin className="h-3.5 w-3.5 text-violet-400" />
                                  <span>{request.technicianCity}</span>
                                </div>
                              )}
                              {groupedTransfer && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
                                  <span>طلب نقل من المستودع</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {formatDistanceToNow(new Date(item.createdAt), { 
                                  addSuffix: true, 
                                  locale: ar 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />

                      {/* Items */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-[#18B2B0]/10 rounded-lg">
                            <Package className="h-4 w-4 text-[#18B2B0]" />
                          </div>
                          <span className="text-sm font-semibold text-white">الأصناف {request ? 'المطلوبة' : 'المنقولة'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getRequestedItems(item).map((itemText, idx) => (
                            <Badge 
                              key={idx}
                              className="bg-gradient-to-r from-[#18B2B0]/20 to-teal-500/20 text-[#18B2B0] border border-[#18B2B0]/30 hover:from-[#18B2B0]/30 hover:to-teal-500/30 transition-all duration-300 px-3 py-1.5 text-xs font-medium shadow-sm"
                            >
                              {itemText}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <div className="mb-5 p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-[#18B2B0] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">ملاحظات</p>
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {item.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rejection reason */}
                      {item.status === 'rejected' && (request?.adminNotes || groupedTransfer?.rejectionReason) && (
                        <div className="mb-5 p-4 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl border border-red-500/30 hover:border-red-500/40 transition-all duration-300">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-red-400 mb-1">سبب الرفض</p>
                              <p className="text-sm text-red-300 leading-relaxed">
                                {request?.adminNotes || groupedTransfer?.rejectionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {item.status === 'pending' && (
                        <div className="flex gap-3 mt-5">
                          <Button
                            onClick={() => request ? handleApproveClick(request) : handleTechApproveBatchClick(groupedTransfer!)}
                            disabled={request ? approveMutation.isPending : techApproveBatchMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-300 h-11"
                            data-testid={`button-approve-${request ? request.id : groupedTransfer?.requestId}`}
                          >
                            <Check className="h-4 w-4 ml-2" />
                            قبول {request ? 'الطلب' : 'النقل'}
                          </Button>
                          <Button
                            onClick={() => request ? handleRejectClick(request) : handleTechRejectBatchClick(groupedTransfer!)}
                            disabled={request ? rejectMutation.isPending : techRejectBatchMutation.isPending}
                            variant="outline"
                            className="flex-1 bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 font-semibold shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-300 h-11"
                            data-testid={`button-reject-${request ? request.id : groupedTransfer?.requestId}`}
                          >
                            <X className="h-4 w-4 ml-2" />
                            رفض {request ? 'الطلب' : 'النقل'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">قبول الطلب</DialogTitle>
            <DialogDescription className="text-gray-400">
              اختر المستودع الذي سيتم السحب منه
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedRequest && (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400 mb-1">الفني:</p>
                <p className="text-white font-bold">{selectedRequest.technicianName}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-white">المستودع</Label>
              <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-warehouse">
                  <SelectValue placeholder="اختر المستودع" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f15] border-[#18B2B0]/20">
                  {warehouses.map((warehouse) => (
                    <SelectItem 
                      key={warehouse.id} 
                      value={warehouse.id}
                      className="text-white hover:bg-white/10"
                    >
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false);
                setSelectedWarehouseId("");
              }}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={!selectedWarehouseId || approveMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              data-testid="button-confirm-approve"
            >
              تأكيد القبول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Received Device Action Dialog */}
      <Dialog open={deviceActionDialogOpen} onOpenChange={setDeviceActionDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {deviceActionType === 'approve' ? 'الموافقة على طلب سحب جهاز' : 'رفض طلب سحب جهاز'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {deviceActionType === 'approve'
                ? 'سيتم اعتماد الطلب وتحديث حالة الجهاز مباشرة.'
                : 'يرجى إدخال سبب الرفض قبل المتابعة.'}
            </DialogDescription>
          </DialogHeader>

          {selectedDeviceRequest && (
            <div className="py-2 px-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400">الجهاز:</p>
              <p className="text-white font-semibold">{selectedDeviceRequest.terminalId} • {selectedDeviceRequest.serialNumber}</p>
            </div>
          )}

          <div className="py-2">
            <Textarea
              value={deviceAdminNotes}
              onChange={(event) => setDeviceAdminNotes(event.target.value)}
              placeholder={deviceActionType === 'approve' ? 'ملاحظات اختيارية...' : 'اكتب سبب الرفض هنا...'}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
              data-testid="textarea-device-action-notes"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeviceActionDialogOpen(false);
                setSelectedDeviceRequest(null);
                setDeviceActionType(null);
                setDeviceAdminNotes("");
              }}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmDeviceAction}
              disabled={reviewDeviceStatusMutation.isPending || (deviceActionType === 'reject' && !deviceAdminNotes.trim())}
              className={deviceActionType === 'approve'
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'}
              data-testid="button-confirm-device-action"
            >
              {reviewDeviceStatusMutation.isPending ? 'جاري الحفظ...' : 'تأكيد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">رفض الطلب</DialogTitle>
            <DialogDescription className="text-gray-400">
              يرجى إدخال سبب رفض الطلب
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
              data-testid="textarea-admin-notes"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setAdminNotes("");
              }}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmReject}
              disabled={!adminNotes.trim() || rejectMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              data-testid="button-confirm-reject"
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Technician Approve Dialog */}
      <Dialog open={techApproveDialogOpen} onOpenChange={setTechApproveDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">قبول طلب النقل</DialogTitle>
            <DialogDescription className="text-gray-400">
              هل تريد قبول هذا الطلب؟ سيتم إضافة الأصناف إلى مخزونك
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="py-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400 mb-1">من المستودع:</p>
              <p className="text-white font-bold">{selectedBatch.warehouseName}</p>
              <p className="text-xs text-gray-500 mt-2">عدد الأصناف: {selectedBatch.transfers.length}</p>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setTechApproveDialogOpen(false)}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleTechConfirmApprove}
              disabled={techApproveBatchMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              data-testid="button-tech-confirm-approve"
            >
              تأكيد القبول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Technician Reject Dialog */}
      <Dialog open={techRejectDialogOpen} onOpenChange={setTechRejectDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">رفض طلب النقل</DialogTitle>
            <DialogDescription className="text-gray-400">
              يرجى إدخال سبب رفض الطلب
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={techRejectionReason}
              onChange={(e) => setTechRejectionReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
              data-testid="textarea-tech-rejection-reason"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTechRejectDialogOpen(false);
                setTechRejectionReason("");
              }}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleTechConfirmReject}
              disabled={!techRejectionReason.trim() || techRejectBatchMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              data-testid="button-tech-confirm-reject"
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <Dialog open={bulkApproveDialogOpen} onOpenChange={setBulkApproveDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">قبول الطلبات المحددة</DialogTitle>
            <DialogDescription className="text-gray-400">
              هل تريد قبول {selectedBatchIds.length} طلب؟ سيتم إضافة جميع الأصناف التالية إلى مخزونك
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Number of requests */}
            <div className="p-3 bg-gradient-to-r from-[#18B2B0]/20 to-teal-500/10 rounded-lg border border-[#18B2B0]/40">
              <p className="text-sm text-gray-400 mb-1">عدد الطلبات:</p>
              <p className="text-white font-bold text-2xl">{selectedBatchIds.length}</p>
            </div>
            
            {/* Items breakdown */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 max-h-60 overflow-y-auto">
              <p className="text-sm font-semibold text-[#18B2B0] mb-3">تفاصيل الكميات:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(getSelectedBatchesTotals()).map(([key, quantity]) => {
                  const [itemType, packagingType] = key.split('_');
                  return (
                    <div 
                      key={key}
                      className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 hover:border-[#18B2B0]/30 transition-colors"
                    >
                      <span className="text-sm text-gray-300">
                        {getItemDisplayName(itemType, packagingType, quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkApproveDialogOpen(false)}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmBulkApprove}
              disabled={bulkApproveMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              data-testid="button-confirm-bulk-approve"
            >
              {bulkApproveMutation.isPending ? "جاري القبول..." : "تأكيد القبول"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border-[#18B2B0]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">رفض الطلبات المحددة</DialogTitle>
            <DialogDescription className="text-gray-400">
              يرجى إدخال سبب رفض {selectedBatchIds.length} طلب
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={bulkRejectionReason}
              onChange={(e) => setBulkRejectionReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
              data-testid="textarea-bulk-rejection-reason"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBulkRejectDialogOpen(false);
                setBulkRejectionReason("");
              }}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmBulkReject}
              disabled={!bulkRejectionReason.trim() || bulkRejectMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              data-testid="button-confirm-bulk-reject"
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
