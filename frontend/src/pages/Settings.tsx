import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, CheckCircle2, Shield, IndianRupee, Anchor, Truck } from 'lucide-react';
import { getExchangeRate, setExchangeRate, DEFAULT_USD_TO_INR_RATE, formatINR } from '../utils/currency';

export const Settings: React.FC = () => {
  const [domain, setDomain] = useState<'maritime' | 'road_freight'>('maritime');
  const [exchangeRate, setRate] = useState<number>(getExchangeRate());
  const [carbonPriceInr, setCarbonPriceInr] = useState<number>(Math.round(85.0 * getExchangeRate())); // ₹/tonne CO2
  const [fuelPricesInr, setFuelPricesInr] = useState({
    hfo: Math.round(520 * getExchangeRate()),
    mgo: Math.round(780 * getExchangeRate()),
    lng: Math.round(640 * getExchangeRate()),
    biofuel: Math.round(950 * getExchangeRate())
  });
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const activeRate = getExchangeRate();
    setRate(activeRate);
  }, []);

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
  };

  const handleResetRate = () => {
    setRate(DEFAULT_USD_TO_INR_RATE);
    setCarbonPriceInr(Math.round(85.0 * DEFAULT_USD_TO_INR_RATE));
    setFuelPricesInr({
      hfo: Math.round(520 * DEFAULT_USD_TO_INR_RATE),
      mgo: Math.round(780 * DEFAULT_USD_TO_INR_RATE),
      lng: Math.round(640 * DEFAULT_USD_TO_INR_RATE),
      biofuel: Math.round(950 * DEFAULT_USD_TO_INR_RATE)
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setExchangeRate(exchangeRate);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-[#2563EB]" />
          System Configuration & Maritime Economics
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Configure operational domain context, Indian Rupee (₹ INR) economic bunker pricing, and carbon offset parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Currency & Exchange Rate Configuration */}
        <div className="q-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#C5D5EE] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#2563EB]" />
                Operational Currency & Exchange Rate Parity
              </h2>
              <p className="text-xs text-[#64748B]">
                Centralized valuation across Fleet Registry, Fuel Studio, QUBO Optimizer, and ESG Decarbonization.
              </p>
            </div>
            <span className="badge-cobalt">
              Base: INR (₹)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[#64748B] mb-1 font-semibold">USD to INR Conversion Benchmark (₹ per $1.00 USD)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="50"
                  max="150"
                  value={exchangeRate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value) || DEFAULT_USD_TO_INR_RATE)}
                  className="q-input"
                />
                <button
                  type="button"
                  onClick={handleResetRate}
                  className="btn-ivory text-[11px] px-3 py-2"
                  title="Reset to default rate ₹83.50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
                  Reset
                </button>
              </div>
              <span className="text-[10px] text-[#64748B] mt-1 block">Default simulation parity: ₹{DEFAULT_USD_TO_INR_RATE.toFixed(2)} per USD</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#C5D5EE] flex flex-col justify-between">
              <span className="text-[#64748B] text-[11px] font-semibold">Active System Benchmark:</span>
              <div className="text-base text-[#0F172A] font-bold">
                ₹83,500 INR = 1,000 USD Equivalence
              </div>
              <span className="text-[10px] text-[#2563EB] font-medium">All financial analytics calibrated natively in Indian Rupees (₹)</span>
            </div>
          </div>
        </div>

        {/* Domain Selection */}
        <div className="q-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#C5D5EE] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">Logistics Domain Mode</h2>
              <p className="text-xs text-[#64748B]">Parameterizes equations for maritime navigation vs heavy commercial drayage.</p>
            </div>
            <span className="badge-cobalt">
              Active: {domain === 'maritime' ? 'Maritime Fleet' : 'Road Fleet'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setDomain('maritime')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                domain === 'maritime'
                  ? 'bg-[rgba(37,99,235,0.08)] border-[#2563EB] ring-2 ring-[#2563EB]/30'
                  : 'bg-white border-[#C5D5EE] hover:border-[#2563EB]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-[#2563EB]" />
                  Maritime Fleet Logistics
                </span>
                {domain === 'maritime' && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
              </div>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Container vessels, bulk carriers, tankers, nautical miles, calm water drag, and Kwon wave resistance.
              </p>
            </div>

            <div
              onClick={() => setDomain('road_freight')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                domain === 'road_freight'
                  ? 'bg-[rgba(37,99,235,0.08)] border-[#2563EB] ring-2 ring-[#2563EB]/30'
                  : 'bg-white border-[#C5D5EE] hover:border-[#2563EB]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#2563EB]" />
                  Heavy Road Freight
                </span>
                {domain === 'road_freight' && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
              </div>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Intermodal drayage trucks, highway aerodynamic drag, gradient resistance, and rolling friction.
              </p>
            </div>
          </div>
        </div>

        {/* Bunker Fuel Economic Parameters */}
        <div className="q-card p-5 space-y-4">
          <div className="border-b border-[#C5D5EE] pb-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">Bunker Fuel Pricing Reference (₹ / Metric Tonne)</h2>
            <p className="text-xs text-[#64748B]">Used by the optimizer to compute multi-objective trade-offs in Indian Rupees.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[#64748B] mb-1 font-semibold">Heavy Fuel Oil (HFO) ₹/MT</label>
              <input
                type="number"
                value={fuelPricesInr.hfo}
                onChange={(e) => setFuelPricesInr({ ...fuelPricesInr, hfo: parseFloat(e.target.value) || 0 })}
                className="q-input"
              />
              <span className="text-[10px] text-[#64748B] mt-1 block">Indian Coastal Reference Rate</span>
            </div>
            <div>
              <label className="block text-[#64748B] mb-1 font-semibold">Marine Gas Oil (MGO) ₹/MT</label>
              <input
                type="number"
                value={fuelPricesInr.mgo}
                onChange={(e) => setFuelPricesInr({ ...fuelPricesInr, mgo: parseFloat(e.target.value) || 0 })}
                className="q-input"
              />
              <span className="text-[10px] text-[#64748B] mt-1 block">Low Sulphur MGO Benchmark</span>
            </div>
            <div>
              <label className="block text-[#64748B] mb-1 font-semibold">Liquefied Natural Gas (LNG) ₹/MT</label>
              <input
                type="number"
                value={fuelPricesInr.lng}
                onChange={(e) => setFuelPricesInr({ ...fuelPricesInr, lng: parseFloat(e.target.value) || 0 })}
                className="q-input"
              />
              <span className="text-[10px] text-[#64748B] mt-1 block">Cryogenic Clean Bunker Fuel</span>
            </div>
            <div>
              <label className="block text-[#64748B] mb-1 font-semibold">Biofuel / Green Methanol ₹/MT</label>
              <input
                type="number"
                value={fuelPricesInr.biofuel}
                onChange={(e) => setFuelPricesInr({ ...fuelPricesInr, biofuel: parseFloat(e.target.value) || 0 })}
                className="q-input"
              />
              <span className="text-[10px] text-[#64748B] mt-1 block">Zero-Carbon Future Fuel</span>
            </div>
          </div>
        </div>

        {/* Carbon Tax & Regulatory Policy */}
        <div className="q-card p-5 space-y-4">
          <div className="border-b border-[#C5D5EE] pb-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">Carbon Taxation & Regulatory Policy</h2>
            <p className="text-xs text-[#64748B]">Shadow carbon price under Indian MoPSW / IMO Global Greenhouse Gas Standards.</p>
          </div>

          <div className="max-w-xs text-xs font-mono">
            <label className="block text-[#64748B] mb-1 font-semibold">Shadow Carbon Price (₹ / Tonne CO2)</label>
            <input
              type="number"
              value={carbonPriceInr}
              onChange={(e) => setCarbonPriceInr(parseFloat(e.target.value) || 0)}
              className="q-input"
            />
            <span className="text-[10px] text-[#64748B] mt-1 block">
              Direct ₹ per MT CO₂ emission penalty benchmark
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <span className="text-xs text-emerald-700 font-mono flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Parameters and exchange rate saved successfully
            </span>
          )}
          <button
            type="submit"
            className="btn-primary ml-auto"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
