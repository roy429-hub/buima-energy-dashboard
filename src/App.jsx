import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Zap, Search, Calculator, ArrowRight, CheckCircle2,
  AlertCircle, TrendingUp, Sun, Battery, Settings, Loader2,
  PlugZap, ChevronRight, X, List, BarChart3, Printer, Copy,
  MessageSquare, Users, Sliders, MapPin, Wifi, Globe,
  DollarSign, RefreshCw, Info, Save, Share2, BookOpen,
  FolderOpen, Trash2, Link, Download
} from 'lucide-react';
import { fetchLocationData } from './locationData.js';

// ─── IRR ─────────────────────────────────────────────────────────────────
const calculateIRR = (cashFlows, guess = 0.1) => {
  let rate = guess;
  for (let i = 0; i < 1000; i++) {
    let npv = 0, deriv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv   += cashFlows[t] / Math.pow(1 + rate, t);
      deriv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }
    const nr = rate - npv / deriv;
    if (Math.abs(nr - rate) < 0.00001) return nr * 100;
    rate = nr;
  }
  return 0;
};

// ─── CLIPBOARD ───────────────────────────────────────────────────────────
const copyToClipboard = (text) => {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(el);
};

// ─── CURRENCY CONFIG ─────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'USD — US Dollar' },
  { code: 'NTD', symbol: 'NT$', label: 'NTD — New Taiwan Dollar' },
  { code: 'EUR', symbol: '€',  label: 'EUR — Euro' },
  { code: 'JPY', symbol: '¥',  label: 'JPY — Japanese Yen' },
  { code: 'SGD', symbol: 'S$', label: 'SGD — Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD — Australian Dollar' },
  { code: 'GBP', symbol: '£',  label: 'GBP — British Pound' },
  { code: 'HKD', symbol: 'HK$', label: 'HKD — Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩',  label: 'KRW — South Korean Won' },
  { code: 'CNY', symbol: '¥',  label: 'CNY — Chinese Yuan' },
  { code: 'INR', symbol: '₹',  label: 'INR — Indian Rupee' },
  { code: 'AED', symbol: 'AED', label: 'AED — UAE Dirham' },
];
const getCurrencySymbol = (code) => CURRENCIES.find(c => c.code === code)?.symbol || code;

// ─── URL SHARE ────────────────────────────────────────────────────────────
const encodeState = (data) => {
  try { return btoa(encodeURIComponent(JSON.stringify(data))); } catch { return ''; }
};
const decodeState = (str) => {
  try { return JSON.parse(decodeURIComponent(atob(str))); } catch { return null; }
};
const getShareUrl = (formData) => {
  const hash = encodeState(formData);
  return `${window.location.origin}${window.location.pathname}#s=${hash}`;
};
const loadStateFromUrl = () => {
  const hash = window.location.hash;
  const match = hash.match(/[#&]s=([^&]+)/);
  if (match) { const d = decodeState(match[1]); window.location.hash = ''; return d; }
  return null;
};

// ─── SAVED SCENARIOS ─────────────────────────────────────────────────────
const STORAGE_KEY = 'buima_scenarios';
const loadScenarios = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
const saveScenarios = (scenarios) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios)); } catch {} };

// ─── UI PRIMITIVES ───────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ title, subtitle, icon: Icon }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon className="w-6 h-6 text-rose-700" />}
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
    {subtitle && <p className="text-slate-500 text-sm ml-8">{subtitle}</p>}
  </div>
);

const InputField = ({ label, value, onChange, type = 'text', placeholder, suffix, note, min, max }) => {
  const displayValue = (typeof value === 'number' && isNaN(value)) ? '' : value;
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative rounded-md shadow-sm">
        <input
          type={type} value={displayValue} onChange={onChange} min={min} max={max}
          className="block w-full rounded-md border-slate-300 pl-3 pr-12 py-2 focus:border-rose-700 focus:ring-rose-700 sm:text-sm border"
          placeholder={placeholder}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-slate-500 sm:text-sm">{suffix}</span>
          </div>
        )}
      </div>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
};

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-[110] animate-fade-in">
      <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

const DataBadge = ({ source }) => (
  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-rose-50 border border-rose-100 rounded-md">
    <Globe className="w-3 h-3 text-rose-700" />
    <span className="text-xs text-rose-800 font-medium">Data: {source}</span>
  </div>
);

// ─── MAIN APP ────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('roi');
  const [toastMsg, setToastMsg] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Header */}
      <header className="bg-white border-b-2 border-rose-700 sticky top-0 z-50 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="B.E.S.T Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-black tracking-tight text-slate-900">BUIMA <span className="text-rose-700">ENERGY</span></span>
              <span className="text-[10px] font-bold text-rose-600 tracking-[0.15em] uppercase">B.E.S.T Dashboard</span>
            </div>
            <span className="hidden sm:inline ml-2 px-2 py-0.5 rounded-full bg-rose-50 text-[10px] font-semibold text-rose-700 border border-rose-200 items-center gap-1 flex">
              <Globe className="w-3 h-3 mr-0.5" />No API Key Required
            </span>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'roi', label: 'ROI Calc' },
              { id: 'modeler', label: 'Compare ROI' },
              { id: 'lcos', label: 'LCOS' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-rose-700 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-rose-700'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
        {activeTab === 'roi'     && <ROICalculatorView setToast={setToastMsg} />}
        {activeTab === 'modeler' && <InteractiveChargingROI />}
        {activeTab === 'lcos'    && <LCOSComparison />}
      </main>
    </div>
  );
}

// ─── ROI CALCULATOR ───────────────────────────────────────────────────────
function ROICalculatorView({ setToast }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [dataSource, setDataSource] = useState(null);
  const [scenarios, setScenarios] = useState(loadScenarios);
  const [showScenarios, setShowScenarios] = useState(false);
  const [scenarioName, setScenarioName] = useState('');

  const DEFAULT_FORM = {
    location: '', gridPrice: 0.12, chargingFee: 0.45, avgChargeHours: 1,
    chargesPerDay: 5, otherRevenueDaily: 0, otherCostDaily: 0, currency: 'USD',
    bestQty: 1, bestCost: 8000, lifecycle: 8000, pcsKw: 6, pcsCost: 2000,
    evChargerCost: 1500, pvKw: 0, pvCost: 0, pvEfficiency: 85,
    standRequired: true, standCost: 1000, laborCost: 2000,
    sunHours: 3.5, chargerRatingKw: 11,
    jvEnabled: false,
    parties: [
      { id: 1, name: 'Partner A', capexShare: 100, profitShare: 100, monthlyCost: 0, active: true },
      { id: 2, name: 'Partner B', capexShare: 0,   profitShare: 0,   monthlyCost: 0, active: false },
      { id: 3, name: 'Partner C', capexShare: 0,   profitShare: 0,   monthlyCost: 0, active: false },
      { id: 4, name: 'Partner D', capexShare: 0,   profitShare: 0,   monthlyCost: 0, active: false },
      { id: 5, name: 'Partner E', capexShare: 0,   profitShare: 0,   monthlyCost: 0, active: false },
    ]
  };

  const [formData, setFormData] = useState(() => {
    const fromUrl = loadStateFromUrl();
    return fromUrl || DEFAULT_FORM;
  });

  // Scenario helpers
  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    const newScenario = { id: Date.now(), name: scenarioName.trim(), data: formData, savedAt: new Date().toLocaleDateString() };
    const updated = [...scenarios, newScenario];
    setScenarios(updated);
    saveScenarios(updated);
    setScenarioName('');
    setToast(`Scenario "${newScenario.name}" saved!`);
  };
  const loadScenario = (sc) => {
    setFormData(sc.data);
    setShowScenarios(false);
    setStep(1);
    setToast(`Loaded: ${sc.name}`);
  };
  const deleteScenario = (id) => {
    const updated = scenarios.filter(s => s.id !== id);
    setScenarios(updated);
    saveScenarios(updated);
  };
  const handleShare = () => {
    const url = getShareUrl(formData);
    copyToClipboard(url);
    setToast('Share link copied to clipboard!');
  };

  const hi = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const hp = (id, field, value) => setFormData(prev => ({
    ...prev,
    parties: prev.parties.map(p => p.id === id ? { ...p, [field]: value } : p)
  }));
  const toggleParty = (id) => setFormData(prev => ({
    ...prev,
    parties: prev.parties.map(p => p.id === id ? { ...p, active: !p.active } : p)
  }));

  const fetchLocation = async () => {
    if (!formData.location) return;
    setLoading(true); setDataFetched(false);
    try {
      const d = await fetchLocationData(formData.location);
      setFormData(prev => ({
        ...prev,
        gridPrice: d.gridPrice,
        chargingFee: d.chargingFee,
        currency: d.currency,
        sunHours: d.sunHours,
        laborCost: d.laborCost,
        chargesPerDay: d.dailySessions,
      }));
      setDataSource({
        grid: d.gridSource,
        ev: d.evSource,
        solar: d.solarSource,
        isGridVerified: d.isGridVerified,
        geoName: d.geoName,
      });
      setDataFetched(true);
      setToast(`Data loaded for ${d.geoName}`);
    } catch (e) {
      setToast('Could not fetch data — using defaults');
      setDataFetched(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const el = document.getElementById('printable-report');
    if (!el) return;
    const win = window.open('', '', 'width=900,height=800');
    if (!win) { alert('Pop-up blocked!'); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Investment Report</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>body{padding:40px;font-family:sans-serif}.print\\:hidden{display:none!important}</style>
      </head><body>${el.innerHTML}<script>setTimeout(()=>window.print(),800)</script></body></html>`);
    win.document.close();
  };

  // Step 1
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in print:hidden">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader title="Step 1: Location & Revenue Data" subtitle="Where will the B.E.S.T. system be installed?" icon={Building2} />
        <button onClick={() => setShowScenarios(v => !v)}
          className="flex items-center gap-2 px-4 py-2 border-2 border-rose-200 rounded-lg text-rose-700 font-medium text-sm hover:bg-rose-50 transition-colors flex-shrink-0">
          <FolderOpen className="w-4 h-4" /> Scenarios {scenarios.length > 0 && <span className="bg-rose-700 text-white text-[10px] px-1.5 py-0.5 rounded-full">{scenarios.length}</span>}
        </button>
      </div>

      {/* Scenarios Panel */}
      {showScenarios && (
        <Card className="p-5 border-2 border-rose-100 animate-fade-in">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-rose-700"/> Saved Scenarios</h3>
          {scenarios.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No saved scenarios yet. Fill in the form and save it.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {scenarios.map(sc => (
                <div key={sc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{sc.name}</p>
                    <p className="text-xs text-slate-400">{sc.savedAt} · {sc.data.location || 'No location'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadScenario(sc)} className="px-3 py-1 bg-rose-700 text-white text-xs font-bold rounded-lg hover:bg-rose-800">Load</button>
                    <button onClick={() => deleteScenario(sc.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <input value={scenarioName} onChange={e => setScenarioName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveScenario()}
              placeholder="Scenario name (e.g. Taipei Hotel 2025)…"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300" />
            <button onClick={saveScenario} disabled={!scenarioName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white text-sm font-bold rounded-lg">
              <Save className="w-4 h-4"/> Save Current
            </button>
          </div>
        </Card>
      )}

      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
        <Globe className="w-5 h-5 text-rose-700 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-rose-900">
          <span className="font-semibold">No API key needed.</span> Grid prices & EV charging rates are pulled from regional data tables. Solar hours come from <strong>Open-Meteo</strong> (free, real data).
        </div>
      </div>

      {/* Currency selector */}
      <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <DollarSign className="w-5 h-5 text-rose-700 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 mb-1">Report Currency</p>
          <select value={formData.currency} onChange={e => hi('currency', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 outline-none bg-white">
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div className="text-3xl font-black text-rose-700 w-12 text-center">{getCurrencySymbol(formData.currency)}</div>
      </div>

      <Card className="p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" value={formData.location}
              onChange={e => hi('location', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchLocation()}
              placeholder="e.g. Taipei, Tokyo, Dubai, San Francisco…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-700 focus:border-rose-700 outline-none"
            />
          </div>
          <button onClick={fetchLocation} disabled={loading || !formData.location}
            className={`px-5 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center gap-2 ${dataFetched ? 'bg-green-600' : 'bg-rose-700 hover:bg-rose-800'} disabled:bg-slate-300`}>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : dataFetched ? <CheckCircle2 className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            {loading ? 'Fetching…' : dataFetched ? 'Fetched!' : 'Auto-Fill'}
          </button>
        </div>
        {dataSource && (
          <div className="mt-4 space-y-2">
            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border ${dataSource.isGridVerified ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
              <span className="font-bold flex-shrink-0">{dataSource.isGridVerified ? '✅' : '⚠️'} Grid Price:</span>
              <span>{dataSource.grid}</span>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs border bg-amber-50 border-amber-100 text-amber-800">
              <span className="font-bold flex-shrink-0">⚠️ EV Fee / Labor:</span>
              <span>{dataSource.ev}</span>
            </div>
            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border ${dataSource.solar && dataSource.solar.includes('✅') ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
              <span className="font-bold flex-shrink-0">{dataSource.solar && dataSource.solar.includes('✅') ? '✅' : '⚠️'} Solar Hours:</span>
              <span>{dataSource.solar}</span>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputField label="Grid Electricity Cost" value={formData.gridPrice} onChange={e => hi('gridPrice', parseFloat(e.target.value))} type="number" suffix={`${formData.currency}/kWh`} note="Cost to charge battery from grid." />
        <InputField label="EV Charging Fee (Revenue)" value={formData.chargingFee} onChange={e => hi('chargingFee', parseFloat(e.target.value))} type="number" suffix={`${formData.currency}/kWh`} note="Price charged to EV driver." />
        <InputField label="Avg. Charge Time" value={formData.avgChargeHours} onChange={e => hi('avgChargeHours', parseFloat(e.target.value))} type="number" suffix="Hours" note="Destination charging average." />
        <InputField label="Sessions Per Day" value={formData.chargesPerDay} onChange={e => hi('chargesPerDay', parseFloat(e.target.value))} type="number" note="Projected daily utilization." />
        <InputField label="Other Daily Revenue" value={formData.otherRevenueDaily} onChange={e => hi('otherRevenueDaily', parseFloat(e.target.value))} type="number" suffix="Daily" note="e.g. ads, signage." />
        <InputField label="Other Daily Costs" value={formData.otherCostDaily} onChange={e => hi('otherCostDaily', parseFloat(e.target.value))} type="number" suffix="Daily" note="e.g. maintenance, insurance." />
      </div>

      <div className="flex justify-end">
        <button onClick={() => setStep(2)} className="bg-rose-700 hover:bg-rose-800 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">
          Next: Hardware Config <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Step 2
  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in print:hidden">
      <SectionHeader title="Step 2: System Configuration" subtitle="Configure the B.E.S.T. hardware and installation costs." icon={Settings} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-5 border-t-4 border-t-rose-600">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Battery className="w-5 h-5 text-rose-700" /> B.E.S.T. & PCS</h3>
          <InputField label="B.E.S.T. Quantity (Sets)" value={formData.bestQty} onChange={e => hi('bestQty', parseFloat(e.target.value))} type="number" note="1 Set = 4 Tiles (approx 16kWh)" />
          <InputField label="B.E.S.T. Lifecycle" value={formData.lifecycle} onChange={e => hi('lifecycle', parseFloat(e.target.value))} type="number" suffix="Cycles" note="Default: 8000 cycles @ 1C" />

          {/* Degradation Toggle */}
          <div className={`rounded-xl border-2 transition-colors mb-4 ${formData.degradationEnabled ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-800">Consider Battery Degradation</p>
                <p className="text-xs text-slate-500 mt-0.5">Revenue declines year-by-year as capacity fades</p>
              </div>
              <button onClick={() => hi('degradationEnabled', !formData.degradationEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${formData.degradationEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.degradationEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {formData.degradationEnabled && (
              <div className="px-4 pb-4 pt-1 border-t border-amber-200">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End-of-Life Capacity Retention
                  <span className="ml-2 text-xs text-amber-700 font-normal">Battery retains this % at end of cycle life</span>
                </label>
                <div className="flex items-center gap-3">
                  <input type="range" min="50" max="95" step="5" value={formData.eolRetention}
                    onChange={e => hi('eolRetention', parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="50" max="95" value={formData.eolRetention}
                      onChange={e => hi('eolRetention', parseFloat(e.target.value))}
                      className="w-16 border rounded-md px-2 py-1 text-sm text-center font-bold border-amber-300 focus:ring-amber-400" />
                    <span className="text-sm font-bold text-amber-700">%</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                  Avg usable capacity = ({formData.eolRetention}% + 100%) ÷ 2 = <strong>{((formData.eolRetention + 100) / 2).toFixed(1)}%</strong> of {formData.bestQty * 16} kWh = <strong>{(formData.bestQty * 16 * (formData.eolRetention + 100) / 200).toFixed(1)} kWh avg/cycle</strong>
                </div>
              </div>
            )}
          </div>

          <InputField label="Cost per Set" value={formData.bestCost} onChange={e => hi('bestCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="PCS Power" value={formData.pcsKw} onChange={e => hi('pcsKw', parseFloat(e.target.value))} type="number" suffix="kW" />
            <InputField label="PCS Cost" value={formData.pcsCost} onChange={e => hi('pcsCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} />
          </div>
        </Card>
        <Card className="p-5 border-t-4 border-t-rose-300">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Sun className="w-5 h-5 text-rose-600" /> PV & Installation</h3>
          {dataFetched && dataSource && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <Sun className="w-4 h-4 flex-shrink-0" />
              Solar hours: {dataSource.solar}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <InputField label="PV Capacity" value={formData.pvKw} onChange={e => hi('pvKw', parseFloat(e.target.value))} type="number" suffix="kW" />
            <InputField label="PV Cost" value={formData.pvCost} onChange={e => hi('pvCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="PV Efficiency (%)" value={formData.pvEfficiency} onChange={e => hi('pvEfficiency', parseFloat(e.target.value))} type="number" min="0" max="100" />
            <InputField label="Avg. Sun Hours" value={formData.sunHours} onChange={e => hi('sunHours', parseFloat(e.target.value))} type="number" suffix="h/day" note="Peak sun hours/day" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="EV Charger Cost" value={formData.evChargerCost} onChange={e => hi('evChargerCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} />
            <InputField label="Charger Max Power" value={formData.chargerRatingKw} onChange={e => hi('chargerRatingKw', parseFloat(e.target.value))} type="number" suffix="kW" />
          </div>
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
            <span className="text-sm font-medium text-slate-700">Mounting Stand Required?</span>
            <input type="checkbox" checked={formData.standRequired} onChange={e => hi('standRequired', e.target.checked)} className="w-5 h-5 text-rose-700 rounded focus:ring-rose-700" />
          </div>
          {formData.standRequired && <InputField label="Stand Cost" value={formData.standCost} onChange={e => hi('standCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} />}
          <InputField label="Installation Labor" value={formData.laborCost} onChange={e => hi('laborCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} note={`Estimate for ${formData.location || 'your region'}`} />
        </Card>
      </div>
      <div className="flex justify-between">
        <button onClick={() => setStep(1)} className="text-slate-500 font-medium px-6 py-3 hover:text-slate-800">← Back</button>
        <button onClick={() => setStep(3)} className="bg-rose-700 hover:bg-rose-800 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">Next: Partnership Structure <ArrowRight className="w-5 h-5" /></button>
      </div>
    </div>
  );

  // Step 3
  const renderStep3 = () => {
    const active = formData.parties.filter(p => p.active);
    const totalCap = active.reduce((s, p) => s + (parseFloat(p.capexShare) || 0), 0);
    const totalPro = active.reduce((s, p) => s + (parseFloat(p.profitShare) || 0), 0);
    const isValid = Math.abs(totalCap - 100) < 0.1 && Math.abs(totalPro - 100) < 0.1;

    return (
      <div className="space-y-6 animate-fade-in print:hidden">
        <SectionHeader title="Step 3: Partnership Structure" subtitle="Define up to 5 parties for Joint Venture modeling." icon={Users} />
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Enable Joint Venture / Partnership Mode</h3>
            <button onClick={() => hi('jvEnabled', !formData.jvEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.jvEnabled ? 'bg-rose-700' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.jvEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {formData.jvEnabled && (
            <div className="space-y-6">
              {formData.parties.map(party => (
                <div key={party.id} className={`p-4 rounded-xl border ${party.active ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" checked={party.active} onChange={() => toggleParty(party.id)} className="w-4 h-4 text-rose-700 rounded" />
                    <span className="font-bold text-sm text-slate-700">Party {party.id}</span>
                  </div>
                  {party.active && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <InputField label="Name" value={party.name} onChange={e => hp(party.id, 'name', e.target.value)} placeholder={`Partner ${String.fromCharCode(64 + party.id)}`} />
                      <InputField label="CapEx Share (%)" value={party.capexShare} onChange={e => hp(party.id, 'capexShare', e.target.value)} type="number" suffix="%" />
                      <InputField label="Profit Share (%)" value={party.profitShare} onChange={e => hp(party.id, 'profitShare', e.target.value)} type="number" suffix="%" />
                      <InputField label="Indiv. Cost ($/mo)" value={party.monthlyCost} onChange={e => hp(party.id, 'monthlyCost', e.target.value)} type="number" suffix="/mo" />
                    </div>
                  )}
                </div>
              ))}
              {!isValid && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  CapEx shares total {totalCap}% · Profit shares total {totalPro}% — both must equal 100%
                </div>
              )}
            </div>
          )}
        </Card>
        <div className="flex justify-between">
          <button onClick={() => setStep(2)} className="text-slate-500 font-medium px-6 py-3 hover:text-slate-800">← Back</button>
          <button onClick={() => setStep(4)} disabled={formData.jvEnabled && !isValid}
            className="bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">
            Generate Report <Calculator className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Step 4 — Report
  const renderStep4 = () => {
    const { currency } = formData;
    const currSymbol = getCurrencySymbol(currency);
    const outputKw = (formData.bestQty * 28) + formData.pcsKw;
    const effectivePower = Math.min(outputKw, formData.chargerRatingKw);
    // Base energy/session and revenue at 100% capacity (Year 1 start)
    const energyPerSession = formData.avgChargeHours * effectivePower;
    const dailyEnergySold  = formData.chargesPerDay * energyPerSession;

    const dailyEvRev    = dailyEnergySold * formData.chargingFee;
    const dailyOtherRev = formData.otherRevenueDaily || 0;
    const baseAnnualRevenue = (dailyEvRev + dailyOtherRev) * 365;

    const dailyPvGen    = formData.pvKw * formData.sunHours * (formData.pvEfficiency / 100);
    const dailyGridDraw = Math.max(0, dailyEnergySold - dailyPvGen);
    const dailyGridCost = dailyGridDraw * formData.gridPrice;
    const dailyOtherCost = formData.otherCostDaily || 0;
    const baseAnnualOpEx = (dailyGridCost + dailyOtherCost) * 365;

    // ── Degradation model ─────────────────────────────────────────────────
    // Capacity factor at the midpoint of year N (after any reset from replacement):
    //   factor = 1 - (cyclesUsedAtMidYear / lifecycle) × drop
    //   where drop = 1 - eolRetention/100
    // Revenue and grid OpEx both scale with capacity factor (less energy = less revenue AND less grid draw)
    // Other fixed costs (otherCostDaily) do NOT scale with degradation
    const degradationOn   = formData.degradationEnabled;
    const eolFraction     = formData.eolRetention / 100;   // e.g. 0.70
    const drop            = 1 - eolFraction;               // e.g. 0.30
    const totalCapKwh     = formData.bestQty * 16;
    const cyclesPerDay    = totalCapKwh > 0 ? (formData.chargesPerDay * Math.min(energyPerSession, totalCapKwh)) / totalCapKwh : 0;
    const cyclesPerYear   = cyclesPerDay * 365;
    const replacementInterval = Math.ceil((cyclesPerDay > 0 ? formData.lifecycle / cyclesPerDay : 999999) / 365);
    const replacementCost = (formData.bestQty * formData.bestCost) * 0.70;

    // Get capacity factor for a given year, accounting for prior replacements
    const getCapFactor = (yearN) => {
      if (!degradationOn) return 1;
      const yearsIntoCurrentBattery = ((yearN - 1) % replacementInterval) + 1;
      const cyclesMidYear = (yearsIntoCurrentBattery - 0.5) * cyclesPerYear;
      const rawFactor = 1 - (cyclesMidYear / formData.lifecycle) * drop;
      return Math.max(eolFraction, Math.min(1, rawFactor));
    };

    const cashFlows  = [-( (formData.bestQty * formData.bestCost) + formData.pcsCost + formData.evChargerCost + formData.pvCost + (formData.standRequired ? formData.standCost : 0) + formData.laborCost )];
    const totalCapex = -cashFlows[0];
    const tableData  = [];
    let cumulative   = -totalCapex;

    let potentialReplacementCost = 0;
    let potentialReplacementYears = [];

    for (let i = 1; i <= 10; i++) {
      const capFactor       = getCapFactor(i);
      // Revenue scales fully with capacity
      const yearRevenue     = baseAnnualRevenue * capFactor;
      // Grid OpEx scales with capacity (less energy delivered = less grid draw); fixed other costs unchanged
      const scaledGridOpEx  = (dailyGridCost * 365) * capFactor;
      const yearOpEx        = scaledGridOpEx + (dailyOtherCost * 365);
      const isReplacement   = (i % replacementInterval === 0);
      const hideReplacement = isReplacement && i >= 8;
      let salvage = 0;
      let flow = yearRevenue - yearOpEx;
      if (isReplacement && !hideReplacement) {
        flow -= replacementCost;
        if (i === 10) { salvage = replacementCost * 0.9; flow += salvage; }
      }
      if (hideReplacement) {
        potentialReplacementCost += replacementCost;
        potentialReplacementYears.push(i);
      }
      cashFlows.push(flow);
      cumulative += flow;
      tableData.push({ year: i, revenue: yearRevenue, expense: yearOpEx + (isReplacement && !hideReplacement ? replacementCost : 0),
        salvage, net: flow, cumulative, isReplacement: isReplacement && !hideReplacement, capFactor });
    }

    // For KPI cards use Year-1 values (full capacity) as the "headline" figure
    const annualRevenue = tableData[0].revenue;
    const annualOpEx    = tableData[0].expense - (tableData[0].isReplacement ? replacementCost : 0);
    const annualProfit  = annualRevenue - annualOpEx;
    const avgAnnualProfit = tableData.reduce((s, r) => s + r.net, 0) / 10;

    const irrValue    = calculateIRR(cashFlows);
    const roiYears    = avgAnnualProfit > 0 ? totalCapex / avgAnnualProfit : 0;
    const roiPercent  = (cumulative / totalCapex) * 100;
    const replacementsIn10y   = Math.floor(10 / replacementInterval);
    const totalReplacement10y = replacementCost * replacementsIn10y;

    return (
      <div id="printable-report" className="space-y-8 animate-fade-in">
        {/* Print header */}
        <div className="hidden print:block border-b-2 border-rose-700 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3"><img src="/logo.png" alt="logo" className="w-10 h-10 object-contain" /><div><h1 className="text-2xl font-black">BUIMA <span className="text-rose-700">ENERGY</span></h1><p className="text-sm text-slate-500 font-semibold tracking-wide">B.E.S.T Investment Analysis Report</p></div></div>
            <div className="text-right text-xs text-slate-400"><p>{new Date().toLocaleDateString()}</p><p>{formData.location}</p></div>
          </div>
        </div>

        <div className="print:hidden"><SectionHeader title="Investment Analysis Report" subtitle="Projected returns based on configured parameters." icon={TrendingUp} /></div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* CAPEX */}
          <div className="bg-slate-800 text-white rounded-xl shadow-sm border border-slate-700 overflow-hidden p-4">
            <p className="text-slate-400 text-xs mb-1 uppercase tracking-wide">Total CAPEX</p>
            <p className="text-2xl font-bold text-white mb-3">{currSymbol} {totalCapex.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <div className="border-t border-slate-600 pt-3 space-y-1 text-xs font-mono">
              <p className="text-slate-400 font-sans font-semibold mb-2 not-italic">Breakdown:</p>
              <p className="flex justify-between text-slate-300"><span>B.E.S.T × {formData.bestQty}</span><span>{(formData.bestQty * formData.bestCost).toLocaleString()}</span></p>
              <p className="flex justify-between text-slate-300"><span>PCS</span><span>{formData.pcsCost.toLocaleString()}</span></p>
              {formData.evChargerCost > 0 && <p className="flex justify-between text-slate-300"><span>EV Charger</span><span>{formData.evChargerCost.toLocaleString()}</span></p>}
              {formData.pvCost > 0 && <p className="flex justify-between text-slate-300"><span>PV System</span><span>{formData.pvCost.toLocaleString()}</span></p>}
              {formData.standRequired && <p className="flex justify-between text-slate-300"><span>Stand</span><span>{formData.standCost.toLocaleString()}</span></p>}
              <p className="flex justify-between text-slate-300"><span>Labor</span><span>{formData.laborCost.toLocaleString()}</span></p>
              <p className="flex justify-between text-white font-bold border-t border-slate-600 pt-1 mt-1"><span>= Total</span><span>{totalCapex.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
            </div>
          </div>

          {/* Annual Net Profit */}
          <Card className="p-4">
            <p className="text-slate-500 text-xs mb-1 uppercase tracking-wide">Annual Net Profit</p>
            <p className="text-2xl font-bold text-rose-700 mb-3">{currSymbol} {annualProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <div className="border-t border-slate-100 pt-3 space-y-1 text-xs font-mono">
              <p className="text-slate-500 font-sans font-semibold mb-2">Formula:</p>
              <p className="flex justify-between text-slate-600"><span>Sessions/day</span><span>{formData.chargesPerDay}</span></p>
              <p className="flex justify-between text-slate-600"><span>× hrs/session</span><span>{formData.avgChargeHours}</span></p>
              <p className="flex justify-between text-slate-600"><span>× power (kW)</span><span>{effectivePower.toFixed(1)}</span></p>
              <p className="flex justify-between text-slate-600"><span>× fee/kWh</span><span>{formData.chargingFee}</span></p>
              <p className="flex justify-between text-slate-600"><span>× 365 days</span><span>= {currency} {Math.round(annualRevenue).toLocaleString()}</span></p>
              <p className="flex justify-between text-red-500"><span>− Annual OpEx</span><span>{Math.round(annualOpEx).toLocaleString()}</span></p>
              <p className="flex justify-between text-rose-800 font-bold border-t border-slate-100 pt-1 mt-1"><span>= Net/yr</span><span>{Math.round(annualProfit).toLocaleString()}</span></p>
            </div>
          </Card>

          {/* IRR */}
          <Card className="p-4">
            <p className="text-slate-500 text-xs mb-1 uppercase tracking-wide">Project IRR (10y)</p>
            <p className={`text-2xl font-bold mb-3 ${irrValue > 0 ? 'text-indigo-600' : 'text-red-500'}`}>{irrValue ? `${irrValue.toFixed(1)}%` : 'N/A'}</p>
            <div className="border-t border-slate-100 pt-3 space-y-1 text-xs font-mono">
              <p className="text-slate-500 font-sans font-semibold mb-2">Cash flow inputs:</p>
              <p className="flex justify-between text-slate-600"><span>Year 0 (invest)</span><span className="text-red-500">−{Math.round(totalCapex).toLocaleString()}</span></p>
              <p className="flex justify-between text-slate-600"><span>Yr 1–10 (annual)</span><span className="text-rose-700">+{Math.round(annualProfit).toLocaleString()}</span></p>
              {replacementInterval <= 10 && (
                <p className="flex justify-between text-slate-600"><span>Yr {replacementInterval} repl.</span><span className="text-amber-600">−{Math.round(replacementCost).toLocaleString()}</span></p>
              )}
              <p className="flex justify-between text-slate-500 border-t border-slate-100 pt-1 mt-1"><span>Battery life</span><span>{formData.lifecycle.toLocaleString()} cyc</span></p>
              <p className="flex justify-between text-indigo-700 font-bold"><span>= IRR</span><span>{irrValue ? `${irrValue.toFixed(2)}%` : 'N/A'}</span></p>
            </div>
          </Card>

          {/* Payback */}
          <Card className="p-4">
            <p className="text-slate-500 text-xs mb-1 uppercase tracking-wide">ROI / Payback</p>
            <p className="text-2xl font-bold text-slate-700 mb-1">{roiYears > 0 ? roiYears.toFixed(1) : 'N/A'} <span className="text-sm font-normal text-slate-500">yrs</span></p>
            <p className="text-sm font-bold text-slate-500 mb-3">10y Yield: <span className={roiPercent >= 0 ? 'text-rose-700' : 'text-red-500'}>{roiPercent.toFixed(1)}%</span></p>
            <div className="border-t border-slate-100 pt-3 space-y-1 text-xs font-mono">
              <p className="text-slate-500 font-sans font-semibold mb-2">Formula:</p>
              <p className="flex justify-between text-slate-600"><span>CAPEX</span><span>{Math.round(totalCapex).toLocaleString()}</span></p>
              <p className="flex justify-between text-slate-600"><span>÷ Net/yr</span><span>{Math.round(annualProfit).toLocaleString()}</span></p>
              <p className="flex justify-between text-slate-700 font-bold border-t border-slate-100 pt-1 mt-1"><span>= Payback</span><span>{roiYears > 0 ? `${roiYears.toFixed(1)} yrs` : 'N/A'}</span></p>
              <p className="flex justify-between text-slate-600 mt-1"><span>10y Cumul.</span><span>{Math.round(cumulative).toLocaleString()}</span></p>
              <p className="flex justify-between text-slate-600"><span>÷ CAPEX</span><span>{Math.round(totalCapex).toLocaleString()}</span></p>
              <p className="flex justify-between text-rose-800 font-bold border-t border-slate-100 pt-1"><span>= 10y Yield</span><span>{roiPercent.toFixed(1)}%</span></p>
            </div>
          </Card>

        </div>

        {/* JV Table */}
        {formData.jvEnabled && (
          <div>
            <div className="mb-4 flex items-center gap-2 text-rose-800"><Users className="w-5 h-5 text-rose-700" /><h3 className="text-lg font-bold">Partnership Analysis</h3></div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-rose-50 text-rose-900 font-bold">
                  <tr>
                    <th className="px-4 py-3">Party</th>
                    <th className="px-4 py-3">Equity</th>
                    <th className="px-4 py-3">Investment</th>
                    <th className="px-4 py-3">Profit Share</th>
                    <th className="px-4 py-3">Monthly Net</th>
                    <th className="px-4 py-3">10y ROI</th>
                    <th className="px-4 py-3">Payback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {formData.parties.filter(p => p.active).map(party => {
                    const invest = totalCapex * (party.capexShare / 100);
                    const grossMonthly = (annualProfit / 12) * (party.profitShare / 100);
                    const netMonthly = grossMonthly - party.monthlyCost;
                    const annualNet = netMonthly * 12;
                    const payback = invest > 0 ? (annualNet > 0 ? invest / annualNet : 999) : 0;
                    const replShare = totalReplacement10y * (party.capexShare / 100);
                    const income10y = (annualNet * 10) - replShare;
                    const roi = invest > 0 ? ((income10y - invest) / invest) * 100 : 999;
                    return (
                      <tr key={party.id}>
                        <td className="px-4 py-3 font-medium">{party.name}</td>
                        <td className="px-4 py-3 text-slate-500">{party.capexShare}%</td>
                        <td className="px-4 py-3 font-bold">{currency} {Math.round(invest).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500">{party.profitShare}%</td>
                        <td className={`px-4 py-3 font-bold ${netMonthly >= 0 ? 'text-rose-700' : 'text-red-500'}`}>{currency} {Math.round(netMonthly).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold">{invest === 0 ? 'Immediate' : `${roi.toFixed(1)}%`}</td>
                        <td className="px-4 py-3">{invest === 0 ? 'Immediate' : payback > 50 ? '> 50 yrs' : `${payback.toFixed(1)} yrs`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cash Flow Table + Calc Basis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">10-Year Project Cash Flow</h3>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Year</th>
                      {formData.degradationEnabled && <th className="px-4 py-3 text-amber-600">Batt. Cap.</th>}
                      <th className="px-4 py-3">Revenue</th>
                      <th className="px-4 py-3">OpEx</th>
                      <th className="px-4 py-3">Net Flow</th>
                      <th className="px-4 py-3">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.map(row => (
                      <tr key={row.year} className={row.isReplacement ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 font-medium">Year {row.year}</td>
                        {formData.degradationEnabled && (
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.capFactor >= 0.90 ? 'bg-green-100 text-green-700' : row.capFactor >= 0.80 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {(row.capFactor * 100).toFixed(1)}%
                            </span>
                            {row.isReplacement && <div className="text-[10px] text-blue-600 mt-0.5">↺ reset</div>}
                          </td>
                        )}
                        <td className="px-4 py-3 text-rose-700">+{Math.round(row.revenue).toLocaleString()}</td>
                        <td className="px-4 py-3 text-red-500">
                          -{Math.round(row.expense).toLocaleString()}
                          {row.isReplacement && <div className="text-xs text-red-700 mt-0.5">(incl. battery replacement)</div>}
                          {row.salvage > 0 && <div className="text-xs text-green-600">+{Math.round(row.salvage).toLocaleString()} salvage</div>}
                        </td>
                        <td className="px-4 py-3 font-bold">{Math.round(row.net).toLocaleString()}</td>
                        <td className={`px-4 py-3 ${row.cumulative > 0 ? 'text-green-600' : 'text-slate-500'}`}>{Math.round(row.cumulative).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            {potentialReplacementCost > 0 && (
              <p className="text-xs text-slate-500 mt-2 px-2 italic">
                Potential Battery Replacement Cost (Year {potentialReplacementYears.join(', ')}): {currSymbol} {Math.round(potentialReplacementCost).toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-0 overflow-hidden">
              <div className="bg-rose-50 px-5 py-3 border-b border-rose-100 flex items-center gap-2">
                <List className="w-4 h-4 text-rose-700" />
                <h3 className="font-bold text-rose-900 text-sm uppercase">Calculation Basis</h3>
              </div>
              <div className="p-5 space-y-4 text-sm text-slate-600">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-2">Revenue</p>
                  <p className="flex justify-between"><span>Fee:</span><span>{currency} {formData.chargingFee} / kWh</span></p>
                  <p className="flex justify-between"><span>Sessions:</span><span>{formData.chargesPerDay}/day</span></p>
                  <p className="flex justify-between font-medium text-rose-800 mt-1"><span>Annual:</span><span>{currency} {Math.round(annualRevenue).toLocaleString()}</span></p>
                </div>
                <div className="space-y-1 pt-2">
                  <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-2">OpEx</p>
                  <p className="flex justify-between"><span>Grid:</span><span>{currency} {formData.gridPrice} / kWh</span></p>
                  <p className="flex justify-between"><span>PV Gen:</span><span>{dailyPvGen.toFixed(1)} kWh/day</span></p>
                  <p className="flex justify-between font-medium text-red-700 mt-1"><span>Annual:</span><span>{currency} {Math.round(annualOpEx).toLocaleString()}</span></p>
                </div>
                <div className="space-y-1 pt-2">
                  <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-2">CAPEX</p>
                  <p className="flex justify-between"><span>B.E.S.T ({formData.bestQty}x):</span><span>{(formData.bestQty * formData.bestCost).toLocaleString()}</span></p>
                  <p className="flex justify-between"><span>PCS:</span><span>{formData.pcsCost.toLocaleString()}</span></p>
                  {formData.pvCost > 0 && <p className="flex justify-between"><span>PV:</span><span>{formData.pvCost.toLocaleString()}</span></p>}
                  {formData.evChargerCost > 0 && <p className="flex justify-between"><span>Charger:</span><span>{formData.evChargerCost.toLocaleString()}</span></p>}
                  {formData.standRequired && <p className="flex justify-between"><span>Stand:</span><span>{formData.standCost.toLocaleString()}</span></p>}
                  <p className="flex justify-between"><span>Labor:</span><span>{formData.laborCost.toLocaleString()}</span></p>
                  <p className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total:</span><span>{totalCapex.toLocaleString()}</span></p>
                </div>
              </div>
            </Card>

            <div className="space-y-2 print:hidden">
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 text-sm">New Calc</button>
                <button onClick={handlePrint} className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 flex items-center justify-center gap-2 text-sm">
                  <Printer className="w-4 h-4" /> PDF / Print
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={handleShare} className="flex-1 py-2.5 border-2 border-rose-200 text-rose-700 rounded-lg font-medium hover:bg-rose-50 flex items-center justify-center gap-2 text-sm">
                  <Link className="w-4 h-4" /> Copy Share Link
                </button>
                <button onClick={() => { setShowScenarios(true); setStep(1); }}
                  className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 flex items-center justify-center gap-2 text-sm">
                  <Save className="w-4 h-4" /> Save Scenario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8 print:hidden">
        <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
          {['Location', 'Config', 'Partners', 'Report'].map((label, i) => (
            <span key={label} className={step >= i + 1 ? 'text-rose-700 font-bold' : ''}>{i + 1}. {label}</span>
          ))}
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-rose-700 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
}

// ─── COMPARE ROI MODELER ──────────────────────────────────────────────────
function InteractiveChargingROI() {
  const [scen, setScen] = useState({
    carsPerDayPerCharger: 8, dwellTimeMin: 45,
    acRate: 0.45, dcRate: 0.60, offPeakGridRate: 0.15, mixedGridRate: 0.25, demandChargePerKw: 20,
    acCount: 3, acHardware: 1500, acInstall: 2000, acFixed: 0, acReplace: 0,
    bestCount: 1, bestHardware: 40000, bestInstall: 5000, bestFixed: 0, bestReplace: 22000,
    superCount: 1, superHardware: 45000, superInstall: 10000, superFixed: 90000, superReplace: 0
  });

  const hi = (field, value) => setScen(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));

  const dwellH = scen.dwellTimeMin / 60;
  // Energy per session: charger power × dwell hours, capped at 75 kWh (typical EV battery limit)
  // Super uses full 180 kW rated power — battery cap naturally limits it (e.g. 60 min = min(180,75) = 75 kWh)
  const energyPerSession = {
    ac:    Math.min(7   * dwellH, 75),
    best:  Math.min(28  * dwellH, 75),
    super: Math.min(60  * dwellH, 75),  // capped at 60 kW — standard EV onboard charger limit
  };

  const capex = {
    ac:    (scen.acCount    * scen.acHardware)    + (scen.acCount    * scen.acInstall)    + scen.acFixed,
    best:  (scen.bestCount  * scen.bestHardware)  + (scen.bestCount  * scen.bestInstall)  + scen.bestFixed,
    super: (scen.superCount * scen.superHardware) + (scen.superCount * scen.superInstall) + scen.superFixed,
  };
  const replace10y = {
    ac:    scen.acCount    * scen.acReplace,
    best:  scen.bestCount  * scen.bestReplace,
    super: scen.superCount * scen.superReplace,
  };
  // Annual revenue = chargers × cars/day × kWh/session × rate/kWh × 365
  const rev = {
    ac:    scen.acCount    * scen.carsPerDayPerCharger * energyPerSession.ac    * scen.acRate  * 365,
    best:  scen.bestCount  * scen.carsPerDayPerCharger * energyPerSession.best  * scen.dcRate  * 365,
    super: scen.superCount * scen.carsPerDayPerCharger * energyPerSession.super * scen.dcRate  * 365,
  };
  const demandChargeAnnual = scen.superCount > 0 ? scen.superCount * 180 * scen.demandChargePerKw * 12 : 0;
  const opex = {
    ac:    scen.acCount    * scen.carsPerDayPerCharger * energyPerSession.ac    * scen.mixedGridRate   * 365,
    best:  scen.bestCount  * scen.carsPerDayPerCharger * energyPerSession.best  * scen.offPeakGridRate  * 365,
    super: (scen.superCount * scen.carsPerDayPerCharger * energyPerSession.super * scen.mixedGridRate * 365) + demandChargeAnnual,
  };
  const net10y = {
    ac:    ((rev.ac    - opex.ac)    * 10) - capex.ac    - replace10y.ac,
    best:  ((rev.best  - opex.best)  * 10) - capex.best  - replace10y.best,
    super: ((rev.super - opex.super) * 10) - capex.super - replace10y.super,
  };
  // Daily helpers for calc remarks
  const dailyRev  = {
    ac:    scen.acCount * scen.carsPerDayPerCharger * energyPerSession.ac * scen.acRate,
    best:  scen.bestCount * scen.carsPerDayPerCharger * energyPerSession.best * scen.dcRate,
    super: scen.superCount * scen.carsPerDayPerCharger * energyPerSession.super * scen.dcRate,
  };
  const dailyOpex = {
    ac:    scen.acCount * scen.carsPerDayPerCharger * energyPerSession.ac * scen.mixedGridRate,
    best:  scen.bestCount * scen.carsPerDayPerCharger * energyPerSession.best * scen.offPeakGridRate,
    super: (scen.superCount * scen.carsPerDayPerCharger * energyPerSession.super * scen.mixedGridRate) + demandChargeAnnual / 365,
  };
  const fmtS = (v) => v >= 1000 ? `$${Math.round(v).toLocaleString()}` : `$${v.toFixed(2)}`;

  const maxVal = Math.max(net10y.ac, net10y.best, net10y.super, 100000);
  const minVal = Math.min(net10y.ac, net10y.best, net10y.super, 0);
  const range  = (maxVal - minVal) || 1;
  const zeroLinePct = maxVal > 0 && minVal < 0 ? (maxVal / range) * 100 : (minVal >= 0 ? 100 : 0);
  const barH   = (val) => `${(Math.abs(val) / range) * 100}%`;
  const fmt    = (v) => `$${Math.round(v).toLocaleString()}`;

  const BarItem = ({ value, color, label }) => (
    <div className="flex flex-col items-center z-10 w-20">
      {value >= 0 ? (
        <div className={`w-16 ${color} rounded-t-md transition-all duration-300 flex items-start justify-center pt-2 text-white text-[10px] font-bold`}
          style={{ height: barH(value), marginBottom: minVal < 0 ? `${(Math.abs(minVal) / range) * 100}%` : '0' }}>
          {fmt(value)}
        </div>
      ) : (
        <div className="w-16 bg-red-500 rounded-b-md transition-all duration-300 flex items-end justify-center pb-2 text-white text-[10px] font-bold"
          style={{ height: barH(value), marginTop: `${zeroLinePct}%` }}>
          {fmt(value)}
        </div>
      )}
      <span className={`text-xs font-bold mt-2 text-center ${value >= 0 ? 'text-slate-700' : 'text-red-500'}`}>{label}</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 animate-fade-in">
      <div className="mb-6 border-b border-slate-200 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <TrendingUp className="text-rose-700 w-6 h-6" /> 10-Year Interactive ROI Modeler
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Adjust sliders and CapEx inputs to stress-test profitability across all three charging architectures.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-2">
            <Sliders className="w-4 h-4 text-rose-700" /> Usage & Rates
          </h3>

          {[
            { label: 'Daily Cars (Per Charger)', field: 'carsPerDayPerCharger', min: 1, max: 30, step: 1 },
            { label: 'Avg Dwell Time (Mins)', field: 'dwellTimeMin', min: 15, max: 120, step: 5 },
          ].map(s => (
            <div key={s.field}>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>{s.label}</span>
                <span className="text-rose-700 font-bold">{scen[s.field]}</span>
              </label>
              <input type="range" min={s.min} max={s.max} step={s.step} value={scen[s.field]}
                onChange={e => hi(s.field, e.target.value)} className="w-full accent-rose-700" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            {[
              { label: 'AC Rate ($/kWh)',    field: 'acRate' },
              { label: 'DC Rate ($/kWh)',    field: 'dcRate' },
              { label: 'Off-Peak Grid ($)',  field: 'offPeakGridRate' },
              { label: 'Mixed Grid ($)',     field: 'mixedGridRate' },
            ].map(f => (
              <div key={f.field}>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">{f.label}</label>
                <input type="number" step="0.01" value={scen[f.field]}
                  onChange={e => hi(f.field, e.target.value)}
                  className="w-full p-1.5 border rounded text-sm focus:ring-2 focus:ring-rose-700" />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Demand Charge ($/kW/mo)</label>
            <input type="number" value={scen.demandChargePerKw} onChange={e => hi('demandChargePerKw', e.target.value)}
              className="w-full p-1.5 border rounded text-sm focus:ring-2 focus:ring-rose-700" />
          </div>
        </div>

        {/* Right side */}
        <div className="lg:col-span-3 space-y-6">
          {/* CapEx editor */}
          <div className="overflow-x-auto border border-indigo-100 rounded-xl shadow-sm">
            <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-700" />
              <h3 className="font-bold text-rose-900 text-sm">System Configuration & CapEx</h3>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 font-medium">Architecture</th>
                  <th className="px-4 py-2 font-medium w-20">Qty</th>
                  <th className="px-4 py-2 font-medium">HW ($/unit)</th>
                  <th className="px-4 py-2 font-medium">Install ($/unit)</th>
                  <th className="px-4 py-2 font-medium">Fixed/Grid ($)</th>
                  <th className="px-4 py-2 font-medium text-amber-600">10y Repl ($/unit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: 'AC (7kW)',       color: 'text-slate-700',  bg: '',                  prefix: 'ac',    borderColor: 'border' },
                  { label: 'B.E.S.T (28kW)', color: 'text-rose-800', bg: 'bg-rose-50/30', prefix: 'best',  borderColor: 'border-rose-200' },
                  { label: 'Super (180kW)',  color: 'text-indigo-700',  bg: 'bg-indigo-50/30',  prefix: 'super', borderColor: 'border-indigo-200' },
                ].map(row => (
                  <tr key={row.prefix} className={`hover:brightness-95 ${row.bg}`}>
                    <td className={`px-4 py-2 font-bold ${row.color}`}>{row.label}</td>
                    {['Count', 'Hardware', 'Install', 'Fixed', 'Replace'].map(field => {
                      const key = row.prefix + field;
                      return (
                        <td key={key} className="px-4 py-2">
                          <input type="number" value={scen[key]} onChange={e => hi(key, e.target.value)}
                            className={`w-full p-1.5 border ${row.borderColor} rounded text-sm focus:ring-2 focus:ring-rose-700`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 h-72 flex items-end justify-center gap-8 relative">
              {minVal < 0 && (
                <div className="absolute w-full border-t-2 border-dashed border-slate-300 left-0 flex items-center"
                  style={{ bottom: `${100 - zeroLinePct}%` }}>
                  <span className="text-[10px] text-slate-400 bg-slate-50 px-2 ml-2 -mt-2">$0 breakeven</span>
                </div>
              )}
              <BarItem value={net10y.ac}    color="bg-slate-400" label={`AC (${scen.acCount})`} />
              <BarItem value={net10y.best}  color="bg-rose-700 shadow-lg ring-2 ring-rose-200" label={`B.E.S.T (${scen.bestCount})`} />
              <BarItem value={net10y.super} color="bg-indigo-500" label={`Super (${scen.superCount})`} />
            </div>

            {/* Results table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-xs w-36">Metric</th>
                    <th className="px-3 py-2 text-xs text-center">AC ({scen.acCount}x)</th>
                    <th className="px-3 py-2 text-xs text-center font-bold text-rose-700 bg-rose-50">B.E.S.T ({scen.bestCount}x)</th>
                    <th className="px-3 py-2 text-xs text-center">Super ({scen.superCount}x)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">

                  {/* CAPEX */}
                  <tr>
                    <td className="px-3 py-2 font-semibold text-slate-700">Setup CapEx</td>
                    {[capex.ac, capex.best, capex.super].map((v, j) => (
                      <td key={j} className={`px-3 py-2 font-mono text-right ${j===1?'bg-rose-50/40':''}`}>
                        <div className="text-red-500 font-bold">-{fmt(v)}</div>
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-3 pb-2 text-slate-400 italic text-[10px] pl-4">HW + Install + Fixed</td>
                    {[
                      `${scen.acCount}×(${scen.acHardware.toLocaleString()}+${scen.acInstall.toLocaleString()})+${scen.acFixed.toLocaleString()}`,
                      `${scen.bestCount}×(${scen.bestHardware.toLocaleString()}+${scen.bestInstall.toLocaleString()})+${scen.bestFixed.toLocaleString()}`,
                      `${scen.superCount}×(${scen.superHardware.toLocaleString()}+${scen.superInstall.toLocaleString()})+${scen.superFixed.toLocaleString()}`,
                    ].map((r, j) => (
                      <td key={j} className={`px-3 pb-2 font-mono text-right text-slate-400 text-[10px] ${j===1?'bg-rose-50/40':''}`}>{r}</td>
                    ))}
                  </tr>

                  {/* Replacements */}
                  <tr>
                    <td className="px-3 py-2 font-semibold text-slate-700">10y Replacements</td>
                    {[replace10y.ac, replace10y.best, replace10y.super].map((v, j) => (
                      <td key={j} className={`px-3 py-2 font-mono text-right ${j===1?'bg-rose-50/40':''}`}>
                        <div className="text-amber-600 font-bold">-{fmt(v)}</div>
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-3 pb-2 text-slate-400 italic text-[10px] pl-4">Qty × repl cost/unit</td>
                    {[
                      `${scen.acCount}×${scen.acReplace.toLocaleString()}`,
                      `${scen.bestCount}×${scen.bestReplace.toLocaleString()}`,
                      `${scen.superCount}×${scen.superReplace.toLocaleString()}`,
                    ].map((r, j) => (
                      <td key={j} className={`px-3 pb-2 font-mono text-right text-slate-400 text-[10px] ${j===1?'bg-rose-50/40':''}`}>{r}</td>
                    ))}
                  </tr>

                  {/* Gross Revenue */}
                  <tr>
                    <td className="px-3 py-2 font-semibold text-slate-700">Gross Revenue <span className="font-normal text-slate-400">(10y)</span></td>
                    {[rev.ac * 10, rev.best * 10, rev.super * 10].map((v, j) => (
                      <td key={j} className={`px-3 py-2 font-mono text-right ${j===1?'bg-rose-50/40':''}`}>
                        <div className="text-rose-800 font-bold">{fmt(v)}</div>
                        <div className="text-slate-400 text-[10px]">{fmtS([dailyRev.ac,dailyRev.best,dailyRev.super][j])}/day · {fmt([rev.ac,rev.best,rev.super][j])}/yr</div>
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-3 pb-2 text-slate-400 italic text-[10px] pl-4">Qty × cars/day × kWh × rate × 365</td>
                    {[
                      { cnt: scen.acCount,    rate: scen.acRate,  kwh: energyPerSession.ac },
                      { cnt: scen.bestCount,  rate: scen.dcRate,  kwh: energyPerSession.best },
                      { cnt: scen.superCount, rate: scen.dcRate,  kwh: energyPerSession.super },
                    ].map((r, j) => (
                      <td key={j} className={`px-3 pb-2 font-mono text-right text-slate-400 text-[10px] ${j===1?'bg-rose-50/40':''}`}>
                        {r.cnt}×{scen.carsPerDayPerCharger}×{r.kwh.toFixed(1)}kWh×${r.rate}×365
                      </td>
                    ))}
                  </tr>

                  {/* OpEx */}
                  <tr>
                    <td className="px-3 py-2 font-semibold text-slate-700">Grid/Demand OpEx <span className="font-normal text-slate-400">(10y)</span></td>
                    {[opex.ac * 10, opex.best * 10, opex.super * 10].map((v, j) => (
                      <td key={j} className={`px-3 py-2 font-mono text-right ${j===1?'bg-rose-50/40':''}`}>
                        <div className="text-red-500 font-bold">-{fmt(v)}</div>
                        <div className="text-slate-400 text-[10px]">{fmtS([dailyOpex.ac,dailyOpex.best,dailyOpex.super][j])}/day · {fmt([opex.ac,opex.best,opex.super][j])}/yr</div>
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-3 pb-2 text-slate-400 italic text-[10px] pl-4">Energy×grid rate (B.E.S.T=off-peak; Super+demand)</td>
                    {[
                      { rate: scen.mixedGridRate,    kwh: energyPerSession.ac,    extra: '' },
                      { rate: scen.offPeakGridRate,  kwh: energyPerSession.best,  extra: '' },
                      { rate: scen.mixedGridRate,    kwh: energyPerSession.super,  extra: `+$${Math.round(demandChargeAnnual).toLocaleString()}/yr demand` },
                    ].map((r, j) => (
                      <td key={j} className={`px-3 pb-2 font-mono text-right text-slate-400 text-[10px] ${j===1?'bg-rose-50/40':''}`}>
                        {r.kwh.toFixed(1)}kWh×${r.rate}{r.extra && <span className="block">{r.extra}</span>}
                      </td>
                    ))}
                  </tr>

                  {/* Net */}
                  <tr className="bg-slate-100 border-t-2 border-slate-300">
                    <td className="px-3 py-3 font-bold text-slate-800">Net 10-Year</td>
                    <td className={`px-3 py-3 font-mono font-bold text-right ${net10y.ac >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                      <div className="text-sm">{fmt(net10y.ac)}</div>
                      <div className="text-[10px] font-normal text-slate-400">(Rev−OpEx)×10 − CapEx − Repl</div>
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-right text-rose-800 bg-rose-100/50 border-x border-rose-200">
                      <div className="text-sm">{fmt(net10y.best)}</div>
                      <div className="text-[10px] font-normal text-rose-600">(Rev−OpEx)×10 − CapEx − Repl</div>
                    </td>
                    <td className={`px-3 py-3 font-mono font-bold text-right ${net10y.super >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                      <div className="text-sm">{fmt(net10y.super)}</div>
                      <div className="text-[10px] font-normal text-slate-400">(Rev−OpEx)×10 − CapEx − Repl</div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LCOS COMPARISON ─────────────────────────────────────────────────────────
function LCOSComparison() {
  const emptySystem = (id) => ({
    id, name: `System ${id}`,
    capacityKwh: 16,
    eolRetention: 70,
    lifecycleCycles: 8000,
    totalCost: 500000,
    active: id <= 2,
  });

  const [systems, setSystems] = useState([
    { ...emptySystem(1), name: '', lifecycleCycles: 8000,  eolRetention: 70, capacityKwh: 16, totalCost: 500000 },
    { ...emptySystem(2), name: '', lifecycleCycles: 10000, eolRetention: 70, capacityKwh: 16, totalCost: 500000 },
    { ...emptySystem(3), name: '', lifecycleCycles: 6000,  eolRetention: 80, capacityKwh: 20, totalCost: 450000, active: false },
    { ...emptySystem(4), name: '', lifecycleCycles: 5000,  eolRetention: 75, capacityKwh: 24, totalCost: 380000, active: false },
  ]);

  const handleLcosPrint = () => {
    const el = document.getElementById('lcos-printable');
    if (!el) return;
    const win = window.open('', '', 'width=1000,height=800');
    if (!win) { alert('Pop-up blocked — please allow pop-ups.'); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>LCOS Comparison Report</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>body{padding:40px;font-family:sans-serif;color:#1e293b}@media print{.no-print{display:none}}</style>
      </head><body>
      <div style="border-bottom:3px solid #be123c;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
        <div><h1 style="font-size:22px;font-weight:900;margin:0">BUIMA <span style="color:#be123c">ENERGY</span></h1>
        <p style="margin:4px 0 0;color:#64748b;font-size:13px">Battery LCOS Comparison Report — ${new Date().toLocaleDateString()}</p></div>
      </div>
      ${el.innerHTML}
      <script>setTimeout(()=>window.print(),800)</script></body></html>`);
    win.document.close();
  };

  const updateSystem = (id, field, value) =>
    setSystems(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const toggleSystem = (id) =>
    setSystems(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

  // LCOS formula:
  //   avgCapacity = capacity × (1 + eolRetention/100) / 2
  //   lifetimeKwh = avgCapacity × cycles
  //   costPerKwh  = totalCost / lifetimeKwh
  const calcLCOS = (s) => {
    const avgCap     = s.capacityKwh * (1 + s.eolRetention / 100) / 2;
    const lifetimeKwh = avgCap * s.lifecycleCycles;
    const costPerKwh  = lifetimeKwh > 0 ? s.totalCost / lifetimeKwh : 0;
    return { avgCap, lifetimeKwh, costPerKwh };
  };

  const active = systems.filter(s => s.active);
  const results = active.map(s => ({ ...s, ...calcLCOS(s) }));
  const bestCpkwh = results.length > 0 ? Math.min(...results.map(r => r.costPerKwh)) : 0;

  const COLORS = ['bg-rose-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-500'];
  const TEXT   = ['text-rose-700', 'text-indigo-700', 'text-emerald-700', 'text-amber-600'];
  const BORDER = ['border-rose-300', 'border-indigo-300', 'border-emerald-300', 'border-amber-300'];
  const BG     = ['bg-rose-50', 'bg-indigo-50', 'bg-emerald-50', 'bg-amber-50'];

  const maxCost = results.length > 0 ? Math.max(...results.map(r => r.costPerKwh)) : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Battery className="w-7 h-7 text-rose-700" /> Battery LCOS Comparison
          </h1>
          <p className="text-slate-500 text-sm">
            Levelized Cost of Storage — how much does each kWh delivered over the battery's lifetime actually cost?
            Formula: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">Cost ÷ (Capacity × avg_retention × Cycles)</span>
          </p>
        </div>
        <button onClick={handleLcosPrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-lg flex-shrink-0">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>
      <div id="lcos-printable">

      {/* System Config Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {systems.map((s, idx) => (
          <div key={s.id} className={`rounded-xl border-2 transition-all ${s.active ? `${BORDER[idx]} shadow-sm` : 'border-slate-200 opacity-50'}`}>
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between rounded-t-xl ${s.active ? BG[idx] : 'bg-slate-50'}`}>
              <input
                value={s.name}
                onChange={e => updateSystem(s.id, 'name', e.target.value)}
                className={`text-sm font-bold bg-transparent border-b border-dashed outline-none w-full ${s.active ? `${TEXT[idx]} border-current` : 'text-slate-400 border-slate-300'}`}
                placeholder={`Click to name system ${s.id}…`}
              />
              <button onClick={() => toggleSystem(s.id)}
                className={`w-10 h-5 rounded-full flex-shrink-0 ml-2 relative transition-colors ${s.active ? COLORS[idx] : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Inputs */}
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Capacity per Set (kWh)</label>
                <input type="number" value={s.capacityKwh} onChange={e => updateSystem(s.id, 'capacityKwh', parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-rose-300 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">EOL Retention (%)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="50" max="95" step="5" value={s.eolRetention}
                    onChange={e => updateSystem(s.id, 'eolRetention', parseFloat(e.target.value))}
                    className={`flex-1 ${s.active ? 'accent-rose-600' : ''}`} />
                  <span className="text-sm font-bold text-slate-700 w-10 text-right">{s.eolRetention}%</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Lifecycle @ 1C (Cycles)</label>
                <input type="number" value={s.lifecycleCycles} onChange={e => updateSystem(s.id, 'lifecycleCycles', parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-rose-300 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Total System Cost ($)</label>
                <input type="number" value={s.totalCost} onChange={e => updateSystem(s.id, 'totalCost', parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-rose-300 outline-none" />
              </div>
            </div>

            {/* LCOS Result */}
            {s.active && (() => {
              const r = calcLCOS(s);
              const isBest = Math.abs(r.costPerKwh - bestCpkwh) < 0.0001;
              return (
                <div className={`mx-4 mb-4 p-3 rounded-xl ${BG[idx]} border ${BORDER[idx]}`}>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-semibold text-slate-600">Cost / kWh</span>
                    {isBest && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">★ BEST</span>}
                  </div>
                  <p className={`text-2xl font-black ${TEXT[idx]}`}>${r.costPerKwh.toFixed(4)}</p>
                  <div className="mt-2 space-y-1 text-[10px] text-slate-500 font-mono">
                    <p>Avg cap: {s.capacityKwh} × {((1 + s.eolRetention/100)/2*100).toFixed(1)}% = {r.avgCap.toFixed(1)} kWh</p>
                    <p>Lifetime: {r.avgCap.toFixed(1)} × {s.lifecycleCycles.toLocaleString()} = {Math.round(r.lifetimeKwh).toLocaleString()} kWh</p>
                    <p>${s.totalCost.toLocaleString()} ÷ {Math.round(r.lifetimeKwh).toLocaleString()} kWh</p>
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Bar Chart Comparison */}
      {results.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-700" /> Cost per kWh — Visual Comparison
            <span className="text-xs font-normal text-slate-400 ml-2">Lower = cheaper per unit of energy delivered over lifetime</span>
          </h3>
          <div className="space-y-4">
            {results.sort((a, b) => a.costPerKwh - b.costPerKwh).map((r, i) => {
              const origIdx = systems.findIndex(s => s.id === r.id);
              const pct = maxCost > 0 ? (r.costPerKwh / maxCost) * 100 : 0;
              const isBest = i === 0;
              return (
                <div key={r.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${TEXT[origIdx]}`}>{r.name}</span>
                    <div className="flex items-center gap-2">
                      {isBest && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">★ Most Cost-Effective</span>}
                      <span className="text-sm font-black text-slate-800">${r.costPerKwh.toFixed(4)}<span className="text-xs font-normal text-slate-400"> /kWh</span></span>
                    </div>
                  </div>
                  <div className="h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div className={`h-full ${COLORS[origIdx]} rounded-lg transition-all duration-500 flex items-center justify-end pr-3`}
                      style={{ width: `${pct}%` }}>
                      <span className="text-white text-xs font-bold">{Math.round(r.lifetimeKwh).toLocaleString()} kWh lifetime</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{r.capacityKwh} kWh × {((1+r.eolRetention/100)/2*100).toFixed(1)}% avg × {r.lifecycleCycles.toLocaleString()} cyc</span>
                    <span>${r.totalCost.toLocaleString()} total cost</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Detail Table */}
      {results.length > 1 && (
        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">Full Comparison Table</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">System</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">EOL Retention</th>
                  <th className="px-5 py-3">Avg. Cap/Cycle</th>
                  <th className="px-5 py-3">Lifecycle</th>
                  <th className="px-5 py-3">Lifetime kWh</th>
                  <th className="px-5 py-3">Total Cost</th>
                  <th className="px-5 py-3 font-bold text-slate-700">$/kWh</th>
                  <th className="px-5 py-3">vs Best</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.sort((a,b) => a.costPerKwh - b.costPerKwh).map((r, i) => {
                  const origIdx = systems.findIndex(s => s.id === r.id);
                  const vsBest  = i === 0 ? null : ((r.costPerKwh - results[0].costPerKwh) / results[0].costPerKwh * 100);
                  return (
                    <tr key={r.id} className={i === 0 ? 'bg-green-50' : ''}>
                      <td className={`px-5 py-3 font-bold ${TEXT[origIdx]}`}>{r.name}</td>
                      <td className="px-5 py-3">{r.capacityKwh} kWh</td>
                      <td className="px-5 py-3">{r.eolRetention}%</td>
                      <td className="px-5 py-3 font-mono">{r.avgCap.toFixed(2)} kWh</td>
                      <td className="px-5 py-3 font-mono">{r.lifecycleCycles.toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono">{Math.round(r.lifetimeKwh).toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono">${r.totalCost.toLocaleString()}</td>
                      <td className="px-5 py-3 font-black text-slate-900">${r.costPerKwh.toFixed(4)}</td>
                      <td className="px-5 py-3">
                        {i === 0
                          ? <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">★ Best</span>
                          : <span className="text-red-600 font-bold">+{vsBest.toFixed(1)}% more expensive</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      </div>{/* end lcos-printable */}

      {/* Formula explainer */}
      <div className="p-5 bg-slate-800 text-white rounded-xl text-sm space-y-3">
        <h4 className="font-bold text-white flex items-center gap-2"><Info className="w-4 h-4 text-rose-400" /> How LCOS is calculated</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300 text-xs font-mono">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-white font-bold mb-1">Step 1 — Avg Capacity</p>
            <p>(Start 100% + EOL %) ÷ 2</p>
            <p className="text-rose-400 mt-1">e.g. (100% + 70%) ÷ 2 = 85%</p>
            <p>→ 16 kWh × 85% = 13.6 kWh/cycle</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-white font-bold mb-1">Step 2 — Lifetime Energy</p>
            <p>Avg kWh/cycle × Total cycles</p>
            <p className="text-rose-400 mt-1">e.g. 13.6 × 8,000 = 108,800 kWh</p>
            <p>→ Total energy delivered over life</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-white font-bold mb-1">Step 3 — Cost per kWh</p>
            <p>Total Cost ÷ Lifetime Energy</p>
            <p className="text-rose-400 mt-1">e.g. $500,000 ÷ 108,800</p>
            <p>→ <strong className="text-white">$4.596 / kWh</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
