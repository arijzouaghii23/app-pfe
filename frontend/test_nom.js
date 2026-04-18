const fetch = require('node-fetch');

async function r() {
  const city = 'Béja';
  // Add featureType=state so it returns the governorate relation instead of the city node
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},+Tunisie&format=json&limit=1&featureType=state`;
  
  const res = await fetch(url, { headers: { 'User-Agent': 'AntigravityApp/1.0' } });
  const data = await res.json();
  console.log("Nominatim data:", data);
}
r().catch(console.error);
