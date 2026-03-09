# التوثيق الشامل للنظام وخطة Clean Architecture

آخر تحديث: 2026-03-04

---

## 1) الملخص التنفيذي

هذا المستند يقدّم مرجعًا موحّدًا للحالة الحالية لنظام إدارة المخزون، ثم يضع خطة انتقال عملية إلى Clean Architecture بدون تعطيل التشغيل.

أهداف الخطة:
- توحيد المعمارية وتقليل التداخل بين الطبقات.
- تحسين قابلية الاختبار والصيانة والتوسع.
- حماية منطق الأعمال من تغييرات قواعد البيانات أو واجهات API.
- تأسيس خارطة تطوير واضحة قصيرة/متوسطة/طويلة المدى.

---

## 2) نظرة عامة على النظام (الحالة الحالية)

### 2.1 المجال الوظيفي
النظام يدير:
- المخزون الثابت والمتحرك للمندوبين.
- إدارة المستودعات والتحويلات.
- إدارة المستخدمين والصلاحيات.
- طلبات المخزون والموافقات.
- الأجهزة المسحوبة/المستلمة.
- السجلات النظامية والمعاملات والتقارير.

### 2.2 التقنية الحالية
- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui + React Query.
- Backend: Node.js + Express + TypeScript.
- Database: PostgreSQL + Drizzle ORM.
- Auth: Session-based auth + middleware للحماية والتحقق من الأدوار.

### 2.3 بنية المشروع الحالية (مختصرة)
- client/src/pages: صفحات النظام.
- client/src/components: مكونات UI وmodals.
- server/routes + server/controllers: طبقة HTTP.
- server/services: منطق أعمال متزايد.
- server/repositories + server/infrastructure/repositories: طبقة الوصول للبيانات (جزئيًا مكرر).
- server/storage.ts + server/database-storage.ts: طبقة توافق/تجريد legacy.
- shared/schema.ts: السكيمة والأنواع المشتركة.

### 2.4 ملاحظات تشغيلية
- فحص الأنواع TypeScript أصبح نظيفًا (check:full يمر بدون أخطاء).
- توجد آثار إعادة هيكلة سابقة (legacy + refactored) وتحتاج توحيد تدريجي منظم.

---

## 3) التحديات الحالية

1. تداخل المسؤوليات بين storage/services/repositories.
2. وجود مسارات legacy بالتوازي مع المسارات الجديدة.
3. تكرار جزئي في تعريفات الطبقات (repositories/services).
4. اقتران منطق الأعمال ببعض تفاصيل Drizzle/schema في عدة أماكن.
5. تغطية الاختبارات ليست بالمستوى المطلوب للانتقال الآمن.
6. المراقبة والقياسات (observability) يمكن تعزيزها.

---

## 4) الرؤية المستهدفة: Clean Architecture

### 4.1 الطبقات المستهدفة

1) Presentation Layer
- Controllers + DTO mappers + request/response validation.
- لا تحتوي منطق أعمال.

2) Application Layer
- Use Cases (أوامر/استعلامات) orchestrate workflows.
- تنسّق بين domain services وports.

3) Domain Layer
- Entities + Value Objects + Domain Rules.
- Domain Services وقواعد الأعمال الأساسية.
- لا تعتمد على Express أو Drizzle.

4) Infrastructure Layer
- Implementations لـ Repositories/Ports.
- Drizzle adapters + PostgreSQL persistence.
- Integrations خارجية (Export, Notifications, Backup).

### 4.2 قواعد الاعتماد (Dependency Rule)
- الطبقات الخارجية تعتمد على الداخلية فقط.
- Domain لا يعرف شيئًا عن Express/DB.
- Application يعتمد على interfaces (ports) وليس implementations.

### 4.3 Ports & Adapters المقترحة
- Ports (داخلية):
  - UserRepositoryPort
  - InventoryRepositoryPort
  - WarehouseRepositoryPort
  - TransferRepositoryPort
  - DeviceRepositoryPort
  - LogRepositoryPort
- Adapters (خارجية):
  - DrizzleUserRepository
  - DrizzleInventoryRepository
  - ...

---

## 5) الهيكل المستهدف للمجلدات (اقتراح عملي)

```text
server/
  api/
    controllers/
    routes/
    middleware/
    validators/
    dto/
  application/
    use-cases/
      inventory/
      warehouse/
      transfers/
      users/
      devices/
    ports/
    mappers/
  domain/
    entities/
    value-objects/
    services/
    events/
    exceptions/
  infrastructure/
    database/
      drizzle/
      migrations/
    repositories/
    providers/
  shared/
    logger/
    config/
    types/
```

مهم: الانتقال يتم تدريجيًا بدون كسر المسارات الحالية.

---

## 6) خطة الانتقال إلى Clean Architecture (Roadmap)

## المرحلة 0: Baseline & Freeze خفيف (1 أسبوع)
المخرجات:
- توثيق current flows وcritical endpoints.
- تثبيت قواعد lint/typecheck/build في CI.
- تعريف قائمة non-functional requirements.

معايير القبول:
- check:full + build يمر دائمًا في CI.
- ملف ADR أولي يحدد قرارات المعمارية.

## المرحلة 1: Domain Extraction (2-3 أسابيع)
المخرجات:
- استخراج كيانات وقواعد الأعمال الأساسية:
  - Inventory, TechnicianInventory, Warehouse, Transfer, Request, Device.
- تعريف Domain services والقواعد الحرجة (تحويل/اعتماد/رفض/عتبات).

معايير القبول:
- لا import من Express/Drizzle داخل domain.
- اختبارات unit لقواعد domain الأساسية.

## المرحلة 2: Application Use Cases (2-4 أسابيع)
المخرجات:
- إنشاء use-cases لكل سيناريو رئيسي:
  - Create/Update Inventory
  - Transfer From Warehouse
  - Approve/Reject Transfer
  - Create/Approve Requests
  - Device workflows
- تعريف Ports interfaces.

معايير القبول:
- Controllers تستدعي use-cases فقط.
- منطق الأعمال يُزال من routes/controllers.

## المرحلة 3: Infrastructure Adapters (2-4 أسابيع)
المخرجات:
- بناء adapters لـ Drizzle repositories مطابقة للـ ports.
- توحيد data access layer وإلغاء التكرار.

معايير القبول:
- منع الوصول المباشر لـ db من الطبقات العليا.
- تغطية integration tests للـ adapters.

## المرحلة 4: API Stabilization & Versioning (1-2 أسبوع)
المخرجات:
- توحيد DTOs وerror contract.
- إدخال API versioning تدريجي (v1/v2 عند الحاجة).
- توحيد pagination/filter conventions.

معايير القبول:
- OpenAPI محدث.
- عدم كسر العقود الحالية بدون deprecation policy.

## المرحلة 5: Legacy Decommission (1-2 أسبوع)
المخرجات:
- إغلاق المسارات/الطبقات legacy بعد التأكد من parity.
- إزالة الملفات غير المستخدمة.

معايير القبول:
- لا references لملفات legacy في runtime.
- smoke tests ناجحة بالكامل.

## المرحلة 6: Hardening (مستمرة)
المخرجات:
- تعزيز security/performance/observability.
- إضافة SLOs ولوحات monitoring.

معايير القبول:
- dashboards للتتبع + تنبيهات production.

---

## 7) خطة الاختبارات المطلوبة خلال الانتقال

1) Unit Tests (Domain/Application)
- تغطي قواعد المخزون والتحويل والاعتماد.

2) Integration Tests (Infrastructure)
- اختبارات repositories على PostgreSQL test DB.

3) API Contract Tests
- التحقق من response schemas وstatus codes.

4) E2E Smoke
- login, fetch dashboard, transfer flow, requests flow.

هدف التغطية المقترح:
- Domain/Application: 80%+
- Infrastructure/API critical paths: 60%+

---

## 8) الأمن والموثوقية والأداء

### الأمن
- توحيد authorization policies مركزيًا.
- rate limiting لنقاط auth الحساسة.
- audit trail إلزامي للعمليات الإدارية.
- مراجعة input validation على كل endpoints.

### الموثوقية
- health checks + readiness checks.
- graceful shutdown موحد.
- retries idempotent للعمليات الخارجية.

### الأداء
- تحسين الاستعلامات الثقيلة (transactions, logs, dashboard).
- caching جزئي للـ read-heavy endpoints.
- pagination افتراضية لجميع القوائم.

---

## 9) التطوير الممكن على النظام (Feature Roadmap)

## أ) قصير المدى (0-3 أشهر)
- مركز تنبيهات ذكي للمخزون منخفض/حرج.
- تحسين صفحة المعاملات بإحصائيات أدق وتصدير أفضل.
- إدارة صلاحيات أدق من role-based إلى permission-based.
- تحسين تجربة mobile في الصفحات الحرجة.

## ب) متوسط المدى (3-6 أشهر)
- Workflow approvals متعدد المستويات.
- Queue للعمليات الثقيلة (exports, backups).
- تقارير تشغيلية متقدمة (SLA, lead time, aging).
- مركز إعدادات سياسات المخزون لكل منطقة.

## ج) طويل المدى (6-12 شهر)
- Mobile app للمندوبين (offline-first).
- تكاملات ERP/BI.
- تنبؤ احتياجات المخزون (forecasting).
- event-driven architecture تدريجيًا للعمليات الحيوية.

---

## 10) مؤشرات النجاح (KPIs)

تقنية:
- Mean Time To Restore (MTTR) أقل من 30 دقيقة للحوادث الحرجة.
- زمن الاستجابة P95 لأهم endpoints أقل من 300ms.
- تغطية اختبارات domain/application > 80%.

منتجية:
- تقليل زمن إضافة ميزة جديدة بنسبة 30%.
- تقليل نسبة الأعطال الناتجة عن regressions بنسبة 40%.

أعمال:
- تقليل أخطاء المخزون اليدوية.
- تسريع دورة الموافقات والتحويلات.

---

## 11) خطة تنفيذ مقترحة (Sprints)

Sprint 1-2:
- Phase 0 + بداية Phase 1 (Domain core + ADR + CI gates).

Sprint 3-4:
- استكمال Phase 1 + Phase 2 (Use-cases للعمليات الحرجة).

Sprint 5-6:
- Phase 3 (Infrastructure adapters) + contract tests.

Sprint 7:
- Phase 4 (API stabilization).

Sprint 8:
- Phase 5 (legacy decommission) + production hardening.

---

## 12) المخاطر وخطط التخفيف

1) خطر كسر سلوك قائم أثناء النقل
- تخفيف: migration by slice + contract tests + feature flags.

2) تضخم مدة الانتقال
- تخفيف: تحديد أولويات حسب business criticality.

3) ازدواجية طبقات مؤقتة
- تخفيف: تواريخ إزالة واضحة لكل legacy module.

4) نقص الاختبارات
- تخفيف: لا يتم دمج أي refactor بدون tests للوظائف الحرجة.

---

## 13) توصيات عملية فورية

1. اعتماد هذا المستند كمرجع هندسي أساسي.
2. بدء Phase 0 رسميًا مع ADR-001 خلال الأسبوع القادم.
3. اختيار نطاق تجريبي واحد للانتقال (Inventory Transfers).
4. إضافة لوحات قياس أساسية قبل أي refactor واسع.
5. إغلاق أي تطوير feature كبير خارج الخطة حتى تثبيت الأساس المعماري.

---

## 14) الخلاصة

النظام حاليًا يعمل وظيفيًا وبنية الكود تحسنت بشكل كبير، لكن الوصول إلى قابلية صيانة عالية على المدى الطويل يتطلب انتقالًا منظمًا إلى Clean Architecture.

الخطة المقترحة هنا عملية، تدريجية، وقابلة للتنفيذ دون تعطيل التشغيل، مع تركيز واضح على:
- حماية منطق الأعمال.
- تقليل التكرار والاقتران.
- رفع الجودة والسرعة في التطوير المستقبلي.
