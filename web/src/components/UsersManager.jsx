import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../utils/api';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  Lock, 
  Mail, 
  User, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  X, 
  Check, 
  Key,
  Smartphone,
  Globe
} from 'lucide-react';

export default function UsersManager() {
  const { user: currentUser, addToast, confirmAction } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [status, setStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/users.php');
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.data || []);
      }
    } catch (err) {
      addToast('Failed to load users list', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setUsername(u.username);
    setFullName(u.full_name);
    setEmail(u.email || '');
    setPassword(''); // leave blank to keep unchanged
    setRole(u.role);
    setStatus(u.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      addToast('Full name is required', 'error');
      return;
    }

    if (!editingUser && (!username.trim() || !password.trim())) {
      addToast('Username and password are required for new users', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        status
      };

      if (!editingUser) {
        payload.username = username.trim();
        payload.password = password.trim();
      } else {
        payload.id = editingUser.id;
        if (password.trim()) {
          payload.password = password.trim();
        }
      }

      const res = await apiFetch('/api/users.php', {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.status === 'success') {
        addToast(editingUser ? 'User updated successfully' : 'User created successfully', 'success');
        setIsModalOpen(false);
        fetchUsers();
      } else {
        addToast(data.message || 'Error saving user', 'error');
      }
    } catch (err) {
      addToast('Error communicating with server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (u) => {
    if (u.id === currentUser?.id) {
      addToast('You cannot deactivate your own admin account', 'error');
      return;
    }

    const confirmed = await confirmAction({
      title: 'Deactivate User',
      message: `Are you sure you want to deactivate ${u.full_name} (${u.username})? They will immediately be logged out and cannot sign in.`,
      confirmText: 'Deactivate',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const res = await apiFetch(`/api/users.php?id=${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        addToast('User deactivated', 'success');
        fetchUsers();
      } else {
        addToast(data.message || 'Error deactivating user', 'error');
      }
    } catch (err) {
      addToast('Failed to deactivate user', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-500" />
            Users & Roles Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control access roles: Administrators (Web & App), Accounts Users (Web & App), and Auditors (Web Only Read & Export)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Role Explanations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Admin Card */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Administrator</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Full system control. Can configure company settings, manage users, categories, accounts, and transactions on both <strong>Web & Mobile</strong>.
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            <Globe className="w-3.5 h-3.5" /> Web &nbsp;•&nbsp; <Smartphone className="w-3.5 h-3.5" /> Mobile App
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-bold text-sm mb-1">
            <User className="w-4 h-4 text-sky-500" />
            <span>Accounts User</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Daily operational access. Can record expenses, incomes, print vouchers, and attach receipt photos on both <strong>Web & Mobile</strong>.
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
            <Globe className="w-3.5 h-3.5" /> Web &nbsp;•&nbsp; <Smartphone className="w-3.5 h-3.5" /> Mobile App
          </div>
        </div>

        {/* Auditor Card */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm mb-1">
            <Eye className="w-4 h-4 text-emerald-500" />
            <span>Compliance Auditor</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <strong>Web Only</strong> inspection and audit mode. Read-only access to inspect accounts, transactions, and full <strong>Excel & PDF exports</strong>.
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Globe className="w-3.5 h-3.5" /> Web Portal Only (No Mobile)
          </div>
        </div>

      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Platform Access</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isAuditor = u.role === 'auditor';
                  const isActive = u.status === 'active';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      
                      {/* Name & Username */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isAdmin 
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                              : isAuditor
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                          }`}>
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {u.id === currentUser?.id && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">@{u.username} {u.email ? `• ${u.email}` : ''}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isAdmin 
                            ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : isAuditor
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        }`}>
                          {isAdmin && '👑 Administrator'}
                          {isAuditor && '🔍 Auditor'}
                          {!isAdmin && !isAuditor && '👤 User'}
                        </span>
                      </td>

                      {/* Platform Access */}
                      <td className="py-3.5 px-4">
                        {isAuditor ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Globe className="w-3.5 h-3.5" /> Web Only
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            <Globe className="w-3.5 h-3.5 text-sky-500" /> Web + <Smartphone className="w-3.5 h-3.5 text-indigo-500" /> App
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                          {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {u.id !== currentUser?.id && isActive && (
                            <button
                              onClick={() => handleDeactivate(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                              title="Deactivate User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white font-heading text-lg">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jsmith, auditor1"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. jsmith@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="admin">👑 Administrator</option>
                    <option value="user">👤 User (Web & App)</option>
                    <option value="auditor">🔍 Auditor (Web Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {editingUser ? 'Reset Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow transition"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
