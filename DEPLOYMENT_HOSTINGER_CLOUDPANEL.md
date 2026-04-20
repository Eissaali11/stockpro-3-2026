ssh root@153.92.211.46# 🚀 خطة نشر التطبيق على Hostinger Cloud Panel

## 📋 المتطلبات الأساسية

| المتطلب | الوصف |
|---------|-------|
| Hostinger VPS | خطة KVM2 أو أعلى (4GB RAM, 2 vCPU) |
| نطاق (Domain) | مثال: `inventory.yourdomain.com` |
| Cloud Panel | مثبت على VPS |

---

## 📁 هيكل المشروع

```
nulip-new/
├── client/          # React Frontend (Vite)
├── server/          # Express Backend
├── dist/            # ملفات البناء
├── shared/          # الملفات المشتركة
└── migrations/      # ملفات قاعدة البيانات
```

---

## 🔧 الخطوة 1: إعداد VPS وCloud Panel

### 1.1 تسجيل الدخول لـ Cloud Panel
```
https://YOUR_VPS_IP:8443
```

### 1.2 إضافة موقع Node.js جديد
1. اذهب إلى **Sites** → **Add Site**
2. اختر **Node.js**
3. أدخل البيانات:
   - **Domain**: `inventory.yourdomain.com`
   - **Node.js Version**: `20.x` أو `22.x`
   - **App Port**: `5000`

---

## 🗄️ الخطوة 2: إعداد قاعدة البيانات PostgreSQL

### 2.1 إنشاء قاعدة بيانات جديدة
1. اذهب إلى **Databases** → **Add Database**
2. اختر **PostgreSQL**
3. أدخل البيانات:
   - **Database Name**: `nulip_inventory`
   - **Username**: `nulip_user`
   - **Password**: `كلمة_مرور_قوية_هنا`

### 2.2 حفظ بيانات الاتصال
```
DATABASE_URL=postgresql://nulip_user:كلمة_المرور@localhost:5432/nulip_inventory
```

---

## 📤 الخطوة 3: رفع الملفات

### الطريقة 1: عبر Git (الموصى بها)

#### 3.1 على جهازك المحلي
```bash
# إنشاء مستودع Git
cd c:\Users\TWc\Desktop\4048\nulip-new
git init
git add .
git commit -m "Initial deployment"

# رفع إلى GitHub
git remote add origin https://github.com/YOUR_USERNAME/nulip-inventory.git
git branch -M main
git push -u origin main
```

#### 3.2 على السيرفر (SSH)
```bash
# الدخول عبر SSH
ssh root@YOUR_VPS_IP

# الذهاب لمجلد الموقع
cd /home/cloudpanel/htdocs/inventory.yourdomain.com

# استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/nulip-inventory.git .
```

### الطريقة 2: عبر SFTP
1. استخدم برنامج **FileZilla** أو **WinSCP**
2. اتصل بالسيرفر:
   - **Host**: `YOUR_VPS_IP`
   - **Port**: `22`
   - **Username**: `root` أو `cloudpanel`
3. ارفع الملفات إلى: `/home/cloudpanel/htdocs/inventory.yourdomain.com/`

---

## ⚙️ الخطوة 4: إعداد متغيرات البيئة

### 4.1 إنشاء ملف `.env` على السيرفر
```bash
cd /home/cloudpanel/htdocs/inventory.yourdomain.com

cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://nulip_user:كلمة_المرور@localhost:5432/nulip_inventory

# Server
PORT=5000
NODE_ENV=production

# Session
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-min-32-chars

# الإنتاج
TRUST_PROXY=true
EOF
```

### 4.2 تأمين الملف
```bash
chmod 600 .env
```

---

## 📦 الخطوة 5: تثبيت وبناء المشروع

### 5.1 تثبيت الحزم
```bash
cd /home/cloudpanel/htdocs/inventory.yourdomain.com

# تثبيت الحزم
npm install --production=false

# أو باستخدام npm ci للتثبيت النظيف
npm ci
```

### 5.2 بناء المشروع
```bash
# بناء Frontend و Backend
npm run build
```

### 5.3 إعداد قاعدة البيانات
```bash
# تطبيق مخطط قاعدة البيانات
npm run db:push

# إنشاء جدول الجلسات
npx tsx scripts/create-bearer-sessions-table.ts

# إعادة تعيين كلمة مرور المدير (اختياري)
npx tsx scripts/reset-admin-password.ts
```

---

## 🔄 الخطوة 6: إعداد PM2 لتشغيل التطبيق

### 6.1 تثبيت PM2
```bash
npm install -g pm2
```

### 6.2 إنشاء ملف ecosystem
```bash
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'nulip-inventory',
    script: 'dist/index.js',
    cwd: '/home/cloudpanel/htdocs/inventory.yourdomain.com',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '.env',
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
```

### 6.3 إنشاء مجلد السجلات
```bash
mkdir -p logs
```

### 6.4 تشغيل التطبيق
```bash
# تشغيل التطبيق
pm2 start ecosystem.config.cjs

# حفظ التشغيل التلقائي
pm2 save
pm2 startup
```

---

## 🌐 الخطوة 7: إعداد Nginx Reverse Proxy

### 7.1 في Cloud Panel
1. اذهب إلى **Sites** → اختر موقعك
2. اذهب إلى **Vhost**
3. استبدل المحتوى بالتالي:

```nginx
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name inventory.yourdomain.com;
    
    # SSL Certificates (يتم إنشاؤها تلقائياً بواسطة Cloud Panel)
    ssl_certificate /etc/nginx/ssl-certificates/inventory.yourdomain.com.crt;
    ssl_certificate_key /etc/nginx/ssl-certificates/inventory.yourdomain.com.key;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Proxy to Node.js App
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API endpoints
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.2 إعادة تشغيل Nginx
```bash
sudo systemctl restart nginx
```

---

## 🔒 الخطوة 8: تفعيل SSL (HTTPS)

### 8.1 في Cloud Panel
1. اذهب إلى **Sites** → اختر موقعك
2. اذهب إلى **SSL/TLS**
3. اضغط **Actions** → **New Let's Encrypt Certificate**
4. أدخل بريدك الإلكتروني
5. اضغط **Create and Install**

---

## ✅ الخطوة 9: التحقق والاختبار

### 9.1 التحقق من حالة التطبيق
```bash
# حالة PM2
pm2 status

# سجلات التطبيق
pm2 logs nulip-inventory

# اختبار الاتصال المحلي
curl http://localhost:5000/api/health
```

### 9.2 اختبار من المتصفح
1. افتح: `https://inventory.yourdomain.com`
2. سجل الدخول:
   - **اسم المستخدم**: `admin`
   - **كلمة المرور**: `admin123`

---

## 🔄 الخطوة 10: تحديث التطبيق مستقبلاً

### 10.1 سكربت التحديث
```bash
cat > update.sh << 'EOF'
#!/bin/bash
cd /home/cloudpanel/htdocs/inventory.yourdomain.com

echo "🔄 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting application..."
pm2 restart nulip-inventory

echo "✅ Update complete!"
pm2 status
EOF

chmod +x update.sh
```

### 10.2 تشغيل التحديث
```bash
./update.sh
```

---

## 🛠️ أوامر مفيدة

| الأمر | الوصف |
|-------|-------|
| `pm2 status` | عرض حالة التطبيق |
| `pm2 logs` | عرض السجلات |
| `pm2 restart nulip-inventory` | إعادة تشغيل التطبيق |
| `pm2 stop nulip-inventory` | إيقاف التطبيق |
| `pm2 monit` | مراقبة الأداء |

---

## 🚨 حل المشاكل الشائعة

### مشكلة: التطبيق لا يعمل
```bash
# فحص السجلات
pm2 logs nulip-inventory --lines 50

# التحقق من المنفذ
netstat -tlnp | grep 5000
```

### مشكلة: خطأ في قاعدة البيانات
```bash
# اختبار الاتصال
psql -U nulip_user -d nulip_inventory -h localhost

# إعادة تطبيق المخطط
npm run db:push
```

### مشكلة: خطأ 502 Bad Gateway
```bash
# التأكد من تشغيل التطبيق
pm2 status

# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

### مشكلة: خطأ "Failed to fetch" عند تسجيل الدخول
```bash
# 1. التحقق من متغيرات البيئة
cd /home/stoc/htdocs/stoc.fun
cat .env | grep -E "TRUST_PROXY|NODE_ENV|HTTPS"

# يجب أن يحتوي .env على:
# TRUST_PROXY=true
# NODE_ENV=production
# HTTPS=true (إذا كان الموقع على HTTPS)

# 2. إعادة بناء التطبيق بعد التحديثات
git pull origin main
npm ci
npm run build

# 3. إعادة تشغيل PM2
pm2 restart nulip-inventory

# 4. فحص السجلات
pm2 logs nulip-inventory --lines 50

# 5. التحقق من إعدادات Nginx
# يجب أن يكون proxy_pass يشير إلى http://localhost:5000
# ويجب أن يحتوي على:
# proxy_set_header X-Real-IP $remote_addr;
# proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
# proxy_set_header X-Forwarded-Proto $scheme;
```

---

## 📊 المراقبة والصيانة

### النسخ الاحتياطي اليومي
```bash
# إنشاء سكربت النسخ الاحتياطي
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/cloudpanel/backups"
DB_NAME="nulip_inventory"
DB_USER="nulip_user"

mkdir -p $BACKUP_DIR

# نسخ قاعدة البيانات
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# حذف النسخ القديمة (أكثر من 7 أيام)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR/db_$DATE.sql"
EOF

chmod +x backup.sh

# إضافة للـ Cron (يومياً الساعة 3 صباحاً)
(crontab -l 2>/dev/null; echo "0 3 * * * /home/cloudpanel/htdocs/inventory.yourdomain.com/backup.sh") | crontab -
```

---

## 📝 ملاحظات مهمة

1. **تغيير كلمات المرور الافتراضية** بعد النشر مباشرة
2. **تفعيل جدار الحماية (Firewall)** في Cloud Panel
3. **إعداد المراقبة** باستخدام Uptime Robot أو مشابه
4. **النسخ الاحتياطي المنتظم** لقاعدة البيانات

---

## 📞 الدعم

- **Hostinger Support**: https://www.hostinger.com/support
- **Cloud Panel Docs**: https://www.cloudpanel.io/docs

---

*آخر تحديث: 2026-02-03*
