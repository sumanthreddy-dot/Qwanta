import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  Lock,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Waves,
  TrendingDown,
  Building2,
  Compass,
  CheckCircle2,
  Sparkles,
  Ship,
  Globe2,
  UserCheck,
  Radio,
  FileBadge
} from 'lucide-react';

interface CustomerPersona {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  avatarBg: string;
  email: string;
  company: string;
  fleetScope: string;
  stickerLabel: string;
  badgeColor: string;
}

const CUSTOMER_PERSONAS: CustomerPersona[] = [
  {
    id: 'dispatcher',
    name: 'Capt. Rajesh Sharma',
    role: 'Chief Fleet Dispatcher',
    avatarInitials: 'RS',
    avatarBg: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
    email: 'rajesh.sharma@oceanlogistics.in',
    company: 'Oceanic Freight Logistics (India)',
    fleetScope: '12 Active Vessels · 6 Corridors',
    stickerLabel: 'Verified Dispatcher',
    badgeColor: '#2563EB',
  },
  {
    id: 'esg_officer',
    name: 'Ananya Verma',
    role: 'ESG & IMO Decarbonization Head',
    avatarInitials: 'AV',
    avatarBg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    email: 'ananya.verma@maritimegreen.org',
    company: 'Global Maritime Green Alliance',
    fleetScope: 'CII Compliance & Carbon Accounting',
    stickerLabel: 'ESG Compliance Auditor',
    badgeColor: '#10B981',
  },
  {
    id: 'quantum_analyst',
    name: 'Dr. Arjun Mehta',
    role: 'Quantum Optimization Specialist',
    avatarInitials: 'AM',
    avatarBg: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
    email: 'arjun.mehta@quantumquanta.ai',
    company: 'QWANTA Computational Labs',
    fleetScope: 'QUBO & Metropolis-Hastings Tuning',
    stickerLabel: 'Algorithm Architect',
    badgeColor: '#7C3AED',
  },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPersona, setSelectedPersona] = useState<CustomerPersona>(CUSTOMER_PERSONAS[0]);
  const [email, setEmail] = useState<string>(CUSTOMER_PERSONAS[0].email);
  const [password, setPassword] = useState<string>('qwanta2026');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSelectPersona = (p: CustomerPersona) => {
    setSelectedPersona(p);
    setEmail(p.email);
    // Store user session info for the session
    try {
      localStorage.setItem('qwanta_user', JSON.stringify({
        name: p.name,
        role: p.role,
        avatarInitials: p.avatarInitials,
        company: p.company,
        stickerLabel: p.stickerLabel,
      }));
    } catch {}
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('qwanta_user', JSON.stringify({
        name: selectedPersona.name,
        role: selectedPersona.role,
        avatarInitials: selectedPersona.avatarInitials,
        company: selectedPersona.company,
        stickerLabel: selectedPersona.stickerLabel,
      }));
    } catch {}
    setTimeout(() => navigate('/dashboard'), 750);
  };

  const stats = [
    { label: 'CO₂ Reduced',   value: '28.4%', icon: TrendingDown, color: '#10B981' },
    { label: 'Fuel Saved',    value: '19.7%', icon: Waves, color: '#2563EB' },
    { label: 'Fleet Vessels', value: '12',    icon: Anchor, color: '#0284C7' },
    { label: 'ML Benchmark',  value: '9 Models', icon: Cpu, color: '#7C3AED' },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #E0EEFD 100%)',
      }}
    >
      {/* Decorative ambient gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 20% 15%, rgba(37,99,235,0.09) 0%, transparent 60%),' +
            'radial-gradient(ellipse 60% 45% at 85% 75%, rgba(37,99,235,0.07) 0%, transparent 55%),' +
            'radial-gradient(ellipse 50% 40% at 50% 90%, rgba(16,185,129,0.05) 0%, transparent 50%)',
        }}
      />

      {/* Grid line overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(#0A1628 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Main card container */}
      <div className="relative z-10 w-full max-w-xl animate-slide-up space-y-4">
        {/* Top Hackathon & Verification banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold"
            style={{
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.25)',
              color: '#2563EB',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping inline-block" />
            <span>SIH 2026 · Problem Statement SIH26138</span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#059669',
            }}
          >
            <Radio className="w-3 h-3 text-[#10B981] animate-pulse" />
            <span>Live GreenQ Telemetry Online</span>
          </div>
        </div>

        {/* Primary Glassmorphism Card */}
        <div
          className="rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white/95 border border-[#C5D5EE] shadow-2xl backdrop-blur-xl space-y-6"
        >
          {/* Subtle Corner Graphic */}
          <div
            className="absolute top-0 right-0 w-44 h-44 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent)',
              transform: 'translate(30%, -30%)',
            }}
          />

          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
            <div className="flex items-center gap-3.5">
              {/* Logo icon with nautical anchor */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                  boxShadow: '0 8px 24px rgba(37,99,235,0.32)',
                }}
              >
                <Anchor className="w-8 h-8 text-white stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
                    QWANTA
                  </h1>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                    style={{
                      background: 'rgba(37,99,235,0.12)',
                      color: '#2563EB',
                      border: '1px solid rgba(37,99,235,0.25)',
                    }}
                  >
                    Enterprise v2.0
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#64748B] flex items-center gap-1.5 mt-0.5">
                  <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                  Quantum-Inspired Fleet Optimization & Fuel Decision Engine
                </p>
              </div>
            </div>
          </div>

          {/* Customer / Stakeholder Pill Sticker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                Select Customer Workspace / Persona
              </span>
              <span className="text-[10px] font-mono text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded">
                1-Click Demo Fill
              </span>
            </div>

            {/* Persona Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {CUSTOMER_PERSONAS.map((p) => {
                const isSelected = selectedPersona.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPersona(p)}
                    className={`text-left p-3 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-[#2563EB] shadow-sm ring-2 ring-[#2563EB]/20'
                        : 'bg-white/80 border-[#E2E8F0] hover:border-[#93C5FD] hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {/* Avatar Bubble with initials */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                        style={{ background: p.avatarBg }}
                      >
                        {p.avatarInitials}
                      </div>

                      {/* Role Sticker Badge */}
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase"
                        style={{
                          background: `${p.badgeColor}15`,
                          color: p.badgeColor,
                          border: `1px solid ${p.badgeColor}30`,
                        }}
                      >
                        {p.stickerLabel}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#0F172A] truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate leading-tight">
                        {p.role}
                      </div>
                      <div className="text-[10px] text-[#2563EB] font-mono mt-1 truncate">
                        {p.company}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 bg-[#2563EB] text-white rounded-full p-0.5 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Customer Details Banner */}
          <div
            className="rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(16,185,129,0.05) 100%)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0"
                style={{ background: selectedPersona.avatarBg }}
              >
                {selectedPersona.avatarInitials}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#0F172A]">{selectedPersona.name}</span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold text-white"
                    style={{ background: selectedPersona.badgeColor }}
                  >
                    {selectedPersona.stickerLabel}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#2563EB]" />
                  <span>{selectedPersona.company}</span>
                  <span className="text-[#94A3B8]">·</span>
                  <span className="text-[#2563EB] font-mono">{selectedPersona.fleetScope}</span>
                </div>
              </div>
            </div>
            <UserCheck className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="text-center rounded-xl p-2.5 space-y-0.5 bg-slate-50 border border-[#E2E8F0]"
                >
                  <Icon className="w-3.5 h-3.5 mx-auto" style={{ color: s.color }} />
                  <div className="text-sm font-extrabold text-[#0F172A]">{s.value}</div>
                  <div className="text-[9px] font-mono leading-tight text-[#64748B]">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block">
                Authorized Dispatcher Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="q-input text-sm"
                placeholder="dispatcher@fleet.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Access Credential Key
                </label>
                <span className="text-[10px] font-mono text-[#2563EB]">
                  Pre-filled Demo Key
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="q-input pr-10 text-sm font-mono"
                  placeholder="••••••••••"
                  required
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#64748B]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Remember this terminal session</span>
              </label>

              <span className="text-[#2563EB] font-mono text-[11px] hover:underline cursor-pointer">
                Switch Port Key
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing {selectedPersona.name}…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Enter Fleet Console as {selectedPersona.name.split(' ')[1] || selectedPersona.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>

          {/* Security & Customer Compliance Seals */}
          <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>TLS 1.3 · SHA-256 Quantum Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileBadge className="w-3.5 h-3.5 text-[#10B981]" />
              <span>IMO CII / MARPOL Annex VI Compliant</span>
            </div>
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="text-center space-y-1">
          <p className="text-xs font-mono text-[#2563EB]">
            QWANTA Fleet Decision Engine · SIH26138 Team Egreen Quanta
          </p>
          <p className="text-[11px] text-[#64748B]">
            Mormugao · Paradip · Visakhapatnam · Kandla · Qingdao · Rotterdam · Singapore
          </p>
        </div>
      </div>
    </div>
  );
};
