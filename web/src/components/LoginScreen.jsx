import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';

export default function LoginScreen() {
  const { login, settings } = useApp();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50/50 to-indigo-50/60 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Ambient Decorative Circles */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-scale-up">
        
        {/* Main Card - Crisp White Theme */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-300/60">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm mb-4">
              <img 
                src={settings?.company_logo || "https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png"} 
                alt="Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
              {settings?.company_name || 'SaNDSLab Simple Accounting'}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">
              Sign in to manage accounts, transactions & reports
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:via-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In to System</span>
              )}
            </button>
          </form>

          {/* Role Policy Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Role Permissions:</span>
            </div>
            <p className="leading-relaxed">• <strong className="text-slate-700">Admin & Users:</strong> Full access on Web & Mobile apps.</p>
            <p className="leading-relaxed">• <strong className="text-slate-700">Auditors:</strong> Web only with Read-Only inspection and Excel/PDF export privileges.</p>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          &copy; {new Date().getFullYear()} {settings?.company_name || 'SaNDSLab'}. All rights reserved.
        </p>

      </div>
    </div>
  );
}
