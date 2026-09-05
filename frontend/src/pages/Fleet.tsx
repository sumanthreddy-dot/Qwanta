import React, { useState, useEffect, useCallback } from 'react';
import {
  Ship, Plus, Check, Info, Trash2, X, AlertTriangle,
  Search, SlidersHorizontal, Anchor, Package, Compass, Layers, ExternalLink,
} from 'lucide-react';
import { fleetApi } from '../services/api';
import { Vessel, VesselType, FuelType } from '../types';
import { VesselClassCard } from '../components/VesselClassCard';
import { MaritimeRouteMap } from '../components/MaritimeRouteMap';
import { formatINR } from '../utils/currency';
import { getVesselClassInfo, getVesselImage } from '../utils/vesselAssets';

import { ConfirmModal } from '../components/ConfirmModal';

/* ─── Add Vessel Modal ──────────────────────────────────────────────── */
interface AddModalProps {
  onClose: () => void;
  onSave: (vessel: Partial<Vessel>) => void;
}

const AddModal: React.FC<AddModalProps> = ({ onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Vessel>>({
    vessel_id: `V-${Date.now().toString().slice(-4)}`,
    name: '',
    vessel_type: 'Container' as VesselType,
    capacity_tonnes: 85000,
    engine_power_kw: 48000,
    min_speed_knots: 12,
    max_speed_knots: 22,
    design_speed_knots: 18,
    compatible_fuels: ['HFO', 'MGO', 'LNG'] as FuelType[],
    current_port: 'Singapore (SGP)',
    op_cost_per_hour: 450,
    available: true,
    cii_rating: 'C',
    base_consumption_rate: 35,
    auxiliary_consumption: 3.0,
    boiler_consumption: 1.5,
  });

  const field = (label: string, key: keyof Vessel, type: string = 'text', extra?: any) => (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#64748B' }}>
        {label}
      </label>
      <input
        type={type}
        value={(form[key] as any) ?? ''}
        onChange={(e) =>
          setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })
        }
        className="q-input text-xs"
        {...extra}
      />
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    onSave(form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel max-w-lg w-full"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5" style={{ color: '#3B82F6' }} />
            <h3 className="text-lg font-bold" style={{ color: '#F0F4FF' }}>
              Register Fleet Asset
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition"
            style={{ color: '#93B4D8' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Vessel Name *', 'name', 'text', { required: true, placeholder: 'e.g. Pacific Vanguard' })}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#64748B' }}>
                Vessel Type
              </label>
              <select
                value={form.vessel_type}
                onChange={(e) => setForm({ ...form, vessel_type: e.target.value as VesselType })}
                className="q-select text-xs"
              >
                <option value="Container">Container</option>
                <option value="Bulk Carrier">Bulk Carrier</option>
                <option value="Oil Tanker">Oil Tanker</option>
                <option value="LNG Carrier">LNG Carrier</option>
                <option value="Ro-Ro">Ro-Ro</option>
                <option value="General Cargo">General Cargo</option>
              </select>
            </div>
            {field('Capacity (Tonnes)', 'capacity_tonnes', 'number')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Engine Power (kW)', 'engine_power_kw', 'number')}
            {field('Design Speed (kn)', 'design_speed_knots', 'number')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Min Speed (kn)', 'min_speed_knots', 'number')}
            {field('Max Speed (kn)', 'max_speed_knots', 'number')}
          </div>

          {field('Home Port', 'current_port', 'text', { placeholder: 'e.g. Singapore (SGP)' })}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ivory flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 justify-center"
            >
              Register Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Fleet Page ───────────────────────────────────────────────── */
export const Fleet: React.FC = () => {
  const [fleet, setFleet] = useState<Vessel[]>([]);
  const [filtered, setFiltered] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<Vessel | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [explainData, setExplainData] = useState<any>(null);

  const loadFleet = useCallback(async () => {
    try {
      const data = await fleetApi.getFleet();
      setFleet(data);
      if (data.length > 0 && !selectedVessel) setSelectedVessel(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFleet(); }, [loadFleet]);

  useEffect(() => {
    let f = fleet;
    if (typeFilter !== 'All') f = f.filter((v) => v.vessel_type === typeFilter);
    if (search) {
      const s = search.toLowerCase();
      f = f.filter((v) => v.name.toLowerCase().includes(s) || v.vessel_id.toLowerCase().includes(s));
    }
    setFiltered(f);
  }, [fleet, search, typeFilter]);

  useEffect(() => {
    if (selectedVessel) {
      fleetApi.getExplainability(selectedVessel.vessel_id)
        .then(setExplainData)
        .catch(() => setExplainData(null));
    }
  }, [selectedVessel]);

  const handleAddVessel = async (vessel: Partial<Vessel>) => {
    try {
      await fleetApi.addVessel(vessel as Vessel);
      setShowAddModal(false);
      await loadFleet();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await fleetApi.deleteVessel(deleteTarget.vessel_id);
      if (selectedVessel?.vessel_id === deleteTarget.vessel_id) setSelectedVessel(null);
      setDeleteTarget(null);
      await loadFleet();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const vesselTypes = ['All', ...Array.from(new Set(fleet.map((v) => v.vessel_type)))];

  const ciiColor = (r?: string) => {
    const map: Record<string, string> = { A: '#22c55e', B: '#4ade80', C: '#f59e0b', D: '#f97316', E: '#ef4444' };
    return map[r?.charAt(0) ?? 'C'] ?? '#f59e0b';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: '#0F172A' }}>
            <Ship className="w-6 h-6" style={{ color: '#2563EB' }} />
            Fleet Assets & Propulsion Registry
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
            Manage vessels, deadweight capacities, propulsion curves, and multi-fuel compatibilities.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      {/* Vessel Class Visual Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4" style={{ color: '#2563EB' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>Vessel Class Showcase</h2>
            <span className="badge-cobalt">Interactive</span>
          </div>
          <span className="text-xs hidden sm:inline font-mono" style={{ color: '#64748B' }}>
            Click any card to inspect or tune in Fuel Studio
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fleet.slice(0, 8).map((v) => (
            <VesselClassCard
              key={v.vessel_id}
              vessel={v}
              isSelected={selectedVessel?.vessel_id === v.vessel_id}
              onSelect={(item) => setSelectedVessel(item)}
              showStudioAction={true}
            />
          ))}
        </div>
      </section>

      {/* Live AIS Fleet Traffic & Strategic Nautical Corridors Map */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">Live AIS Traffic & Nautical Fleet Radar</h2>
            <span className="badge-cobalt">Danelec Clean Map Engine</span>
          </div>
          <span className="text-xs font-mono text-[#64748B]">Real-time telemetry, proximity alert halos & AIS tracking</span>
        </div>
        <MaritimeRouteMap height="420px" autoPlay={true} />
      </section>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#C5D5EE' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="q-input pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" style={{ color: '#2563EB' }} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="q-select text-sm"
            style={{ minWidth: 160 }}
          >
            {vesselTypes.map((t) => (
              <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main grid: table + inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Fleet table */}
        <div className="q-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>
              Registered Maritime Assets ({filtered.length})
            </h2>
            <span className="text-xs font-mono" style={{ color: '#64748B' }}>
              Click row to inspect specs
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shimmer h-10 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm font-mono" style={{ color: '#5E6263' }}>
              No vessels match your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #C5D5EE' }}>
                    {['Vessel', 'Type', 'Capacity', 'Power', 'Speed', 'Fuels', 'CII', ''].map((h) => (
                      <th key={h} className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px]"
                        style={{ color: '#64748B', background: '#EFF6FF' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, idx) => {
                    const isSelected = selectedVessel?.vessel_id === v.vessel_id;
                    return (
                      <tr
                        key={v.vessel_id}
                        onClick={() => setSelectedVessel(v)}
                        className="cursor-pointer transition-all"
                        style={{
                          borderBottom: '1px solid #EFF6FF',
                          background: isSelected ? 'rgba(37,99,235,0.08)' : idx % 2 === 0 ? '#F8FAFC' : 'white',
                          borderLeft: isSelected ? '3px solid #2563EB' : '3px solid transparent',
                        }}
                      >
                        <td className="py-3 px-3 font-semibold" style={{ color: '#0F172A' }}>
                          {v.name}
                          <div className="text-[10px] font-mono" style={{ color: '#64748B' }}>{v.vessel_id}</div>
                        </td>
                        <td className="py-3 px-3 font-mono" style={{ color: '#64748B' }}>{v.vessel_type}</td>
                        <td className="py-3 px-3 font-bold font-mono" style={{ color: '#2563EB' }}>
                          {(v.capacity_tonnes / 1000).toFixed(0)}k DWT
                        </td>
                        <td className="py-3 px-3 font-mono" style={{ color: '#0F172A' }}>
                          {(v.engine_power_kw / 1000).toFixed(1)} MW
                        </td>
                        <td className="py-3 px-3 font-mono" style={{ color: '#0F172A' }}>
                          {v.design_speed_knots} kn
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {v.compatible_fuels.slice(0, 2).map((f) => (
                              <span key={f} className="badge-obsidian text-[9px]">{f}</span>
                            ))}
                            {v.compatible_fuels.length > 2 && (
                              <span className="text-[9px]" style={{ color: '#64748B' }}>
                                +{v.compatible_fuels.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              color: ciiColor(v.cii_rating),
                              background: `${ciiColor(v.cii_rating)}18`,
                              border: `1px solid ${ciiColor(v.cii_rating)}30`,
                            }}
                          >
                            CII {v.cii_rating?.charAt(0) ?? 'C'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            title="Remove vessel"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(v);
                            }}
                            className="p-1.5 rounded-lg transition"
                            style={{ color: '#C5D5EE' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#C5D5EE')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Vessel Inspector Panel */}
        <div className="q-card p-5 space-y-5">
          {selectedVessel ? (
            <>
              <div style={{ borderBottom: '1px solid #C5D5EE', paddingBottom: '0.75rem' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono" style={{ color: '#2563EB' }}>
                    {selectedVessel.vessel_id}
                  </span>
                  <span className="badge-cobalt text-[10px]">{selectedVessel.vessel_type}</span>
                </div>
                <h3 className="text-lg font-bold mt-1" style={{ color: '#0F172A' }}>
                  {selectedVessel.name}
                </h3>
                <p className="text-xs font-mono" style={{ color: '#64748B' }}>
                  Home Port: {selectedVessel.current_port}
                </p>
              </div>

              {/* 3D Animated Vessel Visual Stage in Inspector */}
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#0A1628] border border-[#C5D5EE] group">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_120%,#2563EB_0%,#0A1628_75%)] pointer-events-none" />
                <img
                  src={getVesselImage(selectedVessel.vessel_type)}
                  alt={selectedVessel.name}
                  className="w-full h-full object-cover animate-ocean-sway group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 right-2.5 z-10 pointer-events-none flex items-center gap-1.5 bg-[#0A1628]/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-blue-400/30 text-[9px] font-mono text-cyan-300">
                  <Compass className="w-3 h-3 animate-prop-spin text-cyan-400" />
                  <span>3D Hydrodynamic Simulation Active</span>
                </div>
              </div>

              {/* Cargo & Goods Carried Section */}
              {(() => {
                const classInfo = getVesselClassInfo(selectedVessel.vessel_type);
                return (
                  <div className="rounded-xl p-3 bg-blue-50/60 border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#2563EB]" />
                        Cargo Goods Carried
                      </span>
                      <span className="text-[10px] font-mono text-[#2563EB] bg-white px-2 py-0.5 rounded border border-blue-100">
                        {classInfo.cargo.category}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#64748B]">
                      <strong>Stowage Standard:</strong> {classInfo.cargo.capacityUnit}
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-[#64748B] block mb-1">Payload Commodities:</span>
                      <div className="grid grid-cols-1 gap-1">
                        {classInfo.cargo.goods.map((good, idx) => (
                          <div key={idx} className="text-[11px] text-[#0F172A] flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded border border-blue-100/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                            <span>{good}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-[10px] text-[#0284C7] bg-white p-2 rounded border border-blue-200 leading-snug">
                      <strong>Handling Protocol:</strong> {classInfo.cargo.specialHandling}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2 text-xs font-mono">
                {[
                  ['Deadweight Capacity', `${selectedVessel.capacity_tonnes.toLocaleString()} Tonnes`],
                  ['Engine Rating', `${selectedVessel.engine_power_kw.toLocaleString()} kW`],
                  ['Speed Envelope', `${selectedVessel.min_speed_knots}–${selectedVessel.max_speed_knots} knots`],
                  ['Design Speed', `${selectedVessel.design_speed_knots} knots`],
                  ['Charter Rate', `${formatINR(selectedVessel.op_cost_per_hour * 83.5)}/hr`],
                  ['Base Consumption', `${selectedVessel.base_consumption_rate ?? 35} MT/day`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-1.5"
                    style={{ borderBottom: '1px solid #EFF6FF' }}>
                    <span style={{ color: '#64748B' }}>{label}:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Compatible Fuels */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#64748B' }}>
                  Compatible Fuels
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVessel.compatible_fuels.map((f) => (
                    <span key={f} className="badge-cobalt">{f}</span>
                  ))}
                </div>
              </div>

              {/* Optimizer Rationale */}
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: '#EFF6FF', border: '1px solid #C5D5EE' }}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#2563EB' }}>
                  <Info className="w-3.5 h-3.5" />
                  Optimizer Allocation Rationale
                </div>
                {explainData?.explanation?.why_selected ? (
                  <ul className="space-y-1.5 text-[11px]" style={{ color: '#0F172A' }}>
                    {explainData.explanation.why_selected.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#2563EB' }} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] leading-relaxed" style={{ color: '#64748B' }}>
                    Vessel is in the active pool. Run the QUBO Optimizer to calculate the latest multi-objective assignment.
                  </p>
                )}
              </div>

              {/* Remove button in inspector */}
              <button
                onClick={() => setDeleteTarget(selectedVessel)}
                className="btn-ivory w-full justify-center text-xs"
                style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#dc2626' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove from Registry
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: '#64748B' }}>
              <Ship className="w-10 h-10" style={{ color: '#C5D5EE' }} />
              <p className="text-sm font-mono">Select a vessel to inspect</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Remove Vessel"
          message={
            <span>
              You are about to permanently remove{' '}
              <strong style={{ color: '#3B82F6' }}>{deleteTarget.name}</strong>{' '}
              ({deleteTarget.vessel_id}) from the fleet registry.
            </span>
          }
          subMessage="This action cannot be undone. All associated optimization records will be unlinked."
          details={[
            { label: 'Type', value: deleteTarget.vessel_type },
            { label: 'Capacity', value: `${(deleteTarget.capacity_tonnes / 1000).toFixed(0)}k DWT` },
            { label: 'Engine Power', value: `${deleteTarget.engine_power_kw.toLocaleString()} kW` },
            { label: 'Home Port', value: deleteTarget.current_port || 'En Route' },
          ]}
          confirmLabel="Remove Permanently"
          cancelLabel="Keep Vessel"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Add Vessel Modal */}
      {showAddModal && (
        <AddModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddVessel}
        />
      )}
    </div>
  );
};
