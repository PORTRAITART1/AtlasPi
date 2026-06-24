const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false },
});

const coords = {
  "Jakarta Pi Tech":       { lat: -6.2088,  lng: 106.8456 },
  "Accra Pi Handmade":     { lat:  5.6037,  lng:  -0.1870 },
  "Manila Pi Food Hub":    { lat: 14.5995,  lng: 120.9842 },
  "Sao Paulo Pi Shop":     { lat: -23.5505, lng: -46.6333 },
  "Nairobi Pi Services":   { lat: -1.2921,  lng:  36.8219 },
  "Istanbul Pi Bazaar":    { lat: 41.0082,  lng:  28.9784 },
  "Lagos Pi Market":       { lat:  6.5244,  lng:   3.3792 },
  "Dubai Pi Fashion":      { lat: 25.2048,  lng:  55.2708 },
  "Paris Pi Electronics":  { lat: 48.8566,  lng:   2.3522 },
  "Casablanca Pi Cafe":    { lat: 33.5731,  lng:  -7.5898 },
  "Atlas Persist Test":    { lat: 31.7917,  lng:  -7.0926 },
};

async function run() {
  const client = await pool.connect();
  console.log("✅ Connected to DB");

  for (const [name, { lat, lng }] of Object.entries(coords)) {
    const res = await client.query(
      `UPDATE merchant_listings SET latitude = $1, longitude = $2 WHERE listing_public_name = $3`,
      [lat, lng, name]
    );
    console.log(`📍 ${name} → lat=${lat}, lng=${lng} (rows updated: ${res.rowCount})`);
  }

  console.log("✅ All coordinates updated!");
  client.release();
  await pool.end();
}

run().catch(console.error);
