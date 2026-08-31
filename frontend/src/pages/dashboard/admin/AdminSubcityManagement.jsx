import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { adminAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { Landmark } from 'lucide-react';

const SUBCITY_ROLES = ['subcity', 'subcity_bole', 'subcity_yeka', 'subcity_lemmi_kura'];

export default function AdminSubcityManagement() {
  const [subcityAdmins, setSubcityAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetPwId, setResetPwId] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [viewDetails, setViewDetails] = useState(null);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    role: 'subcity', subcity: '',
  });

  const fetchSubcityAdmins = async () => {
    setLoading(true);
    try {
      const all = await Promise.all(
        SUBCITY_ROLES.map(role => adminAPI.getUsers({ role, limit: 50 }))
      );
      setSubcityAdmins(all.flatMap(r => r.data.users));
    } catch (err) {
      toast.error('Failed to load subcity admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubcityAdmins(); }, []);

  const resetForm = () => {
    setForm({ fullName: '', email: '', password: '', phone: '', role: 'subcity', subcity: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (admin) => {
    setForm({
      fullName: admin.fullName,
      email: admin.email,
      password: '',
      phone: admin.phone || '',
      role: admin.role,
      subcity: admin.subcity || '',
    });
    setEditing(admin._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { fullName: form.fullName, email: form.email, phone: form.phone };
        if (form.password) payload.password = form.password;
        await adminAPI.updateUser(editing, payload);
        toast.success('Subcity admin updated');
      } else {
        const subcity = form.subcity.trim().replace(/\s+/g, '_').toUpperCase();
        await adminAPI.createUser({ ...form, role: 'subcity', subcity });
        toast.success('Subcity admin created');
      }
      resetForm();
      fetchSubcityAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const subcityLabel = (admin) =>
    admin.subcity ||
    admin.role.replace('subcity_', '').replace('_', ' ').toUpperCase();

  const handleToggleActive = async (id) => {
    try {
      await adminAPI.toggleActive(id);
      toast.success('Status updated');
      fetchSubcityAdmins();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subcity admin? This cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('Subcity admin deleted');
      fetchSubcityAdmins();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleResetPassword = async (id) => {
    if (!resetPw || resetPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await adminAPI.updateUser(id, { password: resetPw });
      toast.success('Password reset successfully');
      setResetPwId(null);
      setResetPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  if (viewDetails) {
    const a = viewDetails;
    return (
      <div>
        <button onClick={() => setViewDetails(null)} className="text-sm text-primary-600 hover:underline mb-4">&larr; Back to list</button>
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-2xl">
              {a.fullName?.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{a.fullName}</h3>
              <p className="text-gray-500">{a.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Role:</span> <span className="font-medium capitalize">{a.role.replace('subcity_', '').replace('_', ' ')}</span></div>
            <div><span className="text-gray-500">Subcity:</span> <span className="font-medium">{a.subcity || 'N/A'}</span></div>
            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{a.phone || 'N/A'}</span></div>
            <div><span className="text-gray-500">Status:</span> <span className={`font-medium ${a.isActive ? 'text-green-600' : 'text-red-600'}`}>{a.isActive ? 'Active' : 'Inactive'}</span></div>
            <div><span className="text-gray-500">Created:</span> <span className="font-medium">{new Date(a.createdAt).toLocaleDateString()}</span></div>
            <div><span className="text-gray-500">Region:</span> <span className="font-medium">{a.region || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
        <PageHeader title="Subcity Management" subtitle="Create and manage subcity admin accounts">
          <button onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="btn-primary px-4 py-2 text-sm">
            {showForm ? 'Cancel' : 'Create Subcity Admin'}
          </button>
        </PageHeader>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {editing ? 'Edit Subcity Admin' : 'Create Subcity Admin Account'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {editing ? 'New Password (leave blank to keep)' : 'Password *'}
              </label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                required={!editing} minLength={6} className="input-field" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="input-field" />
            </div>
            {!editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcity *</label>
                <input name="subcity" value={form.subcity} onChange={handleChange} required
                  className="input-field" placeholder="e.g. Bole, Nifas Silk Lafto, Addis Ketema" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary px-6 py-2 text-sm">
              {editing ? 'Update' : 'Create Account'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {resetPwId && (
        <div className="card p-4 mb-6 flex items-center gap-3">
          <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)}
            className="input-field max-w-xs" placeholder="New password (min 6 chars)" />
          <button onClick={() => handleResetPassword(resetPwId)} className="btn-primary px-4 py-2 text-sm">Reset</button>
          <button onClick={() => { setResetPwId(null); setResetPw(''); }} className="text-sm text-gray-500">Cancel</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subcityAdmins.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Landmark size={40} strokeWidth={2} className="mx-auto mb-3" />
          <p>No subcity admins created yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Subcity</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcityAdmins.map(admin => (
                <tr key={admin._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs">
                        {admin.fullName?.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{admin.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-500">{admin.email}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      {subcityLabel(admin)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${admin.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setViewDetails(admin)}
                        className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                        View
                      </button>
                      <button onClick={() => handleEdit(admin)}
                        className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                        Edit
                      </button>
                      <button onClick={() => { setResetPwId(admin._id); setResetPw(''); }}
                        className="text-xs px-2 py-1 rounded border border-orange-200 dark:border-orange-800 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                        Reset PW
                      </button>
                      <button onClick={() => handleToggleActive(admin._id)}
                        className={`text-xs px-2 py-1 rounded border ${admin.isActive ? 'border-yellow-200 text-yellow-600 hover:bg-yellow-50' : 'border-green-200 text-green-600 hover:bg-green-50'} dark:border-opacity-50`}>
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(admin._id)}
                        className="text-xs px-2 py-1 rounded border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
