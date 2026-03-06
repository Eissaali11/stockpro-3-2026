# خطة حذرة لتفكيك `dist/index.js`

## 1) نتيجة التحليل الحالي

- `dist/index.js` هو **ملف build مجمّع (bundle)** ناتج عن Esbuild، وليس مصدرًا أصليًا للصيانة.
- عدد الأسطر الحالي: ~7767.
- يحتوي علامات مقاطع من المصدر (`// server/...`) بعدد ~89 مقطع.
- أكبر المقاطع داخل الملف حاليًا تقريبًا:
  - `server/database-storage.ts` (~925 سطر)
  - `shared/schema.ts` (~559 سطر)
  - `server/controllers/technicians.controller.ts` (~432 سطر)
- سكربتات البناء والتشغيل الحالية:
  - `build`: `vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
  - `start`: `node dist/index.js`

## 2) ملاحظة حرجة قبل أي تفكيك

محتوى `dist/index.js` الحالي يبدو **غير متزامن مع آخر refactor في المصدر** (مثال: يظهر منطق قديم في `server/database-storage.ts` داخل dist).

> القرار الآمن: لا نبدأ التفكيك من الملف الناتج نفسه. نثبت أولًا تزامن `dist` مع `src` ثم نفكك عبر المصدر + إعدادات البناء.

## 3) مبادئ الأمان (Non-Negotiable)

1. **ممنوع تعديل `dist/index.js` يدويًا**.
2. كل تغيير يتم في `server/**` و/أو إعدادات build فقط.
3. بعد كل مرحلة: `npm run check` + `npm run test:unit` + smoke API.
4. وجود خطة rollback جاهزة (تشغيل artifact السابق فورًا).

## 4) خطة التنفيذ المرحلية (Cautious Phased Plan)

### Phase A — تثبيت خط الأساس (Baseline)

**الهدف:** ضمان أن `dist` يعكس الحالة الحالية للمصدر.

1. تشغيل بناء نظيف:
   - `npm run build`
2. توثيق baseline:
   - حجم `dist/index.js`
   - عدد الأسطر
   - وقت الإقلاع
3. اختبار تشغيل سريع:
   - `npm run start`
   - فحص `/api/health`

**معيار النجاح:** build وتشغيل سليم بدون أخطاء startup.

---

### Phase B — قابلية التتبع والتحليل

**الهدف:** تحويل الباندل من "صندوق أسود" إلى Artifact قابل للقياس.

1. إضافة build تحليلي (اختياري لكن موصى به):
   - `--metafile=dist/meta.json`
2. إضافة sourcemap خارجي للباندل الخادمي:
   - `--sourcemap=external`
3. استخراج أكبر الموديولات المتسببة بالحجم من `meta.json`.

**معيار النجاح:** تقرير واضح top contributors للحجم/التعقيد.

---

### Phase C — التفكيك الصحيح من المصدر

**الهدف:** تقليل التعقيد في الباندل عبر المصدر، وليس عبر dist.

1. الاستمرار في فصل الملفات الثقيلة بمبدأ module-per-concern
   - Controllers الكبيرة
   - Repositories متعددة المسؤوليات
   - Route modules الطويلة
2. منع side-effects عند الاستيراد (خصوصًا config/session/db init).
3. تقليل re-export chains غير الضرورية.

**معيار النجاح:**
- انخفاض الحجم/الأسطر في الباندل الناتج.
- نفس سلوك API بدون تغيّر contracts.

---

### Phase D — تفكيك artifact نفسه (Output Chunking)

**الهدف:** جعل `dist` متعدد الملفات بدل ملف ضخم واحد.

> هذا هو التفكيك الحقيقي لـ `dist/index.js` لكن يتم عبر إعدادات build.

1. تفعيل Esbuild splitting للخادم (ESM):
   - `--splitting`
   - الحفاظ على `--format=esm --outdir=dist`
2. إبقاء entry واضح (مثل `dist/index.js`) مع chunks مساعدة.
3. التحقق أن runtime في بيئة الاستضافة يدعم ESM + chunks.

**مخاطر هذه المرحلة:**
- ترتيب التحميل/side-effects
- مسارات نسبية عند النسخ/النشر
- توافق PM2/Hostinger مع layout الجديد

**معيار النجاح:**
- تشغيل مستقر بنفس endpoints
- artifact مقسم (عدة ملفات) بدل monolith.

---

### Phase E — Harden & Rollback Ready

**الهدف:** إطلاق آمن وقابل للرجوع.

1. smoke tests قبل وبعد النشر.
2. حفظ build سابق جاهز للاسترجاع.
3. مراقبة أول 24 ساعة (startup, 5xx, auth/session, transfer flows).

## 5) مصفوفة المخاطر

- **High:** كسر startup بسبب تغيّر ترتيب init في bundle/chunks.
- **High:** كسر auth/session بسبب تحميل config بترتيب مختلف.
- **Medium:** كسر مسارات static/chunks في بيئة production.
- **Medium:** فجوة بين source وdist عند نسيان إعادة build.

## 6) ترتيب التنفيذ المقترح (عملي)

1. Baseline build + run.
2. Build analyze (metafile + sourcemap).
3. استمرار refactor في `server/**` فقط.
4. تفعيل chunking في build على بيئة staging أولًا.
5. smoke + rollback drill.
6. نشر تدريجي.

## 7) قواعد قبول نهائية

- لا تغيّر في API contract.
- `npm run check` و `npm run test:unit` ناجحان.
- `/api/health` ومسارات حرجة تعمل.
- يمكن الرجوع للإصدار السابق خلال دقائق.
