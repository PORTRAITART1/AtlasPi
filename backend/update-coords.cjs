const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://atlaspi:b7kPooLI6poVWTZuLlDiQmxHl5078pP1@dpg-d8doe08js32c73folsog-a.oregon-postgres.render.com/atlaspi',
  ssl: { rejectUnauthorized: false }
});

const coords = [
  { id: 1,  lat: 33.5731,  lng: -7.5898  },  // Casablanca
  { id: 2,  lat: 33.5731,  lng: -7.5898  },  // Casablanca
  { id: 3,  lat: 48.8566,  lng: 2.3522   },  // Paris
  { id: 4,  lat: 25.2048,  lng: 55.2708  },  // Dubai
  { id: 5,  lat: 6.5244,   lng: 3.3792   },  // Lagos
  { id: 6,  lat: 41.0082,  lng: 28.9784  },  // Istanbul
  { id: 7,  lat: -1.2921,  lng: 36.8219  },  // Nairobi
  { id: 8,  lat: -23.5505, lng: -46.6333 },  // Sao Paulo
  { id: 9,  lat: 14.5995,  lng: 120.9842 },  // Manila
  { id: 10, lat: 5.6037,   lng: -0.1870  },  // Accra
  { id: 11, lat: -6.2088,  lng: 106.8456 },  // Jakarta
];

async function run() {
  await client.connect();
  console.log('✅ Connecté à la DB');

  for (const m of coords) {
    const res = await client.query(
      'UPDATE merchant_listings SET lat = $1, lng = $2 WHERE id = $3',
      [m.lat, m.lng, m.id]
    );
    console.log(`✅ ID ${m.id} mis à jour (${res.rowCount} ligne)`);
  }

  await client.end();
  console.log('🎉 Toutes les coordonnées mises à jour !');
}

run().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
