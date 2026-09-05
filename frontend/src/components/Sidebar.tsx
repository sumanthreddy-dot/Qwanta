import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ship,
  Compass,
  Gauge,
  Cpu,
  BarChart3,
  PieChart,
  Settings,
  Leaf,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/fleet',        label: 'Fleet Registry',   icon: Ship },
  { path: '/routes',       label: 'Corridors & Routes', icon: Compass },
  { path: '/predictions',  label: 'Fuel Studio',      icon: Gauge },
  { path: '/optimization', label: 'QUBO Optimizer',   icon: Cpu,      badge: 'Quantum' },
  { path: '/benchmarks',   label: 'Benchmarks',       icon: BarChart3 },
  { path: '/analytics',    label: 'ESG & Analytics',  icon: PieChart },
  { path: '/settings',     label: 'Configuration',    icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside
      className="w-64 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]"
      style={{
        background: '#0D1B2A',
        borderRight: '1px solid rgba(37,99,235,0.15)',
      }}
    >
      {/* Navigation */}
      <div className="p-4 space-y-1">
        <div
          className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest font-mono"
          style={{ color: '#4A6A9A' }}
        >
          Core Platform
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive ? 'nav-item-active' : 'nav-item-default'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: 'rgba(37,99,235,0.15)',
                      color: '#3B82F6',
                      borderLeft: '2px solid #2563EB',
                      paddingLeft: '0.875rem',
                    }
                  : { color: '#4A6A9A', borderLeft: '2px solid transparent' }
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isActive ? '#3B82F6' : '#4A6A9A' }}
                    />
                    <span style={{ color: isActive ? '#E8EFFE' : '#93B4D8' }}>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(37,99,235,0.15)',
                        color: '#3B82F6',
                        border: '1px solid rgba(37,99,235,0.28)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer: IMO 2050 target bar */}
      <div
        className="p-4 m-3 rounded-xl text-xs space-y-2"
        style={{
          background: 'rgba(10,22,40,0.7)',
          border: '1px solid rgba(37,99,235,0.12)',
        }}
      >
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: '#C5D5EE' }}>
          <Leaf className="w-3.5 h-3.5" style={{ color: '#2563EB' }} />
          <span>Decarbonization Target</span>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: '#4A6A9A' }}>
          Optimizing towards IMO 2030 / 2050 net-zero GHG trajectory.
        </p>
        <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: '#0A1628' }}>
          <div
            className="h-full"
            style={{
              width: '68%',
              background: 'linear-gradient(90deg, #1D4ED8, #3B82F6)',
              borderRadius: '99px',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono" style={{ color: '#4A6A9A' }}>
          <span>Fleet CII: B</span>
          <span>Target: −28% CO₂</span>
        </div>
      </div>
    </aside>
  );
};
