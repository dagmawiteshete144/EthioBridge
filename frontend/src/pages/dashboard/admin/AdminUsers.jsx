import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import { Users } from 'lucide-react';

const REGIONS = ['Addis Ababa','Oromia','Amhara','Tigray','Somali','Afar','Sidama','Central Ethiopia','South Ethiopia','Southwest Ethiopia','Gambella','Benishangul-Gumuz','Harari','Dire Dawa'];
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Super Admin' },
  { value: 'subcity_bole', label: 'Sub-city - Bole' },
  { value: 'subcity_yeka', label: 'Sub-city - Yeka' },
  { value: 'subcity_lemmi_kura', label: 'Sub-city - Lemmi Kura' },
  { value: 'woreda', label: 'Woreda' },
  { value: 'citizen', label: 'Citizen' },
  { value: 'volunteer', label: 'Volunteer' },
];

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ fullName:'', email:'', password:'', phone:'', role:'citizen', organizationName:'', organizationType:'', region:'', city:'' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getUsers({ search, role, page, limit: 12 });
      setUsers(r.data.users);
      setPages(r.data.pages);
      setTotal(r.data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, role, page]);

  const toggleActive = async (id) => {
    try {
      await adminAPI.toggleActive(id);
      toast.success(t('dashboard.accountStatusUpdated'));
      fetchUsers();
    } catch (err) { toast.error(t('dashboard.failedToUpdate')); }
  };

  const deleteUser = async (id) => {
    try {
      await adminAPI.deleteUser(id);
      toast.success(t('dashboard.userDeleted'));
      fetchUsers();
    } catch (err) { toast.error(t('dashboard.failedToDelete')); }
    setConfirm(null);
  };

  const openEdit = (u) => {
    setForm({ fullName:u.fullName, email:u.email, password:'', phone:u.phone||'', role:u.role, organizationName:u.organizationName||'', organizationType:u.organizationType||'', region:u.region||'', city:u.city||'' });
    setModal({ type:'edit', id:u._id });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (form.role && !ROLE_OPTIONS.some(o => o.value === form.role)) delete payload.role;
      await adminAPI.updateUser(modal.id, payload);
      toast.success(t('admin.userUpdated'));
      setModal(null);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || t('dashboard.actionFailed')); }
    finally { setSaving(false); }
  };

  const roleColor = {
    citizen:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    government:'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    ngo:'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    volunteer:'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    admin:'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    subcity_bole:'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    subcity_yeka:'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    subcity_lemmi_kura:'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    woreda:'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  };

  const isEditModal = modal && modal.type === 'edit';
  const editRoleOptions = isEditModal && !ROLE_OPTIONS.some(o => o.value === form.role)
    ? [...ROLE_OPTIONS, { value: form.role, label: form.role, legacy: true }]
    : ROLE_OPTIONS;

  return (
    <div className="space-y-5">
      <PageHeader title={<>{t('dashboard.userManagement')} <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">({total})</span></>} />

      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={t('dashboard.searchNameEmail')} className="input-field flex-1 min-w-[180px]" />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">{t('dashboard.allRoles')}</option>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : users.length === 0 ? <EmptyState icon={<Users size={48} strokeWidth={2} />} title={t('dashboard.noUsersFound')} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-700 text-left">
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{t('dashboard.userCol')}</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{t('dashboard.roleCol')}</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{t('dashboard.regionCol')}</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{t('dashboard.statusCol')}</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{t('dashboard.joinedCol')}</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{t('dashboard.actions')}</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{u.fullName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                    {u.organizationName && <p className="text-xs text-gray-400 dark:text-gray-500">{u.organizationName}</p>}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleColor[u.role] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{u.region || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{u.isActive ? t('dashboard.active') : t('dashboard.deactivated')}</span>
                      {!u.isApproved && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 w-fit">{t('dashboard.pendingApproval')}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => openEdit(u)} className="text-xs py-1 px-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 font-medium">{t('common.edit')}</button>
                      <button onClick={() => toggleActive(u._id)} className={`text-xs py-1 px-2 rounded-lg font-medium ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40' : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'}`}>
                        {u.isActive ? t('dashboard.deactivate') : t('dashboard.activate')}
                      </button>
                      <button onClick={() => setConfirm({ id: u._id, name: u.fullName })} className="text-xs py-1 px-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600">{t('dashboard.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <ConfirmModal
        isOpen={!!confirm}
        title={t('dashboard.deleteUser')}
        message={t('dashboard.deleteUserConfirm', { name: confirm?.name })}
        confirmLabel={t('dashboard.delete')}
        danger
        onConfirm={() => deleteUser(confirm.id)}
        onCancel={() => setConfirm(null)}
      />

      {isEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl dark:bg-gray-800 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">{t('admin.editUser')}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.fullName')} *</label>
                  <input value={form.fullName} onChange={e => setForm(p => ({...p, fullName:e.target.value}))} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.emailLabel')} *</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email:e.target.value}))} required className="input-field" disabled />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.roleCol')} *</label>
                  <select value={form.role} onChange={e => setForm(p => ({...p, role:e.target.value}))} required className="input-field">
                    {editRoleOptions.map(r => <option key={r.value} value={r.value} disabled={r.legacy}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.phoneNumber')}</label>
                  <input value={form.phone} onChange={e => setForm(p => ({...p, phone:e.target.value}))} className="input-field" placeholder="+251 9XX XXX XXX" />
                </div>
              </div>
              {(form.role === 'government' || form.role === 'ngo') && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.orgName')}</label>
                    <input value={form.organizationName} onChange={e => setForm(p => ({...p, organizationName:e.target.value}))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.orgType')}</label>
                    <input value={form.organizationType} onChange={e => setForm(p => ({...p, organizationType:e.target.value}))} className="input-field" />
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.regionCol')}</label>
                  <select value={form.region} onChange={e => setForm(p => ({...p, region:e.target.value}))} className="input-field">
                    <option value="">{t('dashboard.selectRegion')}</option>
                    {REGIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.cityTown')}</label>
                  <input value={form.city} onChange={e => setForm(p => ({...p, city:e.target.value}))} className="input-field" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? t('dashboard.processing') : t('admin.saveChanges')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
