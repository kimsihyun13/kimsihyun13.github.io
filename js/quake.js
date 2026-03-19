const map=L.map("map").setView([20,0],2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{maxZoom:8}).addTo(map);

const VP = 12.0, VS = 7; // km/s, 전형적인 지각 내 P/S 파 속도 (실제 값은 지역에 따라 다름)
const MU = 3e10; // Pa, 암석 전단강도 (shear modulus) - 사용자가 요청한 값

// Performance tuning
const STATION_UPDATE_INTERVAL = 150; // ms between visual marker style updates
let lastStationDraw = 0; // timestamp of last marker draw

/* ================= UI ================= */
const width = document.getElementById('width');
const widthV = document.getElementById('widthV');
const slip = document.getElementById('slip');
const slipV = document.getElementById('slipV');
const depth = document.getElementById('depth');
const dV = document.getElementById('dV');
const mV = document.getElementById('mV');

function momentFrom(width_km, slip_m){
  const L_km = Math.max(0.1, 2 * width_km); // km
  const A_km2 = Math.max(1e-6, width_km * L_km);
  const A_m2 = A_km2 * 1e6; // km^2 -> m^2
  const D = Math.max(1e-3, slip_m); // m
  return MU * A_m2 * D; // N·m
}
function mwFromMoment(M0){
  return (2/3) * Math.log10(M0) - 6.06;
}
function estimateMwFrom(width_km, slip_m){
  const M0 = momentFrom(width_km, slip_m);
  return mwFromMoment(M0);
}

function updateControlDisplay(){
  const w = parseFloat(width.value);
  const s = parseFloat(slip.value);
  widthV.textContent = Math.round(w);
  slipV.textContent = s.toFixed(2);
  const Mw = estimateMwFrom(w, s);
  mV.textContent = Mw.toFixed(1);
  dV.textContent = depth.value;
}

width.addEventListener('input', updateControlDisplay);
slip.addEventListener('input', updateControlDisplay);
depth.addEventListener('input', ()=> dV.textContent = depth.value);
updateControlDisplay();

/* ================= JMA INTENSITY ================= */
function calcI(d,m){
  return Math.max(0,Math.min(7,m*1.35-Math.log10(d+1)*3));
}
function JMA(i){
  if(i<0.5) return "0";
  if(i<1.5) return "1";
  if(i<2.5) return "2";
  if(i<3.5) return "3";
  if(i<4.5) return "4";
  if(i<5) return "5-";
  if(i<5.5) return "5+";
  if(i<6) return "6-";
  if(i<6.5) return "6+";
  return "7";
}
function Icolor(i){
  if(i>=6.5) return "#7f00ff";
  if(i>=6) return "#ff0000";
  if(i>=5.5) return "#ff4500";
  if(i>=5) return "#ff8c00";
  if(i>=4) return "#ffd700";
  if(i>=3) return "#66cc33";
  if(i>=2) return "#3399ff";
  return "#777";
}

function hexToRgba(hex, alpha){
  const h = hex.replace('#','');
  const bigint = parseInt(h,16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
} 

/* ================= STATIONS ================= */
const stations=[];
const activeStations = []; // stations currently rendered (in viewport)

// Spatial grid index for quick neighbor queries
let grid = null;
function buildGrid(cellDeg = 1){
  grid = new Map();
  grid.cellDeg = cellDeg;
  grid.key = (x,y)=>`${x}_${y}`;
  grid.insert = (st)=>{
    const x = Math.floor((st.lon + 180) / cellDeg);
    const y = Math.floor((st.lat + 90) / cellDeg);
    const k = grid.key(x,y);
    (grid.get(k) || grid.set(k,[]).get(k)).push(st);
    st._gridXY = [x,y];
  };
  grid.queryBBox = (minLon,minLat,maxLon,maxLat)=>{
    const minX = Math.floor((minLon + 180) / cellDeg);
    const maxX = Math.floor((maxLon + 180) / cellDeg);
    const minY = Math.floor((minLat + 90) / cellDeg);
    const maxY = Math.floor((maxLat + 90) / cellDeg);
    const out = [];
    for(let x=minX;x<=maxX;x++){
      for(let y=minY;y<=maxY;y++){
        const k = grid.key(x,y);
        const arr = grid.get(k);
        if(arr) out.push(...arr);
      }
    }
    return out;
  };
}

const KOREA_AREA = 100210000000; // m²
const KOREA_STATIONS = 80;
const MAX_STATIONS_PER_COUNTRY = 700;


fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
.then(r=>r.json())
.then(world=>{
  world.features.forEach(f=>{
    const area = turf.area(f); // m²
    let count = Math.round(area / KOREA_AREA * KOREA_STATIONS);

    // 최소/최대 안전장치
    count = Math.max(3, count);
    count = Math.min(MAX_STATIONS_PER_COUNTRY, count);

    const b = turf.bbox(f);

    function sampleLon(b0,b2){
      // handle features that cross the antimeridian (date line)
      if(b0 <= b2) return b0 + Math.random() * (b2 - b0);
      const range = (b2 + 360) - b0;
      let lon = b0 + Math.random() * range;
      if(lon > 180) lon -= 360;
      return lon;
    }

    function isPointInFeature(lon, lat, feature){
      // Try the point as-is and with +/-360 longitude to handle datasets
      // that use 0..360 or shifted longitudes for features crossing the date line.
      if(turf.booleanPointInPolygon(turf.point([lon, lat]), feature)) return true;
      if(turf.booleanPointInPolygon(turf.point([lon + 360, lat]), feature)) return true;
      if(turf.booleanPointInPolygon(turf.point([lon - 360, lat]), feature)) return true;
      return false;
    }

    // shared Leaflet canvas renderer for better performance
    const stationRenderer = L.canvas({ padding: 0.5 });

    function boundsContainsLatLon(bounds, lat, lon){
      if(bounds.contains([lat, lon])) return true;
      if(bounds.contains([lat, lon + 360])) return true;
      if(bounds.contains([lat, lon - 360])) return true;
      return false;
    }

    function getDensityForZoom(z){
      // lower zoom -> show fewer markers for performance
      if(z >= 6) return 1;
      if(z === 5) return 0.9;
      if(z === 4) return 0.7;
      if(z === 3) return 0.45;
      if(z === 2) return 0.25;
      return 0.12;
    }

    function updateVisibleMarkers(){
      const bounds = map.getBounds().pad(0.5);

      stations.forEach(st=>{
        const inView = boundsContainsLatLon(bounds, st.lat, st.lon);

        if(inView && !st.layer){
          // zoom-based thinning: don't create marker for every station at low zoom
          const density = getDensityForZoom(map.getZoom());
          if(Math.random() > density) return; // skip creating marker for this station

          // create markers for this station and add as LayerGroup using canvas renderer
          const lons = [st.lon, st.lon - 360, st.lon + 360];
          const markers = lons.map(lo => L.circleMarker([st.lat, lo], {radius:2.5, color:'#777', fillColor:'#777', fillOpacity:1, renderer: stationRenderer}));
          const g = L.layerGroup(markers).addTo(map);
          st.layer = g;
          activeStations.push(st);
        } else if(!inView && st.layer){
          // remove layer and unregister from activeStations
          map.removeLayer(st.layer);
          st.layer = null;
          const i = activeStations.indexOf(st);
          if(i !== -1) activeStations.splice(i,1);
        }
      });
      console.log('updateVisibleMarkers: activeStations =', activeStations.length);
    }

    let updateVisibleTimer = null;
    map.on('moveend zoomend', ()=>{ clearTimeout(updateVisibleTimer); updateVisibleTimer = setTimeout(updateVisibleMarkers, 120); });

    let placed = 0;
    let tries = 0;

    while (placed < count && tries < count * 25) {
      tries++;

      const lon = sampleLon(b[0], b[2]);
      const lat = b[1] + Math.random() * (b[3] - b[1]);

      if (!isPointInFeature(lon, lat, f)) continue;

      // Do not create markers for every station up-front; defer creation until in viewport
      stations.push({
        lat,
        lon,
        markers: null,
        I: 0,
        target: 0
      });

      placed++;
    }

    // If sampling couldn't place enough stations (rare), place remaining near the feature centroid
    if(placed < count){
      const need = count - placed;
      const cpt = turf.centroid(f);
      const cx = cpt.geometry.coordinates[0];
      const cy = cpt.geometry.coordinates[1];
      const lonSpan = (b[2] - b[0]) || 1;
      const latSpan = (b[3] - b[1]) || 1;
      for(let i=0;i<need;i++){
        const jitterLon = cx + (Math.random()-0.5) * Math.min(5, lonSpan);
        const jitterLat = cy + (Math.random()-0.5) * Math.min(5, latSpan);
        let jl = jitterLon;
        if(jl > 180) jl -= 360;
        if(jl < -180) jl += 360;
        stations.push({lat: jitterLat, lon: jl, markers: null, I:0, target:0});
        placed++;
      }
    }

  });

  // Build a global spatial index (grid) and insert all stations (faster and simpler)
  buildGrid(1);
  stations.forEach(s=>grid.insert(s));
  console.log('Grid built: cells=', grid.size, 'stations=', stations.length);

  // after building station list, initialize visible markers
  updateVisibleMarkers();

});







/* ================= EEW ================= */
const quakes=[];
let quakeCounter = 0; // unique id for quakes
function createEEW(q){
  const c=document.createElement("div");
  c.className="eew-card";
  c.innerHTML=`
    <div class="eew-header">지진 속보</div>
    <div class="eew-body">
      <div class="eew-intensity">–</div>
      <div class="eew-info">
        <div>추정 모멘트 규모 <b class="mag">${q.mag.toFixed(1)}</b> Mw</div>
        <div>깊이 <b>${q.depth}</b> km</div>
        <div>관측 최대진도 <b class="maxI">–</b></div>
      </div>
    </div>`;
  document.getElementById("eew-panel").prepend(c);
  q.card=c;
}

/* ================= CLICK ================= */
map.on("click",e=>{
  let parent=null;
  quakes.forEach(q=>{
    const t=(performance.now()-q.t0)/1000;
    const dh=map.distance([q.lat,q.lon],[e.latlng.lat,e.latlng.lng])/1000; // horizontal km
    const clickedDepth = +depth.value;
    const hypoBetween = Math.sqrt(dh*dh + Math.pow(q.depth - clickedDepth,2));
    const Rp = t * VP; // P-wave sphere radius (km)
    if(hypoBetween <= Rp) parent=q;
  });

  if(parent){
    // Record child event as a subevent but DO NOT add its moment to parent (prevent parent magnitude increase)
    const childWidth = parseFloat(width.value);
    const childSlip = parseFloat(slip.value);
    const childM0 = momentFrom(childWidth, childSlip);

    // update parent width to include distance from parent epicenter to child hypocenter (informational only)
    const dh2 = map.distance([parent.lat,parent.lon],[e.latlng.lat,e.latlng.lng])/1000;
    const dd = Math.abs(parent.depth - +depth.value);
    const dist = Math.sqrt(dh2*dh2 + dd*dd); // km
    parent.width = Math.max(parent.width || childWidth, dist);

    // record a subevent so that its localized arrivals/observations are attributed to parent
    parent.subevents = parent.subevents || [];
    const se = {
      lat: e.latlng.lat,
      lon: e.latlng.lng,
      depth: +depth.value,
      t0: performance.now(),
      M0: childM0,
      p: L.circle(e.latlng, {color: "#3399ff", weight:1, fill:false, opacity:0.9}).addTo(map),
      s: L.circle(e.latlng, {color: "#ff9999", weight:1, fill:false, opacity:0.9}).addTo(map)
    };
    parent.subevents.push(se);


    if(parent.card){
      // do not change the displayed magnitude; only update width display
      const wEl = parent.card.querySelector('.width');
      if(wEl) wEl.textContent = parent.width.toFixed(0);
    }

    // do NOT create a separate quake object; attributes are merged into parent (only as subevent)
    return;
  }

  const q={
    id: ++quakeCounter,
    lat:e.latlng.lat,
    lon:e.latlng.lng,
    mag: estimateMwFrom(parseFloat(width.value), parseFloat(slip.value)),
    M0: momentFrom(parseFloat(width.value), parseFloat(slip.value)),
    width: parseFloat(width.value),
    slip: parseFloat(slip.value),
    depth:+depth.value,
    t0:performance.now(),
    maxI:0,
    p:L.circle(e.latlng,{color:"#0066ff",weight:1,fill:false,opacity:0.9}).addTo(map),
    s:L.circle(e.latlng,{color:"#ff3333",weight:1,fill:false,opacity:0.9}).addTo(map),
    card:null,
    subevents:[]
  };

  createEEW(q);
  quakes.push(q);
});

/* ================= LOOP ================= */
function loop(){
  const now=performance.now();
  let any=false;

  quakes.forEach(q=>{
      const t=(now-q.t0)/1000;

    // P/S wave horizontal surface radius (km): when the spherical wavefront intersects the surface
    const Rp = t*VP; // sphere radius (km) for P
    const Rs = t*VS; // sphere radius (km) for S
    const p_horiz = Math.max(0, Math.sqrt(Math.max(0, Rp*Rp - q.depth*q.depth)));
    const s_horiz = Math.max(0, Math.sqrt(Math.max(0, Rs*Rs - q.depth*q.depth)));

    q.p.setRadius(p_horiz*1000);
    q.s.setRadius(s_horiz*1000);

    // Use spatial grid to find stations near the wavefront (much fewer distance computations)
    if(grid){
      // convert s_horiz (km) to degree box around epicenter
      const degLat = s_horiz / 111.0;
      const cosLat = Math.max(0.1, Math.cos(q.lat * Math.PI / 180));
      const degLon = s_horiz / (111.0 * cosLat);

      // helper to query grid with longitude wrapping
      function gridQueryNormalized(minLon,minLat,maxLon,maxLat){
        if(minLon < -180){
          return [...grid.queryBBox(minLon+360,minLat,180,maxLat), ...grid.queryBBox(-180,minLat,maxLon)];
        }
        if(maxLon > 180){
          return [...grid.queryBBox(minLon,minLat,180,maxLat-360), ...grid.queryBBox(-180,minLat,maxLon-360)];
        }
        return grid.queryBBox(minLon,minLat,maxLon,maxLat);
      }

      const minLon = q.lon - degLon; const maxLon = q.lon + degLon;
      const minLat = q.lat - degLat; const maxLat = q.lat + degLat;

      const candidates = gridQueryNormalized(minLon,minLat,maxLon,maxLat);
      const seen = new Set();

      candidates.forEach(st=>{
        if(seen.has(st)) return; seen.add(st);
        const dh = map.distance([q.lat,q.lon],[st.lat,st.lon])/1000;
        const hypo = Math.sqrt(dh*dh + q.depth*q.depth);
        const tp = hypo / VP;
        const ts = hypo / VS;
        let Iq = 0;
        if(t > tp) Iq = Math.max(Iq, calcI(hypo, q.mag) * 0.45);
        if(t > ts){
          const nowMs = performance.now();
          if(!st._sArrivals) st._sArrivals = {};
          if(!st._sArrivals[q.id]){
            st._sArrivals[q.id] = nowMs;
            st.lastSArrival = Math.max(st.lastSArrival || 0, nowMs);
            st._lastDecayAt = null;
          }
          Iq = Math.max(Iq, calcI(hypo, q.mag));
        }

        // subevents contribution (only check subevents if we have any)
        if(q.subevents && q.subevents.length){
          const nowMs = performance.now();
          q.subevents = q.subevents.filter(se => (nowMs - se.t0) / 1000 < 3600);
          q.subevents.forEach(se=>{
            const dh_se = map.distance([se.lat,se.lon],[st.lat,st.lon])/1000;
            const hypo_se = Math.sqrt(dh_se*dh_se + se.depth*se.depth);
            const t_se = (now - se.t0)/1000;
            const tp_se = hypo_se / VP;
            const ts_se = hypo_se / VS;
            const Mw_se = mwFromMoment(se.M0);
            if(t_se > tp_se) Iq = Math.max(Iq, calcI(hypo_se, Mw_se) * 0.45);
          if(t_se > ts_se){
            Iq = Math.max(Iq, calcI(hypo_se, Mw_se));
            // treat subevent S arrival like S arrival: record timestamp so decay is delayed/reset
            st.lastSArrival = Math.max(st.lastSArrival || 0, now);
            st._lastDecayAt = null;
          }
          });
        }

        // Update target (only if this quake contributes)
        if(Iq > 0) st.target = Math.max(st.target, Iq);

        // update quake's max intensity if this station observed it
        if(q.card && Iq > q.maxI){
          q.maxI = Iq;
          q.card.querySelector(".eew-intensity").textContent = JMA(q.maxI);
          q.card.querySelector(".eew-intensity").style.background = Icolor(q.maxI);
          q.card.querySelector(".maxI").textContent = q.maxI.toFixed(1);
        }
      });
    } else {
      // fallback: iterate activeStations
      activeStations.forEach(st=>{
        const dh = map.distance([q.lat,q.lon],[st.lat,st.lon])/1000; // horizontal km
        const hypo = Math.sqrt(dh*dh + q.depth*q.depth); // hypocentral distance (km)

        const tp = hypo / VP; // P arrival time (s)
        const ts = hypo / VS; // S arrival time (s)

        // Compute this quake's contribution to intensity at the station (Iq)
        let Iq = 0;
        if(t > tp){
          Iq = Math.max(Iq, calcI(hypo, q.mag) * 0.45); // P-wave partial from main epicenter
        }
        if(t > ts){
          const nowMs = performance.now();
          if(!st._sArrivals) st._sArrivals = {};
          // record/refresh S-wave arrival for this quake so decay is delayed/restarted
          st._sArrivals[q.id] = nowMs;
          st.lastSArrival = Math.max(st.lastSArrival || 0, nowMs);
          st._lastDecayAt = null;
          Iq = Math.max(Iq, calcI(hypo, q.mag)); // S-wave full from main epicenter
        }

        // consider subevents (child events inside this quake) and attribute to parent
        if(q.subevents && q.subevents.length){
          // filter out very old subevents
          const nowMs = performance.now();
          q.subevents = q.subevents.filter(se => (nowMs - se.t0) / 1000 < 3600);
          q.subevents.forEach(se=>{
            const dh_se = map.distance([se.lat,se.lon],[st.lat,st.lon])/1000;
            const hypo_se = Math.sqrt(dh_se*dh_se + se.depth*se.depth);
            const t_se = (now - se.t0)/1000;
            const tp_se = hypo_se / VP;
            const ts_se = hypo_se / VS;
            const Mw_se = mwFromMoment(se.M0);
            if(t_se > tp_se) Iq = Math.max(Iq, calcI(hypo_se, Mw_se) * 0.45);
          if(t_se > ts_se){
            Iq = Math.max(Iq, calcI(hypo_se, Mw_se));
            st.lastSArrival = Math.max(st.lastSArrival || 0, now);
            st._lastDecayAt = null;
          }
          });
        }

        // Update station's target by considering contributions from this quake
        if(Iq > 0) st.target = Math.max(st.target, Iq);

        // update quake's max intensity if this station observed it
        if(q.card && Iq > q.maxI){
          q.maxI = Iq;
          q.card.querySelector(".eew-intensity").textContent = JMA(q.maxI);
          q.card.querySelector(".eew-intensity").style.background = Icolor(q.maxI);
          q.card.querySelector(".maxI").textContent = q.maxI.toFixed(1);
        }
      });
    }

    // Update subevent wave visuals and cleanup expired subevents
    if(q.subevents && q.subevents.length){
      const nowMs2 = performance.now();
      q.subevents = q.subevents.filter(se=>{
        const t_se = (nowMs2 - se.t0)/1000;
        const Rp_se = t_se * VP;
        const Rs_se = t_se * VS;
        const p_horiz_se = Math.max(0, Math.sqrt(Math.max(0, Rp_se*Rp_se - se.depth*se.depth)));
        const s_horiz_se = Math.max(0, Math.sqrt(Math.max(0, Rs_se*Rs_se - se.depth*se.depth)));
        if(se.p) se.p.setRadius(p_horiz_se*1000);
        if(se.s) se.s.setRadius(s_horiz_se*1000);
        // expire after an hour (same as intensity logic)
        if(t_se > 3600){
          if(se.p) map.removeLayer(se.p);
          if(se.s) map.removeLayer(se.s);
          return false;
        }
        return true;
      });
    }

    any=true;
  });

  // Update all stations' internal intensity and redraw markers at throttled interval
  const nowMsGlobal = performance.now();
  stations.forEach(st => {
    // if S-wave passed and 30s passed since S arrival, apply extra decay to the station's target
    // if S-wave passed and 3s passed since last S arrival, apply extra gradual decay to the station's target
    if(st.lastSArrival && (nowMsGlobal - st.lastSArrival) > 3000){
      const dtSec = (nowMsGlobal - (st._lastDecayAt || st.lastSArrival + 3000)) / 1000;
      if(dtSec > 0){
        // per-second multiplier (e.g., 0.992 per sec -> slow gradual decay)
        const perSecFactor = 2;
        st.target *= Math.pow(perSecFactor, dtSec);
        st._lastDecayAt = nowMsGlobal;
      }
    }

    // evolve observable intensity and global slow decay
    st.I += (st.target - st.I) * 0.03;
    st.target *= 0.992;
  });
  if(nowMsGlobal - lastStationDraw > STATION_UPDATE_INTERVAL){
    activeStations.forEach(st => {
      const clr = Icolor(st.I);
      if(st.layer){
        st.layer.eachLayer(mk => mk.setStyle({ radius: 2.5 + st.I * 0.7, color: clr, fillColor: clr, fillOpacity: 1, opacity: 1 }));
      }
    });
    lastStationDraw = nowMsGlobal;
  }

  if(!any){
    document.getElementById("eew-panel").innerHTML=
      `<div class="eew-card">
        <div class="eew-header">긴급 지진 속보</div>
        <div class="eew-body">
          <div class="eew-info">이건 시뮬레이션 입니다.</div>
        </div>
      </div>`;
  }

  requestAnimationFrame(loop);
}
loop();