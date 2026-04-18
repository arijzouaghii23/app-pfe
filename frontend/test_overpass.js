async function r(city) {
  try {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(city) + ',+Tunisia&format=json&limit=1';
    const res = await fetch(url);
    const data = await res.json();
    if (!data || data.length === 0) return console.log(city, 'Nominatim 0');
    
    const osmId = data[0].osm_id;
    const osmType = data[0].osm_type;
    let areaId = 0;
    if (osmType === 'relation') areaId = Number(osmId) + 3600000000;
    else if (osmType === 'way') areaId = Number(osmId) + 2400000000;
    else return console.log("Not an area");

    const query = `[out:json][timeout:25];area(${areaId})->.searchArea;(way[highway][name](area.searchArea););out center tags;`;
    const overpass = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query)
    });
    const json = await overpass.json();
    console.log(city, 'Overpass found:', json.elements.length, 'highways');
  } catch (err) {
    console.error(err);
  }
}

r('Béja');
r('Tunis');
r('Sousse');
