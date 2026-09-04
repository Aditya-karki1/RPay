require('dotenv').config();
const mongoose = require('mongoose');
const LocalHub = require('./models/LocalHub');

const HUBS = [
  { name: 'District Hub Koramangala', area: 'Koramangala',    city: 'Bangalore',  address: '5th Block, Koramangala, Bengaluru 560034',      lat: 12.9352, lng: 77.6245 },
  { name: 'District Hub Bandra',      area: 'Bandra West',    city: 'Mumbai',     address: 'Hill Road, Bandra West, Mumbai 400050',          lat: 19.0596, lng: 72.8295 },
  { name: 'District Hub CP',          area: 'Connaught Place',city: 'Delhi',      address: 'Block A, Connaught Place, New Delhi 110001',     lat: 28.6315, lng: 77.2167 },
  { name: 'District Hub T Nagar',     area: 'T Nagar',        city: 'Chennai',    address: 'Pondy Bazaar, T Nagar, Chennai 600017',          lat: 13.0418, lng: 80.2341 },
  { name: 'District Hub Hitech City', area: 'Hitech City',    city: 'Hyderabad',  address: 'Madhapur, Hitech City, Hyderabad 500081',        lat: 17.4474, lng: 78.3762 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected');

  let added = 0, updated = 0, skipped = 0;
  for (const h of HUBS) {
    const exists = await LocalHub.findOne({ name: h.name });
    if (exists) {
      if (!exists.lat || !exists.lng) {
        await LocalHub.updateOne({ name: h.name }, { $set: { lat: h.lat, lng: h.lng } });
        console.log(`  ~ ${h.name} (updated coordinates)`);
        updated++;
      } else {
        skipped++;
      }
      continue;
    }
    await LocalHub.create(h);
    console.log(`  + ${h.name}`);
    added++;
  }

  console.log(`\nHub seed complete — ${added} added, ${updated} updated, ${skipped} already up to date.`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
