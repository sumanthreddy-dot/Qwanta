import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  subMessage?: string;
  details?: Array<{ label: string; value: React.ReactNode }>;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'copper';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  subMessage,
  details,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconBg = isDanger
    ? 'rgba(239, 68, 68, 0.15)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.15)'
    : 'rgba(37, 99, 235, 0.15)';

  const iconBorder = isDanger
    ? 'rgba(239, 68, 68, 0.35)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.35)'
    : 'rgba(37, 99, 235, 0.35)';

  const iconColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#3B82F6';

  const confirmBtnStyle: React.CSSProperties = isDanger
    ? {
        background: 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.4) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.45)',
        color: '#fecaca',
      }
    : isWarning
    ? {
        background: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.4) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        color: '#fef3c7',
      }
    : {
        background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        border: '1px solid rgba(37,99,235,0.4)',
        color: '#FFFFFF',
      };

  return (
    <div
      className="modal-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="modal-panel max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          {/* Variant Icon */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{ background: iconBg, border: `1px solid ${iconBorder}` }}
          >
            {isDanger ? (
              <Trash2 className="w-7 h-7" style={{ color: iconColor }} />
            ) : (
              <AlertTriangle className="w-7 h-7" style={{ color: iconColor }} />
            )}
          </div>

          <div>
            <h3
              id="confirm-modal-title"
              className="text-xl font-bold tracking-tight"
              style={{ color: '#F0F4FF' }}
            >
              {title}
            </h3>
            <div className="mt-2 text-sm leading-relaxed" style={{ color: '#C5D5EE' }}>
              {message}
            </div>
            {subMessage && (
              <p className="mt-2 text-xs" style={{ color: '#93B4D8' }}>
                {subMessage}
              </p>
            )}
          </div>

          {/* Key-Value Details */}
          {details && details.length > 0 && (
            <div
              className="w-full rounded-xl p-3.5 text-left text-xs font-mono space-y-1.5"
              style={{
                background: 'rgba(10, 22, 40, 0.7)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
              }}
            >
              {details.map((d, i) => (
                <div key={i} className="flex justify-between items-center py-0.5">
                  <span style={{ color: '#93B4D8' }}>{d.label}:</span>
                  <span style={{ color: '#F0F4FF', fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 w-full mt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-white/10"
              style={{
                background: 'rgba(197, 213, 238, 0.08)',
                border: '1px solid rgba(197, 213, 238, 0.2)',
                color: '#C5D5EE',
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95"
              style={confirmBtnStyle}
            >
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
