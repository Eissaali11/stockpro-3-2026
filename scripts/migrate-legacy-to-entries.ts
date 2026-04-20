/**
 * ترحيل بيانات المخزون من الأعمدة القديمة (Legacy) إلى جداول الإدخالات الديناميكية (Entries)
 * 
 * يعالج:
 * 1. warehouse_inventory → warehouse_inventory_entries
 * 2. technician_fixed_inventories → technician_fixed_inventory_entries
 * 
 * آمن: لا يحذف بيانات Legacy - فقط ينسخها إلى Entries (لا يكتب فوق entries موجودة)
 */

import 'dotenv/config';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

// خريطة الأصناف: itemTypeId → { boxesCol, unitsCol }
const ITEM_TYPE_MAP: Record<string, { boxes: string; units: string }> = {
  n950:         { boxes: 'n950_boxes',          units: 'n950_units' },
  i9000s:       { boxes: 'i9000s_boxes',        units: 'i9000s_units' },
  i9100:        { boxes: 'i9100_boxes',          units: 'i9100_units' },
  rollPaper:    { boxes: 'roll_paper_boxes',     units: 'roll_paper_units' },
  stickers:     { boxes: 'stickers_boxes',       units: 'stickers_units' },
  newBatteries: { boxes: 'new_batteries_boxes',  units: 'new_batteries_units' },
  mobilySim:    { boxes: 'mobily_sim_boxes',     units: 'mobily_sim_units' },
  stcSim:       { boxes: 'stc_sim_boxes',        units: 'stc_sim_units' },
  zainSim:      { boxes: 'zain_sim_boxes',       units: 'zain_sim_units' },
  lebaraSim:    { boxes: 'lebara_boxes',         units: 'lebara_units' },
};

async function migrateWarehouseInventory(client: pg.PoolClient): Promise<number> {
  console.log('\n=== ترحيل مخزون المستودعات ===');
  
  const { rows: warehouses } = await client.query('SELECT * FROM warehouse_inventory');
  console.log(`عدد المستودعات: ${warehouses.length}`);
  
  let insertedCount = 0;
  
  for (const wh of warehouses) {
    for (const [itemTypeId, cols] of Object.entries(ITEM_TYPE_MAP)) {
      const boxes = Number(wh[cols.boxes] || 0);
      const units = Number(wh[cols.units] || 0);
      
      // تخطي الأصناف الفارغة
      if (boxes === 0 && units === 0) continue;
      
      // تحقق من عدم وجود entry مسبق
      const { rows: existing } = await client.query(
        'SELECT id FROM warehouse_inventory_entries WHERE warehouse_id = $1 AND item_type_id = $2',
        [wh.warehouse_id, itemTypeId]
      );
      
      if (existing.length > 0) {
        console.log(`  ⚠ تخطي ${itemTypeId} للمستودع ${wh.warehouse_id} (entry موجود)`);
        continue;
      }
      
      await client.query(
        `INSERT INTO warehouse_inventory_entries (warehouse_id, item_type_id, boxes, units, updated_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [wh.warehouse_id, itemTypeId, boxes, units]
      );
      
      insertedCount++;
    }
  }
  
  console.log(`✓ تم إدخال ${insertedCount} سجل مخزون مستودعات`);
  return insertedCount;
}

async function migrateTechnicianFixedInventory(client: pg.PoolClient): Promise<number> {
  console.log('\n=== ترحيل المخزون الثابت للفنيين ===');
  
  const { rows: technicians } = await client.query('SELECT * FROM technician_fixed_inventories');
  console.log(`عدد الفنيين: ${technicians.length}`);
  
  let insertedCount = 0;
  
  for (const tech of technicians) {
    for (const [itemTypeId, cols] of Object.entries(ITEM_TYPE_MAP)) {
      const boxes = Number(tech[cols.boxes] || 0);
      const units = Number(tech[cols.units] || 0);
      
      if (boxes === 0 && units === 0) continue;
      
      const { rows: existing } = await client.query(
        'SELECT id FROM technician_fixed_inventory_entries WHERE technician_id = $1 AND item_type_id = $2',
        [tech.technician_id, itemTypeId]
      );
      
      if (existing.length > 0) {
        console.log(`  ⚠ تخطي ${itemTypeId} للفني ${tech.technician_id} (entry موجود)`);
        continue;
      }
      
      await client.query(
        `INSERT INTO technician_fixed_inventory_entries (technician_id, item_type_id, boxes, units, updated_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [tech.technician_id, itemTypeId, boxes, units]
      );
      
      insertedCount++;
    }
  }
  
  console.log(`✓ تم إدخال ${insertedCount} سجل مخزون ثابت للفنيين`);
  return insertedCount;
}

async function main() {
  console.log('🔄 بدء ترحيل البيانات من Legacy إلى Entries...');
  console.log(`قاعدة البيانات: ${DATABASE_URL?.replace(/\/\/.*@/, '//****@')}`);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const whCount = await migrateWarehouseInventory(client);
    const techCount = await migrateTechnicianFixedInventory(client);
    
    await client.query('COMMIT');
    
    console.log('\n========================================');
    console.log(`✅ الترحيل مكتمل بنجاح!`);
    console.log(`   مخزون المستودعات: ${whCount} سجل`);
    console.log(`   مخزون الفنيين الثابت: ${techCount} سجل`);
    console.log('========================================');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ في الترحيل - تم التراجع:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
