import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { woredaAPI, subcityAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { Building2 } from 'lucide-react';

export default function SubcityWoredas() {
  const [woredas, setWoredas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetPwId, setResetPwId] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [form, setForm] = useState({
    name: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '',
  });

  const fetchWoredas = async () => {
    setLoading(true);
    try {
      const res = await woredaAPI.getList();
      setWoredas(res.data.woredas);
    } catch (err) {
      toast.error('Failed to load woredas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWoredas(); }, []);

  const resetForm = () => {
    setForm({ name: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await woredaAPI.create(form);
      toast.success(`Woreda "${form.name}" created successfully`);
      resetForm();
      fetchWoredas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create woreda');
    }
  };

  const handleToggleWoreda = async (id, currentActive) => {
    try {
      await woredaAPI.update(id, { isActive: !currentActive });
      toast.success('Status updated');
      fetchWoredas();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this woreda and all its users? This cannot be undone.')) return;
    try {
      await woredaAPI.delete(id);
      toast.success('Woreda deleted');
      fetchWoredas();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleResetPassword = async (userId) => {
    if (!resetPw || resetPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await subcityAPI.resetUserPassword(userId, { newPassword: resetPw });
      toast.success('Password reset successfully');
      setResetPwId(null);
      setResetPw('');
    } catch (err) {
      toast.error('Failed to reset password');
    }
  };

  return (
    <div>
      <PageHeader title="Woreda Management" subtitle="Create and manage woreda accounts for your subcity">
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="btn-primary px-4 py-2 text-sm">
          {showForm ? 'Cancel' : 'Create Woreda'}
        </button>
      </PageHeader>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Create New Woreda</h3>
          <p className="text-sm text-gray-500">This will create a Woreda record and a Woreda Admin account.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Woreda Name *</label>
              <input name="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                className="input-field" placeholder="e.g. Woreda 03" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Full Name *</label>
              <input name="adminName" value={form.adminName} onChange={e => setForm(p => ({ ...p, adminName: e.target.value }))} required
                className="input-field" placeholder="e.g. Woreda 03 Admin" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Email *</label>
              <input name="adminEmail" type="email" value={form.adminEmail} onChange={e => setForm(p => ({ ...p, adminEmail: e.target.value }))} required
                className="input-field" placeholder="e.g. woreda03@ethiobridge.et" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Password *</label>
              <input name="adminPassword" type="password" value={form.adminPassword} onChange={e => setForm(p => ({ ...p, adminPassword: e.target.value }))} required minLength={6}
                className="input-field" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Phone</label>
              <input name="adminPhone" value={form.adminPhone} onChange={e => setForm(p => ({ ...p, adminPhone: e.target.value }))}
                className="input-field" placeholder="e.g. +251911234567" />
            </div>
          </div>
          <button type="submit" className="btn-primary px-6 py-2 text-sm">Create Woreda</button>
        </form>
      )}

      {resetPwId && (
        <div className="card p-4 mb-6 flex items-center gap-3">
          <span className="text-sm text-gray-600">Reset password for user:</span>
          <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)}
            className="input-field max-w-xs" placeholder="New password (min 6 chars)" />
          <button onClick={() => handleResetPassword(resetPwId)} className="btn-primary px-3 py-1.5 text-sm">Reset</button>
          <button onClick={() => { setResetPwId(null); setResetPw(''); }} className="text-sm text-gray-500">Cancel</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : woredas.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p>No woredas created yet. Click "Create Woreda" to add one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {woredas.map(w => (
            <div key={w._id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{w.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {w.userCount || 0} user(s) | Departments: {w.departments?.join(', ') || 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleWoreda(w._id, w.isActive)}
                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {w.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(w._id)}
                    className="text-xs px-2 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
