const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://atlaspi:b7kPooLI6poVWTZuLlDiQmxHl5078pP1@dpg-d8doe08js32c73folsog-a.oregon-postgres.render.com/atlaspi",
  ssl: { rejectUnauthorized: false }
});
async function test() {
  await client.connect();
  const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log('Tables trouvées:', res.rows.map(r => r.table_name));
  await client.end();
}
test().catch(console.error);
