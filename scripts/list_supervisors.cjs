const { Client } = require('pg');
(async ()=>{
  const cs = 'postgresql://nulip_user:Nulip!2026$R8mQw@localhost:5432/nulip_inventory';
  const client = new Client({ connectionString: cs });
  await client.connect();
  const res = await client.query("SELECT id, username, full_name, role, region_id FROM users WHERE role = 'supervisor' ORDER BY full_name");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
})().catch(e=>{ console.error(e); process.exit(1); });
