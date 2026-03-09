# خطة تنفيذ قسم المحاسبة والمبيعات والمشتريات وربطه مع هيئة الزكاة والضريبة والجمارك (ZATCA)

<p align="center">
  <img src="../attached_assets/logl1.png" alt="Stock Enterprise Logo" width="220" />
</p>

<p align="center"><strong>Stock Enterprise Platform</strong><br/>منصة تشغيل مالي ولوجستي موحدة للمؤسسات</p>

تاريخ الإصدار: 2026-03-08
حالة الوثيقة: Draft v1

## لمحة مميزة عن إمكانيات النظام
- إدارة موحدة من المخزون إلى الفاتورة: تحويل كل حركة تشغيلية إلى أثر مالي واضح وقابل للتدقيق.
- تحكم لحظي في أداء المندوبين: تتبع الكميات المباعة والمتبقية والأعلى مبيعًا حسب المندوب/الصنف/المنطقة.
- أتمتة محاسبية كاملة: قيود يومية تلقائية، ترحيل منضبط، وإقفال مالي قابل للحوكمة.
- جاهزية ضريبية متقدمة: احتساب VAT بدقة مع تقارير ضريبية تشغيلية وإدارية.
- تكامل ZATCA على مستوى المؤسسة: إصدار e-invoice، متابعة الحالة، وإدارة الأخطاء وإعادة المحاولة.
- قيادة بالبيانات: لوحات تنفيذية ومؤشرات KPI تدعم القرار المالي والتشغيلي بشكل يومي.

## 1) الهدف
إنشاء قسم محاسبة متكامل داخل النظام الحالي يغطي:
- دورة المبيعات والفوترة
- دورة المشتريات
- القيود المحاسبية (Double-entry)
- التقارير المالية والضريبية
- التكامل مع الفوترة الإلكترونية في ZATCA (Fatoora)

## 2) الوضع الحالي (Current State)
النظام الحالي قوي في إدارة المخزون والتحويلات والعمليات التشغيلية، لكنه لا يحتوي محاسبة مالية متكاملة.

### نقاط القوة المتوفرة في المشروع
- إدارة مستخدمين وصلاحيات ومناطق ومستودعات.
- إدارة مخزون ديناميكي (`warehouse_inventory_entries`, `technician_*_inventory_entries`).
- سجل حركات/معاملات تشغيلية.
- هيكل Routes modular قابل للتوسع.

### الفجوات المطلوب سدها
- لا يوجد دليل حسابات (COA).
- لا يوجد دفتر يومية/أستاذ عام.
- لا يوجد نموذج فواتير مبيعات/مشتريات ضريبية.
- لا يوجد محرك ضريبي VAT.
- لا يوجد تكامل ZATCA (XML + QR + Clearance/Reporting).

## 3) نطاق المشروع

### داخل النطاق
- مبيعات: فواتير، مرتجعات، إشعارات دائنة، تحصيل.
- تتبع مبيعات المندوبين: الكميات المباعة، الكميات المتبقية، الأعلى مبيعًا (مندوب/صنف/منطقة/فترة).
- مشتريات: فواتير موردين، مرتجعات، إشعارات مدينة، مدفوعات.
- محاسبة عامة: قيود يومية تلقائية ويدوية، ترحيل، ميزان مراجعة.
- ضريبة قيمة مضافة: حساب/تجميع/تقارير.
- ZATCA: إنشاء الفاتورة الإلكترونية وإرسالها وتتبع حالتها.

### خارج النطاق (المرحلة الأولى)
- Payroll/رواتب.
- أصول ثابتة كاملة (Depreciation engine).
- Consolidation بين كيانات متعددة قانونيًا.

## 4) المتطلبات التنظيمية (ZATCA)
- الالتزام بمرحلتين الفوترة الإلكترونية (Generation + Integration).
- دعم نوعي الفواتير:
  - Standard Tax Invoice (Clearance)
  - Simplified Tax Invoice (Reporting)
- الالتزام بـ:
  - Data Dictionary
  - XML Implementation Standard
  - Security Features Implementation Standards

مراجع رسمية:
- https://zatca.gov.sa/en/E-Invoicing/Pages/default.aspx
- https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/E-Invoice-specifications.aspx
- https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/Security-Requirements.aspx

## 5) التصميم المعماري المقترح

### طبقات النظام
- `shared/schemas`: تعريف جداول المحاسبة والفوترة والضرائب.
- `server/application`: Use cases (posting, invoice lifecycle, tax, reporting).
- `server/infrastructure`: مستودعات Drizzle + تكامل ZATCA + Queue.
- `server/routes`: endpoints للمحاسبة والفواتير والتقارير.
- `client/src/pages`: شاشات المحاسبة والمبيعات والمشتريات والتقارير.

### مبدأ محوري
لا يتم اعتبار المستند المالي نهائيًا إلا بعد `posting`؛ وعند الترحيل:
1. يُحفظ المستند.
2. تُنشأ القيود المحاسبية المتوازنة.
3. يُحدَّث المخزون (عند الحاجة).
4. تُحدّث حالة ZATCA.

## 6) نموذج البيانات المقترح (جداول جديدة)

### 6.1 المحاسبة العامة
- `chart_of_accounts`
  - id, code, name_ar, name_en, account_type, parent_id, is_postable, is_active
- `journal_entries`
  - id, entry_no, posting_date, source_type, source_id, status, currency, exchange_rate, created_by
- `journal_entry_lines`
  - id, entry_id, account_id, debit, credit, description, cost_center, region_id

### 6.2 الأطراف المالية
- `customers`
  - id, code, name, vat_number, address, city, credit_limit, payment_terms_days, is_active
- `suppliers`
  - id, code, name, vat_number, address, city, payment_terms_days, is_active

### 6.3 المبيعات
- `sales_invoices`
  - id, invoice_no, invoice_type, customer_id, issue_datetime, due_date, status
  - subtotal, discount_total, taxable_amount, vat_total, grand_total
  - currency, notes, posted_at, posted_by
- `sales_invoice_lines`
  - id, invoice_id, item_type_id, description, qty, unit_price, discount, tax_code_id, line_total, warehouse_id
  - technician_id, source_inventory_type (fixed/moving/warehouse), qty_before_sale, qty_after_sale

### 6.3.1 تتبع أداء مبيعات المندوبين
- `technician_sales_metrics_daily`
  - id, sales_date, technician_id, item_type_id, region_id
  - sold_qty, sold_amount, remaining_qty_end_of_day, invoices_count, returns_qty
  - avg_selling_price, last_sale_at
- ملاحظة تنفيذية:
  - يمكن البدء بـ View/Materialized View مشتق من `sales_invoice_lines` + جداول المخزون الحالية بدل جدول منفصل، ثم التحول لجدول مجمّع عند ازدياد الحجم.

### 6.4 المشتريات
- `purchase_bills`
  - id, bill_no, supplier_id, issue_date, due_date, status
  - subtotal, discount_total, taxable_amount, vat_total, grand_total
  - currency, posted_at, posted_by
- `purchase_bill_lines`
  - id, bill_id, item_type_id, description, qty, unit_cost, discount, tax_code_id, line_total, warehouse_id

### 6.5 المدفوعات والتحصيل
- `payments`
  - id, voucher_no, party_type, party_id, method, amount, payment_date, reference_no, status
- `payment_allocations`
  - id, payment_id, document_type, document_id, allocated_amount

### 6.6 الضرائب
- `tax_codes`
  - id, code, name, rate, category, is_active
- `tax_transactions`
  - id, source_type, source_id, tax_code_id, taxable_amount, tax_amount, direction

### 6.7 التكامل مع ZATCA
- `einvoice_documents`
  - id, source_type, source_id, invoice_uuid, invoice_hash, previous_hash
  - qr_payload, xml_payload, signed_xml_payload
  - zatca_status, clearance_status, reporting_status
  - submitted_at, acknowledged_at, error_code, error_message

### 6.8 التسلسل الرقمي
- `number_sequences`
  - id, scope, year, prefix, next_number

## 7) خرائط القيود المحاسبية (Posting Maps)

### 7.1 فاتورة مبيعات
- مدين: ذمم العملاء / الصندوق
- دائن: إيرادات المبيعات
- دائن: ضريبة مخرجات VAT Output

### 7.2 إشعار دائن (مرتجع مبيعات)
- عكس قيود فاتورة المبيعات حسب قيمة المرتجع.

### 7.3 فاتورة مشتريات
- مدين: المخزون أو المصروف
- مدين: ضريبة مدخلات VAT Input
- دائن: ذمم الموردين

### 7.4 إشعار مدين (مرتجع مشتريات)
- عكس جزئي أو كلي لقيود فاتورة الشراء.

### 7.5 التحصيل
- مدين: البنك/الصندوق
- دائن: ذمم العملاء

### 7.6 السداد
- مدين: ذمم الموردين
- دائن: البنك/الصندوق

## 8) واجهات API المطلوبة (مقترحة)

### 8.1 المحاسبة العامة
- `GET /api/accounting/coa`
- `POST /api/accounting/coa`
- `PATCH /api/accounting/coa/:id`
- `GET /api/accounting/journal-entries`
- `POST /api/accounting/journal-entries`
- `POST /api/accounting/journal-entries/:id/post`

### 8.2 المبيعات
- `GET /api/sales/invoices`
- `POST /api/sales/invoices`
- `GET /api/sales/invoices/:id`
- `POST /api/sales/invoices/:id/post`
- `POST /api/sales/invoices/:id/credit-note`
- `GET /api/sales/technicians/performance`
  - فلاتر: `from`, `to`, `technicianId`, `regionId`, `itemTypeId`
  - المخرجات: `soldQty`, `remainingQty`, `soldAmount`, `invoiceCount`, `returnQty`
- `GET /api/sales/technicians/top`
  - فلاتر: `from`, `to`, `regionId`, `limit`, `metric` (`soldQty` أو `soldAmount`)
  - المخرجات: ترتيب المندوبين الأعلى مبيعًا
- `GET /api/sales/items/top`
  - فلاتر: `from`, `to`, `regionId`, `technicianId`, `limit`
  - المخرجات: الأصناف الأعلى مبيعًا مع الكمية المتبقية الحالية

### 8.3 المشتريات
- `GET /api/purchases/bills`
- `POST /api/purchases/bills`
- `GET /api/purchases/bills/:id`
- `POST /api/purchases/bills/:id/post`
- `POST /api/purchases/bills/:id/debit-note`

### 8.4 المدفوعات
- `POST /api/payments/receipts`
- `POST /api/payments/disbursements`
- `POST /api/payments/:id/allocate`

### 8.5 الضرائب
- `GET /api/tax/vat-summary`
- `GET /api/tax/vat-transactions`

### 8.6 ZATCA
- `POST /api/einvoice/:sourceType/:sourceId/generate`
- `POST /api/einvoice/:id/submit`
- `GET /api/einvoice/:id/status`
- `POST /api/einvoice/:id/retry`

## 9) واجهات المستخدم المطلوبة (Frontend)

- قسم المحاسبة:
  - دليل الحسابات
  - القيود اليومية
  - دفتر الأستاذ وميزان المراجعة
- قسم المبيعات:
  - العملاء
  - فواتير المبيعات
  - لوحة أداء مبيعات المندوبين (المباع/المتبقي)
  - تقرير أعلى المندوبين مبيعًا
  - تقرير أعلى الأصناف مبيعًا
  - إشعارات دائن
  - التحصيلات
- قسم المشتريات:
  - الموردون
  - فواتير المشتريات
  - إشعارات مدين
  - المدفوعات
- قسم الضرائب:
  - ملخص VAT
  - حركة ضريبية
- قسم ZATCA:
  - حالة الإرسال
  - الأخطاء وإعادة المحاولة

## 10) خطة التنفيذ الزمنية (12 أسبوع)

### المرحلة 0: تحليل واعتماد سياسات (أسبوع 1)
- اعتماد دليل الحسابات.
- اعتماد سياسات الترحيل والإقفال.
- اعتماد سيناريوهات VAT.

### المرحلة 1: نواة المحاسبة (أسبوع 2-3)
- بناء جداول COA + Journal + Sequences.
- APIs الأساسية للقيود.
- شاشات أولية لدليل الحسابات والقيود.

### المرحلة 2: دورة المبيعات (أسبوع 4-5)
- جداول/واجهات فواتير المبيعات.
- محرك ترحيل مبيعات + توليد قيد.
- احتساب الكمية المتبقية بعد كل عملية بيع على مستوى المندوب/الصنف.
- تقرير Ranking للأعلى مبيعًا (مندوبين وأصناف).
- تحصيل وربط على الفواتير.

### المرحلة 3: دورة المشتريات (أسبوع 6-7)
- جداول/واجهات فواتير المشتريات.
- محرك ترحيل مشتريات + التحديث المخزني.
- سداد الموردين.

### المرحلة 4: الضرائب والتقارير (أسبوع 8-9)
- Tax Engine (rates, categories, summary).
- تقارير: Ledger, Trial Balance, AR/AP Aging, VAT Summary.

### المرحلة 5: تكامل ZATCA (أسبوع 10-11)
- XML generator + signing + QR.
- إرسال Clearance/Reporting.
- Queue + Retry + monitoring.

### المرحلة 6: UAT والإطلاق (أسبوع 12)
- اختبارات نهاية-لنهاية.
- تدريب المستخدمين.
- Go-live تدريجي.

## 11) خطة الملفات المقترحة داخل المشروع

### `shared/schemas`
- `accounting.schema.ts`
- `sales.schema.ts`
- `purchases.schema.ts`
- `tax.schema.ts`
- `einvoice.schema.ts`

### `server/routes`
- `accounting.routes.ts`
- `sales.routes.ts`
- `purchases.routes.ts`
- `payments.routes.ts`
- `tax.routes.ts`
- `einvoice.routes.ts`

### `server/services`
- `posting-engine.service.ts`
- `tax-engine.service.ts`
- `einvoice-xml.service.ts`
- `einvoice-signing.service.ts`
- `zatca-client.service.ts`

### `server/application`
- use-cases لكل دورة (sales/purchases/payments/tax/reporting)

### `client/src/pages`
- `accounting-dashboard.tsx`
- `sales-invoices.tsx`
- `purchase-bills.tsx`
- `vat-reports.tsx`
- `einvoice-monitor.tsx`

## 12) الأمن والصلاحيات
- إضافة أدوار:
  - `accountant`
  - `finance_manager`
  - `auditor`
- فصل الصلاحيات:
  - إنشاء/تعديل مستند
  - ترحيل
  - عكس
  - عرض تقارير
  - إرسال ZATCA

## 13) الجودة والاختبارات
- Unit Tests:
  - posting maps
  - tax engine
  - invoice totals and rounding
- Integration Tests:
  - API lifecycle للمبيعات/المشتريات
  - اتزان القيود بعد الترحيل
  - صحة مؤشرات المبيعات اليومية للمندوبين (sold vs remaining)
- UAT Scenarios:
  - فاتورة مبيعات + تحصيل
  - بيع من مندوب محدد ثم التأكد من خصم الكمية وتحديث مؤشر المتبقي
  - التحقق من ترتيب "الأعلى مبيعًا" عند اختلاف الفترة الزمنية
  - فاتورة مشتريات + سداد
  - مرتجعات
  - دورة ZATCA كاملة مع retry

## 14) معايير القبول (Acceptance Criteria)
- كل مستند مرحل ينتج قيد متوازن (debit = credit).
- لا يمكن حذف مستند مرحل (فقط عكس عبر مستند عكسي).
- تقارير VAT تتطابق مع الفواتير المرحلة.
- تتبع كامل لحالة الفاتورة في ZATCA.
- توفر تقرير مبيعات مندوب دقيق يوضح:
  - الكمية المباعة لكل صنف
  - الكمية المتبقية الحالية
  - إجمالي المبيعات بالقيمة
- توفر Ranking للأعلى مبيعًا:
  - أعلى المندوبين مبيعًا
  - أعلى الأصناف مبيعًا
- تدقيق كامل (audit trail) لكل تعديل/ترحيل/إرسال.

## 15) المخاطر وخطة المعالجة
- تغير المواصفات التنظيمية:
  - اعتماد تصميم versioned في `einvoice`.
- تعارض الترقيم:
  - قفل تسلسلي داخل transaction.
- أخطاء الإرسال الخارجي:
  - queue + retry + dead-letter + monitoring.
- فروقات بين المخزون والمحاسبة:
  - reconciliation job يومي مع تنبيهات.

## 16) مخرجات المرحلة الأولى (MVP)
- إصدار فواتير مبيعات ومشتريات.
- ترحيل تلقائي للقيود.
- ضريبة VAT أساسية.
- تكامل أولي ZATCA مع تتبع الحالة.
- تتبع مبيعات المندوبين (مباع/متبقي) مع تقرير أعلى المبيعات.
- تقارير أساسية (Trial Balance + VAT Summary + AR/AP Aging).

---

## ملحق: قرارات تنفيذية أولية
- تعتمد هذه الخطة على البنية الحالية للمشروع (Drizzle + Express + React).
- يُنصح بتنفيذ Data model أولًا ثم محرك الترحيل ثم واجهات المستخدم.
- أي عملية مالية يجب أن تكون idempotent وقابلة للتدقيق.

