import "dotenv/config";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const tech = await pool.query(
      "select id, full_name from users where role = 'technician' and is_active = true order by created_at desc limit 1",
    );

    if (tech.rows.length === 0) {
      console.log("NO_TECHNICIAN");
      return;
    }

    const technicianId = tech.rows[0].id as string;
    const technicianName = (tech.rows[0].full_name as string | null) ?? "فني";

    const inserted = await pool.query(
      "insert into inventory_requests (technician_id, notes, status, n950_units) values ($1, $2, 'pending', 1) returning id, created_at",
      [technicianId, "طلب تجريبي لإظهار عداد الإشعارات"],
    );

    console.log("CREATED_PENDING_REQUEST", {
      technicianId,
      technicianName,
      requestId: inserted.rows[0].id,
      createdAt: inserted.rows[0].created_at,
    });
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("FAILED_CREATE_PENDING_REQUEST", error);
  process.exit(1);
});
