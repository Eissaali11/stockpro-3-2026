# إعداد قاعدة البيانات | Database Setup Guide

## المشكلة الحالية

عند محاولة تسجيل الدخول، يظهر الخطأ:
```
Internal Server Error (500)
Error at getUserByUsername
```

**السبب**: قاعدة البيانات غير متصلة

---

## الحل 1: Neon Database (سحابي - موصى به) ⭐

### المميزات:
- ✅ مجاني بالكامل
- ✅ لا يحتاج تثبيت
- ✅ جاهز في دقائق
- ✅ SSL مدمج

### الخطوات:

#### 1. إنشاء حساب
- اذهب إلى: https://neon.tech
- اضغط "Sign Up" (يمكنك استخدام GitHub)

#### 2. إنشاء Project
- اضغط "Create Project"
- اسم المشروع: `nulip-inventory`
- اختر Region: أقرب منطقة لك
- اضغط "Create Project"

#### 3. الحصول على Connection String
بعد إنشاء المشروع، ستحصل على رابط مثل:
```
postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/nulip_db?sslmode=require
```

#### 4. تحديث ملف .env
افتح ملف `.env` في المشروع وضع الرابط:
```env
DATABASE_URL=postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/nulip_db?sslmode=require
PORT=5000
NODE_ENV=development
SESSION_SECRET=change-this-secret-key-in-production-12345
```

#### 5. إعادة تشغيل المشروع
```bash
# أوقف الخادم (Ctrl+C) ثم شغله من جديد
npm run dev
```

#### 6. إنشاء الجداول
بعد الاتصال بقاعدة البيانات، قم بتشغيل:
```bash
npm run db:push
```

---

## الحل 2: PostgreSQL محلي 🖥️

### الخطوات:

#### 1. تحميل PostgreSQL
- اذهب إلى: https://www.postgresql.org/download/windows/
- حمّل PostgreSQL 15 أو أحدث
- شغّل المثبت

#### 2. أثناء التثبيت
- اختر كلمة مرور قوية للمستخدم `postgres`
- احفظ الكلمة (ستحتاجها لاحقاً)
- Port: اترك القيمة الافتراضية `5432`

#### 3. إنشاء قاعدة البيانات
افتح PowerShell وشغل:
```powershell
# دخول لـ PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات
CREATE DATABASE nulip_db;

# الخروج
\q
```

#### 4. تحديث ملف .env
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nulip_db
PORT=5000
NODE_ENV=development
SESSION_SECRET=change-this-secret-key-in-production-12345
```
**هام**: استبدل `YOUR_PASSWORD` بكلمة المرور التي اخترتها

#### 5. إنشاء الجداول
```bash
npm run db:push
```

#### 6. تشغيل المشروع
```bash
npm run dev
```

---

## اختبار الاتصال

بعد إعداد قاعدة البيانات، افتح المتصفح:
```
http://localhost:5000
```

### بيانات الدخول الافتراضية:
```
المدير:
Username: admin
Password: admin123

المشرف:
Username: supervisor1
Password: super123

المندوب:
Username: tech1
Password: tech123
```

---

## حل المشاكل الشائعة

### ❌ "Error initializing defaults"
**السبب**: قاعدة البيانات غير متصلة
**الحل**: تأكد من صحة DATABASE_URL

### ❌ "Connection refused"
**السبب**: PostgreSQL غير مُشغل
**الحل**: 
```bash
# Windows - تأكد من تشغيل الخدمة
services.msc
# ابحث عن "postgresql" وتأكد أنها تعمل
```

### ❌ "password authentication failed"
**السبب**: كلمة المرور خاطئة
**الحل**: تأكد من كلمة المرور في DATABASE_URL

### ❌ "database does not exist"
**السبب**: لم يتم إنشاء قاعدة البيانات
**الحل**: أنشئ القاعدة بـ `CREATE DATABASE nulip_db;`

---

## التحقق من نجاح الاتصال

عندما يعمل كل شيء بشكل صحيح، ستظهر هذه الرسائل:

```
✅ Using memory session store
✅ Created default region
✅ Created default users:
   - Admin: admin/admin123
   - Supervisor: supervisor1/super123
   - Technician: tech1/tech123
✅ Item types initialized
✅ serving on port 5000
```

---

## الدعم

إذا واجهت أي مشكلة:
1. تأكد من صحة DATABASE_URL
2. تأكد من تشغيل PostgreSQL (إذا كنت تستخدم محلي)
3. جرب إعادة تشغيل الخادم
4. راجع الـ logs في Terminal

---

**ملاحظة**: الحل السحابي (Neon) هو الأسهل والأسرع! 🚀

