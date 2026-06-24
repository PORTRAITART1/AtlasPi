const { Client } = require('pg');

// Testons toutes les bases possibles sur ce serveur
const baseUrl = "postgresql://atlaspi:b7kPooLI6poVWTZuLlDiQmxHl5078pP1@dpg-d8doe08js32c73folsog-a.oregon-postgres.render.com";

const databases = ['atlaspi', 'postgres', 'atlaspi_db', 'atlaspi_prod', 'defaultdb'];

async function testDb(dbName) {
  const client = new Client({
    connectionString: `${baseUrl}/${dbName}`,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    const tables = res.rows.map(r => r.table_name);
    console.log(`✅ DB "${dbName}": Tables = [${tables.join(', ') || 'VIDE'}]`);
    await client.end();
  } catch(e) {
    console.log(`❌ DB "${dbName}": ${e.message}`);
  }
}

async function main() {
  for (const db of databases) {
    await testDb(db);
  }
}
main();
