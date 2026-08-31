import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import { locationAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Eye, EyeOff, UserRound, UserRoundCheck } from 'lucide-react';

const SUBCITY_VALUE_MAP = {
  YEKA: 'Yeka',
  BOLE: 'Bole',
  LEMMI_KURA: 'Lemmi Kura',
};

const ROLE_ROUTES = {
  citizen: '/dashboard/citizen',
  volunteer: '/dashboard/volunteer',
};

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [form, setForm] = useState({
    role: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    age: '',
    profession: '',
    skills: '',
    subcity: '',
    woredaName: '',
  });

  const roleInfo = {
    citizen:    { icon: UserRound, label: t('register.roleCitizen'),              desc: t('register.roleCitizenDesc') },
    volunteer:  { icon: UserRoundCheck, label: t('register.roleVolunteer'),            desc: t('register.roleVolunteerDesc') },
  };
  const RoleIcon = roleInfo[form.role]?.icon;

  useEffect(() => {
    locationAPI.getSubcities()
      .then(r => setSubcities(r.data.subcities || []))
      .catch(() => setSubcities([]));
  }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const selectRole = (role) => { setForm(p => ({ ...p, role })); setStep(2); };

  const handleSubcityChange = async (e) => {
    const value = e.target.value;
    setForm(p => ({ ...p, subcity: value, woredaName: '' }));
    setWoredas([]);
    if (!value) return;
    const subcity = subcities.find(s => (s.name || '').toLowerCase() === (SUBCITY_VALUE_MAP[value] || '').toLowerCase());
    if (!subcity) return;
    try {
      const r = await locationAPI.getWoredasBySubcity(subcity._id);
      setWoredas(r.data.woredas || []);
    } catch (err) {
      setWoredas([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(t('toast.passwordsDoNotMatch'));
      return;
    }
    if (form.password.length < 6) {
      toast.error(t('toast.passwordTooShort'));
      return;
    }
    if (form.role === 'volunteer' && !form.subcity) {
      toast.error(t('toast.volunteerSubcityRequired'));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      delete payload.confirmPassword;
      const registeredUser = await register(payload);
      if (registeredUser?.role) {
        const destination = ROLE_ROUTES[registeredUser.role] || '/';
        toast.success(t('toast.welcomeBack', { name: registeredUser.fullName }));
        navigate(destination, { replace: true });
      } else {
        toast.success(t('toast.registrationSuccess') + ' Please log in using your email and password.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('toast.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12 transition-colors">
      <div className="w-full max-w-xl">
        {/* Theme toggle */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-2xl">E</div>
            <span className="font-bold text-2xl text-primary-700 dark:text-primary-400">EthioBridge</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('register.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('register.subtitle')}</p>
        </div>

        {/* Step 1: Select Role */}
        {step === 1 && (
          <div className="card shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('register.selectRole')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(roleInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => selectRole(key)}
                  className="border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl p-4 text-left transition-all group"
                >
                  <div className="text-3xl mb-2"><info.icon className="w-7 h-7" /></div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm group-hover:text-primary-700 dark:group-hover:text-primary-400">{info.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{info.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('register.haveAccount')} <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">{t('register.signIn')}</Link>
            </p>
          </div>
        )}

        {/* Step 2: Fill Details */}
        {step === 2 && (
          <div className="card shadow-lg">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">←</button>
              <div className="flex items-center gap-2">
                <span className="text-2xl"><RoleIcon className="w-6 h-6" /></span>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{roleInfo[form.role]?.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('register.fillDetails')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.fullName')}</label>
                <input name="fullName" required value={form.fullName} onChange={handleChange} className="input-field" placeholder={t('register.fullNamePlaceholder')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.emailAddress')}</label>
                  <input name="email" type="email" required value={form.email} onChange={handleChange} className="input-field" placeholder={t('register.emailPlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.phoneNumber')}</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder={t('register.phonePlaceholder')} />
                </div>
              </div>

              {form.role === 'volunteer' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.gender')}</label>
                      <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                        <option value="">{t('register.selectGender')}</option>
                        <option value="Male">{t('register.male')}</option>
                        <option value="Female">{t('register.female')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.age')}</label>
                      <input name="age" type="number" min="0" max="150" value={form.age} onChange={handleChange} className="input-field" placeholder={t('register.agePlaceholder')} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.profession')}</label>
                    <input name="profession" value={form.profession} onChange={handleChange} className="input-field" placeholder={t('register.professionPlaceholder')} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.skills')}</label>
                    <input name="skills" value={form.skills} onChange={handleChange} className="input-field" placeholder={t('register.skillsPlaceholder')} />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {form.role === 'volunteer' && <span className="text-red-500">* </span>}Subcity
                  </label>
                  <select name="subcity" value={form.subcity} onChange={handleSubcityChange} className="input-field">
                    <option value="">Select Subcity</option>
                    <option value="YEKA">Yeka</option>
                    <option value="BOLE">Bole</option>
                    <option value="LEMMI_KURA">Lemmi Kefleketema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Woreda</label>
                  <select name="woredaName" value={form.woredaName} onChange={handleChange} className="input-field" disabled={!form.subcity}>
                    <option value="">{form.subcity ? 'Select Woreda' : 'Select Subcity first'}</option>
                    {woredas.map(w => <option key={w._id} value={w.woredaName || w.name}>{w.woredaName || w.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.password')}</label>
                <div className="relative">
                  <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={handleChange} className="input-field pr-10" placeholder={t('register.passwordPlaceholder')} />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.confirmPassword')}</label>
                <input name="confirmPassword" type="password" required value={form.confirmPassword} onChange={handleChange} className="input-field" placeholder={t('register.confirmPlaceholder')} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('register.registering')}
                  </span>
                ) : t('register.createAccount')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              {t('register.haveAccount')} <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">{t('register.signIn')}</Link>
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">{t('register.backToHome')}</Link>
        </div>
      </div>
    </div>
  );
}
