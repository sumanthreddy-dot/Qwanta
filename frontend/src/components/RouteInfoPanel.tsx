import React from 'react';
import { Compass, Navigation, Clock, ShieldCheck, AlertTriangle, Wind, Waves, Fuel, ArrowRight } from 'lucide-react';
import { CandidateRoute } from '../types';
import { formatINR } from '../utils/currency';

interface RouteInfoPanelProps {
  route: CandidateRoute | null;
  speedKnots?: number;
}

export const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({
  route,
  speedKnots = 16.0
}) => {
  if (!route) {
    return (
      <div className="q-card p-5 text-center text-xs font-mono text-[#64748B] flex flex-col items-center justify-center min-h-[160px]">
        <Compass className="w-8 h-8 text-[#2563EB] mb-2 stroke-[1.5]" />
        Select a maritime corridor to inspect route parameters and hydrodynamics
      </div>
    );
  }

  // Calculate dynamic estimated transit duration based on active operating speed
  const transitHours = Math.round(route.distance_nm / (speedKnots > 0 ? speedKnots : 16.0));
  const reliabilityPct = Math.max(78, Math.round(100 - (route.congestion_risk * 100 * 0.7) - (route.avg_wave_height_m * 2.5)));
  const riskLabel = route.congestion_risk > 0.18 ? 'Moderate' : route.congestion_risk > 0.08 ? 'Low' : 'Minimal';

  // Estimated fuel calculation (approx. cubic power law)
  const estFuelTonnes = Math.round((route.distance_nm / (speedKnots * 24)) * 32.0 * Math.pow(speedKnots / 16.0, 3));
  const estCostInr = estFuelTonnes * (640 * 83.5); // LNG benchmark in INR

  return (
    <div className="q-card p-5 space-y-4">
      {/* Header */}
      <div className="border-b border-[#C5D5EE] pb-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-[#2563EB] uppercase tracking-wider font-semibold block">
            SELECTED ROUTE CORRIDOR
          </span>
          <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mt-0.5">
            <span>{route.origin_port}</span>
            <ArrowRight className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>{route.destination_port}</span>
          </h3>
          <span className="text-[11px] text-[#64748B] font-mono">{route.name}</span>
        </div>
        <span className="badge-copper">
          {route.route_id}
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-[#EFF6FF] p-3 rounded-xl border border-[#C5D5EE]">
          <span className="text-[#64748B] block text-[10px] flex items-center gap-1 font-semibold">
            <Compass className="w-3 h-3 text-[#2563EB]" /> NAUTICAL DISTANCE
          </span>
          <span className="text-[#0F172A] font-bold text-base mt-0.5 block">
            {route.distance_nm.toLocaleString()} <span className="text-xs font-normal text-[#64748B]">nm</span>
          </span>
        </div>

        <div className="bg-[#EFF6FF] p-3 rounded-xl border border-[#C5D5EE]">
          <span className="text-[#64748B] block text-[10px] flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3 text-[#2563EB]" /> ESTIMATED VOYAGE
          </span>
          <span className="text-[#0F172A] font-bold text-base mt-0.5 block">
            {transitHours} <span className="text-xs font-normal text-[#64748B]">hrs (@ {speedKnots} kn)</span>
          </span>
        </div>

        <div className="bg-[#EFF6FF] p-3 rounded-xl border border-[#C5D5EE]">
          <span className="text-[#64748B] block text-[10px] flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3 h-3 text-[#2563EB]" /> CORRIDOR RELIABILITY
          </span>
          <span className="text-[#0F172A] font-bold text-base mt-0.5 block">
            {reliabilityPct}%
          </span>
        </div>

        <div className="bg-[#EFF6FF] p-3 rounded-xl border border-[#C5D5EE]">
          <span className="text-[#64748B] block text-[10px] flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3 h-3 text-[#2563EB]" /> CHOKE / SEA RISK
          </span>
          <span className="font-bold text-base mt-0.5 block text-[#0F172A]">
            {riskLabel} ({(route.congestion_risk * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Weather & Hydrodynamic Metocean Conditions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono bg-[#EFF6FF]/60 p-3 rounded-xl border border-[#C5D5EE]">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-[#2563EB] shrink-0" />
          <div>
            <span className="text-[#64748B] text-[10px] block font-semibold">SEA STATE</span>
            <span className="text-[#0F172A] font-medium">{route.weather_condition} ({route.avg_wave_height_m}m waves)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-[#2563EB] shrink-0" />
          <div>
            <span className="text-[#64748B] text-[10px] block font-semibold">PREVAILING WIND</span>
            <span className="text-[#0F172A] font-medium">{route.avg_wind_speed_knots} kn velocity</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-[#2563EB] shrink-0" />
          <div>
            <span className="text-[#64748B] text-[10px] block font-semibold">EST. BUNKER BUDGET</span>
            <span className="text-[#0F172A] font-bold">~{formatINR(estCostInr, { compact: true })}</span>
          </div>
        </div>
      </div>

      {/* Waypoints sequence */}
      {route.waypoints && route.waypoints.length > 0 && (
        <div className="pt-2 border-t border-[#C5D5EE] text-[11px] font-mono">
          <span className="text-[#64748B] block mb-1.5 uppercase text-[10px] font-semibold">CORRIDOR WAYPOINTS & TRANSIT FIXES</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {route.waypoints.map((wp, idx) => (
              <React.Fragment key={idx}>
                <span className="bg-[#EFF6FF] text-[#0F172A] px-2 py-0.5 rounded border border-[#C5D5EE]">
                  {wp.name}
                </span>
                {idx < (route.waypoints?.length || 0) - 1 && (
                  <span className="text-[#2563EB] font-bold">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
