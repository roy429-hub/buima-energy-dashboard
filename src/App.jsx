import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Zap, Search, Calculator, ArrowRight, CheckCircle2,
  AlertCircle, TrendingUp, Sun, Battery, Settings, Loader2,
  PlugZap, ChevronRight, X, List, BarChart3, Printer, Copy,
  MessageSquare, Users, Sliders, MapPin, Wifi, Globe,
  DollarSign, RefreshCw, Info
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

// ─── UI PRIMITIVES ───────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ title, subtitle, icon: Icon }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon className="w-6 h-6 text-emerald-600" />}
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
          className="block w-full rounded-md border-slate-300 pl-3 pr-12 py-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
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
      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

const DataBadge = ({ source }) => (
  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-md">
    <Globe className="w-3 h-3 text-emerald-600" />
    <span className="text-xs text-emerald-700 font-medium">Data: {source}</span>
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
            <span className="text-lg font-bold tracking-tight text-slate-800">
              BUIMA<span className="text-emerald-600">ENERGY</span>
            </span>
            <span className="hidden sm:inline ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-xs font-medium text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <Globe className="w-3 h-3 inline mr-0.5" />No API Key Required
            </span>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'roi', label: 'ROI Calc' },
              { id: 'modeler', label: 'Compare ROI' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
        {activeTab === 'roi'     && <ROICalculatorView setToast={setToastMsg} />}
        {activeTab === 'modeler' && <InteractiveChargingROI />}
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

  const [formData, setFormData] = useState({
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
    ]
  });

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
      <SectionHeader title="Step 1: Location & Revenue Data" subtitle="Where will the B.E.S.T. system be installed?" icon={Building2} />

      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
        <Globe className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-emerald-800">
          <span className="font-semibold">No API key needed.</span> Grid prices & EV charging rates are pulled from regional data tables. Solar hours come from <strong>Open-Meteo</strong> (free, real data).
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" value={formData.location}
              onChange={e => hi('location', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchLocation()}
              placeholder="e.g. Taipei, Tokyo, Dubai, San Francisco…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <button onClick={fetchLocation} disabled={loading || !formData.location}
            className={`px-5 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center gap-2 ${dataFetched ? 'bg-green-600' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:bg-slate-300`}>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : dataFetched ? <CheckCircle2 className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            {loading ? 'Fetching…' : dataFetched ? 'Fetched!' : 'Auto-Fill'}
          </button>
        </div>
        {dataSource && (
          <div className="mt-4 space-y-2">
            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border ${dataSource.isGridVerified ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
              <span className="font-bold flex-shrink-0">{dataSource.isGridVerified ? '✅' : '⚠️'} Grid Price:</span>
              <span>{dataSource.grid}</span>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs border bg-amber-50 border-amber-100 text-amber-800">
              <span className="font-bold flex-shrink-0">⚠️ EV Fee / Labor:</span>
              <span>{dataSource.ev}</span>
            </div>
            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border ${dataSource.solar && dataSource.solar.includes('✅') ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
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
        <button onClick={() => setStep(2)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">
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
        <Card className="p-5 border-t-4 border-t-emerald-500">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Battery className="w-5 h-5 text-emerald-600" /> B.E.S.T. & PCS</h3>
          <InputField label="B.E.S.T. Quantity (Sets)" value={formData.bestQty} onChange={e => hi('bestQty', parseFloat(e.target.value))} type="number" note="1 Set = 4 Tiles (approx 16kWh)" />
          <InputField label="B.E.S.T. Lifecycle" value={formData.lifecycle} onChange={e => hi('lifecycle', parseFloat(e.target.value))} type="number" suffix="Cycles" note="Default: 8000 cycles @ 1C" />
          <InputField label="Cost per Set" value={formData.bestCost} onChange={e => hi('bestCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="PCS Power" value={formData.pcsKw} onChange={e => hi('pcsKw', parseFloat(e.target.value))} type="number" suffix="kW" />
            <InputField label="PCS Cost" value={formData.pcsCost} onChange={e => hi('pcsCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} />
          </div>
        </Card>
        <Card className="p-5 border-t-4 border-t-indigo-500">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Sun className="w-5 h-5 text-indigo-600" /> PV & Installation</h3>
          {dataFetched && dataSource && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 flex items-center gap-2">
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
            <input type="checkbox" checked={formData.standRequired} onChange={e => hi('standRequired', e.target.checked)} className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
          </div>
          {formData.standRequired && <InputField label="Stand Cost" value={formData.standCost} onChange={e => hi('standCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} />}
          <InputField label="Installation Labor" value={formData.laborCost} onChange={e => hi('laborCost', parseFloat(e.target.value))} type="number" suffix={formData.currency} note={`Estimate for ${formData.location || 'your region'}`} />
        </Card>
      </div>
      <div className="flex justify-between">
        <button onClick={() => setStep(1)} className="text-slate-500 font-medium px-6 py-3 hover:text-slate-800">← Back</button>
        <button onClick={() => setStep(3)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">Next: Partnership Structure <ArrowRight className="w-5 h-5" /></button>
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
        <SectionHeader title="Step 3: Partnership Structure" subtitle="Define up to 3 parties for Joint Venture modeling." icon={Users} />
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Enable Joint Venture / Partnership Mode</h3>
            <button onClick={() => hi('jvEnabled', !formData.jvEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.jvEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.jvEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {formData.jvEnabled && (
            <div className="space-y-6">
              {formData.parties.map(party => (
                <div key={party.id} className={`p-4 rounded-xl border ${party.active ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" checked={party.active} onChange={() => toggleParty(party.id)} className="w-4 h-4 text-emerald-600 rounded" />
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
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">
            Generate Report <Calculator className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Step 4 — Report
  const renderStep4 = () => {
    const { currency } = formData;
    const outputKw = (formData.bestQty * 28) + formData.pcsKw;
    const effectivePower = Math.min(outputKw, formData.chargerRatingKw);
    const energyPerSession = formData.avgChargeHours * effectivePower;
    const dailyEnergySold = formData.chargesPerDay * energyPerSession;

    const dailyEvRev = dailyEnergySold * formData.chargingFee;
    const dailyOtherRev = formData.otherRevenueDaily || 0;
    const dailyRevDisplay = parseFloat((dailyEvRev + dailyOtherRev).toFixed(2));
    const annualRevenue = dailyRevDisplay * 365;

    const dailyPvGen = formData.pvKw * formData.sunHours * (formData.pvEfficiency / 100);
    const dailyGridDraw = Math.max(0, dailyEnergySold - dailyPvGen);
    const dailyGridCost = dailyGridDraw * formData.gridPrice;
    const dailyOtherCost = formData.otherCostDaily || 0;
    const dailyOpEx = parseFloat((dailyGridCost + dailyOtherCost).toFixed(2));
    const annualOpEx = dailyOpEx * 365;
    const annualProfit = annualRevenue - annualOpEx;

    const totalCapex = (formData.bestQty * formData.bestCost) + formData.pcsCost + formData.evChargerCost + formData.pvCost + (formData.standRequired ? formData.standCost : 0) + formData.laborCost;

    const totalCapKwh = formData.bestQty * 16;
    const cyclesPerDay = totalCapKwh > 0 ? (formData.chargesPerDay * Math.min(energyPerSession, totalCapKwh)) / totalCapKwh : 0;
    const replacementInterval = Math.ceil((cyclesPerDay > 0 ? formData.lifecycle / cyclesPerDay : 999999) / 365);
    const replacementCost = (formData.bestQty * formData.bestCost) * 0.70;

    const cashFlows = [-totalCapex];
    const tableData = [];
    let cumulative = -totalCapex;

    for (let i = 1; i <= 10; i++) {
      const isReplacement = (i % replacementInterval === 0);
      let flow = annualProfit;
      let salvage = 0;
      if (isReplacement) {
        flow -= replacementCost;
        if (i === 10) { salvage = replacementCost * 0.9; flow += salvage; }
      }
      cashFlows.push(flow);
      cumulative += flow;
      tableData.push({ year: i, revenue: annualRevenue, expense: annualOpEx + (isReplacement ? replacementCost : 0), salvage, net: flow, cumulative, isReplacement });
    }

    const irrValue = calculateIRR(cashFlows);
    const roiYears = annualProfit > 0 ? totalCapex / annualProfit : 0;
    const roiPercent = (cumulative / totalCapex) * 100;
    const replacementsIn10y = Math.floor(10 / replacementInterval);
    const totalReplacement10y = replacementCost * replacementsIn10y;

    return (
      <div id="printable-report" className="space-y-8 animate-fade-in">
        {/* Print header */}
        <div className="hidden print:block border-b-2 border-emerald-600 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div><h1 className="text-2xl font-bold">BUIMA<span className="text-emerald-600">ENERGY</span></h1><p className="text-sm text-slate-500">B.E.S.T Investment Analysis Report</p></div>
            <div className="text-right text-xs text-slate-400"><p>{new Date().toLocaleDateString()}</p><p>{formData.location}</p></div>
          </div>
        </div>

        <div className="print:hidden"><SectionHeader title="Investment Analysis Report" subtitle="Projected returns based on configured parameters." icon={TrendingUp} /></div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-800 text-white">
            <p className="text-slate-400 text-xs mb-1">Total CAPEX</p>
            <p className="text-2xl font-bold">{currency} {totalCapex.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </Card>
          <Card className="p-4">
            <p className="text-slate-500 text-xs mb-1">Annual Net Profit</p>
            <p className="text-2xl font-bold text-emerald-600">{currency} {annualProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </Card>
          <Card className="p-4">
            <p className="text-slate-500 text-xs mb-1">Project IRR (10y)</p>
            <p className={`text-2xl font-bold ${irrValue > 0 ? 'text-indigo-600' : 'text-red-500'}`}>{irrValue ? `${irrValue.toFixed(1)}%` : 'N/A'}</p>
          </Card>
          <Card className="p-4">
            <p className="text-slate-500 text-xs mb-1">ROI / Payback</p>
            <p className="text-2xl font-bold text-slate-700">{roiYears > 0 ? roiYears.toFixed(1) : 'N/A'} <span className="text-sm font-normal text-slate-500">yrs</span></p>
            <p className="text-xs text-slate-400">10y Yield: {roiPercent.toFixed(1)}%</p>
          </Card>
        </div>

        {/* JV Table */}
        {formData.jvEnabled && (
          <div>
            <div className="mb-4 flex items-center gap-2 text-indigo-800"><Users className="w-5 h-5" /><h3 className="text-lg font-bold">Partnership Analysis</h3></div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-indigo-50 text-indigo-900 font-bold">
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
                        <td className={`px-4 py-3 font-bold ${netMonthly >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{currency} {Math.round(netMonthly).toLocaleString()}</td>
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
                      <th className="px-6 py-3">Year</th>
                      <th className="px-6 py-3">Revenue</th>
                      <th className="px-6 py-3">OpEx</th>
                      <th className="px-6 py-3">Net Flow</th>
                      <th className="px-6 py-3">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.map(row => (
                      <tr key={row.year} className={row.isReplacement ? 'bg-red-50' : ''}>
                        <td className="px-6 py-3 font-medium">Year {row.year}</td>
                        <td className="px-6 py-3 text-emerald-600">+{Math.round(row.revenue).toLocaleString()}</td>
                        <td className="px-6 py-3 text-red-500">
                          -{Math.round(row.expense).toLocaleString()}
                          {row.isReplacement && <div className="text-xs text-red-700 mt-0.5">(incl. battery replacement)</div>}
                          {row.salvage > 0 && <div className="text-xs text-green-600">+{Math.round(row.salvage).toLocaleString()} salvage</div>}
                        </td>
                        <td className="px-6 py-3 font-bold">{Math.round(row.net).toLocaleString()}</td>
                        <td className={`px-6 py-3 ${row.cumulative > 0 ? 'text-green-600' : 'text-slate-500'}`}>{Math.round(row.cumulative).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-0 overflow-hidden">
              <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex items-center gap-2">
                <List className="w-4 h-4 text-indigo-700" />
                <h3 className="font-bold text-indigo-900 text-sm uppercase">Calculation Basis</h3>
              </div>
              <div className="p-5 space-y-4 text-sm text-slate-600">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-2">Revenue</p>
                  <p className="flex justify-between"><span>Fee:</span><span>{currency} {formData.chargingFee} / kWh</span></p>
                  <p className="flex justify-between"><span>Sessions:</span><span>{formData.chargesPerDay}/day</span></p>
                  <p className="flex justify-between font-medium text-emerald-700 mt-1"><span>Annual:</span><span>{currency} {Math.round(annualRevenue).toLocaleString()}</span></p>
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

            <div className="flex gap-3 print:hidden">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50">New Calc</button>
              <button onClick={handlePrint} className="flex-1 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> PDF / Print
              </button>
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
            <span key={label} className={step >= i + 1 ? 'text-emerald-600 font-bold' : ''}>{i + 1}. {label}</span>
          ))}
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
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
  const energyPerSession = {
    ac:    Math.min(7      * dwellH, 75),
    best:  Math.min(28     * dwellH, 75),
    super: Math.min(66.66  * dwellH, 75),
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
  const rev = {
    ac:    scen.acCount    * scen.carsPerDayPerCharger * energyPerSession.ac    * scen.acRate  * 365,
    best:  scen.bestCount  * scen.carsPerDayPerCharger * energyPerSession.best  * scen.dcRate  * 365,
    super: scen.superCount * scen.carsPerDayPerCharger * energyPerSession.super * scen.dcRate  * 365,
  };
  const opex = {
    ac:    scen.acCount    * scen.carsPerDayPerCharger * energyPerSession.ac    * scen.mixedGridRate  * 365,
    best:  scen.bestCount  * scen.carsPerDayPerCharger * energyPerSession.best  * scen.offPeakGridRate * 365,
    super: (scen.superCount * scen.carsPerDayPerCharger * energyPerSession.super * scen.mixedGridRate * 365) +
           (scen.superCount > 0 ? scen.superCount * 180 * scen.demandChargePerKw * 12 : 0),
  };
  const net10y = {
    ac:    ((rev.ac    - opex.ac)    * 10) - capex.ac    - replace10y.ac,
    best:  ((rev.best  - opex.best)  * 10) - capex.best  - replace10y.best,
    super: ((rev.super - opex.super) * 10) - capex.super - replace10y.super,
  };

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
            <TrendingUp className="text-emerald-600 w-6 h-6" /> 10-Year Interactive ROI Modeler
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Adjust sliders and CapEx inputs to stress-test profitability across all three charging architectures.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-2">
            <Sliders className="w-4 h-4 text-indigo-600" /> Usage & Rates
          </h3>

          {[
            { label: 'Daily Cars (Per Charger)', field: 'carsPerDayPerCharger', min: 1, max: 30, step: 1 },
            { label: 'Avg Dwell Time (Mins)', field: 'dwellTimeMin', min: 15, max: 120, step: 5 },
          ].map(s => (
            <div key={s.field}>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>{s.label}</span>
                <span className="text-emerald-600 font-bold">{scen[s.field]}</span>
              </label>
              <input type="range" min={s.min} max={s.max} step={s.step} value={scen[s.field]}
                onChange={e => hi(s.field, e.target.value)} className="w-full accent-emerald-600" />
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
                  className="w-full p-1.5 border rounded text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Demand Charge ($/kW/mo)</label>
            <input type="number" value={scen.demandChargePerKw} onChange={e => hi('demandChargePerKw', e.target.value)}
              className="w-full p-1.5 border rounded text-sm focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        {/* Right side */}
        <div className="lg:col-span-3 space-y-6">
          {/* CapEx editor */}
          <div className="overflow-x-auto border border-indigo-100 rounded-xl shadow-sm">
            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-700" />
              <h3 className="font-bold text-indigo-900 text-sm">System Configuration & CapEx</h3>
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
                  { label: 'B.E.S.T (28kW)', color: 'text-emerald-700', bg: 'bg-emerald-50/30', prefix: 'best',  borderColor: 'border-emerald-200' },
                  { label: 'Super (180kW)',  color: 'text-indigo-700',  bg: 'bg-indigo-50/30',  prefix: 'super', borderColor: 'border-indigo-200' },
                ].map(row => (
                  <tr key={row.prefix} className={`hover:brightness-95 ${row.bg}`}>
                    <td className={`px-4 py-2 font-bold ${row.color}`}>{row.label}</td>
                    {['Count', 'Hardware', 'Install', 'Fixed', 'Replace'].map(field => {
                      const key = row.prefix + field;
                      return (
                        <td key={key} className="px-4 py-2">
                          <input type="number" value={scen[key]} onChange={e => hi(key, e.target.value)}
                            className={`w-full p-1.5 border ${row.borderColor} rounded text-sm focus:ring-2 focus:ring-emerald-500`} />
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
              <BarItem value={net10y.best}  color="bg-emerald-500 shadow-lg ring-2 ring-emerald-200" label={`B.E.S.T (${scen.bestCount})`} />
              <BarItem value={net10y.super} color="bg-indigo-500" label={`Super (${scen.superCount})`} />
            </div>

            {/* Results table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-xs">Metric (10y)</th>
                    <th className="px-3 py-2 text-xs text-center">AC</th>
                    <th className="px-3 py-2 text-xs text-center text-emerald-700 bg-emerald-50">B.E.S.T</th>
                    <th className="px-3 py-2 text-xs text-center">Super</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: 'Setup CapEx',       vals: [capex.ac,       capex.best,       capex.super],       neg: true },
                    { label: 'Replacements',       vals: [replace10y.ac,  replace10y.best,  replace10y.super],  neg: true, clr: 'text-amber-600' },
                    { label: 'Gross Revenue',      vals: [rev.ac * 10,    rev.best * 10,    rev.super * 10],    neg: false },
                    { label: 'Grid/Demand OpEx',   vals: [opex.ac * 10,   opex.best * 10,   opex.super * 10],   neg: true },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-slate-500 text-xs">{row.label}</td>
                      {row.vals.map((v, j) => (
                        <td key={j} className={`px-3 py-2 font-mono text-right text-xs ${row.clr || (row.neg ? 'text-red-500' : 'text-slate-700')} ${j === 1 ? 'bg-emerald-50/50' : ''}`}>
                          {row.neg ? '-' : ''}{fmt(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="px-3 py-3 font-bold text-slate-800 text-xs">Net 10-Year</td>
                    <td className={`px-3 py-3 font-mono font-bold text-right text-xs ${net10y.ac >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{fmt(net10y.ac)}</td>
                    <td className="px-3 py-3 font-mono font-bold text-right text-sm text-emerald-700 bg-emerald-100/50 border-x border-emerald-200">{fmt(net10y.best)}</td>
                    <td className={`px-3 py-3 font-mono font-bold text-right text-xs ${net10y.super >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>{fmt(net10y.super)}</td>
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
