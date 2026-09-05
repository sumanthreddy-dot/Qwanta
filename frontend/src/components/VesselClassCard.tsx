import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Gauge, Package, ArrowRight, Layers, Compass, Sparkles, AlertCircle } from 'lucide-react';
import { Vessel } from '../types';
import { getVesselImage, getVesselClassInfo } from '../utils/vesselAssets';
import { formatINR } from '../utils/currency';

interface VesselClassCardProps {
  vessel: Vessel;
  isSelected?: boolean;
  onSelect?: (vessel: Vessel) => void;
  showStudioAction?: boolean;
}

export const VesselClassCard: React.FC<VesselClassCardProps> = ({
  vessel,
  isSelected = false,
  onSelect,
  showStudioAction = true
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [showCargo, setShowCargo] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const classInfo = getVesselClassInfo(vessel.vessel_type);
  const imageSrc = imageError ? '/images/vessels/container_ship.svg' : getVesselImage(vessel.vessel_type);

  // Dynamic 3D mouse parallax tilt calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -9; // Tilt up to 9 deg
    const rotateY = ((x - centerX) / centerX) * 9;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleStudioNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/predictions?vessel=${vessel.vessel_id}`, { state: { selectedVesselId: vessel.vessel_id } });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect && onSelect(vessel)}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${tilt.x !== 0 ? '8px' : '0px'})`,
        transition: tilt.x === 0 ? 'transform 0.5s ease-out, box-shadow 0.3s ease' : 'transform 0.1s ease-out',
      }}
      className={`bg-white rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between border relative preserve-3d group ${
        isSelected
          ? 'border-[#2563EB] shadow-[0_12px_32px_-4px_rgba(37,99,235,0.35)] ring-2 ring-[#2563EB]/40'
          : 'border-[#C5D5EE] hover:border-[#2563EB] hover:shadow-xl'
      }`}
    >
      {/* Dynamic 3D Vessel Floating Stage */}
      <div className="relative aspect-[16/9] w-full bg-[#0A1628] overflow-hidden">
        {/* Animated Background Ocean Flow Effect */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_120%,#2563EB_0%,#0A1628_75%)] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0A1628] to-transparent z-10 pointer-events-none" />

        {/* 3D Swaying Vessel Image */}
        <img
          src={imageSrc}
          alt={`${vessel.name} — ${vessel.vessel_type}`}
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover animate-ocean-sway group-hover:scale-108 transition-transform duration-700"
        />

        {/* 3D Depth Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
          <span className="text-[10px] font-mono font-bold bg-[#0A1628]/90 text-[#60A5FA] px-2.5 py-0.5 rounded-full border border-[#2563EB]/50 backdrop-blur-md shadow-sm">
            {vessel.vessel_id}
          </span>
          <span className="text-[10px] font-mono bg-[#0A1628]/90 text-[#C5D5EE] px-2 py-0.5 rounded-md border border-[#3B82F6]/40 backdrop-blur-md shadow-sm">
            CII: <strong className="text-emerald-400">{vessel.cii_rating || 'C'}</strong>
          </span>
        </div>

        {/* Animated Propeller / Hydrodynamic Wake indicator */}
        <div className="absolute bottom-2 right-2.5 z-20 pointer-events-none flex items-center gap-1.5 bg-[#0A1628]/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-blue-400/30 text-[9px] font-mono text-cyan-300">
          <Compass className="w-3 h-3 animate-prop-spin text-cyan-400" />
          <span>{vessel.design_speed_knots} kn Live</span>
        </div>

        {/* Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 z-20 pointer-events-none bg-gradient-to-t from-[#0A1628] via-[#0A1628]/80 to-transparent">
          <h3 className="text-sm font-bold text-white tracking-tight leading-tight drop-shadow-md">
            {vessel.name}
          </h3>
          <span className="text-[11px] text-[#93C5FD] font-mono flex items-center gap-1">
            <span>{vessel.vessel_type}</span>
            <span>·</span>
            <span>{(vessel.capacity_tonnes / 1000).toFixed(0)}k DWT</span>
          </span>
        </div>
      </div>

      {/* Specifications & Interactive Cargo Viewer */}
      <div className="p-3.5 space-y-3 font-mono text-xs flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-2 bg-[#EFF6FF] p-2.5 rounded-xl border border-[#C5D5EE]">
          <div>
            <span className="text-[#64748B] block text-[10px]">CAPACITY</span>
            <span className="text-[#0F172A] font-bold text-xs">
              {(vessel.capacity_tonnes / 1000).toFixed(0)}k DWT
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px]">CRUISING SPEED</span>
            <span className="text-[#2563EB] font-bold text-xs">
              {vessel.design_speed_knots} kn
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px]">SPEED ENVELOPE</span>
            <span className="text-[#0F172A] text-[11px]">
              {vessel.min_speed_knots}–{vessel.max_speed_knots} kn
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px]">CHARTER RATE</span>
            <span className="text-[#0F172A] text-[11px] font-semibold">
              {formatINR(vessel.op_cost_per_hour * 83.5)}/hr
            </span>
          </div>
        </div>

        {/* Goods Carried Badge & Drawer Toggle */}
        <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[#0F172A] flex items-center gap-1">
              <Package className="w-3 h-3 text-[#2563EB]" />
              Goods & Cargo Payload
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowCargo(!showCargo);
              }}
              className="text-[10px] text-[#2563EB] hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>{showCargo ? 'Hide Goods' : 'View Goods'}</span>
              <Layers className="w-3 h-3" />
            </button>
          </div>

          {/* Primary cargo headline */}
          <div className="text-[11px] text-[#1E3A8A] font-medium leading-tight">
            {classInfo.cargo.category}
          </div>

          {/* Expandable Goods Payload List */}
          {showCargo && (
            <div className="mt-2 pt-2 border-t border-blue-200/60 space-y-1.5 animate-fadeIn">
              <div className="text-[10px] text-[#64748B]">
                <strong className="text-[#0F172A]">Stowage Unit:</strong> {classInfo.cargo.capacityUnit}
              </div>
              <div className="text-[10px] text-[#64748B]">
                <strong className="text-[#0F172A]">Payload Goods Carried:</strong>
              </div>
              <ul className="grid grid-cols-1 gap-1 pl-1">
                {classInfo.cargo.goods.map((item, idx) => (
                  <li key={idx} className="text-[10px] text-[#0F172A] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="text-[9px] text-[#0284C7] bg-white p-1.5 rounded border border-blue-200 mt-1 leading-snug">
                <strong>Handling:</strong> {classInfo.cargo.specialHandling}
              </div>
            </div>
          )}
        </div>

        {/* Compatible Fuel Pills */}
        <div>
          <span className="text-[10px] text-[#64748B] block mb-1">COMPATIBLE FUELS</span>
          <div className="flex flex-wrap gap-1">
            {(vessel.compatible_fuels || ['MGO']).map((f) => (
              <span
                key={f}
                className="text-[9px] px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#0F172A] border border-[#C5D5EE] font-medium"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button: Tune in Fuel Studio */}
        {showStudioAction && (
          <button
            type="button"
            onClick={handleStudioNavigation}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-[#EFF6FF] hover:bg-[#2563EB] text-[#0F172A] hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-[#C5D5EE] hover:border-[#2563EB] group/btn shadow-xs"
          >
            <Gauge className="w-3.5 h-3.5 text-[#2563EB] group-hover/btn:text-white" />
            <span>Tune in Fuel Studio</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-[#64748B] group-hover/btn:text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

