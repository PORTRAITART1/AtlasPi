const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://atlaspi:b7kPooLI6poVWTZuLlDiQmxHl5078pP1@dpg-d8doe08js32c73folsog-a.oregon-postgres.render.com/atlaspi',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('✅ Connecté');

  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log('📋 Tables trouvées :');
  res.rows.forEach(r => console.log(' -', r.table_name));

  await client.end();
}

run().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
