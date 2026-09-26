import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Tags, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  Activity, 
  X, 
  Check 
} from 'lucide-react';

export default function CategoriesManager() {
  const { categories, fetchInitialData, addToast, confirmAction, isAuditor } = useApp();

  const [activeTab, setActiveTab] = useState('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#EF4444');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const colorsList = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', 
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
  ];

  const filtered = categories.filter((c) => c.type === activeTab);

  const openCreate = () => {
    setEditingCat(null);
    setName('');
    setType(activeTab);
    setColor(activeTab === 'income' ? '#10B981' : '#EF4444');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingCat(c);
    setName(c.name);
    setType(c.type);
    setColor(c.color || '#3B82F6');
    setDescription(c.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Category name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        color,
        description: description.trim()
      };

      let method = 'POST';
      if (editingCat) {
        payload.id = editingCat.id;
        method = 'PUT';
      }

      const res = await fetch('/api/categories.php', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.status === 'success') {
        addToast(editingCat ? 'Category updated' : 'Category created', 'success');
        setIsModalOpen(false);
        fetchInitialData();
      } else {
        addToast(data.message || 'Error saving category', 'error');
      }
    } catch (err) {
      addToast('Error communicating with server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, catName) => {
    const confirmed = await confirmAction({
      title: 'Delete Category',
      message: `Are you sure you want to delete category ${catName ? `"${catName}"` : ''}? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/categories.php?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        addToast('Category deleted successfully', 'success');
        fetchInitialData();
      } else {
        addToast(data.message || 'Failed to delete category', 'error');
      }
    } catch (err) {
      addToast('Failed to delete category', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
            Chart of Accounts & Categories
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize and classify income streams, operational expenses, and activities
          </p>
        </div>

        {!isAuditor && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Category</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'expense', label: 'Expense Categories', icon: TrendingDown, color: 'text-rose-500' },
          { id: 'income', label: 'Income Categories', icon: TrendingUp, color: 'text-emerald-500' },
          { id: 'other', label: 'Other Activities', icon: Activity, color: 'text-purple-500' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition ${
                isActive
                  ? 'border-sky-600 text-sky-600 dark:text-sky-400 dark:border-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between card-hover"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: cat.color }} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {cat.name}
                </h3>
              </div>
              {!isAuditor && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {cat.description || 'No description provided'}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white font-heading text-lg">
                {editingCat ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Subscriptions"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="other">Other Activity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorsList.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note on what belongs in this category"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow transition"
                >
                  {submitting ? 'Saving...' : editingCat ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
