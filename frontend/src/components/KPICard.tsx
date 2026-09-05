import React from 'react';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  changePositive?: boolean;
  icon: LucideIcon;
  color?: 'emerald' | 'cyan' | 'amber' | 'blue' | 'purple' | 'copper';
  subtext?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  change,
  changePositive = true,
  icon: Icon,
  color = 'blue',
  subtext,
}) => {
  return (
    <div className="q-card q-card-hover p-5 relative overflow-hidden transition-all duration-200">
      {/* Subtle corner blue shimmer */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
        style={{ background: '#2563EB' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold font-mono tracking-wider uppercase text-[#64748B]">
          {title}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs"
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            borderColor: 'rgba(37, 99, 235, 0.25)',
            color: '#2563EB',
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-3xl font-black tracking-tight text-[#0F172A] font-mono leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-[#2563EB] font-mono font-semibold mb-0.5">
            {unit}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {change && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              changePositive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {changePositive ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
            {change}
          </span>
        )}
        {subtext && (
          <span className="text-[11px] text-[#64748B] font-mono truncate ml-2" title={subtext}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
