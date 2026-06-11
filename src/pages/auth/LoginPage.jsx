import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, ShieldCheck, Globe, ArrowLeft, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { authApi } from '../../api/auth';
import { Spinner, ErrorMsg } from '../../components/common/index';
import './auth.css';

function ScgTextLogo({ variant = 'card' }) {
  /* variant = 'card' (on white) | 'panel' (on dark) */
  return (
    <div className={`auth-text-logo auth-text-logo--${variant}`}>
      <span className="auth-text-logo-scg">SCG</span>
      <div className="auth-text-logo-divider" />
      <span className="auth-text-logo-ar">مجموعة شبانه للاستشارات</span>
      <span className="auth-text-logo-en">SHABANA CONSULTING GROUP</span>
    </div>
  );
}

export default function LoginPage() {
  const { login, updateUser } = useAuth();
  const { t, lang, toggleLang, isRTL } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword]   = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [serverError, setServerError]     = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsGoogleLoading(true);
    try {
      const res = await authApi.googleLogin({ idToken: credentialResponse.credential });
      const dto = res.data?.data ?? res.data;

      // مستخدم جديد — محتاج يكمل بيانات شركته
      if (dto?.requiresProfileCompletion || dto?.isNewUser) {
        navigate('/register', { state: { googleVerificationToken: dto.verificationToken, googleProfile: { email: dto.email, fullName: dto.fullName, avatarUrl: dto.avatarUrl } } });
        return;
      }

      localStorage.setItem('accessToken', dto.accessToken);
      localStorage.setItem('refreshToken', dto.refreshToken);
      await updateUser({
        id: dto.userId, companyId: dto.companyId, fullName: dto.fullName,
        email: dto.email, role: dto.role, avatarUrl: dto.avatarUrl ?? null,
      });
      toast.success(lang === 'ar' ? 'مرحباً بك!' : 'Welcome!');
      queryClient.clear();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || (lang === 'ar' ? 'فشل تسجيل الدخول بـ Google' : 'Google login failed'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '', twoFactorCode: '' },
  });

  const onLoginSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const result = await login({ email: data.email, password: data.password });
      if (result.requiresTwoFactor) {
        setTwoFactorEmail(result.twoFactorEmail);
        setTwoFactorStep(true);
        toast.success(lang === 'ar' ? 'أدخل رمز التحقق الثنائي' : 'Enter your 2FA code');
      } else {
        toast.success(lang === 'ar' ? 'مرحباً بك!' : 'Welcome back!');
        queryClient.clear();
        navigate('/dashboard');
      }
    } catch (err) {
      setServerError(
        err?.response?.data?.message ||
        (lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const on2FASubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const res = await authApi.verify2FA({ email: twoFactorEmail, code: data.twoFactorCode });
      const dto = res.data.data;
      localStorage.setItem('accessToken', dto.accessToken);
      localStorage.setItem('refreshToken', dto.refreshToken);
      await updateUser({
        id: dto.userId, companyId: dto.companyId, fullName: dto.fullName,
        email: dto.email, role: dto.role, avatarUrl: dto.avatarUrl ?? null,
      });
      toast.success(lang === 'ar' ? 'مرحباً بك!' : 'Welcome back!');
      queryClient.clear();
      navigate('/dashboard');
    } catch (err) {
      setServerError(
        err?.response?.data?.message ||
        (lang === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid 2FA code'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <div className="auth-topbar">
        <Link to="/" className="auth-back-btn">
          {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
          {lang === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <button onClick={toggleLang} className="auth-lang-btn">
          <Globe size={14} />
          {lang === 'ar' ? 'EN' : 'عربي'}
        </button>
      </div>

      {/* Main */}
      <div className="auth-main">
        {/* Left brand panel — desktop only */}
        <div className="auth-left">
          <ScgTextLogo variant="panel" />
          <p className="auth-brand-title">
            {lang === 'ar' ? 'نحو قرارات أذكى .. ومستقبل أفضل' : 'Smarter Decisions. Better Future.'}
          </p>
          <p className="auth-brand-sub">
            {lang === 'ar'
              ? 'منصة الاستشارات الذكية المدعومة بالذكاء الاصطناعي'
              : 'AI-Powered Consulting Platform'}
          </p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-logo">
            <ScgTextLogo variant="card" />
          </div>

          {!twoFactorStep ? (
            <>
              <h2 className="auth-card-title">{t('welcomeBack')}</h2>
              <p className="auth-card-sub">
                {lang === 'ar' ? 'سجّل دخولك للمتابعة' : 'Sign in to continue'}
              </p>

              <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4" noValidate>
                {serverError && <ErrorMsg message={serverError} />}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="label">{t('email')}</label>
                  <input
                    type="email"
                    autoComplete="email"
                    className={`input ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder={lang === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    {...register('email', {
                      required: lang === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: lang === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email',
                      },
                    })}
                  />
                  {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="label">{t('password')}</label>
                    <Link to="/forgot-password" className="auth-footer-link text-xs">
                      {t('forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`input pe-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder={lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                      {...register('password', {
                        required: lang === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required',
                        minLength: { value: 6, message: lang === 'ar' ? 'لا تقل عن 6 أحرف' : 'Min 6 characters' },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
                  {isSubmitting ? <Spinner size="sm" /> : (<><LogIn size={16} />{t('login')}</>)}
                </button>
              </form>

              {/* Google Login */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
                  {lang === 'ar' ? 'أو' : 'or'}
                </div>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error(lang === 'ar' ? 'فشل تسجيل الدخول بـ Google' : 'Google login failed')}
                  text={lang === 'ar' ? 'signin_with' : 'signin_with'}
                  locale={lang === 'ar' ? 'ar' : 'en'}
                  width="100%"
                  useOneTap={false}
                />
              </div>

              <p className="auth-footer-text">
                {lang === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                <Link to="/register" className="auth-footer-link">{t('register')}</Link>
              </p>
            </>
          ) : (
            /* 2FA Step */
            <>
              <div className="text-center mb-5">
                <div className="auth-verify-icon mx-auto">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="auth-card-title">
                  {lang === 'ar' ? 'التحقق الثنائي' : 'Two-Factor Auth'}
                </h2>
                <p className="auth-card-sub">
                  {lang === 'ar'
                    ? 'أدخل رمز التحقق من تطبيق المصادقة'
                    : 'Enter the code from your authenticator app'}
                </p>
              </div>

              <form onSubmit={handleSubmit(on2FASubmit)} className="space-y-4" noValidate>
                {serverError && <ErrorMsg message={serverError} />}

                <div className="space-y-1.5">
                  <label className="label">
                    {lang === 'ar' ? 'رمز التحقق' : 'Verification Code'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className={`input text-center text-2xl tracking-[0.5em] font-mono ${errors.twoFactorCode ? 'border-red-400' : ''}`}
                    placeholder="000000"
                    {...register('twoFactorCode', {
                      required: lang === 'ar' ? 'رمز التحقق مطلوب' : 'Code is required',
                      pattern: { value: /^\d{6}$/, message: lang === 'ar' ? 'يجب أن يكون 6 أرقام' : '6 digits required' },
                    })}
                  />
                  {errors.twoFactorCode && (
                    <p className="text-xs text-red-600">{errors.twoFactorCode.message}</p>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
                  {isSubmitting ? <Spinner size="sm" /> : (lang === 'ar' ? 'تحقق' : 'Verify')}
                </button>

                <button
                  type="button"
                  onClick={() => { setTwoFactorStep(false); setServerError(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 text-center mt-1"
                >
                  {lang === 'ar' ? 'رجوع لتسجيل الدخول' : 'Back to login'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="auth-copyright">
        &copy; {new Date().getFullYear()} Shabana Consulting Group.{' '}
        {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
      </p>
    </div>
  );
}
