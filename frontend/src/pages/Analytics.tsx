import React, { useState, useEffect } from 'react';
import { PieChart, IndianRupee, ShieldAlert, Award, TrendingDown, Leaf, Ship, Gauge } from 'lucide-react';
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { fleetApi } from '../services/api';
import { AnalyticsResponse } from '../types';
import { formatINR, convertUsdToInr } from '../utils/currency';

const BLUE = '#2563EB';
const BLUE_S = '#3B82F6';
const INK = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#C5D5EE';
const NAVY = '#0A1628';

const FUEL_COLORS = ['#2563EB', '#3B82F6', '#0284C7', '#60A5FA', '#93C5FD'];

const CII_COLORS: Record<string, string> = {
  A: '#15803d',
  B: '#22c55e',
  C: '#b45309',
  D: '#ea580c',
  E: '#dc2626',
};

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
      <div style={{ color: BLUE_S, fontWeight: 600, marginBottom: 4 }}>{label || payload[0]?.name}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey || p.name} style={{ color: p.color || '#F0F4FF' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    fleetApi.getAnalytics().then(setAnalytics).catch(console.error);
  }, []);

  const fuelData = analytics?.fuel_distribution_pct
    ? Object.entries(analytics.fuel_distribution_pct).map(([name, value]) => ({ name, value }))
    : [
        { name: 'LNG', value: 35 },
        { name: 'MGO', value: 28 },
        { name: 'HFO', value: 25 },
        { name: 'Biofuel', value: 10 },
        { name: 'Electric', value: 2 },
      ];

  const ciiData = analytics?.imo_cii_ratings
    ? Object.entries(analytics.imo_cii_ratings).map(([grade, count]) => ({ grade: grade.slice(0, 1), count, full: grade }))
    : [
        { grade: 'A', count: 3, full: 'A (Major Superior)' },
        { grade: 'B', count: 4, full: 'B (Minor Superior)' },
        { grade: 'C', count: 2, full: 'C (Moderate)' },
        { grade: 'D', count: 1, full: 'D (Minor Inferior)' },
        { grade: 'E', count: 0, full: 'E (Major Inferior)' },
      ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
          <Leaf className="w-6 h-6 text-[#2563EB]" />
          ESG Decarbonization & Operational Analytics
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Track fleet environmental efficiency, IMO Carbon Intensity Indicator (CII) compliance, and carbon cost reductions.
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="q-card p-4 space-y-1">
          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">TOTAL ACTIVE ASSETS</span>
          <div className="text-2xl font-bold text-[#0F172A]">{analytics?.total_active_vessels || 10} Vessels</div>
          <span className="text-[11px] text-[#2563EB] font-semibold">{((analytics?.total_fleet_capacity_tonnes || 750000) / 1000).toFixed(0)}k DWT Total Capacity</span>
        </div>

        <div className="q-card p-4 space-y-1">
          <span className="text-[11px] text-[#2563EB] uppercase tracking-wider font-semibold block">ESTIMATED CARBON TAX SAVED</span>
          <div className="text-2xl font-bold text-[#0F172A]">
            {formatINR(convertUsdToInr(analytics?.carbon_tax_saved_estimated_usd || 142500), { compact: true })}
          </div>
          <span className="text-[11px] text-[#64748B]">Under EU ETS / IMO Pricing (₹ INR)</span>
        </div>

        <div className="q-card p-4 space-y-1">
          <span className="text-[11px] text-[#1D4ED8] uppercase tracking-wider font-semibold block">FLEET AVERAGE AGE</span>
          <div className="text-2xl font-bold text-[#0F172A]">{analytics?.avg_fleet_age_years || 5.4} Years</div>
          <span className="text-[11px] text-[#64748B]">High-efficiency modern tonnage</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IMO CII Rating Distribution */}
        <div className="q-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">IMO Carbon Intensity Indicator (CII) Ratings</h3>
              <p className="text-xs text-[#64748B]">Mandatory IMO rating grade from A (Superior) to E (Inferior)</p>
            </div>
            <span className="badge-copper">
              90% Compliant (A-C)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ciiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="grade" stroke={MUTED} fontSize={11} />
                <YAxis stroke={MUTED} fontSize={11} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Vessels in Grade" radius={[4, 4, 0, 0]}>
                  {ciiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CII_COLORS[entry.grade] || BLUE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Fuel Breakdown */}
        <div className="q-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Alternative Fuel Mix Distribution</h3>
              <p className="text-xs text-[#64748B]">Share of energy consumption by fuel classification</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={fuelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {fuelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FUEL_COLORS[index % FUEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
