(async ()=>{
  try {
    const base = 'http://localhost:3001';
    // Login as supervisor (defaults seeded on first run)
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'supervisor1', password: 'super123' })
    });

    const loginJson = await loginRes.json();
    console.log('login:', loginJson);
    if (!loginJson.success || !loginJson.token) {
      console.error('Login failed');
      process.exit(1);
    }

    const token = loginJson.token;
    const warehouseId = '1b75e6c2-9f51-4151-a687-a4ea1dd22015';
    const whRes = await fetch(`${base}/api/warehouses/${warehouseId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const whJson = await whRes.json();
    console.log('warehouse:', JSON.stringify(whJson, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
