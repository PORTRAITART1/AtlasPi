const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://atlaspi:b7kPooLI6poVWTZuLlDiQmxHl5078pP1@dpg-d8doe08js32c73folsog-a.oregon-postgres.render.com/atlaspi",
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  await client.connect();
  const res = await client.query(
    `UPDATE merchant_listings SET latitude = 33.5731, longitude = -7.5898 WHERE id = 1`
  );
  console.log('Updated:', res.rowCount, 'row(s)');
  await client.end();
}

fix().catch(console.error);
