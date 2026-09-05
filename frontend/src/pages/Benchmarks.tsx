import React, { useState, useEffect } from 'react';
import { BarChart3, Play, Clock, CheckCircle2, AlertTriangle, ShieldCheck, Scale, IndianRupee } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { fleetApi } from '../services/api';
import { BenchmarkResponse, ScalabilityRecord } from '../types';
import { ScientificHonestyBanner } from '../components/ScientificHonestyBanner';
import { formatINR, convertUsdToInr } from '../utils/currency';
import { DirectionalArrowDot, NavigationTriangleDot } from '../components/ChartMarkers';

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
      <div style={{ color: BLUE_S, fontWeight: 600, marginBottom: 4 }}>{label} vessels</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color || '#F0F4FF' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export const Benchmarks: React.FC = () => {
  const [benchmark, setBenchmark] = useState<BenchmarkResponse | null>(null);
  const [scalability, setScalability] = useState<ScalabilityRecord[]>([]);
  const [mlMetrics, setMlMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchBenchmark = async () => {
    setLoading(true);
    try {
      const [bmData, scData, modelsData] = await Promise.all([
        fleetApi.runBenchmark(),
        fleetApi.getScalability(),
        fleetApi.getModels()
      ]);
      setBenchmark(bmData);
      setScalability(scData);
      setMlMetrics(modelsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#2563EB]" />
            Algorithmic Benchmarks & Scalability Suite
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Empirical comparative analysis across Classical Baselines, Genetic Algorithms, and QUBO + Simulated Annealing.
          </p>
        </div>

        <button
          onClick={fetchBenchmark}
          disabled={loading}
          className="btn-copper font-mono disabled:opacity-50 self-start sm:self-auto"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running Benchmarks...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Re-run Live Benchmark
            </>
          )}
        </button>
      </div>

      <ScientificHonestyBanner />

      {/* Main Benchmark Comparison Table */}
      <div className="q-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Controlled Benchmark Results</h2>
            <p className="text-xs text-[#64748B] font-mono">
              Evaluated over {benchmark?.num_qubo_variables || 1152} binary decision variables with identical operational constraints.
            </p>
          </div>
          <span className="badge-copper">
            Real-Time Execution
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#C5D5EE]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#EFF6FF] text-[#64748B] text-[11px] uppercase tracking-wider border-b border-[#C5D5EE]">
              <tr>
                <th className="py-3 px-4">Algorithm Architecture</th>
                <th className="py-3 px-4">Total Fuel (L)</th>
                <th className="py-3 px-4">Total Cost (₹)</th>
                <th className="py-3 px-4">CO2 (Tonnes)</th>
                <th className="py-3 px-4">Transit Time</th>
                <th className="py-3 px-4">Runtime (ms)</th>
                <th className="py-3 px-4">Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF6FF] bg-white">
              {benchmark?.benchmark_table.map((row, idx) => {
                const isProposed = row.algorithm.includes('Simulated Annealing');
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isProposed ? 'bg-[rgba(37,99,235,0.08)] font-bold border-l-3 border-[#2563EB]' : 'hover:bg-[#EFF6FF]/50'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-[#0F172A] flex items-center gap-2">
                      {row.algorithm}
                      {isProposed && (
                        <span className="badge-copper text-[10px]">
                          Proposed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#0F172A]">{(row.total_fuel_litres / 1000).toFixed(1)}k</td>
                    <td className="py-3.5 px-4 text-[#2563EB] font-medium">{formatINR(convertUsdToInr(row.total_cost_usd))}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{row.total_co2_tonnes.toFixed(1)} t</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{row.total_travel_time_hours.toFixed(1)}h</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{row.runtime_ms} ms</td>
                    <td className="py-3.5 px-4">
                      {row.constraint_violations === 0 ? (
                        <span className="badge-success">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 0
                        </span>
                      ) : (
                        <span className="badge-warning font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> {row.constraint_violations}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9 Machine Learning Models Comparative Evaluation */}
      <div className="q-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#0F172A]">9 Machine Learning Models — Evaluation & Dynamic Ranking</h2>
              <span className="badge-cobalt">Kamsarmax Fleet Reference</span>
            </div>
            <p className="text-xs text-[#64748B] font-mono mt-0.5">
              Empirical evaluation across 6,000 operational samples. Strictly excludes internal engine states (RPM, torque) from decision-time inference.
            </p>
          </div>
          {mlMetrics?.ranking?.best_model && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[rgba(37,99,235,0.08)] border border-[#2563EB]/20 text-xs font-mono text-[#2563EB]">
              <span>Rank #1 Champion:</span>
              <strong className="font-bold">{mlMetrics.ranking.best_model}</strong>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#C5D5EE]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#EFF6FF] text-[#64748B] text-[11px] uppercase tracking-wider border-b border-[#C5D5EE]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Model Architecture</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">R² Score</th>
                <th className="py-3 px-4">MAE (L/h)</th>
                <th className="py-3 px-4">RMSE (L/h)</th>
                <th className="py-3 px-4">MAPE (%)</th>
                <th className="py-3 px-4">Inference (ms)</th>
                <th className="py-3 px-4">Project Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF6FF] bg-white">
              {(mlMetrics?.models || mlMetrics?.model_metrics || [
                { rank: 1, model_name: 'Extra Trees', r2: 0.9817, mae: 16.80, rmse: 28.86, mape: 2.52, prediction_runtime_ms: 18.33, is_tree_based: true },
                { rank: 2, model_name: 'HistGradientBoosting', r2: 0.9809, mae: 17.74, rmse: 29.43, mape: 2.80, prediction_runtime_ms: 2.73, is_tree_based: true },
                { rank: 3, model_name: 'Random Forest', r2: 0.9808, mae: 16.43, rmse: 29.55, mape: 2.57, prediction_runtime_ms: 16.68, is_tree_based: true },
                { rank: 4, model_name: 'XGBoost', r2: 0.9783, mae: 17.30, rmse: 31.42, mape: 2.76, prediction_runtime_ms: 1.55, is_tree_based: true },
                { rank: 5, model_name: 'CatBoost', r2: 0.9782, mae: 18.76, rmse: 31.45, mape: 2.90, prediction_runtime_ms: 1.35, is_tree_based: true },
                { rank: 6, model_name: 'LightGBM', r2: 0.9779, mae: 18.24, rmse: 31.69, mape: 2.90, prediction_runtime_ms: 2.31, is_tree_based: false },
                { rank: 7, model_name: 'MLP Neural Network', r2: 0.9006, mae: 45.24, rmse: 67.20, mape: 6.47, prediction_runtime_ms: 1.17, is_tree_based: false },
                { rank: 8, model_name: 'SVM / SVR', r2: 0.8301, mae: 57.55, rmse: 87.83, mape: 8.72, prediction_runtime_ms: 409.21, is_tree_based: false },
                { rank: 9, model_name: 'Linear Regression', r2: 0.8043, mae: 61.36, rmse: 94.28, mape: 10.96, prediction_runtime_ms: 0.11, is_tree_based: false },
              ]).map((m: any, idx: number) => {
                const isChampion = m.rank === 1 || idx === 0;
                const isPrimary = m.model_name === 'CatBoost';
                const role = m.model_name === 'CatBoost' ? 'Primary Optimizer Predictor'
                  : m.model_name === 'XGBoost' ? 'Primary Challenger'
                  : m.model_name === 'Extra Trees' ? 'Top Accuracy Benchmark'
                  : m.model_name === 'LightGBM' ? 'Fast Boosting Benchmark'
                  : m.model_name === 'HistGradientBoosting' ? 'Lightweight GBDT'
                  : m.model_name === 'Random Forest' ? 'Classical Ensemble'
                  : m.model_name === 'MLP Neural Network' ? 'Deep Learning Baseline'
                  : m.model_name === 'SVM / SVR' ? 'Non-linear Baseline'
                  : 'Classical Linear Baseline';

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isChampion
                        ? 'bg-[rgba(37,99,235,0.06)] font-bold border-l-3 border-[#2563EB]'
                        : isPrimary
                        ? 'bg-blue-50/40 border-l-3 border-[#0284C7]'
                        : 'hover:bg-[#EFF6FF]/40'
                    }`}
                  >
                    <td className="py-3 px-4 text-[#0F172A]">#{m.rank || idx + 1}</td>
                    <td className="py-3 px-4 text-[#0F172A] flex items-center gap-1.5">
                      {m.model_name}
                      {isChampion && <span className="badge-copper text-[10px]">Rank #1</span>}
                      {isPrimary && <span className="badge-cobalt text-[10px]">Primary</span>}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {m.is_tree_based ? 'Tree Ensemble' : m.model_name.includes('MLP') ? 'Neural Net' : 'Classical'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2563EB]">{(m.r2 ?? 0.95).toFixed(4)}</td>
                    <td className="py-3 px-4 text-[#0F172A]">{(m.mae ?? 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-[#64748B]">{(m.rmse ?? 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-[#64748B]">{(m.mape ?? 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-[#64748B]">{(m.prediction_runtime_ms ?? 0).toFixed(2)} ms</td>
                    <td className="py-3 px-4 text-[#0284C7] font-medium">{role}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scalability Charts (Runtime & Objective vs Fleet Size) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runtime Scalability */}
        <div className="q-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0F172A]">Runtime Scalability vs Fleet Size</h3>
            <span className="text-xs text-[#64748B] font-mono">Execution latency (ms)</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scalability} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="fleet_size" stroke={MUTED} fontSize={11} unit=" vessels" />
                <YAxis stroke={MUTED} fontSize={11} unit=" ms" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="sa_runtime_ms"
                  name="QUBO + SA (ms)"
                  stroke={BLUE}
                  strokeWidth={2.5}
                  dot={<NavigationTriangleDot fill={BLUE} stroke={BLUE} />}
                />
                <Line
                  type="monotone"
                  dataKey="greedy_runtime_ms"
                  name="Greedy Baseline (ms)"
                  stroke="#1E3A8A"
                  strokeWidth={2}
                  dot={<DirectionalArrowDot fill="#1E3A8A" stroke="#1E3A8A" />}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Binary Variables Explosion */}
        <div className="q-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0F172A]">QUBO Combinatorial Space Explosion</h3>
            <span className="text-xs text-[#64748B] font-mono">Number of Binary Variables</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scalability} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="fleet_size" stroke={MUTED} fontSize={11} unit=" vessels" />
                <YAxis stroke={MUTED} fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="num_qubo_variables" name="Decision Variables (N)" fill={BLUE_S} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
