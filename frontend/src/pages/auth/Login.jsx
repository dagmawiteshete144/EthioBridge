import { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const ROLE_ROUTES = {
  citizen: '/dashboard/citizen',
  volunteer: '/dashboard/volunteer',
  admin: '/dashboard/admin',
  subcity: '/subcity/dashboard',
  subcity_bole: '/subcity/bole/dashboard',
  subcity_yeka: '/subcity/yeka/dashboard',
  subcity_lemmi_kura: '/subcity/lemmi/dashboard',
  woreda: '/woreda/dashboard',
  department: '/department/dashboard',
};

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const loginAttempted = useRef(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await login(form.email, form.password);
      loginAttempted.current = true;

      let destination = ROLE_ROUTES[loggedInUser.role] || '/';

      // After login, continue to the page the user originally requested.
      if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
        destination = redirectTo;
      }

      toast.success(t('toast.welcomeBack', { name: loggedInUser.fullName }));
      navigate(destination, { replace: true });
    } catch (err) {
      let msg;
      if (!err.response) {
        msg = `${t('toast.serverUnreachable')} (${API.defaults.baseURL})`;
      } else {
        msg = err.response?.data?.message || t('toast.loginFailed');
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-cover bg-center flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto"
      style={{ backgroundImage: "url('/images/selam.png')" }}>
      <div className="absolute inset-0 bg-black/10 dark:bg-black/50" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl border border-blue-500/60 bg-white/90 backdrop-blur-md shadow-xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto dark:bg-[#0b1a2e]/90 dark:border-blue-500/70">
          <div className="absolute top-3 right-3 z-20">
            <ThemeToggle />
          </div>

          <div className="text-center mb-4 sm:mb-5">
            <Link to="/" className="inline-flex items-center justify-center gap-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl">E</div>
              <span className="font-bold text-lg sm:text-xl text-primary-700 dark:text-white">EthioBridge</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mt-3 dark:text-white">{t('login.welcome')}</h1>
            <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-300">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-900/30 dark:border-red-500/50 dark:text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-200">{t('login.emailLabel')}</label>
              <input
                name="email" type="email" required autoComplete="email"
                value={form.email} onChange={handleChange}
                className="input-field text-sm"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-200">{t('login.passwordLabel')}</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                  value={form.password} onChange={handleChange}
                  className="input-field pr-10 text-sm"
                  placeholder={t('login.passwordPlaceholder')}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg dark:text-gray-400 dark:hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 sm:py-3 text-sm font-semibold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('login.signingIn')}
                </span>
              ) : t('login.signIn')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-primary-600 font-medium hover:underline dark:text-blue-400">{t('login.registerHere')}</Link>
            </p>
          </div>

          <div className="mt-3 text-center border-t border-gray-100 pt-3 dark:border-gray-700">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">{t('login.backToHome')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
