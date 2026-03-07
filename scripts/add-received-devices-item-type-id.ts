import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../server/db";

async function run() {
  try {
    console.log("🔧 Applying safe migration for received_devices.item_type_id...");

    await db.execute(sql`
      ALTER TABLE received_devices
      ADD COLUMN IF NOT EXISTS item_type_id varchar;
    `);

    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'received_devices_item_type_id_item_types_id_fk'
        ) THEN
          ALTER TABLE received_devices
          ADD CONSTRAINT received_devices_item_type_id_item_types_id_fk
          FOREIGN KEY (item_type_id)
          REFERENCES item_types(id)
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_received_devices_item_type_id
      ON received_devices(item_type_id);
    `);

    console.log("✅ Migration applied successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to apply migration:", error);
    process.exit(1);
  }
}

run();
