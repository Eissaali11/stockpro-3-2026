import "dotenv/config";
import { desc } from "drizzle-orm";
import { db } from "../server/db";
import { users, withdrawnDevices } from "../shared/schema";

type SeedRow = {
  city: string;
  technicianName: string;
  terminalId: string;
  serialNumber: string;
  battery: string;
  chargerCable: string;
  chargerHead: string;
  hasSim: string;
  simCardType: string | null;
  damagePart: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  regionId: string | null;
};

function inferStatus(notes?: string | null, damagePart?: string | null): "pending" | "approved" | "rejected" {
  const source = `${notes || ""} ${damagePart || ""}`.toLowerCase();

  if (/(مرفوض|رفض|rejected|reject)/i.test(source)) {
    return "rejected";
  }

  if (/(موافق|تمت\s*الموافقة|approved|accept|مقبول)/i.test(source)) {
    return "approved";
  }

  return "pending";
}

async function main() {
  const [anyUser] = await db.select().from(users).limit(1);
  if (!anyUser) {
    throw new Error("No users found in database. Please create at least one user first.");
  }

  const seedTag = Date.now();
  const cities = ["الرياض", "جدة", "الدمام", "المدينة", "مكة", "القصيم"];
  const technicians = ["أحمد السبيعي", "فهد القحطاني", "سالم الحربي", "ناصر الغامدي", "راشد الشهري"];
  const simTypes = ["STC", "Mobily", "Zain", null];

  const rows: SeedRow[] = [];
  const monthsBack = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];

  for (let index = 0; index < monthsBack.length; index += 1) {
    const back = monthsBack[index];
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - back);
    createdAt.setDate(Math.max(1, 3 + index));
    createdAt.setHours(9 + (index % 8), 10, 0, 0);

    const mode = index % 3;
    const statusNote =
      mode === 0
        ? "تمت الموافقة من المشرف - approved"
        : mode === 1
          ? "حالة مرفوضة من الفحص - rejected"
          : "قيد المراجعة بدون اعتماد نهائي";

    const damage =
      mode === 0
        ? "تلف بسيط وتم اعتماده"
        : mode === 1
          ? "كسر في الشاشة - مرفوض"
          : "فحص أولي بانتظار قرار المشرف";

    rows.push({
      city: cities[index % cities.length],
      technicianName: technicians[index % technicians.length],
      terminalId: `WD-OPS-${seedTag}-${index + 1}`,
      serialNumber: `WD-SN-${seedTag}-${index + 1}`,
      battery: index % 2 === 0 ? "موجود" : "غير موجود",
      chargerCable: index % 3 === 0 ? "موجود" : "غير موجود",
      chargerHead: index % 4 === 0 ? "موجود" : "غير موجود",
      hasSim: index % 2 === 0 ? "موجود" : "غير موجود",
      simCardType: simTypes[index % simTypes.length],
      damagePart: damage,
      notes: statusNote,
      createdAt,
      updatedAt: createdAt,
      createdBy: anyUser.id,
      regionId: anyUser.regionId ?? null,
    });
  }

  await db.insert(withdrawnDevices).values(rows);

  const recentRows = await db
    .select()
    .from(withdrawnDevices)
    .orderBy(desc(withdrawnDevices.createdAt))
    .limit(200);

  const statusCounts = recentRows.reduce(
    (acc, row) => {
      const status = inferStatus(row.notes, row.damagePart);
      acc[status] += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("ar-SA", { month: "long" }),
      count: 0,
    };
  });
  const monthMap = new Map(months.map((m, idx) => [m.key, idx]));

  for (const row of recentRows) {
    const d = new Date(row.createdAt || "");
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = monthMap.get(key);
    if (idx !== undefined) {
      months[idx].count += 1;
    }
  }

  console.log("✅ Seed completed for withdrawn devices analytics");
  console.log({ inserted: rows.length, seedTag });
  console.log("Status summary (latest 200 rows):", statusCounts);
  console.log("Monthly trend (latest 6 months):", months);
}

main().catch((error) => {
  console.error("❌ Seed failed:", error?.message || error);
  process.exit(1);
});
