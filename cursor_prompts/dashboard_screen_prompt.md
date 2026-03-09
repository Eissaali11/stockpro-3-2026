# 🎯 Cursor Prompt: إنشاء الصفحة الرئيسية للمندوب في Flutter

## المطلوب
أنشئ صفحة رئيسية (Dashboard) أنيقة ومميزة للمندوب في تطبيق Flutter لإدارة المخزون. يجب أن تكون الصفحة بتصميم عصري احترافي مع دعم RTL للغة العربية.

---

## 🎨 التصميم المطلوب

### الألوان الرئيسية
```dart
// الألوان الأساسية للتطبيق
static const Color primaryColor = Color(0xFF18B2B0);     // تركواز
static const Color primaryDark = Color(0xFF16A09E);
static const Color backgroundDark = Color(0xFF0F172A);   // خلفية داكنة
static const Color surfaceColor = Color(0xFF1E293B);     // سطح داكن
static const Color cardColor = Color(0xFF334155);
static const Color accentGreen = Color(0xFF22C55E);      // أخضر للنجاح
static const Color accentOrange = Color(0xFFF59E0B);     // برتقالي للتحذير
static const Color accentRed = Color(0xFFEF4444);        // أحمر للخطأ
```

### الخط
```dart
// استخدم خط Cairo للعربية
GoogleFonts.cairo()
```

---

## 📱 مكونات الصفحة

### 1. Header (الرأس)
```
┌─────────────────────────────────────────────────────────┐
│  [🔔]                   نظام المخزون                [👤] │
│         مرحباً، [اسم المندوب]                              │
│         [التاريخ والوقت الحالي]                          │
└─────────────────────────────────────────────────────────┘
```

**المتطلبات:**
- أيقونة الإشعارات مع badge لعدد الإشعارات المعلقة
- اسم المستخدم والترحيب
- التاريخ والوقت بالعربية (يتحدث كل ثانية)
- أيقونة الملف الشخصي للانتقال لصفحة Profile

### 2. Stats Cards (بطاقات الإحصائيات)
```
┌───────────────────┐  ┌───────────────────┐
│   📦 المخزون       │  │   🚚 المخزون       │
│      الثابت        │  │      المتحرك       │
│                   │  │                   │
│      [عدد]        │  │      [عدد]        │
│   كراتين + وحدات   │  │   كراتين + وحدات   │
└───────────────────┘  └───────────────────┘

┌───────────────────┐  ┌───────────────────┐
│   ⏳ طلبات         │  │   📊 إجمالي        │
│      معلقة        │  │      المخزون       │
│                   │  │                   │
│      [عدد]        │  │      [عدد]        │
│   بانتظار الموافقة │  │   ثابت + متحرك    │
└───────────────────┘  └───────────────────┘
```

**المتطلبات:**
- 4 بطاقات بتصميم Glassmorphism
- أيقونات متحركة (Animation)
- أرقام كبيرة واضحة
- خلفية متدرجة لكل بطاقة
- تأثير ظل (Shadow)

### 3. Quick Actions (الإجراءات السريعة)
```
┌─────────────────────────────────────────────────────────┐
│                    الإجراءات السريعة                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  📦     │  │  🚚     │  │  📱     │  │  📋     │   │
│  │ الثابت  │  │ المتحرك │  │ الأجهزة │  │ الطلبات │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**الأزرار:**
1. **المخزون الثابت** → `/fixed-inventory`
2. **المخزون المتحرك** → `/moving-inventory`
3. **إدخال جهاز** → `/submit-device`
4. **طلب مخزون** → فتح Modal لطلب مخزون جديد

### 4. Inventory Summary (ملخص المخزون)
```
┌─────────────────────────────────────────────────────────┐
│                     ملخص المخزون                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📱 أجهزة N950           │  كراتين: 5  │ وحدات: 12│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 📱 أجهزة I9000s         │  كراتين: 3  │ وحدات: 8 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 📱 أجهزة I9100          │  كراتين: 2  │ وحدات: 5 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 📄 رولات الورق          │  كراتين: 10 │ وحدات: 20│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 🏷️ ملصقات              │  كراتين: 4  │ وحدات: 15│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 🔋 بطاريات جديدة        │  كراتين: 2  │ وحدات: 10│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 📶 شرائح موبايلي        │  كراتين: 1  │ وحدات: 5 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 📶 شرائح STC            │  كراتين: 1  │ وحدات: 3 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 📶 شرائح زين            │  كراتين: 0  │ وحدات: 2 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5. Pending Transfers Section (النقل المعلق)
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ لديك [3] طلبات نقل معلقة                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📦 مستودع جدة                                    │   │
│  │    N950 - 5 كراتين                               │   │
│  │    منذ ساعتين                                    │   │
│  │    [✓ قبول]  [✗ رفض]                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [عرض جميع الإشعارات →]                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints المطلوبة

```dart
// الحصول على المخزون الثابت
GET /api/my-fixed-inventory
Headers: Authorization: Bearer <token>

// الحصول على المخزون المتحرك  
GET /api/my-moving-inventory
Headers: Authorization: Bearer <token>

// الحصول على طلبات النقل المعلقة
GET /api/warehouse-transfers
Headers: Authorization: Bearer <token>

// الحصول على أنواع العناصر
GET /api/item-types/active
Headers: Authorization: Bearer <token>
```

---

## 🗂️ Data Models

```dart
// نموذج المخزون
class InventoryEntry {
  final String itemTypeId;
  final int boxes;
  final int units;
  
  int get total => boxes + units;
}

// نموذج نوع العنصر
class ItemType {
  final String id;
  final String nameAr;
  final String nameEn;
  final String? iconName;
  final String? colorHex;
  final int sortOrder;
}

// نموذج طلب النقل
class WarehouseTransfer {
  final String id;
  final String warehouseName;
  final String itemType;
  final String packagingType; // "boxes" | "units"
  final int quantity;
  final String status; // "pending" | "accepted" | "rejected"
  final DateTime createdAt;
}
```

---

## 🎭 Animations المطلوبة

1. **Fade In** عند تحميل الصفحة
2. **Scale Animation** عند الضغط على البطاقات
3. **Shimmer Loading** أثناء تحميل البيانات
4. **Slide Animation** للقوائم
5. **Pulse Animation** لعدد الإشعارات

```dart
// مثال Animation
AnimatedBuilder(
  animation: _controller,
  builder: (context, child) {
    return Transform.scale(
      scale: 1.0 + (_controller.value * 0.05),
      child: child,
    );
  },
  child: StatsCard(...),
)
```

---

## 📁 هيكل الملفات

```
lib/features/dashboard/
├── presentation/
│   ├── screens/
│   │   └── dashboard_screen.dart
│   └── widgets/
│       ├── dashboard_header.dart
│       ├── stats_card.dart
│       ├── quick_action_button.dart
│       ├── inventory_summary_card.dart
│       ├── pending_transfer_card.dart
│       └── inventory_item_row.dart
├── providers/
│   └── dashboard_provider.dart
└── data/
    └── dashboard_repository.dart
```

---

## 🔧 الكود الأساسي

### DashboardScreen
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> 
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();
  }

  @override
  Widget build(BuildContext context) {
    final dashboardState = ref.watch(dashboardProvider);
    
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppColors.backgroundDark,
        body: RefreshIndicator(
          onRefresh: () => ref.refresh(dashboardProvider.future),
          child: dashboardState.when(
            loading: () => const DashboardShimmer(),
            error: (error, stack) => ErrorView(
              message: 'حدث خطأ في تحميل البيانات',
              onRetry: () => ref.refresh(dashboardProvider),
            ),
            data: (data) => CustomScrollView(
              slivers: [
                // Header
                SliverToBoxAdapter(
                  child: DashboardHeader(
                    userName: data.user.fullName,
                    notificationCount: data.pendingTransfers.length,
                  ),
                ),
                
                // Stats Cards
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.3,
                    ),
                    delegate: SliverChildListDelegate([
                      StatsCard(
                        title: 'المخزون الثابت',
                        value: data.fixedInventoryTotal.toString(),
                        icon: Icons.inventory_2,
                        gradient: [AppColors.primaryColor, AppColors.primaryDark],
                      ),
                      StatsCard(
                        title: 'المخزون المتحرك',
                        value: data.movingInventoryTotal.toString(),
                        icon: Icons.local_shipping,
                        gradient: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                      ),
                      StatsCard(
                        title: 'طلبات معلقة',
                        value: data.pendingTransfers.length.toString(),
                        icon: Icons.pending_actions,
                        gradient: [AppColors.accentOrange, Color(0xFFD97706)],
                      ),
                      StatsCard(
                        title: 'إجمالي المخزون',
                        value: (data.fixedInventoryTotal + data.movingInventoryTotal).toString(),
                        icon: Icons.analytics,
                        gradient: [AppColors.accentGreen, Color(0xFF16A34A)],
                      ),
                    ]),
                  ),
                ),
                
                // Quick Actions
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: QuickActionsSection(),
                  ),
                ),
                
                // Inventory Summary
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: InventorySummaryCard(
                      fixedInventory: data.fixedInventory,
                      movingInventory: data.movingInventory,
                      itemTypes: data.itemTypes,
                    ),
                  ),
                ),
                
                // Pending Transfers
                if (data.pendingTransfers.isNotEmpty)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: PendingTransfersSection(
                        transfers: data.pendingTransfers,
                      ),
                    ),
                  ),
                
                const SliverToBoxAdapter(
                  child: SizedBox(height: 100),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

### StatsCard Widget
```dart
class StatsCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final List<Color> gradient;

  const StatsCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: gradient.first.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {},
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: Colors.white, size: 24),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      value,
                      style: GoogleFonts.cairo(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      title,
                      style: GoogleFonts.cairo(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## ✅ قائمة التحقق

- [ ] التصميم RTL بالكامل
- [ ] خط Cairo للعربية
- [ ] الألوان المطابقة للتطبيق
- [ ] Animations سلسة
- [ ] Pull-to-refresh
- [ ] Shimmer loading
- [ ] Error handling مع رسائل عربية
- [ ] Empty state عند عدم وجود بيانات
- [ ] Navigation للصفحات الأخرى
- [ ] الإشعارات مع Badge

---

## 📝 ملاحظات إضافية

1. استخدم `ConsumerWidget` أو `ConsumerStatefulWidget` للـ Riverpod
2. جميع النصوص بالعربية
3. التاريخ والوقت بالتنسيق العربي
4. الأرقام بالأرقام العربية أو الإنجليزية حسب التفضيل
5. تأكد من معالجة حالة عدم الاتصال بالإنترنت
6. استخدم `Hero` animation للانتقال بين الصفحات

---

## 🔗 Base URL للـ API

```dart
const String baseUrl = 'https://fcf0121e-0593-4710-ad11-105d54ba692e-00-3cyb0wsnu78xa.janeway.replit.dev';
```
