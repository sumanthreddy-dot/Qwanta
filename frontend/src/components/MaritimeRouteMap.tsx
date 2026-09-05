import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Compass, Navigation, Waves, Wind, Layers, Eye, Radio, Globe } from 'lucide-react';
import { CandidateRoute, Waypoint } from '../types';

interface PortNode {
  code: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  region: string;
}

interface FleetVesselMarker {
  id: string;
  name: string;
  type: string;
  speed: number;
  status: 'optimal' | 'warning' | 'standby' | 'transit';
  heading: number;
  lat: number;
  lon: number;
  color: string;
  zoneRadius: number; // in px for radar alert zone
  zoneColor: string;
}

interface MaritimeRouteMapProps {
  selectedRoute?: CandidateRoute | null;
  routes?: CandidateRoute[];
  onSelectRoute?: (route: CandidateRoute) => void;
  height?: string;
  autoPlay?: boolean;
}

// Strategic global maritime hubs
const GLOBAL_PORTS: Record<string, PortNode> = {
  BOM: { code: 'BOM', name: 'Mumbai (JNPT)', country: 'India', lat: 18.94, lon: 72.83, region: 'South Asia' },
  MAA: { code: 'MAA', name: 'Chennai', country: 'India', lat: 13.08, lon: 80.27, region: 'South Asia' },
  CMB: { code: 'CMB', name: 'Colombo', country: 'Sri Lanka', lat: 6.92, lon: 79.86, region: 'South Asia' },
  SGP: { code: 'SGP', name: 'Singapore', country: 'Singapore', lat: 1.29, lon: 103.85, region: 'Southeast Asia' },
  SHA: { code: 'SHA', name: 'Shanghai', country: 'China', lat: 31.23, lon: 121.47, region: 'East Asia' },
  PUS: { code: 'PUS', name: 'Busan', country: 'Korea', lat: 35.17, lon: 129.07, region: 'East Asia' },
  DXB: { code: 'DXB', name: 'Dubai', country: 'UAE', lat: 25.20, lon: 55.27, region: 'Middle East' },
  SUZ: { code: 'SUZ', name: 'Suez Canal', country: 'Egypt', lat: 29.97, lon: 32.55, region: 'Middle East' },
  RTM: { code: 'RTM', name: 'Rotterdam', country: 'Netherlands', lat: 51.92, lon: 4.47, region: 'North Europe' },
  ANR: { code: 'ANR', name: 'Antwerp', country: 'Belgium', lat: 51.22, lon: 4.40, region: 'North Europe' },
  LAX: { code: 'LAX', name: 'Los Angeles', country: 'USA', lat: 33.74, lon: -118.27, region: 'North America' },
  PAN: { code: 'PAN', name: 'Panama Canal', country: 'Panama', lat: 9.08, lon: -79.68, region: 'Central America' },
  SSZ: { code: 'SSZ', name: 'Santos', country: 'Brazil', lat: -23.96, lon: -46.33, region: 'South America' },
};

// Maritime fleet AIS live traffic vessels (Danelec-style real-time fleet overview)
const LIVE_FLEET_VESSELS: FleetVesselMarker[] = [
  { id: 'V-01', name: 'Ever Vanguard', type: 'Container (18,000 TEU)', speed: 17.4, status: 'optimal', heading: 68, lat: 14.5, lon: 112.8, color: '#EF4444', zoneRadius: 36, zoneColor: 'rgba(239, 68, 68, 0.15)' },
  { id: 'V-02', name: 'Nordic Horizon', type: 'LNG Carrier (174,000 m³)', speed: 18.2, status: 'optimal', heading: 240, lat: 2.1, lon: 104.2, color: '#F59E0B', zoneRadius: 42, zoneColor: 'rgba(245, 158, 11, 0.14)' },
  { id: 'V-03', name: 'Ocean Pioneer', type: 'Ultra Large Bulk (180k DWT)', speed: 13.8, status: 'optimal', heading: 145, lat: -2.8, lon: 118.5, color: '#10B981', zoneRadius: 38, zoneColor: 'rgba(16, 185, 129, 0.16)' },
  { id: 'V-04', name: 'Pacific Breeze', type: 'MR Product Tanker', speed: 14.5, status: 'optimal', heading: 110, lat: 19.8, lon: 116.4, color: '#3B82F6', zoneRadius: 28, zoneColor: 'rgba(59, 130, 246, 0.12)' },
  { id: 'V-05', name: 'Bharat Samudra', type: 'Aframax Crude Tanker', speed: 15.0, status: 'warning', heading: 165, lat: -4.5, lon: 102.2, color: '#EF4444', zoneRadius: 44, zoneColor: 'rgba(239, 68, 68, 0.18)' },
  { id: 'V-06', name: 'Caspian Trader', type: 'General Cargo (45k DWT)', speed: 12.1, status: 'standby', heading: 85, lat: 10.2, lon: 86.5, color: '#EAB308', zoneRadius: 25, zoneColor: 'rgba(234, 179, 8, 0.13)' },
  { id: 'V-07', name: 'Kallisto Star', type: 'Feeder Container', speed: 16.2, status: 'optimal', heading: 320, lat: -9.8, lon: 142.5, color: '#10B981', zoneRadius: 30, zoneColor: 'rgba(16, 185, 129, 0.14)' },
  { id: 'V-08', name: 'Coral Navigator', type: 'Chemical Carrier', speed: 13.4, status: 'optimal', heading: 280, lat: -10.5, lon: 130.0, color: '#3B82F6', zoneRadius: 26, zoneColor: 'rgba(59, 130, 246, 0.12)' },
];

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 520;

/**
 * Standard Equirectangular nautical projection mapping (lon/lat to SVG x/y)
 */
function project(lon: number, lat: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return { x, y };
}

export const MaritimeRouteMap: React.FC<MaritimeRouteMapProps> = ({
  selectedRoute,
  routes = [],
  onSelectRoute,
  height = '480px',
  autoPlay = true,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [vesselPos, setVesselPos] = useState<{ x: number; y: number; angle: number }>({ x: 0, y: 0, angle: 0 });
  const [hoveredPort, setHoveredPort] = useState<PortNode | null>(null);
  const [hoveredVessel, setHoveredVessel] = useState<FleetVesselMarker | null>(null);
  const [showFleetOverlay, setShowFleetOverlay] = useState<boolean>(true);
  const [showWeatherClouds, setShowWeatherClouds] = useState<boolean>(true);

  const pathRef = useRef<SVGPathElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevRouteIdRef = useRef<string | null>(null);

  // Compute Origin & Destination Coordinates
  const routeOriginPort = selectedRoute
    ? GLOBAL_PORTS[selectedRoute.origin_port] ||
    Object.values(GLOBAL_PORTS).find((p) =>
      p.name.toLowerCase().includes(selectedRoute.origin_port.toLowerCase())
    )
    : null;
  const routeDestPort = selectedRoute
    ? GLOBAL_PORTS[selectedRoute.destination_port] ||
    Object.values(GLOBAL_PORTS).find((p) =>
      p.name.toLowerCase().includes(selectedRoute.destination_port.toLowerCase())
    )
    : null;

  // Build SVG path data for selected route
  const selectedPathD = useMemo(() => {
    if (!selectedRoute) return '';

    if (selectedRoute.waypoints && selectedRoute.waypoints.length >= 2) {
      const pts = selectedRoute.waypoints.map((wp) => project(wp.lon, wp.lat));
      let d = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2 - 10;
        d += ` Q ${midX},${midY} ${curr.x},${curr.y}`;
      }
      return d;
    }

    if (routeOriginPort && routeDestPort) {
      const p1 = project(routeOriginPort.lon, routeOriginPort.lat);
      const p2 = project(routeDestPort.lon, routeDestPort.lat);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2 - 25;
      return `M ${p1.x},${p1.y} Q ${midX},${midY} ${p2.x},${p2.y}`;
    }

    return '';
  }, [selectedRoute, routeOriginPort, routeDestPort]);

  // Handle Route Switch
  useEffect(() => {
    if (selectedRoute?.route_id !== prevRouteIdRef.current) {
      prevRouteIdRef.current = selectedRoute?.route_id || null;
      setProgress(0);
      setIsPlaying(true);
    }
  }, [selectedRoute?.route_id]);

  // Animation Loop along selected route
  useEffect(() => {
    let lastTimestamp: number | null = null;
    const durationMs = 10000 / speedMultiplier;

    const step = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (isPlaying && pathRef.current) {
        setProgress((prev) => {
          let next = prev + delta / durationMs;
          if (next >= 1) {
            next = 0;
          }
          return next;
        });
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, speedMultiplier, selectedPathD]);

  // Update vessel position and heading angle based on path
  useEffect(() => {
    if (!pathRef.current) return;
    try {
      const totalLen = pathRef.current.getTotalLength();
      if (totalLen <= 0) return;

      const currentLen = progress * totalLen;
      const pt = pathRef.current.getPointAtLength(currentLen);

      const aheadLen = Math.min(totalLen, currentLen + 4);
      const aheadPt = pathRef.current.getPointAtLength(aheadLen);
      const angle = Math.atan2(aheadPt.y - pt.y, aheadPt.x - pt.x) * (180 / Math.PI);

      setVesselPos({ x: pt.x, y: pt.y, angle });
    } catch {
      // SVG fallback
    }
  }, [progress]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden relative flex flex-col border border-[#CBD5E1] shadow-md">
      {/* Top Map Header & Controls (Clean Light Maritime Theme) */}
      <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]" />
            <span className="text-xs font-bold text-[#0F172A] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#2563EB]" />
              Nautical Corridor Simulator & Fleet AIS Radar
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0] hidden sm:inline font-semibold">
            Live AIS Feed (Satellite Sync)
          </span>
        </div>

        {/* View toggles & Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Layer toggles */}
          <div className="flex items-center bg-white border border-[#CBD5E1] rounded-lg p-0.5 text-xs font-mono shadow-xs">
            <button
              onClick={() => setShowFleetOverlay(!showFleetOverlay)}
              className={`px-2 py-1 rounded transition flex items-center gap-1 text-[11px] font-medium ${showFleetOverlay ? 'bg-[#EFF6FF] text-[#2563EB] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              title="Toggle Live AIS Fleet Traffic"
            >
              <Radio className="w-3 h-3" />
              AIS Traffic ({LIVE_FLEET_VESSELS.length})
            </button>
            <button
              onClick={() => setShowWeatherClouds(!showWeatherClouds)}
              className={`px-2 py-1 rounded transition flex items-center gap-1 text-[11px] font-medium ${showWeatherClouds ? 'bg-[#EFF6FF] text-[#2563EB] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              title="Toggle Weather Cloud Simulation"
            >
              <Wind className="w-3 h-3" />
              Weather
            </button>
          </div>

          {/* Play/Pause Controls */}
          <div className="flex items-center bg-white border border-[#CBD5E1] rounded-lg p-0.5 text-xs font-mono shadow-xs">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-md transition ${isPlaying ? 'bg-[#ECFDF5] text-[#059669]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              onClick={() => setProgress(0)}
              className="p-1.5 rounded-md text-[#64748B] hover:text-[#0F172A] transition"
              title="Reset to Origin"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-white border border-[#CBD5E1] rounded-lg p-0.5 text-[11px] font-mono shadow-xs">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-1 rounded transition ${speedMultiplier === s ? 'bg-[#2563EB] text-white font-bold' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Clean Map Canvas */}
      <div className="relative w-full overflow-hidden bg-[#ECECEE]" style={{ height }}>
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Elegant Clean Ocean Background Gradient */}
            <linearGradient id="lightOcean" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EFF4F9" />
              <stop offset="50%" stopColor="#E9F0F7" />
              <stop offset="100%" stopColor="#DFE8F3" />
            </linearGradient>

            {/* Cloud Atmospheric Gradients */}
            <radialGradient id="cloudSoft1" cx="40%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#F8FAFC" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#F1F5F9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cloudSoft2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#F1F5F9" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0" />
            </radialGradient>

            {/* Route & Vessel Glow filters */}
            <filter id="lightRouteGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="vesselDropShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
            </filter>

            {/* Directional Path Arrow Marker */}
            <marker
              id="lightArrowMarker"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#2563EB" />
            </marker>
          </defs>

          {/* Clean Ocean Water Surface */}
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#lightOcean)" />

          {/* Subtle Nautical Graticule (Latitude & Longitude Gridlines) */}
          <g stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="3 5" opacity="0.6">
            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
              <line key={`x-${x}`} x1={x} y1="0" x2={x} y2={MAP_HEIGHT} />
            ))}
            {[60, 130, 200, 260, 330, 400, 470].map((y) => (
              <line key={`y-${y}`} x1="0" y1={y} x2={MAP_WIDTH} y2={y} />
            ))}
          </g>

          {/* High-Fidelity Landmass Shapes (Danelec Clean Light Grey Style with Subtle White Borders) */}
          <g fill="#DCDCDC" stroke="#FFFFFF" strokeWidth="1.2">
            {/* Europe & Nordic */}
            <path d="M 460,75 L 485,60 L 515,65 L 530,95 L 510,120 L 490,135 L 465,115 L 445,95 Z" />
            <path d="M 505,45 L 525,30 L 545,50 L 535,75 L 515,70 Z" />

            {/* British Isles */}
            <path d="M 445,70 L 458,60 L 460,82 L 448,90 Z" />

            {/* Russia / North Asia */}
            <path d="M 530,95 L 610,80 L 720,70 L 820,80 L 890,105 L 850,135 L 780,125 L 670,115 L 590,125 L 540,110 Z" />

            {/* Middle East & Arabian Peninsula */}
            <path d="M 605,175 L 655,175 L 665,225 L 640,245 L 615,230 L 600,200 Z" />

            {/* Africa continent */}
            <path d="M 495,150 L 590,155 L 610,210 L 590,300 L 565,370 L 540,410 L 515,385 L 480,310 L 455,235 L 465,185 Z" />
            <path d="M 605,335 L 620,335 L 615,380 L 600,370 Z" /> {/* Madagascar */}

            {/* Indian Subcontinent (Detailed & Prominent) */}
            <path d="M 660,170 L 725,175 L 740,215 L 730,255 L 705,295 L 685,255 L 665,215 Z" />
            <path d="M 700,302 L 708,300 L 710,315 L 702,318 Z" /> {/* Sri Lanka */}

            {/* China & East Asia */}
            <path d="M 730,140 L 820,130 L 860,155 L 855,200 L 820,230 L 760,210 L 735,175 Z" />
            {/* Korea & Japan */}
            <path d="M 855,155 L 865,155 L 865,180 L 852,175 Z" /> {/* Korea */}
            <path d="M 875,140 L 895,150 L 885,190 L 870,180 Z" /> {/* Japan */}

            {/* Southeast Asia (Indo-China & Malayan Peninsula) */}
            <path d="M 760,210 L 795,215 L 815,250 L 795,290 L 780,285 L 770,250 L 755,235 Z" />
            <path d="M 780,280 L 790,280 L 795,315 L 785,315 Z" /> {/* Malay Peninsula */}

            {/* Indonesian Archipelago & Philippines (Danelec Feature Focus) */}
            <path d="M 765,310 L 805,335 L 790,360 L 750,330 Z" /> {/* Sumatra */}
            <path d="M 800,315 L 845,310 L 840,350 L 810,355 Z" /> {/* Borneo */}
            <path d="M 810,365 L 860,368 L 845,380 L 800,375 Z" /> {/* Java */}
            <path d="M 848,325 L 865,320 L 868,360 L 850,350 Z" /> {/* Sulawesi */}
            <path d="M 825,240 L 840,240 L 845,280 L 830,280 Z" /> {/* Philippines */}
            <path d="M 880,335 L 945,340 L 935,375 L 875,365 Z" /> {/* Papua New Guinea */}

            {/* Australia */}
            <path d="M 820,385 L 910,375 L 935,420 L 920,465 L 850,475 L 815,430 Z" />
            <path d="M 915,485 L 930,480 L 925,505 L 910,500 Z" /> {/* Tasmania / New Zealand */}

            {/* North America */}
            <path d="M 75,60 L 210,65 L 260,110 L 250,175 L 205,210 L 160,215 L 125,170 L 70,120 Z" />
            {/* Central America */}
            <path d="M 160,215 L 205,210 L 230,245 L 220,270 L 195,255 Z" />
            {/* South America */}
            <path d="M 215,270 L 275,285 L 305,350 L 285,445 L 245,475 L 225,410 L 205,315 Z" />
          </g>

          {/* Soft Atmospheric Cloud Layers (Matching the Reference Map) */}
          {showWeatherClouds && (
            <g className="pointer-events-none transition-opacity duration-500" opacity="0.8">
              {/* Cloud Formation 1: Bay of Bengal to South China Sea */}
              <circle cx="750" cy="110" r="140" fill="url(#cloudSoft1)" />
              <circle cx="830" cy="80" r="110" fill="url(#cloudSoft2)" />
              {/* Cloud Formation 2: Indian Ocean Southwestern expanse */}
              <circle cx="670" cy="450" r="130" fill="url(#cloudSoft1)" />
              <circle cx="610" cy="420" r="95" fill="url(#cloudSoft2)" />
              {/* Cloud Formation 3: North Atlantic / Europe */}
              <circle cx="480" cy="50" r="120" fill="url(#cloudSoft1)" />
              {/* Cloud Formation 4: Western Pacific */}
              <circle cx="940" cy="220" r="105" fill="url(#cloudSoft2)" />
            </g>
          )}

          {/* Regional Country / Sea Labels in Danelec Styled Typography */}
          <g
            fill="#64748B"
            fontSize="10"
            fontFamily="'Inter', system-ui, sans-serif"
            fontStyle="italic"
            fontWeight="500"
            opacity="0.85"
            className="pointer-events-none select-none"
          >
            <text x="680" y="215">India</text>
            <text x="702" y="335">Sri Lanka</text>
            <text x="732" y="195">Bangladesh</text>
            <text x="765" y="215">Myanmar</text>
            <text x="770" y="250">Thailand</text>
            <text x="812" y="240">Vietnam</text>
            <text x="785" y="295">Malaysia</text>
            <text x="815" y="340">Indonesia</text>
            <text x="888" y="375">Papua New Guinea</text>
            <text x="850" y="440">Australia</text>
            <text x="620" y="195">Arabian Sea</text>
            <text x="715" y="260">Bay of Bengal</text>
          </g>

          {/* Standard Sea Lanes / Maritime Trade Corridors (Clean Neutral Grey) */}
          <g stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 4" opacity="0.5">
            <line x1={project(72.83, 18.94).x} y1={project(72.83, 18.94).y} x2={project(55.27, 25.20).x} y2={project(55.27, 25.20).y} />
            <line x1={project(72.83, 18.94).x} y1={project(72.83, 18.94).y} x2={project(79.86, 6.92).x} y2={project(79.86, 6.92).y} />
            <line x1={project(79.86, 6.92).x} y1={project(79.86, 6.92).y} x2={project(103.85, 1.29).x} y2={project(103.85, 1.29).y} />
            <line x1={project(103.85, 1.29).x} y1={project(103.85, 1.29).y} x2={project(121.47, 31.23).x} y2={project(121.47, 31.23).y} />
            <line x1={project(121.47, 31.23).x} y1={project(121.47, 31.23).y} x2={project(129.07, 35.17).x} y2={project(129.07, 35.17).y} />
            <line x1={project(32.55, 29.97).x} y1={project(32.55, 29.97).y} x2={project(4.47, 51.92).x} y2={project(4.47, 51.92).y} />
            <line x1={project(79.86, 6.92).x} y1={project(79.86, 6.92).y} x2={project(32.55, 29.97).x} y2={project(32.55, 29.97).y} />
          </g>

          {/* CANDIDATE ROUTES (Dashed subtle routes) */}
          {routes.map((r, idx) => {
            const isThisSelected = selectedRoute?.route_id === r.route_id;
            if (isThisSelected) return null;

            const orig = GLOBAL_PORTS[r.origin_port] ? project(GLOBAL_PORTS[r.origin_port].lon, GLOBAL_PORTS[r.origin_port].lat) : null;
            const dest = GLOBAL_PORTS[r.destination_port] ? project(GLOBAL_PORTS[r.destination_port].lon, GLOBAL_PORTS[r.destination_port].lat) : null;
            if (!orig || !dest) return null;

            const midX = (orig.x + dest.x) / 2;
            const midY = (orig.y + dest.y) / 2 - 15;
            const d = `M ${orig.x},${orig.y} Q ${midX},${midY} ${dest.x},${dest.y}`;

            return (
              <path
                key={r.route_id || idx}
                d={d}
                stroke="#64748B"
                strokeWidth="1.8"
                strokeDasharray="4 4"
                fill="none"
                opacity="0.5"
                className="cursor-pointer hover:stroke-[#2563EB] hover:stroke-width-2 hover:opacity-100 transition-all"
                onClick={() => onSelectRoute && onSelectRoute(r)}
              />
            );
          })}

          {/* ACTIVE SELECTED ROUTE PATH (Cobalt Blue Modern Nautical Track) */}
          {selectedPathD && (
            <>
              {/* Outer soft blue shadow halo */}
              <path
                d={selectedPathD}
                stroke="#93C5FD"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                opacity="0.45"
                filter="url(#lightRouteGlow)"
              />
              {/* Core Sharp Navigational Blue Line */}
              <path
                ref={pathRef}
                d={selectedPathD}
                stroke="#2563EB"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
                markerMid="url(#lightArrowMarker)"
              />
              {/* Animated Voyage Flow Pulse */}
              <path
                d={selectedPathD}
                stroke="#60A5FA"
                strokeWidth="2.5"
                strokeDasharray="8 18"
                strokeDashoffset={-progress * 120}
                fill="none"
                opacity="0.95"
              />
            </>
          )}

          {/* ALL STRATEGIC MARITIME PORT PINS */}
          {Object.values(GLOBAL_PORTS).map((port) => {
            const pos = project(port.lon, port.lat);
            const isOrigin = routeOriginPort?.code === port.code;
            const isDest = routeDestPort?.code === port.code;
            const isRelevant = isOrigin || isDest;

            return (
              <g
                key={port.code}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer transition-transform hover:scale-125"
                onMouseEnter={() => setHoveredPort(port)}
                onMouseLeave={() => setHoveredPort(null)}
              >
                {/* Ping wave for active origin/destination */}
                {isOrigin && (
                  <circle r="14" fill="#2563EB" opacity="0.2" className="animate-ping" />
                )}
                {isDest && (
                  <circle r="14" fill="#059669" opacity="0.2" className="animate-ping" />
                )}

                {/* Port center node circle */}
                <circle
                  r={isRelevant ? 6.5 : 4}
                  fill={isOrigin ? '#2563EB' : isDest ? '#059669' : '#FFFFFF'}
                  stroke={isRelevant ? '#FFFFFF' : '#475569'}
                  strokeWidth={isRelevant ? '2.5' : '1.5'}
                  filter="url(#vesselDropShadow)"
                />

                {/* Port Code Label */}
                <text
                  x={8}
                  y={4}
                  fill={isRelevant ? '#0F172A' : '#475569'}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize={isRelevant ? 11 : 9}
                  fontWeight={isRelevant ? 'bold' : '600'}
                  className="pointer-events-none drop-shadow-sm select-none"
                >
                  {port.code} {isRelevant ? `(${port.name})` : ''}
                </text>
              </g>
            );
          })}

          {/* DANELEC-STYLE FLEET AIS TRAFFIC OVERLAY (Ship Hull Silhouettes with Proximity Halos) */}
          {showFleetOverlay &&
            LIVE_FLEET_VESSELS.map((ship) => {
              const pos = project(ship.lon, ship.lat);
              return (
                <g
                  key={ship.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer transition-transform hover:scale-115"
                  onMouseEnter={() => setHoveredVessel(ship)}
                  onMouseLeave={() => setHoveredVessel(null)}
                >
                  {/* Concentric Circular Proximity Zone (Danelec Radar Aesthetic) */}
                  <circle
                    r={ship.zoneRadius}
                    fill={ship.zoneColor}
                    stroke={ship.color}
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    opacity="0.8"
                  />
                  <circle
                    r={ship.zoneRadius * 0.6}
                    fill={ship.zoneColor}
                    opacity="0.6"
                  />

                  {/* Rotated Vessel Hull Silhouette */}
                  <g transform={`rotate(${ship.heading})`}>
                    {/* Realistic Vessel Hull Shape (Pointed Bow, Rounded Stern) */}
                    <path
                      d="M 0,-15 C 6,-9 7,4 6,12 C 4,14 -4,14 -6,12 C -7,4 -6,-9 0,-15 Z"
                      fill="#FFFFFF"
                      stroke={ship.color}
                      strokeWidth="2.2"
                      filter="url(#vesselDropShadow)"
                    />
                    {/* Bridge Superstructure line */}
                    <rect x="-3" y="3" width="6" height="5" rx="1" fill={ship.color} />
                  </g>
                </g>
              );
            })}

          {/* PRIMARY OPTIMIZED VOYAGE SHIP MARKER TRAVERSING ROUTE */}
          {selectedRoute && vesselPos.x > 0 && (
            <g
              transform={`translate(${vesselPos.x}, ${vesselPos.y}) rotate(${vesselPos.angle})`}
              filter="url(#vesselDropShadow)"
              className="pointer-events-none"
            >
              {/* Active Dispatch Radar Pulse Ring */}
              <circle r="18" fill="#2563EB" opacity="0.15" />
              <circle r="10" fill="#2563EB" opacity="0.3" />

              {/* Vessel Hull Silhouette in Rich Cobalt/White */}
              <path
                d="M 0,-18 C 7,-11 8,6 7,15 C 5,17 -5,17 -7,15 C -8,6 -7,-11 0,-18 Z"
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="2.4"
              />
              {/* Deck superstructure */}
              <rect x="-3.5" y="3" width="7" height="6" rx="1.5" fill="#FFFFFF" />
              {/* Bow Beacon */}
              <circle cx="0" cy="-14" r="2.2" fill="#60A5FA" />
            </g>
          )}
        </svg>

        {/* Floating Danelec-Style Solutions / Resources Badge (Top-Right of Map) */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#0F172A]/75 text-white backdrop-blur-md rounded-lg px-3 py-1.5 text-xs font-medium shadow-md border border-white/20">
          <span className="cursor-pointer hover:text-[#60A5FA] transition">Fleet Overview</span>
          <span className="text-white/40">|</span>
          <span className="cursor-pointer hover:text-[#60A5FA] transition">AIS Telemetry</span>
        </div>

        {/* Hovered Port Tooltip */}
        {hoveredPort && (
          <div className="absolute top-4 left-4 bg-white/95 border border-[#CBD5E1] px-3.5 py-2 rounded-xl text-xs font-mono text-[#0F172A] shadow-xl backdrop-blur-md pointer-events-none z-20">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="text-[#2563EB] font-bold">{hoveredPort.name}</span>
              <span className="text-[#64748B]">({hoveredPort.code})</span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              {hoveredPort.country} · {hoveredPort.region} · {hoveredPort.lat.toFixed(2)}°N, {hoveredPort.lon.toFixed(2)}°E
            </div>
          </div>
        )}

        {/* Hovered AIS Vessel Tooltip */}
        {hoveredVessel && (
          <div className="absolute top-4 left-4 bg-white/95 border border-[#CBD5E1] px-3.5 py-2.5 rounded-xl text-xs font-mono text-[#0F172A] shadow-xl backdrop-blur-md pointer-events-none z-20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredVessel.color }} />
              <span className="font-bold text-sm text-[#0F172A]">{hoveredVessel.name}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                style={{
                  backgroundColor: `${hoveredVessel.color}15`,
                  color: hoveredVessel.color,
                }}
              >
                {hoveredVessel.status}
              </span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 space-y-0.5">
              <div>Type: <span className="font-semibold text-[#0F172A]">{hoveredVessel.type}</span></div>
              <div>Speed: <span className="font-semibold text-[#2563EB]">{hoveredVessel.speed} knots</span> · Heading: <span className="font-semibold text-[#0F172A]">{hoveredVessel.heading}°</span></div>
              <div>Position: {hoveredVessel.lat.toFixed(2)}°N, {hoveredVessel.lon.toFixed(2)}°E</div>
            </div>
          </div>
        )}

        {/* Floating Telemetry Badge (Bottom-Left) */}
        {selectedRoute && (
          <div className="absolute bottom-3 left-3 bg-white/90 border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F172A] backdrop-blur-md flex items-center gap-3 shadow-md">
            <div>
              <span className="text-[10px] text-[#64748B] block uppercase font-semibold">ACTIVE VOYAGE</span>
              <span className="text-[#0F172A] font-bold">{selectedRoute.name}</span>
            </div>
            <div className="border-l border-[#CBD5E1] pl-3">
              <span className="text-[10px] text-[#64748B] block uppercase font-semibold">VOYAGE PROGRESS</span>
              <span className="text-[#2563EB] font-bold">{(progress * 100).toFixed(0)}% Completed</span>
            </div>
          </div>
        )}

        {/* Scientific Honesty Disclaimer Badge */}
        <div className="absolute bottom-3 right-3 bg-white/80 border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-[10px] font-mono text-[#64748B] backdrop-blur-sm shadow-xs">
          Interactive AIS Fleet Simulator — Synchronized with QUBO Waypoint Graph
        </div>
      </div>
    </div>
  );
};
