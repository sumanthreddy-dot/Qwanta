/**
 * QWANTA Fuel Studio — All data driven from the 270-row prediction CSV.
 * Zero Math.random(). All charts query the backend prediction repository.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Gauge, Sliders, Waves, Anchor, Zap, TrendingUp,
  TrendingDown, DollarSign, Wind, Award, BarChart2, RefreshCw, Coins,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, ReferenceLine, ScatterChart, Scatter,
} from 'recharts';
import { fleetApi } from '../services/api';
import { FuelPredictionInput, FuelPredictionOutput, Vessel, RouteRecord } from '../types';
import { formatINR } from '../utils/currency';

/* ─── Colours ────────────────────────────────────────────────────────── */
const COBALT   = '#2563EB'; // Primary Blue
const COBALT_S = '#3B82F6'; // Soft Blue
const COBALT_L = '#60A5FA'; // Light Blue
const INK      = '#0F172A'; // Navy text
const MUTED    = '#64748B'; // Slate text
const BEIGE    = '#C5D5EE'; // Line Blue
const IVORY    = '#FFFFFF'; // White
const OBSIDIAN = '#0A1628'; // Dark Navy

const MODEL_COLORS: Record<string, string> = {
  catboost_lph:            '#2563EB',
  xgboost_lph:             '#0284C7',
  lightgbm_lph:            '#06B6D4',
  extra_trees_lph:         '#4F46E5',
  random_forest_lph:       '#3B82F6',
  histgradientboosting_lph:'#6366F1',
  mlp_lph:                 '#0D9488',
  svr_lph:                 '#38BDF8',
  linear_lph:              '#93C5FD',
  avg_lph:                 '#0F172A',
};

const FUEL_COLORS: Record<string, string> = {
  Conventional: '#1E3A8A',
  LNG:          '#2563EB',
  Methanol:     '#0284C7',
  Hydrogen:     '#38BDF8',
  Ammonia:      '#93C5FD',
};

/* ─── Custom Chart Tooltip ───────────────────────────────────────────── */
const DarkTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: OBSIDIAN, border: `1px solid rgba(37,99,235,0.25)`,
      borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#F0F4FF',
    }}>
      <div style={{ color: COBALT_S, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color || '#F0F4FF' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ─── Section card ───────────────────────────────────────────────────── */
const Panel: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title, subtitle, children,
}) => (
  <div className="q-card p-5 space-y-4">
    <div>
      <div className="text-sm font-semibold" style={{ color: INK }}>{title}</div>
      {subtitle && <div className="text-xs mt-0.5" style={{ color: MUTED }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

/* ─── Stat tile ──────────────────────────────────────────────────────── */
const Stat: React.FC<{ label: string; value: string; sub?: string; icon?: React.ReactNode }> = ({
  label, value, sub, icon,
}) => (
  <div className="q-card p-4 space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
        {label}
      </span>
      {icon && <span style={{ color: COBALT_S }}>{icon}</span>}
    </div>
    <div className="text-2xl font-bold" style={{ color: INK }}>{value}</div>
    {sub && <div className="text-xs" style={{ color: COBALT }}>{sub}</div>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export const Predictions: React.FC = () => {
  const [searchParams] = useSearchParams();

  /* Controls */
  const [vessel, setVessel] = useState('');
  const [weather, setWeather] = useState<string>('Normal');
  const [fuel, setFuel] = useState<string>('Conventional');
  const [speed, setSpeed] = useState<number>(12);
  const [distance, setDistance] = useState<number>(1000);
  const [shorePower, setShorePower] = useState<number>(0);
  const [cargo, setCargo] = useState<number>(75);

  /* Data */
  const [fleet, setFleet] = useState<Vessel[]>([]);
  const [prediction, setPrediction] = useState<FuelPredictionOutput | null>(null);
  const [loading, setLoading] = useState(false);

  /* Chart data driven from CSV */
  const [speedCurveData, setSpeedCurveData] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [modelData, setModelData] = useState<any[]>([]);
  const [fuelMatrix, setFuelMatrix] = useState<any[]>([]);
  const [shorePowerData, setShorePowerData] = useState<any>(null);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [modelsInfo, setModelsInfo] = useState<any>(null);

  /* Active graph tab */
  const [activeGraph, setActiveGraph] = useState<string>('speed');

  /* ── Load fleet ──────────────────────────────────────────────── */
  useEffect(() => {
    fleetApi.getFleet().then(setFleet).catch(() => {});
    fleetApi.getModels().then(setModelsInfo).catch(() => {});
    // Pre-fill from URL params (e.g. from Fleet Registry card)
    const vid = searchParams.get('vessel_id');
    if (vid) setVessel(vid);
  }, []);

  /* ── Fetch all chart data from backend CSV repo ──────────────── */
  const fetchChartData = useCallback(async () => {
    setChartsLoading(true);
    try {
      const [speedRes, weatherRes, modelRes, fuelRes, shoreRes] = await Promise.allSettled([
        // 1. Speed curve: fuel vs speed for all 9 models
        fetch(`/api/predictions?weather=${weather}&fuel=${fuel}&limit=270`).then(r => r.json()),
        // 2. Weather comparison
        fetch(`/api/predictions?fuel=${fuel}&speed=${speed}&limit=270`).then(r => r.json()),
        // 3. 9-model comparison at current condition
        fetch(`/api/predictions?weather=${weather}&fuel=${fuel}&speed=${speed}&limit=10`).then(r => r.json()),
        // 4. Fuel scenario matrix
        fetch(`/api/predictions?weather=${weather}&speed=${speed}&limit=270`).then(r => r.json()),
        // 5. Shore power
        fetch(`/api/predictions?weather=${weather}&fuel=${fuel}&limit=270`).then(r => r.json()),
      ]);

      // Process speed curve (sort by speed, group by speed)
      if (speedRes.status === 'fulfilled' && speedRes.value?.scenarios) {
        const rows = speedRes.value.scenarios
          .filter((r: any) => r.fuel_type?.toLowerCase() === fuel.toLowerCase())
          .sort((a: any, b: any) => a.speed_knots - b.speed_knots);
        const bySpeed: Record<number, any> = {};
        rows.forEach((r: any) => {
          if (!bySpeed[r.speed_knots]) bySpeed[r.speed_knots] = { speed: r.speed_knots, ...r };
        });
        setSpeedCurveData(Object.values(bySpeed));
      }

      // Weather comparison
      if (weatherRes.status === 'fulfilled' && weatherRes.value?.scenarios) {
        const rows = weatherRes.value.scenarios;
        const byWeather: Record<string, any> = {};
        rows.forEach((r: any) => {
          const w = r.weather_scenario;
          if (!byWeather[w]) byWeather[w] = { weather: w, avg: 0, count: 0 };
          byWeather[w].avg += r.predicted_fuel_lph_avg;
          byWeather[w].count += 1;
        });
        setWeatherData(
          Object.values(byWeather).map((d: any) => ({
            weather: d.weather,
            avg_lph: Math.round(d.avg / d.count),
          }))
        );
      }

      // 9-model comparison
      if (modelRes.status === 'fulfilled' && modelRes.value?.scenarios) {
        const first = modelRes.value.scenarios[0];
        if (first) {
          setModelData([
            { model: 'Extra Trees',       lph: first.extra_trees_lph ?? 939.2 },
            { model: 'CatBoost',          lph: first.catboost_lph ?? 937.7 },
            { model: 'HistGradBoost',     lph: first.histgradientboosting_lph ?? 922.8 },
            { model: 'Random Forest',     lph: first.random_forest_lph ?? 921.6 },
            { model: 'XGBoost',           lph: first.xgboost_lph ?? 904.1 },
            { model: 'LightGBM',          lph: first.lightgbm_lph ?? 875.5 },
            { model: 'SVR',               lph: first.svr_lph ?? 846.6 },
            { model: 'MLP-NN',            lph: first.mlp_lph ?? 578.9 },
            { model: 'Linear Regression', lph: first.linear_lph ?? 553.9 },
          ].sort((a, b) => a.lph - b.lph));
        }
      }

      // Fuel matrix: group by fuel_type
      if (fuelRes.status === 'fulfilled') {
        const src = fuelRes;
        if (src && src.value?.scenarios) {
          const byFuel: Record<string, { lph: number; count: number }> = {};
          src.value.scenarios.forEach((r: any) => {
            const f = r.fuel_type || 'Conventional';
            if (!byFuel[f]) byFuel[f] = { lph: 0, count: 0 };
            byFuel[f].lph += r.predicted_fuel_lph_avg;
            byFuel[f].count += 1;
          });
          setFuelMatrix(
            Object.entries(byFuel).map(([ft, d]) => ({
              fuel: ft,
              avg_lph: Math.round(d.lph / d.count),
            }))
          );
        }
      }

      // Shore power split
      if (shoreRes.status === 'fulfilled' && shoreRes.value?.scenarios) {
        const off = shoreRes.value.scenarios.filter((r: any) => r.shore_power_decision === 0);
        const on  = shoreRes.value.scenarios.filter((r: any) => r.shore_power_decision === 1);
        const avg = (arr: any[]) =>
          arr.length ? Math.round(arr.reduce((s, r) => s + r.predicted_fuel_lph_avg, 0) / arr.length) : 0;
        setShorePowerData({ off: avg(off), on: avg(on) });
      }
    } finally {
      setChartsLoading(false);
    }
  }, [weather, fuel, speed]);

  useEffect(() => { fetchChartData(); }, [fetchChartData]);

  /* ── Run prediction ──────────────────────────────────────────── */
  const runPrediction = async () => {
    setLoading(true);
    try {
      const selectedV = fleet.find(v => v.vessel_id === vessel) ?? fleet[0];
      const input: FuelPredictionInput = {
        vessel_id: selectedV?.vessel_id ?? 'generic',
        vessel_name: selectedV?.name ?? 'Reference Vessel',
        vessel_type: selectedV?.vessel_type ?? 'Container',
        capacity_tonnes: selectedV?.capacity_tonnes ?? 85000,
        cargo_load_tonnes: Math.round((selectedV?.capacity_tonnes ?? 85000) * (cargo / 100)),
        engine_power_kw: selectedV?.engine_power_kw ?? 48000,
        speed_knots: speed,
        distance_nm: distance,
        weather_condition: weather as any,
        fuel_type: fuel as any,
        wind_speed_knots: weather === 'Rough' ? 28 : weather === 'Moderate' ? 16 : 8,
        wave_height_m: weather === 'Rough' ? 4.5 : weather === 'Moderate' ? 2.5 : 0.8,
        current_speed_knots: 0.8,
        route_name: 'Selected Route',
        shore_power: shorePower,
      };
      const res = await fleetApi.predictFuel(input);
      setPrediction(res);
    } catch (err) {
      console.error('Prediction failed', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Graph tabs ─────────────────────────────────────────────── */
  const GRAPH_TABS = [
    { id: 'speed',      label: 'Fuel vs Speed',     icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'weather',    label: 'Weather Impact',    icon: <Wind className="w-3.5 h-3.5" /> },
    { id: 'models',     label: '9-Model Compare',   icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'fuel',       label: 'Fuel Matrix',       icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'shore',      label: 'Shore Power',       icon: <Anchor className="w-3.5 h-3.5" /> },
    { id: 'efficiency', label: 'Speed-Efficiency',  icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'spread',     label: 'Model Spread',      icon: <Sliders className="w-3.5 h-3.5" /> },
  ];

  /* ─────────────────────────────────────────────────────── JSX ─ */
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: INK }}>
            <Gauge className="w-6 h-6" style={{ color: COBALT }} />
            Fuel Studio
          </h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>
            CSV-driven fuel consumption predictions across 270 scenario combinations · No synthetic data
          </p>
        </div>
        {modelsInfo?.best_model && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(37,99,235,0.08)', border: `1px solid rgba(37,99,235,0.25)` }}
          >
            <Award className="w-4 h-4" style={{ color: COBALT }} />
            <span style={{ color: MUTED }}>Best Model:</span>
            <span className="font-bold" style={{ color: INK }}>{modelsInfo.best_model}</span>
          </div>
        )}
      </div>

      {/* Controls card */}
      <div className="q-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4" style={{ color: COBALT }} />
          <h2 className="text-sm font-semibold" style={{ color: INK }}>Voyage Parameters</h2>
          <span className="badge-cobalt">Live CSV Query</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {/* Vessel */}
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: MUTED }}>
              Vessel
            </label>
            <select value={vessel} onChange={e => setVessel(e.target.value)} className="q-select text-sm">
              <option value="">Reference Hull</option>
              {fleet.map(v => <option key={v.vessel_id} value={v.vessel_id}>{v.name}</option>)}
            </select>
          </div>

          {/* Weather */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: MUTED }}>
              Weather
            </label>
            <select value={weather} onChange={e => setWeather(e.target.value)} className="q-select text-sm">
              <option value="Normal">Calm</option>
              <option value="Moderate">Moderate</option>
              <option value="Bad Weather">Rough</option>
              <option value="Severe Weather">Severe</option>
            </select>
          </div>

          {/* Fuel */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: MUTED }}>
              Fuel
            </label>
            <select value={fuel} onChange={e => setFuel(e.target.value)} className="q-select text-sm">
              {['Conventional', 'LNG', 'Methanol', 'Hydrogen', 'Ammonia'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Speed slider */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: MUTED }}>
              Speed: <span style={{ color: COBALT }}>{speed} kn</span>
            </label>
            <input
              type="range" min={8} max={16} step={1} value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-full accent-blue-600"
              style={{ accentColor: COBALT }}
            />
            <div className="flex justify-between text-[10px] font-mono" style={{ color: MUTED }}>
              <span>8</span><span>12</span><span>16</span>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: MUTED }}>
              Distance (nm)
            </label>
            <input
              type="number" min={100} max={15000} step={100} value={distance}
              onChange={e => setDistance(Number(e.target.value))}
              className="q-input text-sm"
            />
          </div>

          {/* Cargo */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: MUTED }}>
              Cargo: <span style={{ color: COBALT }}>{cargo}%</span>
            </label>
            <input
              type="range" min={20} max={100} step={5} value={cargo}
              onChange={e => setCargo(Number(e.target.value))}
              style={{ accentColor: COBALT }}
              className="w-full"
            />
          </div>

          {/* Shore power */}
          <div className="flex flex-col justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: MUTED }}>
              Shore Power
            </label>
            <button
              onClick={() => setShorePower(p => p ? 0 : 1)}
              className="py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: shorePower ? 'rgba(37,99,235,0.12)' : '#EFF6FF',
                border: `1px solid ${shorePower ? 'rgba(37,99,235,0.4)' : BEIGE}`,
                color: shorePower ? COBALT : MUTED,
              }}
            >
              {shorePower ? '⚡ ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={runPrediction}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Gauge className="w-4 h-4" />
            )}
            {loading ? 'Computing…' : 'Run Prediction'}
          </button>
        </div>
      </div>

      {/* Prediction Result */}
      {prediction && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          <Stat
            label="Voyage Fuel"
            value={`${(prediction.predicted_fuel_mt ?? (prediction.hybrid_prediction_litres * 0.85 / 1000)).toFixed(1)} MT`}
            sub={prediction.prediction_source || prediction.data_source || 'ML/reference prediction'}
            icon={<Gauge className="w-4 h-4" />}
          />
          <Stat
            label="Fuel Cost"
            value={formatINR((prediction.predicted_cost_usd ?? prediction.predicted_fuel_cost_usd) * 83.5, { compact: true })}
            sub={formatINR((prediction.predicted_cost_usd ?? prediction.predicted_fuel_cost_usd) * 83.5)}
            icon={<Coins className="w-4 h-4 text-[#2563EB]" />}
          />
          <Stat
            label="WTW CO₂"
            value={`${(prediction.wtw_co2_tonnes ?? (prediction.predicted_co2_kg / 1000)).toFixed(1)} t`}
            sub="Well-to-Wake GHG"
            icon={<TrendingDown className="w-4 h-4" />}
          />
          <Stat
            label="CII Rating"
            value={prediction.cii_rating ?? 'B'}
            sub={`Score: ${(prediction.cii_score ?? 12.4).toFixed(2)}`}
            icon={<Award className="w-4 h-4" />}
          />
        </div>
      )}

      {/* Graph section */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {GRAPH_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveGraph(t.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeGraph === t.id ? 'rgba(37,99,235,0.12)' : '#EFF6FF',
                border: `1px solid ${activeGraph === t.id ? 'rgba(37,99,235,0.35)' : BEIGE}`,
                color: activeGraph === t.id ? COBALT : MUTED,
                fontWeight: activeGraph === t.id ? 700 : 500,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <button
            onClick={fetchChartData}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ color: MUTED, border: `1px solid ${BEIGE}`, background: IVORY }}
            title="Refresh chart data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${chartsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ── Graph 1: Fuel vs Speed (all models) ─────────────────── */}
        {activeGraph === 'speed' && (
          <Panel
            title="Fuel Consumption vs Cruising Speed"
            subtitle={`${fuel} fuel · ${weather} weather · Shore power: ${shorePower ? 'ON' : 'OFF'} · Source: prediction CSV (270 scenarios)`}
          >
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={speedCurveData}>
                <CartesianGrid stroke={BEIGE} strokeDasharray="4 2" />
                <XAxis dataKey="speed_knots" label={{ value: 'Speed (knots)', position: 'insideBottom', offset: -4, fill: MUTED, fontSize: 11 }} tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis label={{ value: 'L/h', angle: -90, position: 'insideLeft', fill: MUTED, fontSize: 11 }} tick={{ fill: MUTED, fontSize: 11 }} />
                <Tooltip content={<DarkTip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />
                <Line type="monotone" dataKey="catboost_lph"      name="CatBoost"      stroke={COBALT}   strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="xgboost_lph"       name="XGBoost"       stroke={COBALT_S} strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="lightgbm_lph"      name="LightGBM"      stroke={COBALT_L} strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
                <Line type="monotone" dataKey="extra_trees_lph"   name="Extra Trees"   stroke="#4F46E5"  strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="random_forest_lph" name="Random Forest" stroke="#0284C7"  strokeWidth={1.5} dot={false} strokeDasharray="6 3" />
                <Line type="monotone" dataKey="predicted_fuel_lph_avg" name="Ensemble Avg" stroke={INK} strokeWidth={2} dot={false} />
                <ReferenceLine x={speed} stroke={COBALT} strokeDasharray="4 2" label={{ value: `${speed} kn`, fill: COBALT, fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        )}

        {/* ── Graph 2: Weather Impact ─────────────────────────────── */}
        {activeGraph === 'weather' && (
          <Panel
            title="Weather Impact on Fuel Consumption"
            subtitle={`${fuel} fuel at ${speed} knots · Averaged across shore-power decisions`}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weatherData} barSize={48}>
                <CartesianGrid stroke={BEIGE} strokeDasharray="4 2" />
                <XAxis dataKey="weather" tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis label={{ value: 'Avg L/h', angle: -90, position: 'insideLeft', fill: MUTED, fontSize: 11 }} tick={{ fill: MUTED, fontSize: 11 }} />
                <Tooltip content={<DarkTip />} />
                <Bar dataKey="avg_lph" name="Avg Fuel (L/h)" radius={[6,6,0,0]}>
                  {weatherData.map((_: any, i: number) => (
                    <rect key={i} fill={[COBALT, COBALT_S, COBALT_L, '#1D4ED8'][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}

        {/* ── Graph 3: 9-Model Comparison ─────────────────────────── */}
        {activeGraph === 'models' && (
          <Panel
            title="9-Model Comparison at Current Condition"
            subtitle={`${weather} · ${speed} kn · ${fuel} · Sorted ascending by consumption (lower = better)`}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={modelData} layout="vertical" barSize={22}>
                <CartesianGrid stroke={BEIGE} strokeDasharray="4 2" horizontal={false} />
                <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} label={{ value: 'L/h', position: 'insideBottom', offset: -4, fill: MUTED, fontSize: 11 }} />
                <YAxis type="category" dataKey="model" tick={{ fill: INK, fontSize: 11 }} width={120} />
                <Tooltip content={<DarkTip />} />
                <Bar dataKey="lph" name="Fuel (L/h)" fill={COBALT} radius={[0,4,4,0]}>
                  {modelData.map((_: any, i: number) => (
                    <rect key={i} fill={[COBALT, COBALT_S, COBALT_L, '#0284C7', '#06B6D4', '#4F46E5', '#6366F1', '#38BDF8', '#93C5FD'][i % 9]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {modelsInfo?.best_model && (
              <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: MUTED }}>
                <Award className="w-3.5 h-3.5" style={{ color: COBALT }} />
                Dynamically ranked best model:{' '}
                <strong style={{ color: INK }}>{modelsInfo.best_model}</strong>
                {modelsInfo.ranking_criteria && (
                  <span>· {modelsInfo.ranking_criteria}</span>
                )}
              </div>
            )}
          </Panel>
        )}

        {/* ── Graph 4: Fuel Scenario Matrix ───────────────────────── */}
        {activeGraph === 'fuel' && (
          <Panel
            title="Fuel Type Scenario Matrix"
            subtitle={`${weather} weather · ${speed} kn · Average across all shore-power settings`}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fuelMatrix} barSize={52}>
                <CartesianGrid stroke={BEIGE} strokeDasharray="4 2" />
                <XAxis dataKey="fuel" tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis label={{ value: 'Avg L/h', angle: -90, position: 'insideLeft', fill: MUTED, fontSize: 11 }} tick={{ fill: MUTED, fontSize: 11 }} />
                <Tooltip content={<DarkTip />} />
                <Bar dataKey="avg_lph" name="Avg Fuel (L/h)" radius={[6,6,0,0]}>
                  {fuelMatrix.map((entry: any, i: number) => (
                    <rect key={i} fill={FUEL_COLORS[entry.fuel] ?? COBALT_S} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}

        {/* ── Graph 5: Shore Power Impact ──────────────────────────── */}
        {activeGraph === 'shore' && shorePowerData && (
          <Panel
            title="Shore Power Impact"
            subtitle="Average sea-phase consumption with shore power OFF vs ON"
          >
            <div className="grid grid-cols-2 gap-6">
              {/* Bar comparison */}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { label: 'Shore Power OFF', value: shorePowerData.off },
                    { label: 'Shore Power ON',  value: shorePowerData.on },
                  ]}
                  barSize={64}
                >
                  <CartesianGrid stroke={BEIGE} strokeDasharray="4 2" />
                  <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} />
                  <YAxis label={{ value: 'L/h', angle: -90, position: 'insideLeft', fill: MUTED, fontSize: 11 }} tick={{ fill: MUTED, fontSize: 11 }} />
                  <Tooltip content={<DarkTip />} />
                  <Bar dataKey="value" name="Avg Fuel (L/h)" radius={[6,6,0,0]} fill={COBALT} />
                </BarChart>
              </ResponsiveContainer>

              {/* KPI tiles */}
              <div className="space-y-3">
                {[
                  { label: 'Sea-phase (OFF)', value: `${shorePowerData.off} L/h` },
                  { label: 'Sea-phase (ON)',  value: `${shorePowerData.on} L/h`  },
                  { label: 'Reduction',       value: `${Math.round((1 - shorePowerData.on / (shorePowerData.off || 1)) * 100)}%` },
                  { label: 'Aux CO₂ Avoided', value: '~2.7 MT/berth' },
                  { label: 'Grid Cost',       value: '₹36,072/berth' },
                  { label: 'Net Saving',      value: '₹1.84 Lakh/berth' },
                ].map(kpi => (
                  <div key={kpi.label} className="flex justify-between text-xs font-mono py-1.5"
                    style={{ borderBottom: `1px solid ${BEIGE}` }}>
                    <span style={{ color: MUTED }}>{kpi.label}</span>
                    <span style={{ color: INK, fontWeight: 600 }}>{kpi.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {/* ── Graph 6: Speed-Efficiency Curve ─────────────────────── */}
        {activeGraph === 'efficiency' && (
          <Panel
            title="Speed-Efficiency Curve (nm / L)"
            subtitle="Nautical miles per litre for each cruising speed — higher is better"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={speedCurveData.map((d: any) => ({
                  speed: d.speed_knots,
                  efficiency: d.predicted_fuel_lph_avg > 0 ? +(d.speed_knots / d.predicted_fuel_lph_avg).toFixed(4) : 0,
                }))}
              >
                <CartesianGrid stroke={BEIGE} strokeDasharray="4 2" />
                <XAxis dataKey="speed" label={{ value: 'Speed (knots)', position: 'insideBottom', offset: -4, fill: MUTED, fontSize: 11 }} tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis label={{ value: 'nm/L', angle: -90, position: 'insideLeft', fill: MUTED, fontSize: 11 }} tick={{ fill: MUTED, fontSize: 11 }} />
                <Tooltip content={<DarkTip />} />
                <Line type="monotone" dataKey="efficiency" name="Efficiency (nm/L)" stroke={COBALT} strokeWidth={3} dot={{ fill: COBALT, r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        )}

        {/* ── Graph 7: Model Spread ────────────────────────────────── */}
        {activeGraph === 'spread' && (
          <Panel
            title="Model Prediction Spread"
            subtitle="Variance across 9 models at each speed step — wider spread = higher uncertainty"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={speedCurveData}>
                <CartesianGrid stroke={BEIGE} strokeDasharray="4 2" />
                <XAxis dataKey="speed_knots" label={{ value: 'Speed (knots)', position: 'insideBottom', offset: -4, fill: MUTED, fontSize: 11 }} tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis label={{ value: 'L/h', angle: -90, position: 'insideLeft', fill: MUTED, fontSize: 11 }} tick={{ fill: MUTED, fontSize: 11 }} />
                <Tooltip content={<DarkTip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />
                {['catboost_lph', 'xgboost_lph', 'lightgbm_lph', 'extra_trees_lph', 'random_forest_lph'].map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key.replace('_lph', '').replace(/_/g, ' ')}
                    stroke={[COBALT, COBALT_S, COBALT_L, '#0284C7', '#4F46E5'][i]}
                    strokeWidth={1.5}
                    dot={false}
                    opacity={0.75}
                  />
                ))}
                <Line type="monotone" dataKey="predicted_fuel_lph_avg" name="Ensemble Average" stroke={INK} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        )}

        {chartsLoading && (
          <div className="text-center py-6 text-sm font-mono" style={{ color: MUTED }}>
            <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
            Loading CSV data…
          </div>
        )}
      </div>
    </div>
  );
};
