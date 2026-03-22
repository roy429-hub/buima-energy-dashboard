/**
 * locationData.js
 * Replaces Gemini API entirely.
 * Uses:
 *   1. Open-Meteo Geocoding API  → lat/lon from location string (free, no key)
 *   2. Open-Meteo Climate API    → annual avg solar radiation → peak sun hours (free, no key)
 *   3. Static regional tables    → grid prices, EV charging fees, labor costs
 */

// ─── STATIC RATE TABLES ────────────────────────────────────────────────────
// Sources: IEA, IRENA, GlobalPetrolPrices (2024 averages, USD)
const REGIONAL_RATES = [
  // Taiwan & East Asia
  { match: ['taiwan', 'taipei', 'taichung', 'tainan', 'kaohsiung', 'hsinchu', 'taoyuan'],
    country: 'Taiwan', currency: 'USD',
    gridPrice: 0.10, chargingFee: 0.38, laborCost: 1800, dailySessions: 7 },
  { match: ['japan', 'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya', 'fukuoka'],
    country: 'Japan', currency: 'USD',
    gridPrice: 0.24, chargingFee: 0.55, laborCost: 3500, dailySessions: 8 },
  { match: ['korea', 'seoul', 'busan', 'incheon', 'daejeon'],
    country: 'South Korea', currency: 'USD',
    gridPrice: 0.12, chargingFee: 0.42, laborCost: 2500, dailySessions: 8 },
  { match: ['china', 'beijing', 'shanghai', 'shenzhen', 'guangzhou', 'chengdu', 'hangzhou'],
    country: 'China', currency: 'USD',
    gridPrice: 0.08, chargingFee: 0.28, laborCost: 1200, dailySessions: 10 },
  { match: ['hong kong', 'hk'],
    country: 'Hong Kong', currency: 'USD',
    gridPrice: 0.16, chargingFee: 0.48, laborCost: 3200, dailySessions: 7 },
  { match: ['singapore', 'sg'],
    country: 'Singapore', currency: 'USD',
    gridPrice: 0.21, chargingFee: 0.52, laborCost: 3000, dailySessions: 8 },
  { match: ['thailand', 'bangkok', 'chiang mai', 'phuket'],
    country: 'Thailand', currency: 'USD',
    gridPrice: 0.11, chargingFee: 0.35, laborCost: 900, dailySessions: 5 },
  { match: ['vietnam', 'hanoi', 'ho chi minh', 'saigon', 'da nang'],
    country: 'Vietnam', currency: 'USD',
    gridPrice: 0.08, chargingFee: 0.28, laborCost: 700, dailySessions: 5 },
  { match: ['malaysia', 'kuala lumpur', 'penang', 'johor'],
    country: 'Malaysia', currency: 'USD',
    gridPrice: 0.09, chargingFee: 0.30, laborCost: 900, dailySessions: 6 },
  { match: ['indonesia', 'jakarta', 'bali', 'surabaya'],
    country: 'Indonesia', currency: 'USD',
    gridPrice: 0.09, chargingFee: 0.28, laborCost: 700, dailySessions: 5 },
  { match: ['philippines', 'manila', 'cebu', 'davao'],
    country: 'Philippines', currency: 'USD',
    gridPrice: 0.18, chargingFee: 0.42, laborCost: 800, dailySessions: 5 },

  // Europe
  { match: ['germany', 'berlin', 'munich', 'hamburg', 'frankfurt', 'cologne'],
    country: 'Germany', currency: 'USD',
    gridPrice: 0.38, chargingFee: 0.68, laborCost: 5500, dailySessions: 6 },
  { match: ['france', 'paris', 'lyon', 'marseille', 'toulouse'],
    country: 'France', currency: 'USD',
    gridPrice: 0.22, chargingFee: 0.50, laborCost: 4500, dailySessions: 6 },
  { match: ['uk', 'united kingdom', 'london', 'manchester', 'birmingham', 'edinburgh'],
    country: 'United Kingdom', currency: 'USD',
    gridPrice: 0.34, chargingFee: 0.62, laborCost: 5000, dailySessions: 6 },
  { match: ['netherlands', 'amsterdam', 'rotterdam', 'the hague'],
    country: 'Netherlands', currency: 'USD',
    gridPrice: 0.32, chargingFee: 0.60, laborCost: 5000, dailySessions: 7 },
  { match: ['norway', 'oslo', 'bergen', 'trondheim'],
    country: 'Norway', currency: 'USD',
    gridPrice: 0.16, chargingFee: 0.40, laborCost: 7000, dailySessions: 8 },
  { match: ['sweden', 'stockholm', 'gothenburg', 'malmo'],
    country: 'Sweden', currency: 'USD',
    gridPrice: 0.14, chargingFee: 0.40, laborCost: 5500, dailySessions: 7 },
  { match: ['spain', 'madrid', 'barcelona', 'seville', 'valencia'],
    country: 'Spain', currency: 'USD',
    gridPrice: 0.26, chargingFee: 0.52, laborCost: 3500, dailySessions: 6 },
  { match: ['italy', 'rome', 'milan', 'naples', 'turin'],
    country: 'Italy', currency: 'USD',
    gridPrice: 0.28, chargingFee: 0.55, laborCost: 3800, dailySessions: 6 },

  // North America
  { match: ['california', 'los angeles', 'san francisco', 'san diego', 'san jose', 'sacramento'],
    country: 'USA (CA)', currency: 'USD',
    gridPrice: 0.26, chargingFee: 0.48, laborCost: 4500, dailySessions: 8 },
  { match: ['new york', 'nyc', 'brooklyn', 'manhattan', 'queens'],
    country: 'USA (NY)', currency: 'USD',
    gridPrice: 0.22, chargingFee: 0.48, laborCost: 5000, dailySessions: 7 },
  { match: ['texas', 'houston', 'dallas', 'austin', 'san antonio'],
    country: 'USA (TX)', currency: 'USD',
    gridPrice: 0.12, chargingFee: 0.35, laborCost: 3200, dailySessions: 7 },
  { match: ['florida', 'miami', 'orlando', 'tampa', 'jacksonville'],
    country: 'USA (FL)', currency: 'USD',
    gridPrice: 0.13, chargingFee: 0.38, laborCost: 3000, dailySessions: 7 },
  { match: ['usa', 'united states', 'america', 'us '],
    country: 'USA', currency: 'USD',
    gridPrice: 0.16, chargingFee: 0.40, laborCost: 3800, dailySessions: 7 },
  { match: ['canada', 'toronto', 'vancouver', 'montreal', 'calgary', 'ottawa'],
    country: 'Canada', currency: 'USD',
    gridPrice: 0.13, chargingFee: 0.38, laborCost: 4000, dailySessions: 6 },

  // Middle East & Africa
  { match: ['uae', 'dubai', 'abu dhabi', 'sharjah'],
    country: 'UAE', currency: 'USD',
    gridPrice: 0.08, chargingFee: 0.30, laborCost: 1500, dailySessions: 6 },
  { match: ['saudi', 'riyadh', 'jeddah', 'dammam'],
    country: 'Saudi Arabia', currency: 'USD',
    gridPrice: 0.05, chargingFee: 0.22, laborCost: 1200, dailySessions: 5 },
  { match: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth'],
    country: 'Australia', currency: 'USD',
    gridPrice: 0.20, chargingFee: 0.45, laborCost: 5000, dailySessions: 6 },
  { match: ['india', 'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'pune'],
    country: 'India', currency: 'USD',
    gridPrice: 0.08, chargingFee: 0.25, laborCost: 600, dailySessions: 6 },
];

const DEFAULT_RATES = {
  country: 'Unknown Region', currency: 'USD',
  gridPrice: 0.14, chargingFee: 0.40, laborCost: 2500, dailySessions: 6
};

function matchRates(locationStr) {
  if (!locationStr) return DEFAULT_RATES;
  const lower = locationStr.toLowerCase();
  for (const region of REGIONAL_RATES) {
    if (region.match.some(keyword => lower.includes(keyword))) {
      return region;
    }
  }
  return DEFAULT_RATES;
}

// ─── OPEN-METEO GEOCODING ──────────────────────────────────────────────────
async function geocode(locationStr) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationStr)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude, name: data.results[0].name };
    }
  } catch (e) {
    console.warn('Geocoding failed:', e);
  }
  return null;
}

// ─── OPEN-METEO SOLAR DATA ─────────────────────────────────────────────────
// Uses climate normals or forecast daily sunshine_duration / shortwave_radiation
async function fetchSolarHours(lat, lon) {
  try {
    // Use 1 year of daily shortwave radiation to get annual avg peak sun hours
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-12-31&daily=shortwave_radiation_sum&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.daily && data.daily.shortwave_radiation_sum) {
      const values = data.daily.shortwave_radiation_sum.filter(v => v !== null);
      // shortwave_radiation_sum is in MJ/m² → divide by 3.6 to get kWh/m² = peak sun hours
      const avgDaily = values.reduce((a, b) => a + b, 0) / values.length;
      const peakSunHours = avgDaily / 3.6;
      return Math.round(peakSunHours * 10) / 10;
    }
  } catch (e) {
    console.warn('Solar data fetch failed:', e);
  }
  return null;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────
/**
 * Fetches all location data needed by the ROI calculator.
 * Returns { gridPrice, chargingFee, currency, sunHours, laborCost, dailySessions, country, source }
 */
export async function fetchLocationData(locationStr) {
  const rates = matchRates(locationStr);

  // Try to get real solar hours from Open-Meteo
  let sunHours = null;
  let geoName = null;
  let solarSource = 'estimated';

  const geo = await geocode(locationStr);
  if (geo) {
    geoName = geo.name;
    const solar = await fetchSolarHours(geo.lat, geo.lon);
    if (solar && solar > 0 && solar < 12) {
      sunHours = solar;
      solarSource = 'Open-Meteo (live)';
    }
  }

  // Fallback sun hours by latitude band (if API failed)
  if (!sunHours) {
    const lowerLoc = locationStr.toLowerCase();
    if (['taiwan', 'philippines', 'vietnam', 'indonesia', 'malaysia', 'thailand', 'singapore'].some(c => lowerLoc.includes(c))) sunHours = 4.5;
    else if (['india', 'uae', 'saudi', 'dubai'].some(c => lowerLoc.includes(c))) sunHours = 5.5;
    else if (['australia'].some(c => lowerLoc.includes(c))) sunHours = 5.0;
    else if (['california', 'spain', 'italy'].some(c => lowerLoc.includes(c))) sunHours = 5.0;
    else if (['germany', 'uk', 'norway', 'sweden'].some(c => lowerLoc.includes(c))) sunHours = 3.0;
    else if (['japan', 'korea', 'china'].some(c => lowerLoc.includes(c))) sunHours = 4.0;
    else sunHours = 3.8;
    solarSource = 'regional estimate';
  }

  return {
    ...rates,
    sunHours,
    geoName,
    solarSource,
    chargingFee: rates.chargingFee,
    dailySessions: rates.dailySessions,
  };
}
