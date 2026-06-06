import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, UserPlus, ShieldCheck, CheckCircle2,
  RefreshCw, ChevronRight, ChevronLeft, Building2, Globe,
  ArrowLeft, ArrowRight,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { Spinner, ErrorMsg } from '../../components/common/index';
import './auth.css';

function ScgTextLogo({ variant = 'card' }) {
  return (
    <div className={`auth-text-logo auth-text-logo--${variant}`}>
      <span className="auth-text-logo-scg">SCG</span>
      <div className="auth-text-logo-divider" />
      <span className="auth-text-logo-ar">مجموعة شبانه للاستشارات</span>
      <span className="auth-text-logo-en">SHABANA CONSULTING GROUP</span>
    </div>
  );
}

const SECTORS = [
  'Technology', 'Finance', 'Healthcare', 'Education',
  'Retail', 'Manufacturing', 'Consulting', 'Real Estate', 'Other',
];
const SIZES = ['Small', 'Medium', 'Large', 'Enterprise'];

function StepBar({ step, lang }) {
  const steps = [
    { num: 1, label: lang === 'ar' ? 'الحساب'  : 'Account' },
    { num: 2, label: lang === 'ar' ? 'التحقق'  : 'Verify'  },
    { num: 3, label: lang === 'ar' ? 'الشركة'  : 'Company' },
    { num: 4, label: lang === 'ar' ? 'اكتمل'   : 'Done'    },
  ];

  return (
    <div className="auth-stepbar">
      {steps.map((s, idx) => {
        const state = step > s.num ? 'done' : step === s.num ? 'active' : 'pending';
        return (
          <div key={s.num} className="auth-step">
            <div className="auth-step-circle">
              <div className={`auth-step-dot ${state}`}>
                {step > s.num ? <CheckCircle2 size={13} /> : s.num}
              </div>
              <span className={`auth-step-label ${state}`}>{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`auth-step-line ${step > s.num ? 'done' : 'pending'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const { t, lang, toggleLang, isRTL } = useLang();
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]                 = useState(1);
  const [serverError, setServerError]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googlePrefill, setGooglePrefill] = useState(null); // { googleId, email, fullName, avatarUrl }
  const [isResending, setIsResending]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [registeredEmail, setRegisteredEmail]     = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  const step1 = useForm({ defaultValues: { email: '', password: '', passwordConfirm: '' } });
  const step2 = useForm({ defaultValues: { otp: '' } });
  const step3 = useForm({ defaultValues: { adminFullName: '', companyName: '', sector: '', size: '' } });

  const password1 = step1.watch('password');
  const clearError = () => setServerError('');

  // ── Google Register ────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsGoogleLoading(true);
    clearError();
    try {
      const res = await authApi.googleLogin({ idToken: credentialResponse.credential });
      const dto = res.data?.data ?? res.data;

      if (dto?.accessToken) {
        // حساب موجود — سجّل دخوله مباشرة
        localStorage.setItem('accessToken', dto.accessToken);
        localStorage.setItem('refreshToken', dto.refreshToken);
        await updateUser({
          id: dto.userId, companyId: dto.companyId, fullName: dto.fullName,
          email: dto.email, role: dto.role, avatarUrl: dto.avatarUrl ?? null,
        });
        toast.success(lang === 'ar' ? 'مرحباً بك!' : 'Welcome back!');
        navigate('/dashboard');
        return;
      }

      // مستخدم جديد — الـ backend رجع verificationToken
      if (dto?.requiresProfileCompletion || dto?.isNewUser) {
        setVerificationToken(dto.verificationToken);
        setGooglePrefill({
          email:    dto.email,
          fullName: dto.fullName,
          avatarUrl: dto.avatarUrl,
        });
        toast.success(lang === 'ar' ? 'تم التحقق من Google، أكمل بيانات شركتك' : 'Google verified! Complete your company info');
        setStep(3);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || (lang === 'ar' ? 'فشل تسجيل الدخول بـ Google' : 'Google failed'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onStep1Submit = async (data) => {
    clearError();
    setIsSubmitting(true);
    try {
      await authApi.register({
        email: data.email, password: data.password, passwordConfirm: data.passwordConfirm,
      });
      setRegisteredEmail(data.email);
      toast.success(lang === 'ar' ? 'تم إرسال رمز التحقق إلى بريدك' : 'Verification code sent to your email');
      setStep(2);
    } catch (err) {
      setServerError(err?.response?.data?.message || (lang === 'ar' ? 'حدث خطأ' : 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onStep2Submit = async (data) => {
    clearError();
    setIsSubmitting(true);
    try {
      const res = await authApi.verifyOtp({ email: registeredEmail, otp: data.otp });
      const token = res?.data?.data?.verificationToken;
      if (!token) throw new Error('No verification token returned');
      setVerificationToken(token);
      toast.success(lang === 'ar' ? 'تم التحقق بنجاح' : 'Verified successfully!');
      setStep(3);
    } catch (err) {
      setServerError(err?.response?.data?.message || (lang === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid verification code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      await authApi.resendOtp({ email: registeredEmail });
      toast.success(lang === 'ar' ? 'تم إعادة إرسال الرمز' : 'Code resent');
    } catch {
      toast.error(lang === 'ar' ? 'فشل إعادة الإرسال' : 'Failed to resend');
    } finally {
      setIsResending(false);
    }
  };

  const onStep3Submit = async (data) => {
    clearError();
    setIsSubmitting(true);
    try {
      // مسار Google أو Email — كلاهم بيستخدم verificationToken + completeReg
      await authApi.completeReg({
        verificationToken,
        adminFullName: data.adminFullName,
        companyName:   data.companyName,
        sector:        data.sector,
        size:          data.size,
      });
      toast.success(lang === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      setStep(4);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setServerError(err?.response?.data?.message || (lang === 'ar' ? 'فشل إكمال التسجيل' : 'Failed to complete registration'));
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
          <div className="auth-brand-divider" />
          <p className="auth-brand-title">
            {lang === 'ar' ? 'انضم إلى منصة الاستشارات الذكية' : 'Join the Smart Consulting Platform'}
          </p>
          <p className="auth-brand-sub">
            {lang === 'ar'
              ? 'أنشئ حسابك وابدأ رحلتك نحو قرارات أفضل'
              : 'Create your account and start your journey toward smarter decisions'}
          </p>
        </div>

        {/* Card */}
        <div className="auth-card" style={{ maxWidth: '480px' }}>
          <div className="auth-card-logo">
            <ScgTextLogo variant="card" />
          </div>

          <StepBar step={step} lang={lang} />

          {/* ── STEP 1: Email + Password ─────────────────────── */}
          {step === 1 && (
            <>
              <h2 className="auth-card-title">
                {lang === 'ar' ? 'إنشاء حساب جديد' : 'Create your account'}
              </h2>
              <p className="auth-card-sub">
                {lang === 'ar' ? 'بيانات الدخول' : 'Account credentials'}
              </p>

              <form onSubmit={step1.handleSubmit(onStep1Submit)} className="space-y-4" noValidate>
                {serverError && <ErrorMsg message={serverError} />}

                <div className="space-y-1.5">
                  <label className="label">{t('email')} *</label>
                  <input
                    type="email"
                    className={`input ${step1.formState.errors.email ? 'border-red-400' : ''}`}
                    placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                    {...step1.register('email', {
                      required: lang === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: lang === 'ar' ? 'بريد غير صالح' : 'Invalid email' },
                    })}
                  />
                  {step1.formState.errors.email && <p className="text-xs text-red-600">{step1.formState.errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="label">{t('password')} *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`input pe-10 ${step1.formState.errors.password ? 'border-red-400' : ''}`}
                      placeholder={lang === 'ar' ? '8 أحرف على الأقل' : 'Min 8 characters'}
                      {...step1.register('password', {
                        required: lang === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required',
                        minLength: { value: 8, message: lang === 'ar' ? 'لا تقل عن 8 أحرف' : 'Minimum 8 characters' },
                      })}
                    />
                    <button type="button" onClick={() => setShowPassword((p) => !p)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {step1.formState.errors.password && <p className="text-xs text-red-600">{step1.formState.errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="label">{t('confirmPassword')} *</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className={`input pe-10 ${step1.formState.errors.passwordConfirm ? 'border-red-400' : ''}`}
                      placeholder={lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}
                      {...step1.register('passwordConfirm', {
                        required: lang === 'ar' ? 'تأكيد كلمة المرور مطلوب' : 'Please confirm your password',
                        validate: (val) => val === password1 || (lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'),
                      })}
                    />
                    <button type="button" onClick={() => setShowConfirm((p) => !p)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {step1.formState.errors.passwordConfirm && <p className="text-xs text-red-600">{step1.formState.errors.passwordConfirm.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
                  {isSubmitting ? <Spinner size="sm" /> : (
                    <>{lang === 'ar' ? 'متابعة' : 'Continue'}{isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}</>
                  )}
                </button>
              </form>

              {/* Google Register */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
                  {lang === 'ar' ? 'أو سجّل بـ' : 'or register with'}
                </div>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error(lang === 'ar' ? 'فشل التسجيل بـ Google' : 'Google registration failed')}
                  text="signup_with"
                  locale={lang === 'ar' ? 'ar' : 'en'}
                  useOneTap={false}
                />
              </div>

              <p className="auth-footer-text">
                {lang === 'ar' ? 'لديك حساب؟' : 'Already have an account?'}{' '}
                <Link to="/login" className="auth-footer-link">{t('login')}</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP ──────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="text-center mb-4">
                <div className="auth-verify-icon mx-auto">
                  <ShieldCheck size={22} />
                </div>
                <h2 className="auth-card-title">
                  {lang === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}
                </h2>
                <p className="auth-card-sub">
                  {lang === 'ar'
                    ? `أرسلنا رمز التحقق إلى ${registeredEmail}`
                    : `We sent a 6-digit code to ${registeredEmail}`}
                </p>
              </div>

              <form onSubmit={step2.handleSubmit(onStep2Submit)} className="space-y-4" noValidate>
                {serverError && <ErrorMsg message={serverError} />}

                <div className="space-y-1.5">
                  <label className="label">
                    {lang === 'ar' ? 'رمز التحقق (6 أرقام)' : 'Verification Code (6 digits)'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className={`input text-center text-2xl tracking-[0.5em] font-mono ${step2.formState.errors.otp ? 'border-red-400' : ''}`}
                    placeholder="000000"
                    {...step2.register('otp', {
                      required: lang === 'ar' ? 'رمز التحقق مطلوب' : 'OTP is required',
                      pattern: { value: /^\d{6}$/, message: lang === 'ar' ? 'يجب أن يكون 6 أرقام' : 'Must be 6 digits' },
                    })}
                  />
                  {step2.formState.errors.otp && <p className="text-xs text-red-600">{step2.formState.errors.otp.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
                  {isSubmitting ? <Spinner size="sm" /> : (lang === 'ar' ? 'تحقق' : 'Verify Code')}
                </button>

                <div className="flex items-center justify-between text-sm mt-1">
                  <button type="button" onClick={() => { clearError(); setStep(1); }}
                    className="text-gray-500 hover:text-gray-700 font-medium">
                    {t('back')}
                  </button>
                  <button type="button" onClick={handleResendOtp} disabled={isResending}
                    className="flex items-center gap-1 disabled:opacity-50"
                    style={{ color: '#b8943d' }}>
                    {isResending ? <Spinner size="sm" /> : <RefreshCw size={14} />}
                    {lang === 'ar' ? 'إعادة إرسال' : 'Resend code'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── STEP 3: Company ──────────────────────────────── */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(200,168,75,0.12)', color: '#c8a84b' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {lang === 'ar' ? 'معلومات الشركة' : 'Company information'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {lang === 'ar' ? 'أكمل إنشاء حسابك' : 'Complete your account setup'}
                  </p>
                </div>
              </div>

              {googlePrefill && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-2">
                  {googlePrefill.avatarUrl && (
                    <img src={googlePrefill.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-700 truncate">{googlePrefill.fullName}</p>
                    <p className="text-xs text-blue-500 truncate">{googlePrefill.email}</p>
                  </div>
                  <svg className="w-4 h-4 text-blue-400 ml-auto flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  </svg>
                </div>
              )}

              <form onSubmit={step3.handleSubmit(onStep3Submit)} className="space-y-4" noValidate>
                {serverError && <ErrorMsg message={serverError} />}

                <div className="space-y-1.5">
                  <label className="label">{t('fullName')} *</label>
                  <input
                    type="text"
                    className={`input ${step3.formState.errors.adminFullName ? 'border-red-400' : ''}`}
                    placeholder={lang === 'ar' ? 'اسمك الكامل' : 'Your full name'}
                    {...step3.register('adminFullName', {
                      required: lang === 'ar' ? 'الاسم مطلوب' : 'Full name is required',
                    })}
                  />
                  {step3.formState.errors.adminFullName && <p className="text-xs text-red-600">{step3.formState.errors.adminFullName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="label">{t('companyName')} *</label>
                  <input
                    type="text"
                    className={`input ${step3.formState.errors.companyName ? 'border-red-400' : ''}`}
                    placeholder={lang === 'ar' ? 'اسم الشركة' : 'Company name'}
                    {...step3.register('companyName', {
                      required: lang === 'ar' ? 'اسم الشركة مطلوب' : 'Company name is required',
                    })}
                  />
                  {step3.formState.errors.companyName && <p className="text-xs text-red-600">{step3.formState.errors.companyName.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="label">{lang === 'ar' ? 'القطاع' : 'Sector'} *</label>
                    <select
                      className={`input ${step3.formState.errors.sector ? 'border-red-400' : ''}`}
                      {...step3.register('sector', { required: lang === 'ar' ? 'القطاع مطلوب' : 'Sector is required' })}
                    >
                      <option value="">{lang === 'ar' ? 'اختر القطاع' : 'Select sector'}</option>
                      {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {step3.formState.errors.sector && <p className="text-xs text-red-600">{step3.formState.errors.sector.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="label">{lang === 'ar' ? 'حجم الشركة' : 'Size'} *</label>
                    <select
                      className={`input ${step3.formState.errors.size ? 'border-red-400' : ''}`}
                      {...step3.register('size', { required: lang === 'ar' ? 'حجم الشركة مطلوب' : 'Size is required' })}
                    >
                      <option value="">{lang === 'ar' ? 'اختر الحجم' : 'Select size'}</option>
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {step3.formState.errors.size && <p className="text-xs text-red-600">{step3.formState.errors.size.message}</p>}
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
                  {isSubmitting ? <Spinner size="sm" /> : (lang === 'ar' ? 'إنشاء الحساب' : 'Create Account')}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 4: Success ──────────────────────────────── */}
          {step === 4 && (
            <div className="text-center py-2">
              <div className="auth-success-icon mx-auto">
                <CheckCircle2 size={38} />
              </div>
              <h2 className="auth-card-title">
                {lang === 'ar' ? 'تم إنشاء حسابك بنجاح!' : 'Account created!'}
              </h2>
              <p className="auth-card-sub" style={{ marginBottom: '1rem' }}>
                {lang === 'ar'
                  ? 'سيتم تحويلك لصفحة تسجيل الدخول تلقائياً...'
                  : 'Redirecting you to login automatically...'}
              </p>
              <button onClick={() => navigate('/login')} className="auth-submit-btn">
                <LogIn size={16} />
                {lang === 'ar' ? 'الدخول الآن' : 'Login Now'}
              </button>
            </div>
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
