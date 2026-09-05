import React, { useState, useEffect } from 'react';
import { Compass, Navigation, Waves, Wind, ShieldAlert, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { fleetApi } from '../services/api';
import { CandidateRoute } from '../types';
import { MaritimeRouteMap } from '../components/MaritimeRouteMap';
import { RouteInfoPanel } from '../components/RouteInfoPanel';

export const Routes: React.FC = () => {
  const [ports, setPorts] = useState<any[]>([]);
  const [corridors, setCorridors] = useState<any[]>([]);
  const [origin, setOrigin] = useState<string>('BOM'); // Mumbai default for Indian routing demo
  const [destination, setDestination] = useState<string>('MAA'); // Chennai default
  const [candidates, setCandidates] = useState<CandidateRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<CandidateRoute | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fleetApi.getPorts().then(setPorts).catch(console.error);
    fleetApi.getCorridors().then(setCorridors).catch(console.error);
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const data = await fleetApi.getCandidateRoutes(origin, destination);
      setCandidates(data);
      if (data.length > 0) {
        setSelectedRoute(data[0]);
      } else {
        setSelectedRoute(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [origin, destination]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#2563EB]" />
            Global Maritime Corridors & Candidate Route Generator
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            NetworkX multi-path generation via Yen's $k$-shortest algorithms incorporating sea state risk and weather vectors.
          </p>
        </div>

        {/* Origin / Destination Selector */}
        <div className="flex items-center gap-2 q-card p-2 font-mono text-xs shadow-xs">
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[#64748B]">From:</span>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="bg-transparent text-[#0F172A] font-bold outline-none cursor-pointer"
            >
              {ports.map((p) => (
                <option key={p.code} value={p.code} className="bg-white text-[#0F172A]">
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-[#2563EB]" />

          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[#64748B]">To:</span>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent text-[#0F172A] font-bold outline-none cursor-pointer"
            >
              {ports.map((p) => (
                <option key={p.code} value={p.code} className="bg-white text-[#0F172A]">
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Animated Route Map */}
      <div className="space-y-4">
        <MaritimeRouteMap
          selectedRoute={selectedRoute}
          routes={candidates}
          onSelectRoute={(r) => setSelectedRoute(r)}
          height="450px"
          autoPlay={true}
        />

        {/* Selected Route Detailed Telemetry Panel */}
        <RouteInfoPanel route={selectedRoute} speedKnots={16.0} />
      </div>

      {/* Candidate Routes Comparison Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
            <span>Generated Feasible Route Options</span>
            <span className="badge-cobalt">
              {candidates.length} alternatives
            </span>
          </h2>
          <span className="text-xs text-[#64748B] font-mono">Click card to simulate voyage on map</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {candidates.map((route, idx) => {
            const isSelected = selectedRoute?.route_id === route.route_id;
            return (
              <div
                key={route.route_id}
                onClick={() => setSelectedRoute(route)}
                className={`q-card p-5 space-y-4 relative cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30 bg-[#EFF6FF]'
                    : 'border-[#C5D5EE] hover:border-[#3B82F6] bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#2563EB] font-bold">{route.route_id}</span>
                  {idx === 0 && (
                    <span className="badge-cobalt">
                      Recommended Primary
                    </span>
                  )}
                  {isSelected && idx !== 0 && (
                    <span className="badge-cobalt">
                      Active On Map
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0F172A] mt-1 leading-tight">{route.name}</h3>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#EFF6FF] p-3 rounded-xl border border-[#C5D5EE]">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">DISTANCE</span>
                    <span className="text-[#0F172A] font-bold text-sm">{route.distance_nm.toLocaleString()} nm</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">SEA STATE</span>
                    <span className="text-[#2563EB] font-semibold">{route.weather_condition}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">AVG WIND / WAVES</span>
                    <span className="text-[#0F172A]">{route.avg_wind_speed_knots} kn / {route.avg_wave_height_m}m</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">CHOKE RISK</span>
                    <span className={route.congestion_risk > 0.15 ? 'text-amber-700 font-bold' : 'text-[#0F172A]'}>
                      {(route.congestion_risk * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Transit Times across speeds */}
                <div className="space-y-1.5 text-xs font-mono">
                  <span className="text-[#64748B] text-[11px] block font-semibold">Transit Time by Speed:</span>
                  <div className="flex justify-between bg-[#EFF6FF]/60 p-2 rounded-lg text-[11px] border border-[#C5D5EE]">
                    <span>14 kn: {(route.distance_nm / 14).toFixed(0)}h</span>
                    <span className="text-[#2563EB] font-bold">16 kn: {(route.distance_nm / 16).toFixed(0)}h</span>
                    <span>18 kn: {(route.distance_nm / 18).toFixed(0)}h</span>
                  </div>
                </div>

                {/* Waypoints */}
                {route.waypoints && route.waypoints.length > 0 && (
                  <div className="text-[11px] font-mono text-[#64748B] pt-2 border-t border-[#C5D5EE]">
                    <span className="text-[#64748B] block mb-1">Waypoints:</span>
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      {route.waypoints.map((wp, wIdx) => (
                        <React.Fragment key={wIdx}>
                          <span className="text-[#0F172A] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#C5D5EE]">
                            {wp.name}
                          </span>
                          {wIdx < (route.waypoints?.length || 0) - 1 && <span className="text-[#2563EB]">→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Corridor Network Grid */}
      <div className="q-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0F172A]">Global Strategic Sea-Lanes ({corridors.length} Corridors)</h2>
          <span className="text-xs text-[#64748B] font-mono">12 International Maritime Hubs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {corridors.map((c, i) => (
            <div key={i} className="bg-[#EFF6FF] border border-[#C5D5EE] p-3 rounded-xl text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-[#0F172A] font-semibold">
                <span>{c.from} ↔ {c.to}</span>
                <span className="text-[#2563EB]">{c.distance_nm} nm</span>
              </div>
              <p className="text-[10px] text-[#64748B] truncate">{c.from_name} to {c.to_name}</p>
              <div className="flex justify-between text-[10px] text-[#64748B] pt-1">
                <span>{c.weather}</span>
                <span>Current: {c.current} kn</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
