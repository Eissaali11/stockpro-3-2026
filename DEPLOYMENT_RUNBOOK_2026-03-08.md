# Deployment Runbook - Hostinger CloudPanel (2026-03-08)

هذا الملف يوثق كل ما تم خلال عملية الرفع والنشر، المشاكل التي ظهرت، وكيف تم حلها.

## 1) الهدف

- رفع مشروع `nulip-new` إلى GitHub.
- نشره على VPS (Hostinger + CloudPanel).
- تشغيل التطبيق عبر PM2.
- ربط الدومين `nuzum.fun` مع التطبيق.
- تجهيز قاعدة البيانات PostgreSQL وتشغيل schema/scripts المطلوبة.

## 2) ما تم إنجازه بنجاح

- رفع الكود إلى GitHub بنجاح.
- نسخ المشروع إلى السيرفر ضمن:
  - `/home/nuzum/htdocs/nuzum.fun`
- تثبيت الاعتمادات بنجاح (`npm install`).
- بناء المشروع بنجاح (`npm run build`).
- تحديث قاعدة البيانات بنجاح (`npm run db:push -- --force`).
- إنشاء جدول `bearer_sessions` بنجاح.
- تشغيل التطبيق عبر PM2 باسم:
  - `nulip-inventory`
- تأكيد أن التطبيق يعمل محليًا على السيرفر عبر `127.0.0.1:5000`.
- تصحيح DNS للدومين ليشير إلى IP السيرفر:
  - `153.92.211.46`

## 3) المشاكل التي واجهتنا والحلول

### المشكلة 1: مسار النشر الخاطئ

- الحالة:
  - تم العمل مؤقتًا في `/home/nuzum/htdocs/example.com` بدل المسار الفعلي.
- الحل:
  - اعتماد المسار الصحيح:
  - `/home/nuzum/htdocs/nuzum.fun`

### المشكلة 2: فشل اتصال قاعدة البيانات (`28P01`)

- الحالة:
  - `password authentication failed for user "nulip_user"` عند `db:push` و scripts.
- السبب:
  - اختلاف بين كلمة مرور مستخدم PostgreSQL والقيمة الموجودة في `DATABASE_URL`.
- الحل:
  - إعادة تعيين كلمة مرور المستخدم في PostgreSQL.
  - تحديث `.env` بقيم صحيحة ومتطابقة.
  - إعادة المحاولة حتى نجح الاتصال.

### المشكلة 3: إيقاف `drizzle-kit push` بسبب تحذير فقد بيانات

- الحالة:
  - `drizzle-kit push` أوقف التغييرات بسبب حذف جدول `product_types`.
- الحل:
  - أخذ نسخة احتياطية من قاعدة البيانات.
  - أخذ نسخة احتياطية من الجدول المستهدف قبل الحذف (عند الحاجة).
  - تنفيذ:
  - `npm run db:push -- --force`

### المشكلة 4: التطبيق لا يرد على `:5000`

- الحالة:
  - `Port 5000 is already in use` في بعض المحاولات.
- الحل:
  - إيقاف/إعادة تشغيل PM2 والتأكد من process واحد فقط.
  - إعادة التشغيل مع البيئة:
  - `pm2 restart nulip-inventory --update-env`

### المشكلة 5: الدومين يعرض صفحة Parked من Hostinger

- الحالة:
  - `https://nuzum.fun/api/health` يعرض HTML Parked بدل JSON API.
- السبب:
  - DNS كان يشير إلى IP خاطئ (`2.57.91.91`).
- الحل:
  - تعديل سجلات DNS إلى IP الصحيح `153.92.211.46`.
  - التحقق عبر:
  - `nslookup nuzum.fun 8.8.8.8`

### المشكلة 6: أخطاء في Vhost (Nginx)

- الحالة:
  - أخطاء مثل:
  - `unexpected end of file, expecting "}"`
  - `"server" directive is not allowed here`
- السبب:
  - تركيب غير صحيح لبلوكات `server` والأقواس.
- الحل:
  - إعادة تنظيم ملف vhost بحيث لا يوجد `server` داخل `server`.
  - اختبار الإعداد قبل التفعيل:
  - `nginx -t`

### المشكلة 7: خطأ SSL في المتصفح (`NET::ERR_CERT_AUTHORITY_INVALID`)

- الحالة:
  - الشهادة الحالية Self-Signed وغير موثوقة.
- الدليل:
  - `issuer=CN=nuzum.fun`
- الحل الجاري:
  - إصدار شهادة Let's Encrypt من CloudPanel بعد التأكد من DNS.
  - استبدال Self-Signed بالشهادة الموثوقة.

## 4) الحالة الحالية (Current Status)

- النشر على السيرفر: ناجح.
- التطبيق: يعمل عبر PM2.
- DNS: تم تصحيحه إلى IP الصحيح.
- قاعدة البيانات: تم تحديثها وتشغيل scripts الأساسية.
- SSL: ما زال يحتاج استبدال Self-Signed بشهادة Let's Encrypt لتختفي رسالة الأمان.

## 5) أوامر التحقق السريعة

```bash
# DNS
nslookup nuzum.fun 8.8.8.8
nslookup www.nuzum.fun 8.8.8.8

# PM2
pm2 status
pm2 logs nulip-inventory --lines 80 --nostream

# صحة التطبيق محليًا
curl -sS http://127.0.0.1:5000/api/health

# صحة التطبيق عبر الدومين (بعد SSL الصحيح)
curl -I https://nuzum.fun/api/health
curl -sS https://nuzum.fun/api/health
```

## 6) إدارة حساب مدير النظام (Admin)

يوجد سكربت جاهز داخل المشروع:

- `scripts/reset-admin-password.ts`

وظيفته:

- إذا المستخدم `admin` موجود: يعيد ضبط كلمة مروره.
- إذا غير موجود: ينشئ مستخدم Admin جديد.

تشغيله يجب أن يكون داخل SSH على السيرفر من مسار التطبيق:

```bash
cd /home/nuzum/htdocs/nuzum.fun
npx tsx scripts/reset-admin-password.ts
```

## 7) ملاحظات أمنية مهمة

- لا تضع كلمات المرور الفعلية داخل ملفات التوثيق أو Git.
- استخدم قيم سرية قوية لـ `SESSION_SECRET`.
- أي قيمة سرية ظهرت في السجلات يجب تدويرها (Rotate).
- احرص على صلاحيات `.env`:

```bash
chmod 600 .env
```

## 8) الخطوة الأخيرة لإغلاق المهمة 100%

- إصدار وتفعيل Let's Encrypt بدل Self-Signed من CloudPanel.
- إعادة اختبار:
  - `https://nuzum.fun/api/health`
- التأكد من اختفاء رسالة `Not secure` في المتصفح.
