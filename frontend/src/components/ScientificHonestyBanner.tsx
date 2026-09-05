import React from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ScientificHonestyBannerProps {
  compact?: boolean;
}

export const ScientificHonestyBanner: React.FC<ScientificHonestyBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div
        className="rounded-xl px-4 py-2.5 text-xs flex items-center gap-2.5 transition-all"
        style={{
          background: 'rgba(239, 246, 255, 0.7)',
          border: '1px solid #BFDBFE',
          color: '#475569',
        }}
      >
        <ShieldCheck className="w-4 h-4 shrink-0 text-[#2563EB]" />
        <span>
          <strong className="text-[#0F172A]">Scientific Integrity Notice:</strong> Calibrated with ITTC-1957 naval hydrodynamics, Kwon wave equations, and real CSV multi-model inference. No synthetic superiority or hardware quantum speedup is fabricated.
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 text-xs flex items-start gap-3.5 transition-all"
      style={{
        background: 'rgba(240, 246, 255, 0.85)',
        border: '1px solid #BFDBFE',
        color: '#0F172A',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: 'rgba(37, 99, 235, 0.1)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          color: '#2563EB',
        }}
      >
        <AlertCircle className="w-4 h-4" />
      </div>
      <div className="space-y-1.5 flex-1">
        <div className="font-semibold text-[#0F172A] flex items-center justify-between">
          <span className="text-sm">Scientific & Methodological Transparency</span>
          <span className="badge-copper">
            Democratized Computing
          </span>
        </div>
        <p className="text-[#475569] leading-relaxed">
          Operational plans are derived from naval architectural physics modeling and executed via classical metaheuristics (Simulated Annealing on dynamic QUBO Hamiltonians). The system operates on standard commercial hardware without requiring paid quantum processors. All benchmark improvements versus classical baselines (Greedy, Shortest Path, GA) are computed dynamically from live backend execution rather than hardcoded metrics.
        </p>
      </div>
    </div>
  );
};
