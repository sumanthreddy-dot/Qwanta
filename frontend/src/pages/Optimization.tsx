import React, { useState, useEffect } from 'react';
import {
  Cpu, Play, RotateCcw, CheckCircle2, AlertTriangle, ArrowRight,
  TrendingDown, ShieldCheck, Flame, Zap, Layers, Sparkles, IndianRupee, Sliders
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { fleetApi } from '../services/api';
import { OptimizationRequest, OptimizationResult, FuelType } from '../types';
import { ScientificHonestyBanner } from '../components/ScientificHonestyBanner';
import { formatINR, convertUsdToInr } from '../utils/currency';
import { DirectionalArrowDot } from '../components/ChartMarkers';

const COBALT = '#2563EB';
const COBALT_LIGHT = '#3B82F6';
const INK = '#0F172A';
const MUTED = '#64748B';
const BEIGE = '#C5D5EE';
const OBSIDIAN = '#0A1628';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: OBSIDIAN,
        border: '1px solid rgba(37,99,235,0.3)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: '#F0F4FF',
      }}
    >
      <div style={{ color: COBALT_LIGHT, fontWeight: 600, marginBottom: 4 }}>Iteration {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color || '#F0F4FF' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export const Optimization: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);

  // Weights & Request Config
  const [weights, setWeights] = useState({
    w_fuel: 0.30,
    w_cost: 0.25,
    w_emission: 0.25,
    w_time: 0.15,
    w_risk: 0.05
  });

  const [speedOptions, setSpeedOptions] = useState<number[]>([14.0, 16.0]);
  const [fuelOptions, setFuelOptions] = useState<FuelType[]>(['HFO', 'MGO', 'LNG', 'Biofuel']);
  const [solverType, setSolverType] = useState<string>('SimulatedAnnealing');
  const [iterations, setIterations] = useState<number>(3000);
  const [coolingRate, setCoolingRate] = useState<number>(0.985);

  const handleRunOptimization = async () => {
    setLoading(true);
    try {
      const payload: OptimizationRequest = {
        speed_options: speedOptions,
        fuel_options: fuelOptions,
        weights: weights,
        solver_type: solverType,
        iterations: iterations,
        cooling_rate: coolingRate
      };
      const res = await fleetApi.runOptimization(payload);
      setOptResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run initial baseline optimization on page load so graph & plan display immediately
  useEffect(() => {
    handleRunOptimization();
  }, []);

  const toggleSpeed = (s: number) => {
    if (speedOptions.includes(s)) {
      if (speedOptions.length > 1) setSpeedOptions(speedOptions.filter(x => x !== s));
    } else {
      setSpeedOptions([...speedOptions, s].sort());
    }
  };

  const toggleFuel = (f: FuelType) => {
    if (fuelOptions.includes(f)) {
      if (fuelOptions.length > 1) setFuelOptions(fuelOptions.filter(x => x !== f));
    } else {
      setFuelOptions([...fuelOptions, f]);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#2563EB]" />
            Quantum-Inspired QUBO Optimization Engine
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Formulating maritime multi-objective allocation as Quadratic Unconstrained Binary Optimization solved via Simulated Annealing.
          </p>
        </div>

        <button
          onClick={handleRunOptimization}
          disabled={loading}
          className="btn-primary font-mono disabled:opacity-50 self-start sm:self-auto"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Annealing QUBO...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              EXECUTE OPTIMIZATION
            </>
          )}
        </button>
      </div>

      <ScientificHonestyBanner />

      {/* Primary Configuration & Solver Grid (Form on Left, Graphs Beside on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Objective Weights & Problem Constraints (5 cols) */}
        <div className="q-card p-5 space-y-4 lg:col-span-5">
          <div className="border-b border-[#C5D5EE] pb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#2563EB]" />
              Objective Weights ($w_i$)
            </h2>
            <span className="text-[10px] font-mono text-[#64748B]">Sum: {Object.values(weights).reduce((a, b) => a + b, 0).toFixed(2)}</span>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            {/* w_fuel */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#64748B]">Fuel Consumption Weight (w_fuel):</span>
                <span className="text-[#2563EB] font-bold">{weights.w_fuel.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05"
                value={weights.w_fuel}
                onChange={(e) => setWeights({ ...weights, w_fuel: parseFloat(e.target.value) })}
                className="w-full accent-[#2563EB] bg-[#EFF6FF] rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            {/* w_cost */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#64748B]">Operating Cost Weight (w_cost):</span>
                <span className="text-[#3B82F6] font-bold">{weights.w_cost.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05"
                value={weights.w_cost}
                onChange={(e) => setWeights({ ...weights, w_cost: parseFloat(e.target.value) })}
                className="w-full accent-[#3B82F6] bg-[#EFF6FF] rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            {/* w_emission */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#64748B]">Greenhouse Gas / CO2 Weight (w_emission):</span>
                <span className="text-[#0284C7] font-bold">{weights.w_emission.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05"
                value={weights.w_emission}
                onChange={(e) => setWeights({ ...weights, w_emission: parseFloat(e.target.value) })}
                className="w-full accent-[#0284C7] bg-[#EFF6FF] rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            {/* w_time */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#64748B]">Transit Travel Time Weight (w_time):</span>
                <span className="text-[#60A5FA] font-bold">{weights.w_time.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05"
                value={weights.w_time}
                onChange={(e) => setWeights({ ...weights, w_time: parseFloat(e.target.value) })}
                className="w-full accent-[#60A5FA] bg-[#EFF6FF] rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            {/* w_risk */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#64748B]">Corridor / Sea State Risk Weight (w_risk):</span>
                <span className="text-[#4F46E5] font-bold">{weights.w_risk.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05"
                value={weights.w_risk}
                onChange={(e) => setWeights({ ...weights, w_risk: parseFloat(e.target.value) })}
                className="w-full accent-[#4F46E5] bg-[#EFF6FF] rounded-lg h-1.5 cursor-pointer"
              />
            </div>
          </div>

          {/* Solver Settings */}
          <div className="pt-3 border-t border-[#C5D5EE] space-y-3">
            <div className="text-xs font-mono">
              <label className="block text-[#64748B] mb-1">Algorithm Solver</label>
              <select
                value={solverType}
                onChange={(e) => setSolverType(e.target.value)}
                className="q-select text-xs font-sans"
              >
                <option value="SimulatedAnnealing">Simulated Annealing (Metropolis-Hastings)</option>
                <option value="ClassicalExact">Branch & Bound (Integer Linear Program)</option>
                <option value="GeneticAlgorithm">Genetic Algorithm Metaheuristic</option>
                <option value="GreedyHeuristic">Greedy Shortest-Path Baseline</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5E6263] mb-1">Iterations</label>
                <input
                  type="number" min="500" max="15000" step="500" value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value) || 3000)}
                  className="q-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[#5E6263] mb-1">Cooling Rate</label>
                <input
                  type="number" min="0.90" max="0.999" step="0.005" value={coolingRate}
                  onChange={(e) => setCoolingRate(parseFloat(e.target.value) || 0.985)}
                  className="q-input text-xs"
                />
              </div>
            </div>

            {/* Candidate Options Checkboxes */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="block text-[#64748B]">Discrete Cruising Speeds:</span>
                <span className="text-[10px] text-[#2563EB] font-mono">SIH 8–16 kn Grid</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[8.0, 10.0, 12.0, 14.0, 16.0].map((s) => (
                  <button
                    key={s} type="button" onClick={() => toggleSpeed(s)}
                    className={`px-2.5 py-1 rounded text-[11px] border transition ${
                      speedOptions.includes(s)
                        ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold shadow-xs'
                        : 'bg-[#EFF6FF] text-[#64748B] border-[#C5D5EE] hover:border-[#2563EB]'
                    }`}
                  >
                    {s} kn
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[#64748B] mb-1">Fuel Alternatives:</span>
              <div className="flex flex-wrap gap-2">
                {(['HFO', 'MGO', 'LNG', 'Biofuel', 'Electric'] as FuelType[]).map((f) => (
                  <button
                    key={f} type="button" onClick={() => toggleFuel(f)}
                    className={`px-2.5 py-1 rounded text-[11px] border transition ${
                      fuelOptions.includes(f)
                        ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] font-bold shadow-xs'
                        : 'bg-[#EFF6FF] text-[#64748B] border-[#C5D5EE] hover:border-[#1E3A8A]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Convergence Graph & QUBO Matrix (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Convergence History */}
          <div className="q-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">Quantum-Inspired Annealing Energy Convergence</h3>
                <p className="text-xs text-[#64748B]">Metropolis acceptance minimizing Hamiltonian energy $H(x) = x^T Q x$</p>
              </div>
              {optResult && (
                <span className="badge-cobalt">
                  Solved in {optResult.runtime_ms} ms
                </span>
              )}
            </div>

            <div className="h-64 w-full">
              {optResult?.convergence_history && optResult.convergence_history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={optResult.convergence_history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BEIGE} />
                    <XAxis dataKey="iteration" stroke={MUTED} fontSize={10} />
                    <YAxis stroke={MUTED} fontSize={10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="best_energy"
                      name="Best Energy"
                      stroke={COBALT}
                      strokeWidth={2.5}
                      dot={(props: any) => {
                        const total = optResult?.convergence_history?.length || 1;
                        const interval = Math.max(1, Math.floor(total / 12));
                        if (props.index % interval === 0 || props.index === total - 1) {
                          return <DirectionalArrowDot key={props.key || props.index} {...props} fill={COBALT} />;
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="current_energy" name="Current Energy" stroke={COBALT_LIGHT} strokeWidth={1} strokeDasharray="2 2" dot={false} opacity={0.6} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#64748B] font-mono text-xs">
                  Click 'EXECUTE OPTIMIZATION' to compute live convergence history
                </div>
              )}
            </div>
          </div>

          {/* QUBO Matrix Visualization */}
          {optResult?.qubo_metadata && (
            <div className="q-card p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">Hamiltonian Q-Matrix Architecture</h3>
                  <p className="text-xs text-[#64748B] font-sans">
                    {optResult.qubo_metadata.num_variables} Binary Variables • {optResult.qubo_metadata.matrix_density_percent}% Density
                  </p>
                </div>
                <span className="badge-cobalt">
                  {optResult.qubo_metadata.num_nonzero_terms} non-zero terms
                </span>
              </div>

              {/* Downsampled Heatmap Grid */}
              {optResult.qubo_metadata.downsampled_heatmap && (
                <div className="bg-[#0A1628] p-3.5 rounded-xl border border-[rgba(37,99,235,0.2)] space-y-1 overflow-x-auto shadow-inner">
                  <div className="text-[10px] text-[#3B82F6] font-semibold mb-1">QUBO 2D Sparsity Heatmap (Downsampled Matrix):</div>
                  <div className="inline-grid gap-0.5">
                    {optResult.qubo_metadata.downsampled_heatmap.map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-0.5">
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          const intensity = Math.min(1, Math.abs(val) / 20.0);
                          const bg = isDiagonal
                            ? `rgba(37, 99, 235, ${Math.max(0.35, intensity)})`
                            : val > 0
                            ? `rgba(59, 130, 246, ${Math.max(0.2, intensity)})`
                            : 'rgba(255, 255, 255, 0.05)';
                          return (
                            <div
                              key={cIdx}
                              title={`Q[${rIdx},${cIdx}] = ${val}`}
                              style={{ backgroundColor: bg }}
                              className="w-2.5 h-2.5 rounded-[1px] hover:scale-125 transition-transform cursor-pointer"
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Before vs After Baseline Comparison Cards */}
      {optResult && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            Before vs. After Optimization (Empirical Comparison)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* Fuel */}
            <div className="q-card p-4 space-y-1">
              <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">VOYAGE FUEL</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm text-[#64748B] line-through">
                    {(optResult.baseline_comparison.baseline_fuel_litres / 1000).toFixed(0)}k
                  </span>
                  <span className="text-xl font-bold text-[#0F172A] ml-2">
                    {(optResult.total_fuel_litres / 1000).toFixed(0)}k L
                  </span>
                </div>
                <span className={`text-xs font-bold ${optResult.baseline_comparison.fuel_saved_pct > 0 ? 'text-emerald-700' : 'text-[#64748B]'}`}>
                  {optResult.baseline_comparison.fuel_saved_pct > 0 ? `-${optResult.baseline_comparison.fuel_saved_pct}%` : `${Math.abs(optResult.baseline_comparison.fuel_saved_pct)}%`}
                </span>
              </div>
              <span className="text-[10px] text-[#64748B]">vs Shortest-Path Baseline</span>
            </div>

            {/* Cost */}
            <div className="q-card p-4 space-y-1">
              <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">TOTAL EXPENSE</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm text-[#64748B] line-through">
                    {formatINR(convertUsdToInr(optResult.baseline_comparison.baseline_total_cost_usd), { compact: true })}
                  </span>
                  <span className="text-xl font-bold text-[#0F172A] ml-2">
                    {formatINR(convertUsdToInr(optResult.total_cost_usd), { compact: true })}
                  </span>
                </div>
                <span className={`text-xs font-bold ${optResult.baseline_comparison.cost_saved_pct > 0 ? 'text-emerald-700' : 'text-[#64748B]'}`}>
                  {optResult.baseline_comparison.cost_saved_pct > 0 ? `-${optResult.baseline_comparison.cost_saved_pct}%` : `${Math.abs(optResult.baseline_comparison.cost_saved_pct)}%`}
                </span>
              </div>
              <span className="text-[10px] text-[#64748B]">Charter + Bunker Costs (₹ INR)</span>
            </div>

            {/* CO2 */}
            <div className="q-card p-4 space-y-1">
              <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">CO2 FOOTPRINT</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm text-[#64748B] line-through">
                    {(optResult.baseline_comparison.baseline_co2_kg / 1000).toFixed(0)}t
                  </span>
                  <span className="text-xl font-bold text-[#0F172A] ml-2">
                    {(optResult.total_co2_kg / 1000).toFixed(0)}t
                  </span>
                </div>
                <span className={`text-xs font-bold ${optResult.baseline_comparison.co2_reduced_pct > 0 ? 'text-emerald-700' : 'text-[#64748B]'}`}>
                  {optResult.baseline_comparison.co2_reduced_pct > 0 ? `-${optResult.baseline_comparison.co2_reduced_pct}%` : `${Math.abs(optResult.baseline_comparison.co2_reduced_pct)}%`}
                </span>
              </div>
              <span className="text-[10px] text-[#64748B]">Decarbonization Benefit</span>
            </div>

            {/* Transit Time */}
            <div className="q-card p-4 space-y-1">
              <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">TRANSIT DURATION</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm text-[#64748B] line-through">
                    {optResult.baseline_comparison.baseline_time_hours.toFixed(0)}h
                  </span>
                  <span className="text-xl font-bold text-[#0F172A] ml-2">
                    {optResult.total_time_hours.toFixed(0)}h
                  </span>
                </div>
                <span className="text-xs font-bold text-[#2563EB]">
                  {optResult.baseline_comparison.time_diff_pct > 0 ? `-${optResult.baseline_comparison.time_diff_pct}%` : `+${Math.abs(optResult.baseline_comparison.time_diff_pct)}%`}
                </span>
              </div>
              <span className="text-[10px] text-[#64748B]">Schedule Reliability</span>
            </div>
          </div>

          {/* Detailed Recommended Plan Table */}
          <div className="q-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Recommended Optimized Assignments</h3>

            <div className="overflow-x-auto rounded-xl border border-[#C5D5EE]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#EFF6FF] text-[#64748B] text-[11px] uppercase tracking-wider border-b border-[#C5D5EE]">
                  <tr>
                    <th className="py-3 px-3">Asset</th>
                    <th className="py-3 px-3">Shipment Leg</th>
                    <th className="py-3 px-3">Cargo Load</th>
                    <th className="py-3 px-3">Speed</th>
                    <th className="py-3 px-3">Fuel</th>
                    <th className="py-3 px-3">Predicted Fuel</th>
                    <th className="py-3 px-3">Est. Cost (₹)</th>
                    <th className="py-3 px-3">CO2</th>
                    <th className="py-3 px-3">Time / Deadline</th>
                    <th className="py-3 px-3">Feasibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF6FF] bg-white">
                  {optResult.plan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#EFF6FF]/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#0F172A]">
                        {item.vessel_name}
                        <div className="text-[10px] text-[#64748B]">{item.vessel_id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[#0F172A] font-medium">{item.origin_port} → {item.destination_port}</span>
                        <div className="text-[10px] text-[#64748B] truncate max-w-xs">{item.route_name}</div>
                      </td>
                      <td className="py-3 px-3 text-[#0F172A]">
                        {item.cargo_tonnes.toLocaleString()} t ({item.capacity_utilization_pct}%)
                      </td>
                      <td className="py-3 px-3 text-[#2563EB] font-bold">{item.speed_knots} kn</td>
                      <td className="py-3 px-3">
                        <span className="badge-cobalt">
                          {item.fuel_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#0F172A]">{(item.predicted_fuel_litres / 1000).toFixed(1)}k L</td>
                      <td className="py-3 px-3 font-medium text-[#0F172A]">
                        {formatINR(convertUsdToInr(item.total_cost_usd))}
                      </td>
                      <td className="py-3 px-3 text-[#64748B]">{(item.co2_emission_kg / 1000).toFixed(1)} t</td>
                      <td className="py-3 px-3 text-[#64748B]">
                        {item.travel_time_hours}h / {item.deadline_hours}h
                      </td>
                      <td className="py-3 px-3">
                        {item.is_feasible ? (
                          <span className="badge-success">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Feasible
                          </span>
                        ) : (
                          <span className="badge-warning" title={item.violation_notes.join('; ')}>
                            <AlertTriangle className="w-3.5 h-3.5" /> Penalty
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
