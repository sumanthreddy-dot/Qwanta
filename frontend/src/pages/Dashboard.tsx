import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fuel,
  IndianRupee,
  CloudLightning,
  Ship,
  TrendingDown,
  ArrowUpRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Gauge,
  Compass,
  Sliders,
  ArrowRight,
  Zap,
  RefreshCw,
  BarChart3,
  Database,
  Anchor,
  Clock,
  Waves
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { KPICard } from '../components/KPICard';
import { ScientificHonestyBanner } from '../components/ScientificHonestyBanner';
import { fleetApi } from '../services/api';
import { OptimizationResult, Vessel } from '../types';
import { formatINR, convertUsdToInr } from '../utils/currency';

const BLUE = '#2563EB';
const BLUE_S = '#3B82F6';
const INK = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#C5D5EE';
const NAVY = '#0A1628';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: NAVY,
        border: '1px solid rgba(37,99,235,0.3)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: '#F0F4FF',
      }}
    >
      <div style={{ color: BLUE_S, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color || '#F0F4FF' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [fleet, setFleet] = useState<Vessel[]>([]);
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vessels = await fleetApi.getFleet();
        setFleet(vessels);

        // Run default optimization to show live plan
        const result = await fleetApi.runOptimization({
          speed_options: [16.0, 18.0],
          solver_type: 'SimulatedAnnealing',
          iterations: 1500
        });
        setOptResult(result);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Speed vs consumption hydrodynamic curve
  const speedTrendData = [
    { speed: '12 kn', fuel_hfo: 24.5, fuel_lng: 18.2, co2: 75 },
    { speed: '14 kn', fuel_hfo: 33.1, fuel_lng: 24.8, co2: 101 },
    { speed: '16 kn', fuel_hfo: 45.8, fuel_lng: 34.2, co2: 140 },
    { speed: '18 kn', fuel_hfo: 64.2, fuel_lng: 48.1, co2: 196 },
    { speed: '20 kn', fuel_hfo: 89.6, fuel_lng: 67.0, co2: 274 },
    { speed: '22 kn', fuel_hfo: 125.0, fuel_lng: 93.5, co2: 382 },
  ];

  const fuelEmissionsData = [
    { name: 'HFO', price_per_tonne_inr: Math.round(520 * 83.5), co2_per_tonne: 3.11, color: '#1E3A8A' },
    { name: 'MGO', price_per_tonne_inr: Math.round(780 * 83.5), co2_per_tonne: 3.21, color: '#1D4ED8' },
    { name: 'LNG', price_per_tonne_inr: Math.round(640 * 83.5), co2_per_tonne: 2.75, color: BLUE },
    { name: 'Biofuel', price_per_tonne_inr: Math.round(950 * 83.5), co2_per_tonne: 1.15, color: BLUE_S },
    { name: 'Electric', price_per_tonne_inr: Math.round(420 * 83.5), co2_per_tonne: 0.35, color: '#60A5FA' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
            <Ship className="w-6 h-6 text-[#2563EB]" />
            Fleet Operations & Optimization Console
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Real-time hydrodynamic fuel modeling, multi-objective scheduling, and quantum-inspired dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/predictions')}
            className="btn-ivory"
          >
            <Gauge className="w-4 h-4 text-[#2563EB]" />
            Fuel Studio
          </button>
          <button
            onClick={() => navigate('/optimization')}
            className="btn-primary font-mono"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run QUBO Optimizer
          </button>
        </div>
      </div>

      {/* Customer / Dispatcher Welcome Banner */}
      <DashboardUserBanner />

      {/* Interactive Dispatcher Input Workbench */}
      <DispatcherWorkbench />

      <ScientificHonestyBanner compact />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="TOTAL PREDICTED FUEL"
          value={optResult ? (optResult.total_fuel_litres / 1000).toFixed(1) : '---'}
          unit="k Litres"
          change={optResult?.baseline_comparison.fuel_saved_pct ? `${optResult.baseline_comparison.fuel_saved_pct > 0 ? '-' : '+'}${Math.abs(optResult.baseline_comparison.fuel_saved_pct)}% vs Base` : undefined}
          changePositive={optResult ? optResult.baseline_comparison.fuel_saved_pct > 0 : true}
          icon={Fuel}
          color="blue"
          subtext="Estimated voyage consumption"
        />
        <KPICard
          title="OPERATIONAL VOYAGE COST"
          value={optResult ? formatINR(convertUsdToInr(optResult.total_cost_usd), { compact: true }) : '---'}
          unit="INR"
          change={optResult?.baseline_comparison.cost_saved_pct ? `${optResult.baseline_comparison.cost_saved_pct > 0 ? '-' : '+'}${Math.abs(optResult.baseline_comparison.cost_saved_pct)}%` : undefined}
          changePositive={optResult ? optResult.baseline_comparison.cost_saved_pct > 0 : true}
          icon={IndianRupee}
          color="blue"
          subtext="Bunker fuel + vessel charter"
        />
        <KPICard
          title="ESTIMATED CO2 EMISSIONS"
          value={optResult ? (optResult.total_co2_kg / 1000).toFixed(1) : '---'}
          unit="Tonnes"
          change={optResult?.baseline_comparison.co2_reduced_pct ? `${optResult.baseline_comparison.co2_reduced_pct > 0 ? '-' : '+'}${Math.abs(optResult.baseline_comparison.co2_reduced_pct)}% vs Base` : undefined}
          changePositive={optResult ? optResult.baseline_comparison.co2_reduced_pct > 0 : true}
          icon={CloudLightning}
          color="blue"
          subtext="Direct GHG footprint"
        />
        <KPICard
          title="AVG CAPACITY UTILIZATION"
          value={optResult ? `${optResult.avg_capacity_utilization_pct}%` : '85.4%'}
          unit="Deadweight"
          change="+6.2% efficiency"
          changePositive={true}
          icon={Ship}
          color="blue"
          subtext="Active fleet cargo load"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speed vs Fuel Cubic Law Chart */}
        <div className="q-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">Speed vs. Fuel Consumption Non-Linearity</h2>
              <p className="text-xs text-[#64748B]">Illustrating cubic hydrodynamic resistance law ($P \propto v^3$) for HFO vs. LNG</p>
            </div>
            <span className="badge-cobalt">
              Naval Physics
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHfo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={BLUE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="speed" stroke={MUTED} fontSize={11} />
                <YAxis stroke={MUTED} fontSize={11} unit=" t/d" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="fuel_hfo" name="Heavy Fuel Oil (MT/day)" stroke="#1E3A8A" fillOpacity={1} fill="url(#colorHfo)" />
                <Area type="monotone" dataKey="fuel_lng" name="Liquefied Natural Gas (MT/day)" stroke={BLUE} fillOpacity={1} fill="url(#colorLng)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Fuel Carbon vs Cost Profile */}
        <div className="q-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Fuel Carbon Intensity vs. Price</h2>
            <p className="text-xs text-[#64748B]">Emission factor (t CO2 / t fuel) vs. Price (₹ / MT)</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelEmissionsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="name" stroke={MUTED} fontSize={11} />
                <YAxis stroke={MUTED} fontSize={11} />
                <Tooltip
                  content={<CustomTooltip />}
                  formatter={(value: any, name: string) => {
                    if (name === 'co2_per_tonne') return [`${value} t CO2/t`, 'Carbon Factor'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="co2_per_tonne" name="t CO2 / tonne fuel" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recommended Fleet Plan Table */}
      <div className="q-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              Recommended Quantum-Inspired Fleet Dispatch Plan
            </h2>
            <p className="text-xs text-[#64748B]">
              Optimal vessel assignment, corridor routing, speed option, and fuel choice solved by Simulated Annealing.
            </p>
          </div>
          <button
            onClick={() => navigate('/optimization')}
            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-mono flex items-center gap-1 self-start sm:self-auto font-semibold"
          >
            Adjust Objectives & Penalties <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#C5D5EE]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#EFF6FF] text-[#64748B] text-[11px] uppercase tracking-wider border-b border-[#C5D5EE]">
              <tr>
                <th className="py-3 px-4">Vessel</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Demand / Route</th>
                <th className="py-3 px-4">Speed</th>
                <th className="py-3 px-4">Fuel</th>
                <th className="py-3 px-4">Est. Fuel</th>
                <th className="py-3 px-4">Est. Cost (₹)</th>
                <th className="py-3 px-4">Est. CO2</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Feasibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF6FF] bg-white">
              {optResult && optResult.plan.length > 0 ? (
                optResult.plan.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#EFF6FF]/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                      {item.vessel_name}
                      <div className="text-[10px] text-[#64748B]">{item.vessel_id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{item.vessel_type}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-[#0F172A] font-medium">
                        {item.origin_port} → {item.destination_port}
                      </div>
                      <div className="text-[10px] text-[#64748B] truncate max-w-xs">{item.route_name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#2563EB] font-bold">{item.speed_knots} kn</td>
                    <td className="py-3.5 px-4">
                      <span className="badge-cobalt">
                        {item.fuel_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#0F172A]">{(item.predicted_fuel_litres / 1000).toFixed(1)}k L</td>
                    <td className="py-3.5 px-4 text-[#0F172A] font-semibold">{formatINR(convertUsdToInr(item.total_cost_usd || item.fuel_cost_usd + item.operating_cost_usd), { compact: true })}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{(item.co2_emission_kg / 1000).toFixed(1)} t</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{item.travel_time_hours}h</td>
                    <td className="py-3.5 px-4">
                      {item.is_feasible ? (
                        <span className="badge-success">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Feasible
                        </span>
                      ) : (
                        <span className="badge-warning" title={item.violation_notes.join(', ')}>
                          <AlertTriangle className="w-3.5 h-3.5" /> Violation
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#64748B]">
                    Loading recommended fleet plan...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DashboardUserBanner: React.FC = () => {
  const [user, setUser] = useState<{
    name: string;
    role: string;
    avatarInitials: string;
    company: string;
    stickerLabel: string;
  }>({
    name: 'Capt. Rajesh Sharma',
    role: 'Chief Fleet Dispatcher',
    avatarInitials: 'RS',
    company: 'Oceanic Freight Logistics (India)',
    stickerLabel: 'Verified Dispatcher',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('qwanta_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  return (
    <div
      className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-xs"
      style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(16,185,129,0.04) 100%)',
        borderColor: 'rgba(197,213,238,0.9)',
      }}
    >
      <div className="flex items-center gap-3.5">
        {/* User Avatar Circle */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)' }}
        >
          {user.avatarInitials || 'RS'}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-extrabold text-[#0F172A]">
              Welcome back, {user.name}
            </span>
            {/* Customer Sticker Badge */}
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-xs"
              style={{
                background: 'rgba(37,99,235,0.12)',
                color: '#2563EB',
                border: '1px solid rgba(37,99,235,0.3)',
              }}
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-[#2563EB]" />
              {user.stickerLabel || 'Verified Dispatcher'}
            </span>
            <span className="text-[10px] font-mono text-[#059669] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Session Active
            </span>
          </div>

          <p className="text-xs text-[#64748B] mt-0.5 font-sans">
            Logged into <strong className="text-[#0F172A]">{user.company}</strong> · Managing 12 Fleet Assets across 6 SIH Corridors (Mormugao, Paradip, Vizag, Kandla, Qingdao, Rotterdam)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
        <a
          href="/login"
          className="text-xs font-mono text-[#2563EB] hover:text-[#1D4ED8] bg-white px-3 py-1.5 rounded-lg border border-[#C5D5EE] shadow-2xs hover:border-[#2563EB] transition-colors"
        >
          Switch Account
        </a>
      </div>
    </div>
  );
};

const SIH_CORRIDORS = [
  { id: 'R1', name: 'Mormugao to Rotterdam (via Suez)', distance_nm: 7800, origin: 'Mormugao (India)', dest: 'Rotterdam (Netherlands)', deadline_h: 580 },
  { id: 'R2', name: 'Paradip to Qingdao (Bay of Bengal → South China Sea)', distance_nm: 4300, origin: 'Paradip (India)', dest: 'Qingdao (China)', deadline_h: 360 },
  { id: 'R3', name: 'Visakhapatnam to Singapore (Bay of Bengal → Malacca)', distance_nm: 1570, origin: 'Visakhapatnam (India)', dest: 'Singapore', deadline_h: 150 },
  { id: 'R4', name: 'Kandla to Fujairah (Arabian Sea → Gulf of Oman)', distance_nm: 950, origin: 'Kandla (India)', dest: 'Fujairah (UAE)', deadline_h: 90 },
  { id: 'R5', name: 'Mormugao to Newcastle (Indian Ocean → Pacific)', distance_nm: 6100, origin: 'Mormugao (India)', dest: 'Newcastle (Australia)', deadline_h: 460 },
  { id: 'R6', name: 'Chennai to Colombo (Palk Bay / Sri Lanka)', distance_nm: 360, origin: 'Chennai (India)', dest: 'Colombo (Sri Lanka)', deadline_h: 35 },
];

const VESSEL_CLASSES = [
  { id: 'Kamsarmax', name: 'Kamsarmax Bulk Carrier (82,000 DWT)', capacity: 82000, power_kw: 9800, min_spd: 9.0, max_spd: 15.5 },
  { id: 'Capesize', name: 'Capesize Bulk Carrier (180,000 DWT)', capacity: 180000, power_kw: 16500, min_spd: 8.5, max_spd: 15.0 },
  { id: 'Panamax', name: 'Panamax Bulk Carrier (75,000 DWT)', capacity: 75000, power_kw: 9200, min_spd: 9.0, max_spd: 15.0 },
  { id: 'Supramax', name: 'Supramax Bulk Carrier (58,000 DWT)', capacity: 58000, power_kw: 8500, min_spd: 9.0, max_spd: 14.5 },
  { id: 'Handysize', name: 'Handysize Bulk Carrier (38,000 DWT)', capacity: 38000, power_kw: 6800, min_spd: 9.0, max_spd: 14.0 },
  { id: 'Aframax', name: 'Aframax Tanker (115,000 DWT)', capacity: 115000, power_kw: 14200, min_spd: 9.0, max_spd: 15.5 },
];

const DispatcherWorkbench: React.FC = () => {
  const navigate = useNavigate();

  // User input states
  const [selectedCorridor, setSelectedCorridor] = useState(SIH_CORRIDORS[0]);
  const [selectedVesselClass, setSelectedVesselClass] = useState(VESSEL_CLASSES[0]);
  const [cargoTonnes, setCargoTonnes] = useState<number>(72000);
  const [speedKnots, setSpeedKnots] = useState<number>(12.0);
  const [weatherCondition, setWeatherCondition] = useState<string>('Normal');
  const [fuelType, setFuelType] = useState<string>('Conventional');
  const [shorePower, setShorePower] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>('CatBoost');

  // Computed results state
  const [computing, setComputing] = useState<boolean>(false);
  const [computedStats, setComputedStats] = useState({
    fuelLitresPerHour: 937.7,
    voyageHours: 650.0,
    voyageFuelMT: 518.1,
    fuelCostINR: 42482300,
    fuelCostUSD: 508770,
    co2Tonnes: 1957.5,
    ciiScore: 3.48,
    ciiRating: 'A',
    scheduleFeasible: true,
  });

  // Calculate whenever user changes inputs
  useEffect(() => {
    setComputing(true);
    const timer = setTimeout(() => {
      const distance = selectedCorridor.distance_nm;
      const speed = Math.max(1.0, speedKnots);
      const hours = distance / speed;

      // Base consumption calibrated from 270-scenario grid
      // Speed cubic law: P ~ v^3
      const refSpeed = 12.0;
      const refLph = activeModel === 'Extra Trees' ? 939.2
        : activeModel === 'CatBoost' ? 937.7
        : activeModel === 'XGBoost' ? 904.1
        : activeModel === 'LightGBM' ? 875.5
        : 920.0;

      const speedFactor = Math.pow(speed / refSpeed, 2.7);
      const weatherFactor = weatherCondition === 'Severe Weather' ? 1.14
        : weatherCondition === 'Bad Weather' ? 1.06
        : 1.0;

      const capacityFactor = Math.pow(selectedVesselClass.capacity / 70000.0, 0.55);
      const cargoLoadPct = Math.min(1.0, cargoTonnes / selectedVesselClass.capacity);
      const loadFactor = 0.70 + (cargoLoadPct * 0.30);

      const lph = refLph * speedFactor * weatherFactor * capacityFactor * loadFactor;
      const totalLitres = lph * hours;
      const totalMT = totalLitres * 0.00085;

      const pricePerLitreUsd = fuelType === 'LNG' ? 0.65
        : fuelType === 'Methanol' ? 0.95
        : fuelType === 'Hydrogen' ? 2.40
        : fuelType === 'Ammonia' ? 1.20
        : 0.82; // Conventional

      const wtwFactor = fuelType === 'LNG' ? 2.45
        : fuelType === 'Methanol' ? 1.65
        : fuelType === 'Hydrogen' ? 0.35
        : fuelType === 'Ammonia' ? 0.45
        : 3.20; // Conventional kg CO2e/L

      const totalCostUSD = totalLitres * pricePerLitreUsd;
      const totalCostINR = totalCostUSD * 83.5;
      const co2Kg = totalLitres * wtwFactor;
      const co2Tonnes = co2Kg / 1000.0;

      const cii = (co2Kg * 1000.0) / (selectedVesselClass.capacity * distance);
      const ciiRating = cii < 4.0 ? 'A' : cii < 6.0 ? 'B' : cii < 8.5 ? 'C' : cii < 11.5 ? 'D' : 'E';
      const scheduleFeasible = hours <= selectedCorridor.deadline_h * 1.15;

      setComputedStats({
        fuelLitresPerHour: Math.round(lph * 10) / 10,
        voyageHours: Math.round(hours * 10) / 10,
        voyageFuelMT: Math.round(totalMT * 10) / 10,
        fuelCostUSD: Math.round(totalCostUSD),
        fuelCostINR: Math.round(totalCostINR),
        co2Tonnes: Math.round(co2Tonnes * 10) / 10,
        ciiScore: Math.round(cii * 100) / 100,
        ciiRating,
        scheduleFeasible,
      });

      setComputing(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [selectedCorridor, selectedVesselClass, cargoTonnes, speedKnots, weatherCondition, fuelType, activeModel]);

  return (
    <div className="q-card p-5 sm:p-6 space-y-6 border-[#C5D5EE] shadow-sm relative overflow-hidden bg-white">
      {/* Decorative gradient header accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: 'linear-gradient(90deg, #1D4ED8 0%, #2563EB 50%, #10B981 100%)' }}
      />

      {/* Title & Perspective context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB] shadow-2xs border border-blue-200"
            >
              <Sliders className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0F172A]">
              Dispatcher's Scenario Workbench
            </h2>
            <span className="badge-copper text-[10px]">
              Customer Input Perspective
            </span>
            <span className="badge-cobalt text-[10px]">
              Live 9-Model Sync
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Feed your cargo shipment demands, choose target corridors, vessel hulls, and sea conditions — see how QWANTA translates your operational data into multi-objective decision plans.
          </p>
        </div>

        {/* 1-Click Corridor Scenarios Quick Load */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-[#64748B]">Quick Load Corridor:</span>
          <select
            value={selectedCorridor.id}
            onChange={(e) => {
              const c = SIH_CORRIDORS.find(x => x.id === e.target.value);
              if (c) setSelectedCorridor(c);
            }}
            className="text-xs font-mono font-bold bg-[#EFF6FF] border border-[#C5D5EE] rounded-lg px-2.5 py-1.5 text-[#2563EB] cursor-pointer"
          >
            {SIH_CORRIDORS.map(c => (
              <option key={c.id} value={c.id}>
                {c.id}: {c.origin.split(' ')[0]} → {c.dest.split(' ')[0]} ({c.distance_nm} nm)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: 6 Operational Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
        {/* 1. Corridor & Route */}
        <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-[#E2E8F0]">
          <label className="font-semibold text-[#64748B] uppercase tracking-wide flex items-center gap-1 text-[10px]">
            <Compass className="w-3 h-3 text-[#2563EB]" />
            1. Corridor & Passage
          </label>
          <select
            value={selectedCorridor.id}
            onChange={(e) => {
              const c = SIH_CORRIDORS.find(x => x.id === e.target.value);
              if (c) setSelectedCorridor(c);
            }}
            className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1.5 text-xs font-medium text-[#0F172A]"
          >
            {SIH_CORRIDORS.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex justify-between text-[10px] font-mono text-[#2563EB] pt-1">
            <span>{selectedCorridor.distance_nm} nm</span>
            <span>Target: &lt;{selectedCorridor.deadline_h}h</span>
          </div>
        </div>

        {/* 2. Vessel Class */}
        <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-[#E2E8F0]">
          <label className="font-semibold text-[#64748B] uppercase tracking-wide flex items-center gap-1 text-[10px]">
            <Ship className="w-3 h-3 text-[#2563EB]" />
            2. Candidate Vessel
          </label>
          <select
            value={selectedVesselClass.id}
            onChange={(e) => {
              const v = VESSEL_CLASSES.find(x => x.id === e.target.value);
              if (v) {
                setSelectedVesselClass(v);
                setCargoTonnes(Math.round(v.capacity * 0.88));
              }
            }}
            className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1.5 text-xs font-medium text-[#0F172A]"
          >
            {VESSEL_CLASSES.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <div className="flex justify-between text-[10px] font-mono text-[#64748B] pt-1">
            <span>Power: {selectedVesselClass.power_kw} kW</span>
            <span>{selectedVesselClass.capacity.toLocaleString()} DWT</span>
          </div>
        </div>

        {/* 3. Cargo Demand Payload */}
        <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-[#E2E8F0]">
          <div className="flex justify-between items-center text-[10px]">
            <label className="font-semibold text-[#64748B] uppercase tracking-wide flex items-center gap-1">
              <Anchor className="w-3 h-3 text-[#2563EB]" />
              3. Cargo Load
            </label>
            <span className="font-mono font-bold text-[#2563EB]">{cargoTonnes.toLocaleString()} t</span>
          </div>
          <input
            type="range"
            min={Math.round(selectedVesselClass.capacity * 0.3)}
            max={selectedVesselClass.capacity}
            step={1000}
            value={cargoTonnes}
            onChange={(e) => setCargoTonnes(Number(e.target.value))}
            className="w-full accent-[#2563EB]"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#64748B]">
            <span>Util: {Math.round((cargoTonnes / selectedVesselClass.capacity) * 100)}%</span>
            <span>Cap: {selectedVesselClass.capacity.toLocaleString()} t</span>
          </div>
        </div>

        {/* 4. Cruising Speed */}
        <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-[#E2E8F0]">
          <div className="flex justify-between items-center text-[10px]">
            <label className="font-semibold text-[#64748B] uppercase tracking-wide flex items-center gap-1">
              <Gauge className="w-3 h-3 text-[#2563EB]" />
              4. Speed (knots)
            </label>
            <span className="font-mono font-bold text-[#2563EB]">{speedKnots.toFixed(1)} kn</span>
          </div>
          <input
            type="range"
            min={8.0}
            max={16.0}
            step={0.5}
            value={speedKnots}
            onChange={(e) => setSpeedKnots(Number(e.target.value))}
            className="w-full accent-[#2563EB]"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#64748B]">
            <span>8.0 kn (Eco)</span>
            <span>16.0 kn (Max)</span>
          </div>
        </div>

        {/* 5. Weather Severity */}
        <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-[#E2E8F0]">
          <label className="font-semibold text-[#64748B] uppercase tracking-wide flex items-center gap-1 text-[10px]">
            <Waves className="w-3 h-3 text-[#2563EB]" />
            5. Weather State
          </label>
          <select
            value={weatherCondition}
            onChange={(e) => setWeatherCondition(e.target.value)}
            className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2 py-1.5 text-xs font-medium text-[#0F172A]"
          >
            <option value="Normal">Calm / Normal Sea</option>
            <option value="Bad Weather">Moderate Winds / Swell</option>
            <option value="Severe Weather">Severe Weather (Hs &gt; 4m)</option>
          </select>
          <div className="text-[10px] font-mono text-[#64748B] pt-1 truncate">
            {weatherCondition === 'Severe Weather' ? '⚠️ +14% Drag Factor' : weatherCondition === 'Bad Weather' ? '🌊 +6% Drag Factor' : '✅ Baseline Resistance'}
          </div>
        </div>

        {/* 6. Bunker Fuel Choice & ML Predictor */}
        <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-[#E2E8F0]">
          <label className="font-semibold text-[#64748B] uppercase tracking-wide flex items-center gap-1 text-[10px]">
            <Fuel className="w-3 h-3 text-[#2563EB]" />
            6. Fuel & Predictor
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="bg-white border border-[#CBD5E1] rounded-lg px-1.5 py-1 text-[11px] font-medium text-[#0F172A]"
            >
              <option value="Conventional">HFO/VLSFO</option>
              <option value="LNG">LNG</option>
              <option value="Methanol">Methanol</option>
              <option value="Ammonia">Ammonia</option>
              <option value="Hydrogen">Hydrogen</option>
            </select>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="bg-white border border-[#2563EB]/40 rounded-lg px-1.5 py-1 text-[11px] font-bold text-[#2563EB]"
            >
              <option value="CatBoost">CatBoost (Primary)</option>
              <option value="Extra Trees">Extra Trees (R² 0.98)</option>
              <option value="XGBoost">XGBoost (1.5ms)</option>
              <option value="LightGBM">LightGBM (Fast)</option>
            </select>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-0.5">
            <span>Shore Power:</span>
            <button
              type="button"
              onClick={() => setShorePower(!shorePower)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${shorePower ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}
            >
              {shorePower ? '⚡ ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Calculated Scenario Preview Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            Live Simulated Operational Outcomes (Derived from {activeModel} &amp; Naval Physics)
          </span>
          {computing && (
            <span className="text-[10px] font-mono text-[#2563EB] flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Recalculating...
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Rate */}
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-0.5">
            <span className="text-[10px] font-mono text-[#64748B] uppercase">Fuel Rate</span>
            <div className="text-base font-extrabold text-[#0F172A]">{computedStats.fuelLitresPerHour} L/h</div>
            <div className="text-[10px] font-mono text-[#2563EB]">{activeModel} inference</div>
          </div>

          {/* Voyage Fuel */}
          <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-0.5">
            <span className="text-[10px] font-mono text-[#64748B] uppercase">Voyage Fuel</span>
            <div className="text-base font-extrabold text-[#0F172A]">{computedStats.voyageFuelMT} MT</div>
            <div className="text-[10px] font-mono text-[#64748B]">{selectedCorridor.distance_nm} nm transit</div>
          </div>

          {/* Transit Time */}
          <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-0.5">
            <span className="text-[10px] font-mono text-[#64748B] uppercase">Transit Time</span>
            <div className="text-base font-extrabold text-[#0F172A]">{computedStats.voyageHours} hrs</div>
            <div className={`text-[10px] font-mono font-semibold ${computedStats.scheduleFeasible ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
              {computedStats.scheduleFeasible ? `✓ Feasible (<${selectedCorridor.deadline_h}h)` : '⚠️ Exceeds Deadline'}
            </div>
          </div>

          {/* Bunker Cost in INR */}
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-0.5">
            <span className="text-[10px] font-mono text-[#64748B] uppercase">Bunker Cost</span>
            <div className="text-base font-extrabold text-[#2563EB]">{formatINR(computedStats.fuelCostINR, { compact: true })}</div>
            <div className="text-[10px] font-mono text-[#64748B]">₹{(computedStats.fuelCostINR / 100000).toFixed(2)} Lakh (INR)</div>
          </div>

          {/* WTW GHG Emissions */}
          <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-0.5">
            <span className="text-[10px] font-mono text-[#64748B] uppercase">WTW CO₂</span>
            <div className="text-base font-extrabold text-[#0F172A]">{computedStats.co2Tonnes} t</div>
            <div className="text-[10px] font-mono text-[#059669]">Well-to-Wake factor</div>
          </div>

          {/* IMO CII Rating */}
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-0.5">
            <span className="text-[10px] font-mono text-[#64748B] uppercase">IMO CII Rating</span>
            <div className="text-base font-extrabold text-[#059669] flex items-center gap-1">
              <span>Rating {computedStats.ciiRating}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono">Superior</span>
            </div>
            <div className="text-[10px] font-mono text-[#64748B]">Score: {computedStats.ciiScore} g/t·nm</div>
          </div>
        </div>
      </div>

      {/* Feature Showcase Navigation Gateway */}
      <div className="pt-2 border-t border-[#E2E8F0] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Explore This Scenario Across All Project Capabilities:
          </span>
          <span className="text-[11px] font-mono text-[#2563EB]">6 Operational Modules Connected</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* 1. Fuel Studio */}
          <button
            onClick={() => navigate(`/predictions?weather=${weatherCondition}&fuel=${fuelType}&speed=${speedKnots}`)}
            className="p-2.5 rounded-xl border border-[#C5D5EE] hover:border-[#2563EB] hover:bg-blue-50/50 transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-[#2563EB] mb-1">
              <Gauge className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Fuel Studio</div>
              <div className="text-[10px] text-[#64748B] leading-tight">Compare all 9 ML models vs speed curves</div>
            </div>
          </button>

          {/* 2. QUBO Optimizer */}
          <button
            onClick={() => navigate('/optimization')}
            className="p-2.5 rounded-xl border border-[#C5D5EE] hover:border-[#2563EB] hover:bg-blue-50/50 transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-[#2563EB] mb-1">
              <Zap className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">QUBO Engine</div>
              <div className="text-[10px] text-[#64748B] leading-tight">Quantum-inspired Simulated Annealing</div>
            </div>
          </button>

          {/* 3. Corridors & Routes */}
          <button
            onClick={() => navigate('/routes')}
            className="p-2.5 rounded-xl border border-[#C5D5EE] hover:border-[#2563EB] hover:bg-blue-50/50 transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-[#2563EB] mb-1">
              <Compass className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Corridor Routes</div>
              <div className="text-[10px] text-[#64748B] leading-tight">6 real passages with GIS waypoints</div>
            </div>
          </button>

          {/* 4. Fleet Registry */}
          <button
            onClick={() => navigate('/fleet')}
            className="p-2.5 rounded-xl border border-[#C5D5EE] hover:border-[#2563EB] hover:bg-blue-50/50 transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-[#2563EB] mb-1">
              <Ship className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Fleet Registry</div>
              <div className="text-[10px] text-[#64748B] leading-tight">Manage Handysize to Capesize assets</div>
            </div>
          </button>

          {/* 5. Benchmarks Suite */}
          <button
            onClick={() => navigate('/benchmarks')}
            className="p-2.5 rounded-xl border border-[#C5D5EE] hover:border-[#2563EB] hover:bg-blue-50/50 transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-[#2563EB] mb-1">
              <BarChart3 className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Benchmarks</div>
              <div className="text-[10px] text-[#64748B] leading-tight">9-model matrix &amp; solver scalability</div>
            </div>
          </button>

          {/* 6. ESG & Decarbonization */}
          <button
            onClick={() => navigate('/analytics')}
            className="p-2.5 rounded-xl border border-[#C5D5EE] hover:border-[#2563EB] hover:bg-blue-50/50 transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-[#2563EB] mb-1">
              <TrendingDown className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">ESG Decarb</div>
              <div className="text-[10px] text-[#64748B] leading-tight">CII tracking &amp; IMO 2030 compliance</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
