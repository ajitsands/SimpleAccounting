import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  X 
} from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  onConfirm,
  onCancel
}) {
  // Close on Escape key & confirm on Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Icon & Theme Configurations
  const typeConfigs = {
    danger: {
      icon: Trash2,
      badgeBg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 ring-rose-500/50',
      accentGlow: 'from-rose-500/20 via-transparent to-transparent'
    },
    warning: {
      icon: AlertTriangle,
      badgeBg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25 ring-amber-500/50',
      accentGlow: 'from-amber-500/20 via-transparent to-transparent'
    },
    info: {
      icon: Info,
      badgeBg: 'bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900',
      confirmBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/25 ring-sky-500/50',
      accentGlow: 'from-sky-500/20 via-transparent to-transparent'
    },
    success: {
      icon: CheckCircle2,
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 ring-emerald-500/50',
      accentGlow: 'from-emerald-500/20 via-transparent to-transparent'
    }
  };

  const config = typeConfigs[type] || typeConfigs.danger;
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transform transition-all animate-scale-up">
        
        {/* Subtle Top Ambient Glow */}
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b ${config.accentGlow} blur-2xl pointer-events-none`} />

        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Styled Icon Badge */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${config.badgeBg}`}>
              <IconComponent className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition active:scale-95"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              autoFocus
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ${config.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
