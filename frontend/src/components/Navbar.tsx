import React, { useState, useEffect } from 'react';
import { Anchor, Cpu, Activity, ShieldCheck, Waves } from 'lucide-react';
import { fleetApi } from '../services/api';

export const Navbar: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [modelName, setModelName] = useState<string>('…');

  useEffect(() => {
    fleetApi.getHealth()
      .then((data: any) => {
        setIsOnline(true);
        // best_model from QWANTA backend — never a hard-coded champion
        const m = data.best_model || data.champion_model;
        if (m) setModelName(m);
      })
      .catch(() => setIsOnline(false));
  }, []);

  return (
    <header
      className="h-16 sticky top-0 z-40 flex items-center justify-between px-6"
      style={{
        background: 'rgba(10, 22, 40, 0.97)',
        borderBottom: '1px solid rgba(37,99,235,0.18)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        {/* Blue anchor logo */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
            boxShadow: '0 2px 12px rgba(37,99,235,0.45)',
          }}
        >
          <Anchor className="w-5 h-5" style={{ color: '#FFFFFF' }} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight" style={{ color: '#F0F4FF' }}>
              QWANTA
            </h1>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(37,99,235,0.14)',
                color: '#60A5FA',
                border: '1px solid rgba(37,99,235,0.3)',
              }}
            >
              v2.0
            </span>
          </div>
          <p className="text-xs flex items-center gap-1" style={{ color: '#4A6A9A' }}>
            <Cpu className="w-3 h-3" style={{ color: '#2563EB' }} />
            A Fleet Decision Engine
          </p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-3">
        {/* Domain */}
        <div
          className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono"
          style={{
            background: 'rgba(10,22,40,0.8)',
            border: '1px solid rgba(197,213,238,0.12)',
            color: '#C5D5EE',
          }}
        >
          <Waves className="w-3.5 h-3.5" style={{ color: '#2563EB' }} />
          Maritime Logistics
        </div>

        {/* Dynamic best model badge — no hard-coded label */}
        <div
          className="hidden lg:flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono"
          style={{
            background: 'rgba(10,22,40,0.8)',
            border: '1px solid rgba(197,213,238,0.12)',
          }}
        >
          <span style={{ color: '#4A6A9A' }}>Best Model:</span>
          <span style={{ color: '#3B82F6', fontWeight: 600 }}>{modelName}</span>
        </div>

        {/* Online indicator */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono"
          style={{
            background: 'rgba(10,22,40,0.8)',
            border: '1px solid rgba(197,213,238,0.12)',
          }}
        >
          <span
            className={isOnline ? 'animate-pulse' : ''}
            style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: isOnline ? '#22c55e' : '#ef4444',
              boxShadow: isOnline ? '0 0 6px #22c55e' : 'none',
              display: 'inline-block',
            }}
          />
          <span style={{ color: isOnline ? '#86efac' : '#fca5a5', fontWeight: 500 }}>
            {isOnline ? 'System Online' : 'Offline'}
          </span>
        </div>

        {/* SIH tag */}
        <div
          className="hidden sm:flex items-center gap-2 pl-3 text-xs"
          style={{ borderLeft: '1px solid rgba(197,213,238,0.15)' }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: '#2563EB' }} />
          <span className="font-mono" style={{ color: '#C5D5EE' }}>SIH26138</span>
        </div>

        {/* Customer Avatar & Role Sticker Pill */}
        <UserAvatarPill />
      </div>
    </header>
  );
};

const UserAvatarPill: React.FC = () => {
  const [userData, setUserData] = useState<{
    name: string;
    role: string;
    avatarInitials: string;
    company: string;
    stickerLabel: string;
  }>({
    name: 'Capt. Rajesh Sharma',
    role: 'Chief Dispatcher',
    avatarInitials: 'RS',
    company: 'Oceanic Freight',
    stickerLabel: 'Verified Dispatcher',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('qwanta_user');
      if (stored) {
        setUserData(JSON.parse(stored));
      }
    } catch {}
  }, []);

  return (
    <div
      className="flex items-center gap-2.5 pl-3 border-l border-white/10"
    >
      {/* Avatar circle */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
        style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)' }}
        title={`${userData.name} (${userData.role})`}
      >
        {userData.avatarInitials || 'RS'}
      </div>

      {/* Name and sticker badge */}
      <div className="hidden md:flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#F0F4FF] leading-tight">
            {userData.name}
          </span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase"
            style={{
              background: 'rgba(37,99,235,0.25)',
              color: '#93C5FD',
              border: '1px solid rgba(147,197,253,0.3)',
            }}
          >
            {userData.stickerLabel || 'Dispatcher'}
          </span>
        </div>
        <span className="text-[10px] text-[#64748B] font-mono leading-tight">
          {userData.role} · {userData.company}
        </span>
      </div>

      {/* Exit / Switch button */}
      <a
        href="/login"
        title="Switch customer account"
        className="text-[11px] font-mono text-[#64748B] hover:text-[#93C5FD] transition-colors p-1"
      >
        Exit
      </a>
    </div>
  );
};
