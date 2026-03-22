/**
 * locationData.js — BUIMA ENERGY B.E.S.T Dashboard
 * ─────────────────────────────────────────────────
 * DATA SOURCES (clearly labeled per field):
 *
 *  gridPrice   ✅ VERIFIED — WorldPopulationReview / GlobalPetrolPrices Q4 2025
 *                            https://worldpopulationreview.com/country-rankings/cost-of-electricity-by-country
 *                            Business rates shown (approx 80% of household rate)
 *
 *  chargingFee ⚠️ ESTIMATED — No free global API exists for EV charging rates.
 *                             Based on operator surveys & regional market reports 2024.
 *
 *  laborCost   ⚠️ ESTIMATED — Regional construction cost indices 2024.
 *
 *  dailySessions ⚠️ ESTIMATED — Generic utilization assumptions only.
 *
 *  sunHours    ✅ LIVE — Open-Meteo Archive API (real 2023 historical irradiance)
 *                        https://archive-api.open-meteo.com
 */

// ─────────────────────────────────────────────────────────────────────────────
// GRID PRICES — Source: WorldPopulationReview / GlobalPetrolPrices Q4 2025
// Household rates from source. Business rates = household × ~0.82 (typical ratio)
// ─────────────────────────────────────────────────────────────────────────────
const GRID_PRICES = {
  'taiwan':         { household: 0.10, business: 0.085 },
  'japan':          { household: 0.23, business: 0.19  },
  'south korea':    { household: 0.13, business: 0.11  },
  'china':          { household: 0.08, business: 0.07  },
  'hong kong':      { household: 0.19, business: 0.16  },
  'singapore':      { household: 0.23, business: 0.19  },
  'thailand':       { household: 0.13, business: 0.11  },
  'vietnam':        { household: 0.08, business: 0.07  },
  'malaysia':       { household: 0.05, business: 0.045 },
  'indonesia':      { household: 0.09, business: 0.08  },
  'philippines':    { household: 0.20, business: 0.17  },
  'cambodia':       { household: 0.15, business: 0.13  },
  'india':          { household: 0.08, business: 0.07  },
  'pakistan':       { household: 0.07, business: 0.06  },
  'bangladesh':     { household: 0.06, business: 0.05  },
  'sri lanka':      { household: 0.12, business: 0.10  },
  'nepal':          { household: 0.04, business: 0.035 },
  'uae':            { household: 0.08, business: 0.07  },
  'saudi arabia':   { household: 0.05, business: 0.045 },
  'qatar':          { household: 0.03, business: 0.025 },
  'kuwait':         { household: 0.04, business: 0.035 },
  'bahrain':        { household: 0.05, business: 0.045 },
  'oman':           { household: 0.03, business: 0.025 },
  'jordan':         { household: 0.09, business: 0.08  },
  'israel':         { household: 0.18, business: 0.15  },
  'turkey':         { household: 0.07, business: 0.06  },
  'egypt':          { household: 0.02, business: 0.018 },
  'iraq':           { household: 0.01, business: 0.009 },
  'germany':        { household: 0.40, business: 0.32  },
  'france':         { household: 0.28, business: 0.23  },
  'uk':             { household: 0.40, business: 0.32  },
  'united kingdom': { household: 0.40, business: 0.32  },
  'netherlands':    { household: 0.29, business: 0.24  },
  'belgium':        { household: 0.40, business: 0.32  },
  'spain':          { household: 0.25, business: 0.21  },
  'italy':          { household: 0.42, business: 0.34  },
  'portugal':       { household: 0.23, business: 0.19  },
  'sweden':         { household: 0.23, business: 0.19  },
  'norway':         { household: 0.15, business: 0.13  },
  'denmark':        { household: 0.36, business: 0.29  },
  'finland':        { household: 0.18, business: 0.15  },
  'poland':         { household: 0.23, business: 0.19  },
  'austria':        { household: 0.34, business: 0.28  },
  'switzerland':    { household: 0.36, business: 0.29  },
  'greece':         { household: 0.25, business: 0.21  },
  'czechia':        { household: 0.35, business: 0.28  },
  'hungary':        { household: 0.11, business: 0.10  },
  'romania':        { household: 0.19, business: 0.16  },
  'ireland':        { household: 0.44, business: 0.35  },
  'croatia':        { household: 0.17, business: 0.14  },
  'serbia':         { household: 0.13, business: 0.11  },
  'ukraine':        { household: 0.08, business: 0.07  },
  'russia':         { household: 0.07, business: 0.06  },
  'bulgaria':       { household: 0.15, business: 0.13  },
  'slovakia':       { household: 0.21, business: 0.17  },
  'estonia':        { household: 0.29, business: 0.24  },
  'latvia':         { household: 0.28, business: 0.23  },
  'lithuania':      { household: 0.27, business: 0.22  },
  'iceland':        { household: 0.17, business: 0.14  },
  'united states':  { household: 0.18, business: 0.14  },
  'usa':            { household: 0.18, business: 0.14  },
  'canada':         { household: 0.12, business: 0.10  },
  'mexico':         { household: 0.11, business: 0.09  },
  'brazil':         { household: 0.16, business: 0.13  },
  'chile':          { household: 0.21, business: 0.17  },
  'colombia':       { household: 0.20, business: 0.17  },
  'peru':           { household: 0.19, business: 0.16  },
  'argentina':      { household: 0.08, business: 0.07  },
  'ecuador':        { household: 0.10, business: 0.09  },
  'uruguay':        { household: 0.25, business: 0.21  },
  'costa rica':     { household: 0.17, business: 0.14  },
  'panama':         { household: 0.17, business: 0.14  },
  'venezuela':      { household: 0.07, business: 0.06  },
  'australia':      { household: 0.26, business: 0.21  },
  'new zealand':    { household: 0.21, business: 0.17  },
  'south africa':   { household: 0.19, business: 0.16  },
  'kenya':          { household: 0.22, business: 0.18  },
  'nigeria':        { household: 0.04, business: 0.035 },
  'ghana':          { household: 0.13, business: 0.11  },
  'morocco':        { household: 0.12, business: 0.10  },
  'ethiopia':       { household: 0.01, business: 0.009 },
  'tanzania':       { household: 0.09, business: 0.08  },
  'algeria':        { household: 0.04, business: 0.035 },
  'zambia':         { household: 0.02, business: 0.018 },
  'namibia':        { household: 0.14, business: 0.12  },
  'uganda':         { household: 0.17, business: 0.14  },
  'cameroon':       { household: 0.08, business: 0.07  },
  'rwanda':         { household: 0.20, business: 0.17  },
  'kazakhstan':     { household: 0.06, business: 0.05  },
  'uzbekistan':     { household: 0.04, business: 0.035 },
  'azerbaijan':     { household: 0.05, business: 0.045 },
  'georgia':        { household: 0.07, business: 0.06  },
  'armenia':        { household: 0.11, business: 0.09  },
  'myanmar':        { household: 0.03, business: 0.025 },
  'laos':           { household: 0.03, business: 0.025 },
  'afghanistan':    { household: 0.05, business: 0.045 },
  'maldives':       { household: 0.10, business: 0.09  },
  'turkey':         { household: 0.07, business: 0.06  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CITY → COUNTRY MAP
// ─────────────────────────────────────────────────────────────────────────────
const CITY_TO_COUNTRY = {
  'taipei':'taiwan','taichung':'taiwan','tainan':'taiwan','kaohsiung':'taiwan',
  'hsinchu':'taiwan','taoyuan':'taiwan','keelung':'taiwan',
  'tokyo':'japan','osaka':'japan','kyoto':'japan','yokohama':'japan',
  'nagoya':'japan','fukuoka':'japan','sapporo':'japan','kobe':'japan',
  'seoul':'south korea','busan':'south korea','incheon':'south korea',
  'daejeon':'south korea','gwangju':'south korea','daegu':'south korea',
  'beijing':'china','shanghai':'china','shenzhen':'china','guangzhou':'china',
  'chengdu':'china','hangzhou':'china','wuhan':'china','nanjing':'china',
  'tianjin':'china','chongqing':'china','suzhou':'china',
  'hong kong':'hong kong','kowloon':'hong kong',
  'singapore':'singapore',
  'bangkok':'thailand','chiang mai':'thailand','phuket':'thailand',
  'ho chi minh':'vietnam','hanoi':'vietnam','da nang':'vietnam','saigon':'vietnam',
  'kuala lumpur':'malaysia','penang':'malaysia','johor':'malaysia',
  'jakarta':'indonesia','bali':'indonesia','surabaya':'indonesia',
  'manila':'philippines','cebu':'philippines','davao':'philippines',
  'phnom penh':'cambodia','siem reap':'cambodia',
  'mumbai':'india','delhi':'india','bangalore':'india','hyderabad':'india',
  'chennai':'india','pune':'india','kolkata':'india','new delhi':'india',
  'karachi':'pakistan','lahore':'pakistan','islamabad':'pakistan',
  'dhaka':'bangladesh','colombo':'sri lanka','kathmandu':'nepal',
  'dubai':'uae','abu dhabi':'uae','sharjah':'uae',
  'riyadh':'saudi arabia','jeddah':'saudi arabia','dammam':'saudi arabia',
  'doha':'qatar','kuwait city':'kuwait','manama':'bahrain','muscat':'oman',
  'amman':'jordan','tel aviv':'israel','jerusalem':'israel',
  'istanbul':'turkey','ankara':'turkey','cairo':'egypt','baghdad':'iraq',
  'berlin':'germany','munich':'germany','hamburg':'germany','frankfurt':'germany',
  'cologne':'germany','dusseldorf':'germany',
  'paris':'france','lyon':'france','marseille':'france','toulouse':'france',
  'london':'uk','manchester':'uk','birmingham':'uk','edinburgh':'uk',
  'amsterdam':'netherlands','rotterdam':'netherlands',
  'brussels':'belgium','madrid':'spain','barcelona':'spain','seville':'spain',
  'rome':'italy','milan':'italy','naples':'italy','turin':'italy',
  'lisbon':'portugal','porto':'portugal',
  'stockholm':'sweden','oslo':'norway','copenhagen':'denmark','helsinki':'finland',
  'warsaw':'poland','krakow':'poland','vienna':'austria',
  'zurich':'switzerland','geneva':'switzerland','athens':'greece',
  'prague':'czechia','budapest':'hungary','bucharest':'romania',
  'dublin':'ireland','zagreb':'croatia','belgrade':'serbia',
  'kyiv':'ukraine','moscow':'russia','sofia':'bulgaria',
  'bratislava':'slovakia','tallinn':'estonia','riga':'latvia','vilnius':'lithuania',
  'reykjavik':'iceland',
  'new york':'usa','nyc':'usa','los angeles':'usa','chicago':'usa',
  'houston':'usa','dallas':'usa','austin':'usa','phoenix':'usa',
  'san francisco':'usa','seattle':'usa','miami':'usa','boston':'usa',
  'washington':'usa','atlanta':'usa','denver':'usa','las vegas':'usa',
  'toronto':'canada','vancouver':'canada','montreal':'canada',
  'calgary':'canada','ottawa':'canada',
  'sao paulo':'brazil','rio de janeiro':'brazil','brasilia':'brazil',
  'santiago':'chile','bogota':'colombia','lima':'peru',
  'buenos aires':'argentina','quito':'ecuador','montevideo':'uruguay',
  'sydney':'australia','melbourne':'australia','brisbane':'australia','perth':'australia',
  'auckland':'new zealand','wellington':'new zealand',
  'johannesburg':'south africa','cape town':'south africa','durban':'south africa',
  'nairobi':'kenya','lagos':'nigeria','accra':'ghana',
  'casablanca':'morocco','addis ababa':'ethiopia',
  'dar es salaam':'tanzania','algiers':'algeria','lusaka':'zambia',
  'windhoek':'namibia','kampala':'uganda','kigali':'rwanda',
  'almaty':'kazakhstan','tashkent':'uzbekistan','baku':'azerbaijan',
  'tbilisi':'georgia','yerevan':'armenia',
};

// ─────────────────────────────────────────────────────────────────────────────
// EV RATES ⚠️ ESTIMATED — verify with local operators
// ─────────────────────────────────────────────────────────────────────────────
const EV_RATES = {
  'taiwan':{'fee':0.38,'sessions':7,'labor':1800},
  'japan':{'fee':0.55,'sessions':8,'labor':3500},
  'south korea':{'fee':0.42,'sessions':8,'labor':2500},
  'china':{'fee':0.28,'sessions':10,'labor':1200},
  'hong kong':{'fee':0.48,'sessions':7,'labor':3200},
  'singapore':{'fee':0.52,'sessions':8,'labor':3000},
  'thailand':{'fee':0.35,'sessions':5,'labor':900},
  'vietnam':{'fee':0.28,'sessions':5,'labor':700},
  'malaysia':{'fee':0.25,'sessions':6,'labor':900},
  'indonesia':{'fee':0.28,'sessions':5,'labor':700},
  'philippines':{'fee':0.42,'sessions':5,'labor':800},
  'cambodia':{'fee':0.30,'sessions':4,'labor':600},
  'india':{'fee':0.25,'sessions':6,'labor':600},
  'pakistan':{'fee':0.20,'sessions':3,'labor':500},
  'uae':{'fee':0.30,'sessions':6,'labor':1500},
  'saudi arabia':{'fee':0.22,'sessions':5,'labor':1200},
  'qatar':{'fee':0.20,'sessions':5,'labor':1800},
  'israel':{'fee':0.45,'sessions':6,'labor':3500},
  'turkey':{'fee':0.25,'sessions':6,'labor':1500},
  'egypt':{'fee':0.15,'sessions':4,'labor':700},
  'germany':{'fee':0.68,'sessions':6,'labor':5500},
  'france':{'fee':0.55,'sessions':6,'labor':4500},
  'uk':{'fee':0.62,'sessions':6,'labor':5000},
  'united kingdom':{'fee':0.62,'sessions':6,'labor':5000},
  'netherlands':{'fee':0.60,'sessions':7,'labor':5000},
  'belgium':{'fee':0.65,'sessions':6,'labor':4800},
  'spain':{'fee':0.50,'sessions':6,'labor':3500},
  'italy':{'fee':0.55,'sessions':6,'labor':3800},
  'portugal':{'fee':0.48,'sessions':6,'labor':3200},
  'sweden':{'fee':0.40,'sessions':7,'labor':5500},
  'norway':{'fee':0.40,'sessions':8,'labor':7000},
  'denmark':{'fee':0.55,'sessions':6,'labor':6000},
  'poland':{'fee':0.45,'sessions':6,'labor':2800},
  'austria':{'fee':0.55,'sessions':6,'labor':4500},
  'switzerland':{'fee':0.60,'sessions':7,'labor':7000},
  'usa':{'fee':0.40,'sessions':7,'labor':3800},
  'united states':{'fee':0.40,'sessions':7,'labor':3800},
  'canada':{'fee':0.38,'sessions':6,'labor':4000},
  'mexico':{'fee':0.30,'sessions':5,'labor':1500},
  'brazil':{'fee':0.35,'sessions':5,'labor':1500},
  'chile':{'fee':0.40,'sessions':5,'labor':2000},
  'colombia':{'fee':0.35,'sessions':5,'labor':1200},
  'australia':{'fee':0.45,'sessions':6,'labor':5000},
  'new zealand':{'fee':0.42,'sessions':5,'labor':4500},
  'south africa':{'fee':0.35,'sessions':5,'labor':1200},
  'kenya':{'fee':0.30,'sessions':4,'labor':800},
  'nigeria':{'fee':0.20,'sessions':3,'labor':700},
};

const DEFAULT = { gridBusiness:0.14, chargingFee:0.38, laborCost:2500, dailySessions:5 };

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE
// ─────────────────────────────────────────────────────────────────────────────
function resolveRates(locationStr) {
  const lower = locationStr.toLowerCase().trim();
  let countryKey = null;

  // Direct country match
  if (GRID_PRICES[lower]) countryKey = lower;

  // City → country
  if (!countryKey) {
    for (const [city, country] of Object.entries(CITY_TO_COUNTRY)) {
      if (lower.includes(city)) { countryKey = country; break; }
    }
  }

  // Partial country name
  if (!countryKey) {
    for (const c of Object.keys(GRID_PRICES)) {
      if (lower.includes(c)) { countryKey = c; break; }
    }
  }

  const g = countryKey ? GRID_PRICES[countryKey] : null;
  const e = countryKey ? (EV_RATES[countryKey] || null) : null;

  return {
    countryKey,
    gridPrice:      g ? g.business        : DEFAULT.gridBusiness,
    gridHousehold:  g ? g.household       : DEFAULT.gridBusiness * 1.3,
    chargingFee:    e ? e.fee             : DEFAULT.chargingFee,
    laborCost:      e ? e.labor           : DEFAULT.laborCost,
    dailySessions:  e ? e.sessions        : DEFAULT.dailySessions,
    currency: 'USD',
    isGridVerified: !!g,
    gridSource: g
      ? 'WorldPopulationReview / GlobalPetrolPrices Q4 2025 ✅'
      : 'Global average estimate — not verified ⚠️',
    evSource: 'Estimated from market surveys 2024 ⚠️ — verify with local operators',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOCODE via Open-Meteo (free, no key)
// ─────────────────────────────────────────────────────────────────────────────
async function geocode(locationStr) {
  try {
    const res  = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationStr)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    if (data.results?.[0]) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude,
               name: data.results[0].name, country: data.results[0].country };
    }
  } catch (e) { console.warn('Geocode fail:', e.message); }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLAR HOURS via Open-Meteo Archive (free, real historical data)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchSolarHours(lat, lon) {
  try {
    const res  = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-12-31&daily=shortwave_radiation_sum&timezone=auto`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    if (data.daily?.shortwave_radiation_sum) {
      const vals = data.daily.shortwave_radiation_sum.filter(v => v !== null);
      if (vals.length > 300) {
        const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
        const hrs = avg / 3.6; // MJ/m² → kWh/m² = peak sun hours
        if (hrs > 0.5 && hrs < 12)
          return { hours: Math.round(hrs * 10) / 10, source: 'Open-Meteo 2023 historical data ✅' };
      }
    }
  } catch (e) { console.warn('Solar fail:', e.message); }
  return null;
}

function solarFallback(lat) {
  const a = Math.abs(lat || 25);
  if (a < 15) return { hours: 5.2, source: 'Estimated (equatorial) ⚠️' };
  if (a < 25) return { hours: 4.8, source: 'Estimated (tropical) ⚠️' };
  if (a < 35) return { hours: 4.4, source: 'Estimated (subtropical) ⚠️' };
  if (a < 45) return { hours: 3.8, source: 'Estimated (temperate) ⚠️' };
  if (a < 55) return { hours: 3.2, source: 'Estimated (cool temperate) ⚠️' };
  return { hours: 2.8, source: 'Estimated (high latitude) ⚠️' };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchLocationData(locationStr) {
  let rates = resolveRates(locationStr);

  const geo = await geocode(locationStr);
  let sunHours   = null;
  let solarSource = null;
  let geoName    = locationStr;

  if (geo) {
    geoName = `${geo.name}, ${geo.country}`;

    // Try to improve country match from geocoded country name
    if (!rates.isGridVerified) {
      const geoRates = resolveRates(geo.country || '');
      if (geoRates.isGridVerified) rates = geoRates;
    }

    const solar = await fetchSolarHours(geo.lat, geo.lon);
    if (solar) {
      sunHours    = solar.hours;
      solarSource = solar.source;
    } else {
      const fb    = solarFallback(geo.lat);
      sunHours    = fb.hours;
      solarSource = fb.source;
    }
  } else {
    sunHours    = 3.8;
    solarSource = 'Estimated — location not resolved ⚠️';
  }

  return {
    gridPrice:      rates.gridPrice,
    gridHousehold:  rates.gridHousehold,
    chargingFee:    rates.chargingFee,
    laborCost:      rates.laborCost,
    dailySessions:  rates.dailySessions,
    currency:       'USD',
    sunHours,
    geoName,
    country:        rates.countryKey || 'Unknown',
    isGridVerified: rates.isGridVerified,
    gridSource:     rates.gridSource,
    evSource:       rates.evSource,
    solarSource,
  };
}
