import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  FileSpreadsheet, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function LoginScreen() {
  const { login, settings, addToast } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(username.trim(), password.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Invalid username or password');
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-scale-up">
        
        {/* Main Card */}
        <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/60">
          
          {/* Logo & Header */}
          <div className="text-center mb-7">
            <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner mb-3.5">
              <img 
                src={settings?.company_logo || "https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png"} 
                alt="Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <h1 className="text-2xl font-extrabold text-white font-heading tracking-tight">
              {settings?.company_name || 'SaNDSLab Simple Accounting'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign in to manage accounts, transactions & reports
            </p>
          </div>

          {/* Quick Demo Login Chips */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2 px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick Login Presets:
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Click to autofill</span>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="px-2 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition active:scale-95"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('user', 'user123')}
                className="px-2 py-1.5 rounded-xl text-[11px] font-bold bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 transition active:scale-95"
              >
                👤 User
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('auditor', 'auditor123')}
                className="px-2 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition active:scale-95"
              >
                🔍 Auditor
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800/80 flex items-start gap-3 text-rose-200 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter username (e.g. admin, user, auditor)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In to System</span>
              )}
            </button>
          </form>

          {/* Role Policy Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role Permissions:</span>
            </div>
            <p>• <strong>Admin & Users</strong>: Full access on Web & Mobile apps.</p>
            <p>• <strong>Auditors</strong>: Web only with Read-Only inspection and Excel/PDF export privileges.</p>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-5">
          &copy; {new Date().getFullYear()} {settings?.company_name || 'SaNDSLab'}. All rights reserved.
        </p>

      </div>
    </div>
  );
}
