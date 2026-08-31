import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { locationAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Building2, Landmark, LoaderCircle, Info, Save, X, Inbox } from 'lucide-react';

const TABS = [
  { id: 'subcities',   label: 'Manage Subcities',  icon: Building2 },
  { id: 'woredas',     label: 'Manage Woredas',    icon: Building2 },
  { id: 'departments', label: 'Manage Departments', icon: Landmark },
];

export default function AdminLocationDeptManagement() {
  const [tab, setTab] = useState('subcities');
  const [woredaSubcityId, setWoredaSubcityId] = useState('');

  const openWoredas = (subcityId) => {
    setWoredaSubcityId(subcityId);
    setTab('woredas');
  };

  return (
    <div>
        <PageHeader title="Location & Department Management"
          subtitle="Manage subcities, woredas, and departments. These power the Report Complaint form — changes are reflected instantly." />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2
              ${tab === t.id
                ? 'bg-primary-600 text-white shadow'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <t.icon size={20} strokeWidth={2} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'subcities' && <SubcityManager onManageWoredas={openWoredas} />}
      {tab === 'woredas' && <WoredaManager initialSubcityId={woredaSubcityId} />}
      {tab === 'departments' && <DepartmentManager />}
    </div>
  );
}

/* ─────────────────── Subcities ─────────────────── */

function SubcityManager({ onManageWoredas }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await locationAPI.getAllSubcities();
      setItems(res.data.subcities || []);
    } catch (err) {
      toast.error('Failed to load subcities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setName('');
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openEdit = (item) => {
    setName(item.name);
    setEditing(item._id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Subcity name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await locationAPI.updateSubcity(editing, { name: name.trim() });
        toast.success('Subcity updated');
      } else {
        await locationAPI.createSubcity({ name: name.trim() });
        toast.success('Subcity added');
      }
      resetForm();
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete subcity "${item.name}" and all of its woredas? This cannot be undone.`)) return;
    try {
      await locationAPI.deleteSubcity(item._id);
      toast.success('Subcity deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subcity');
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Building2 className="text-primary-600 dark:text-primary-400" size={20} strokeWidth={2} /> Subcities
        </h3>
        <p className="text-sm text-gray-500">Use "Manage Woredas" to view and manage the woredas of a subcity.</p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-end animate-fade-in">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {editing ? 'Edit Subcity Name' : 'Subcity Name'} *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Bole"
              className={`input-field ${error ? 'border-red-400' : ''}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
              {saving ? <LoaderCircle className="animate-spin" size={18} strokeWidth={2} /> : <Save size={18} strokeWidth={2} />}
              {editing ? 'Update' : 'Add Subcity'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><LoaderCircle className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Building2 size={40} strokeWidth={2} className="mx-auto mb-3" />
          <p>No subcities yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-500">Subcity Name</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => onManageWoredas(item._id)} className="text-xs px-3 py-1.5 rounded border border-primary-200 dark:border-primary-800 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:text-primary-400 flex items-center gap-1">
                        <Building2 size={14} strokeWidth={2} /> Manage Woredas
                      </button>
                      <button onClick={() => openEdit(item)} className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Pencil size={14} strokeWidth={2} /> Edit
                      </button>
                      <button onClick={() => handleDelete(item)} className="text-xs px-3 py-1.5 rounded border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1">
                        <Trash2 size={14} strokeWidth={2} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ─────────────────── Woredas ─────────────────── */

function WoredaManager({ initialSubcityId }) {
  const [subcities, setSubcities] = useState([]);
  const [selectedSubcityId, setSelectedSubcityId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubcities, setLoadingSubcities] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await locationAPI.getAllSubcities();
        setSubcities(res.data.subcities || []);
      } catch (err) {
        toast.error('Failed to load subcities');
      } finally {
        setLoadingSubcities(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (initialSubcityId && subcities.some(s => s._id === initialSubcityId) && !selectedSubcityId) {
      setSelectedSubcityId(initialSubcityId);
      fetchWoredas(initialSubcityId);
    }
  }, [initialSubcityId, subcities, selectedSubcityId, fetchWoredas]);

  const fetchWoredas = useCallback(async (subcityId) => {
    if (!subcityId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await locationAPI.getAllWoredas({ subcityId });
      setItems(res.data.woredas || []);
    } catch (err) {
      toast.error('Failed to load woredas');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubcityChange = (e) => {
    const id = e.target.value;
    setSelectedSubcityId(id);
    setShowForm(false);
    setEditing(null);
    setError('');
    setName('');
    fetchWoredas(id);
  };

  const resetForm = () => {
    setName('');
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openEdit = (item) => {
    setName(item.woredaName || item.name);
    setEditing(item._id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubcityId) { setError('Please select a subcity first'); return; }
    if (!name.trim()) { setError('Woreda name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await locationAPI.updateWoreda(editing, { subcityId: selectedSubcityId, woredaName: name.trim() });
        toast.success('Woreda updated');
      } else {
        await locationAPI.createWoreda({ subcityId: selectedSubcityId, woredaName: name.trim() });
        toast.success('Woreda added');
      }
      resetForm();
      fetchWoredas(selectedSubcityId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete woreda "${item.woredaName || item.name}"? This cannot be undone.`)) return;
    try {
      await locationAPI.deleteWoreda(item._id);
      toast.success('Woreda deleted');
      fetchWoredas(selectedSubcityId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete woreda');
    }
  };

  const selectedSubcity = subcities.find(s => s._id === selectedSubcityId);

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
        <Building2 className="text-primary-600 dark:text-primary-400" size={20} strokeWidth={2} /> Woredas
      </h3>

      <div className="card p-5 mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Subcity *</label>
        {loadingSubcities ? (
          <div className="input-field flex items-center gap-2 text-gray-400">
            <LoaderCircle className="w-4 h-4 animate-spin" /> Loading subcities...
          </div>
        ) : (
          <select value={selectedSubcityId} onChange={handleSubcityChange} className="input-field">
            <option value="">Select a subcity...</option>
            {subcities.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        )}
        {!loadingSubcities && subcities.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> No subcities exist yet. Add subcities in the Subcities tab first.
          </p>
        )}
      </div>

      {selectedSubcity && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Showing woredas for <span className="font-semibold text-gray-800 dark:text-gray-100">{selectedSubcity.name}</span>
          </p>
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setError(''); }}
            className={`${showForm ? 'btn-secondary' : 'btn-primary'} px-4 py-2 text-sm flex items-center gap-2`}
          >
            {showForm ? <><X size={18} strokeWidth={2} /> Cancel</> : <><Plus size={18} strokeWidth={2} /> Add Woreda</>}
          </button>
        </div>
      )}

      {showForm && selectedSubcity && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-end animate-fade-in">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {editing ? 'Edit Woreda Name' : `Woreda Name (${selectedSubcity.name})`} *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. 01"
              className={`input-field ${error ? 'border-red-400' : ''}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
              {saving ? <LoaderCircle className="animate-spin" size={18} strokeWidth={2} /> : <Save size={18} strokeWidth={2} />}
              {editing ? 'Update' : 'Add Woreda'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {!selectedSubcityId ? (
        <div className="card p-12 text-center text-gray-400">
          <Building2 size={40} strokeWidth={2} className="mx-auto mb-3" />
          <p>Select a subcity to view and manage its woredas.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><LoaderCircle className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Inbox size={40} strokeWidth={2} className="mx-auto mb-3" />
          <p>No woredas found for {selectedSubcity?.name}. Add one above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-500">Woreda Name</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Subcity</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{item.woredaName || item.name}</td>
                  <td className="py-3 px-2 text-gray-500">{selectedSubcity?.name}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(item)} className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Pencil size={14} strokeWidth={2} /> Edit
                      </button>
                      <button onClick={() => handleDelete(item)} className="text-xs px-3 py-1.5 rounded border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1">
                        <Trash2 size={14} strokeWidth={2} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ─────────────────── Departments ─────────────────── */

function DepartmentManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await locationAPI.getAllDepartments();
      setItems(res.data.departments || []);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setName('');
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openEdit = (item) => {
    setName(item.departmentName);
    setEditing(item._id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Department name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await locationAPI.updateDepartment(editing, { departmentName: name.trim() });
        toast.success('Department updated');
      } else {
        await locationAPI.createDepartment({ departmentName: name.trim() });
        toast.success('Department added');
      }
      resetForm();
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete department "${item.departmentName}"? This cannot be undone.`)) return;
    try {
      await locationAPI.deleteDepartment(item._id);
      toast.success('Department deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Building2 className="text-primary-600 dark:text-primary-400" size={20} strokeWidth={2} /> Departments
        </h3>
        <p className="text-sm text-gray-500">Edit or remove departments. These power the Report Complaint form.</p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-end animate-fade-in">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {editing ? 'Edit Department Name' : 'Department Name'} *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Drainage Issue"
              className={`input-field ${error ? 'border-red-400' : ''}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
              {saving ? <LoaderCircle className="animate-spin" size={18} strokeWidth={2} /> : <Save size={18} strokeWidth={2} />}
              {editing ? 'Update' : 'Add Department'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="mb-5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3 text-xs text-primary-700 dark:text-primary-300 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Changes to departments are instantly reflected in the public Report Complaint form.</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoaderCircle className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Landmark size={40} strokeWidth={2} className="mx-auto mb-3" />
          <p>No departments yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-500">Department Name</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{item.departmentName}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(item)} className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Pencil size={14} strokeWidth={2} /> Edit
                      </button>
                      <button onClick={() => handleDelete(item)} className="text-xs px-3 py-1.5 rounded border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1">
                        <Trash2 size={14} strokeWidth={2} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
