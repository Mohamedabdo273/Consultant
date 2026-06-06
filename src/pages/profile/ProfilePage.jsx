import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  User,
  Mail,
  Shield,
  KeyRound,
  Smartphone,
  Check,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { profileApi } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { Spinner, FormField, Modal } from '../../components/common/index';

// ── Avatar ────────────────────────────────────────────────────────────────────
function AvatarInitials({ name, size = 'lg' }) {
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const sizes = {
    sm: 'w-10 h-10 text-base',
    md: 'w-14 h-14 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold select-none`}
    >
      {initials || <User size={24} />}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        {Icon && <Icon size={18} className="text-primary-600" />}
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Password Input ────────────────────────────────────────────────────────────
function PasswordInput({ register: reg, name, placeholder, error, registerOptions }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={`input pe-10 ${error ? 'border-red-400' : ''}`}
        placeholder={placeholder}
        {...reg(name, registerOptions)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ── Edit Profile Section ──────────────────────────────────────────────────────
function EditProfileSection() {
  const { user, updateUser } = useAuth();
  const { lang } = useLang();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      fullName: user?.fullName ?? '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => profileApi.update(data),
    onSuccess: (res) => {
      const updated = res.data?.data ?? {};
      updateUser({ fullName: updated.fullName ?? undefined });
      toast.success(lang === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated successfully');
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile')
      );
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
          required
          error={errors.fullName?.message}
        >
          <input
            type="text"
            className={`input ${errors.fullName ? 'border-red-400' : ''}`}
            {...register('fullName', {
              required: lang === 'ar' ? 'الاسم مطلوب' : 'Name is required',
              minLength: { value: 2, message: 'Name too short' },
            })}
          />
        </FormField>

        <FormField label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}>
          <input
            type="email"
            className="input bg-gray-50 cursor-not-allowed"
            value={user?.email ?? ''}
            readOnly
            disabled
          />
        </FormField>

        <FormField label={lang === 'ar' ? 'الدور' : 'Role'}>
          <input
            type="text"
            className="input bg-gray-50 cursor-not-allowed"
            value={user?.role ?? '—'}
            readOnly
            disabled
          />
        </FormField>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="btn-primary text-sm px-5 py-2 flex items-center gap-2 disabled:opacity-50"
        >
          {isPending ? <Spinner size="sm" /> : null}
          {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ── Change Password Section ───────────────────────────────────────────────────
function ChangePasswordSection() {
  const { lang } = useLang();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const newPassword = watch('newPassword');

  const { mutate, isPending } = useMutation({
    mutationFn: (data) =>
      profileApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmNewPassword,
      }),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      reset();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل تغيير كلمة المرور' : 'Failed to change password')
      );
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField
            label={lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
            required
            error={errors.currentPassword?.message}
          >
            <PasswordInput
              register={register}
              name="currentPassword"
              placeholder={lang === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
              error={errors.currentPassword}
              registerOptions={{ required: lang === 'ar' ? 'مطلوب' : 'Required' }}
            />
          </FormField>
        </div>

        <FormField
          label={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
          required
          error={errors.newPassword?.message}
        >
          <PasswordInput
            register={register}
            name="newPassword"
            placeholder={lang === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
            error={errors.newPassword}
            registerOptions={{
              required: lang === 'ar' ? 'مطلوب' : 'Required',
              minLength: { value: 8, message: lang === 'ar' ? 'يجب أن تكون 8 أحرف على الأقل' : 'At least 8 characters' },
            }}
          />
        </FormField>

        <FormField
          label={lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm New Password'}
          required
          error={errors.confirmNewPassword?.message}
        >
          <PasswordInput
            register={register}
            name="confirmNewPassword"
            placeholder={lang === 'ar' ? 'أعد كتابة كلمة المرور' : 'Repeat new password'}
            error={errors.confirmNewPassword}
            registerOptions={{
              required: lang === 'ar' ? 'مطلوب' : 'Required',
              validate: (v) =>
                v === newPassword || (lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'),
            }}
          />
        </FormField>
      </div>

      {/* Password strength hints */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: '8+ characters', pass: (newPassword ?? '').length >= 8 },
          { label: 'Uppercase', pass: /[A-Z]/.test(newPassword ?? '') },
          { label: 'Number', pass: /[0-9]/.test(newPassword ?? '') },
        ].map(({ label, pass }) => (
          <span
            key={label}
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              pass ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {pass ? <Check size={11} /> : <X size={11} />}
            {label}
          </span>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary text-sm px-5 py-2 flex items-center gap-2"
        >
          {isPending ? <Spinner size="sm" /> : null}
          {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}

// ── 2FA Section ───────────────────────────────────────────────────────────────
function TwoFactorSection() {
  const { user, updateUser } = useAuth();
  const { lang } = useLang();

  const [step, setStep] = useState('idle'); // idle | setup | verify
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  const is2FAEnabled = user?.twoFactorEnabled ?? user?.isTwoFactorEnabled ?? false;

  // Enable 2FA — sends OTP to email, returns { qrCode?, secret? }
  const { mutate: enable2FA, isPending: isEnabling } = useMutation({
    mutationFn: () => profileApi.enable2FA(),
    onSuccess: (res) => {
      const d = res.data?.data ?? res.data;
      setQrCode(d?.qrCode ?? d?.qrCodeUri ?? null);
      setSecret(d?.secret ?? null);
      setStep('setup');
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل تفعيل 2FA' : 'Failed to enable 2FA')
      );
    },
  });

  // Verify/confirm 2FA with the OTP code
  const { mutate: verify2FA, isPending: isVerifying } = useMutation({
    mutationFn: (code) => profileApi.verify2FA({ code }),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم تفعيل التحقق الثنائي' : '2FA enabled successfully');
      updateUser({ twoFactorEnabled: true, isTwoFactorEnabled: true });
      setStep('idle');
      setQrCode(null);
      setVerifyCode('');
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'الكود غير صحيح' : 'Invalid verification code')
      );
    },
  });

  // Disable 2FA — requires current OTP code in body
  const { mutate: disable2FA, isPending: isDisabling } = useMutation({
    mutationFn: (code) => profileApi.disable2FA({ code }),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إلغاء التحقق الثنائي' : '2FA disabled');
      updateUser({ twoFactorEnabled: false, isTwoFactorEnabled: false });
      setDisableOpen(false);
      setDisableCode('');
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إلغاء 2FA' : 'Failed to disable 2FA')
      );
    },
  });

  return (
    <div className="space-y-4">
      {/* Status Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            is2FAEnabled ? 'bg-green-50' : 'bg-gray-100'
          }`}>
            {is2FAEnabled
              ? <ShieldCheck size={18} className="text-green-600" />
              : <ShieldOff size={18} className="text-gray-400" />
            }
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {lang === 'ar' ? 'التحقق الثنائي (2FA)' : 'Two-Factor Authentication'}
            </p>
            <p className={`text-xs ${is2FAEnabled ? 'text-green-600' : 'text-gray-400'}`}>
              {is2FAEnabled
                ? (lang === 'ar' ? 'مفعّل' : 'Enabled')
                : (lang === 'ar' ? 'غير مفعّل' : 'Disabled')}
            </p>
          </div>
        </div>

        {is2FAEnabled ? (
          <button
            onClick={() => setDisableOpen(true)}
            className="btn-secondary text-sm px-4 py-2 text-red-600 hover:bg-red-50 border-red-200"
          >
            {lang === 'ar' ? 'إلغاء التفعيل' : 'Disable'}
          </button>
        ) : step === 'idle' ? (
          <button
            onClick={() => enable2FA()}
            disabled={isEnabling}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            {isEnabling ? <Spinner size="sm" /> : null}
            {lang === 'ar' ? 'تفعيل' : 'Enable'}
          </button>
        ) : null}
      </div>

      {/* Setup step */}
      {step === 'setup' && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <p className="text-sm text-gray-700 font-medium">
            {lang === 'ar'
              ? '1. امسح رمز QR باستخدام تطبيق المصادقة (مثل Google Authenticator)'
              : '1. Scan the QR code with your authenticator app (e.g. Google Authenticator)'}
          </p>

          {qrCode ? (
            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="2FA QR Code"
                className="w-40 h-40 rounded-lg border border-gray-200"
              />
            </div>
          ) : secret ? (
            <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">
                {lang === 'ar' ? 'أو أدخل هذا الكود يدوياً:' : 'Or enter this code manually:'}
              </p>
              <code className="text-sm font-mono font-semibold text-gray-900 tracking-widest">
                {secret}
              </code>
            </div>
          ) : null}

          <p className="text-sm text-gray-700 font-medium">
            {lang === 'ar'
              ? '2. أدخل الكود المكوّن من 6 أرقام من التطبيق'
              : '2. Enter the 6-digit code from your app'}
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="input text-center text-lg tracking-widest font-mono flex-1"
              placeholder="000000"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <button
              onClick={() => verify2FA(verifyCode)}
              disabled={verifyCode.length !== 6 || isVerifying}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              {isVerifying ? <Spinner size="sm" /> : <Check size={16} />}
              {lang === 'ar' ? 'تحقق' : 'Verify'}
            </button>
          </div>

          <button
            onClick={() => { setStep('idle'); setQrCode(null); setVerifyCode(''); }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      )}

      {/* Disable confirm modal */}
      <Modal
        open={disableOpen}
        onClose={() => { setDisableOpen(false); setDisableCode(''); }}
        title={lang === 'ar' ? 'إلغاء التحقق الثنائي' : 'Disable 2FA'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {lang === 'ar'
              ? 'أدخل الكود من تطبيق المصادقة لتأكيد الإلغاء.'
              : 'Enter the code from your authenticator app to confirm.'}
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="input text-center text-xl tracking-widest font-mono"
            placeholder="000000"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setDisableOpen(false); setDisableCode(''); }}
              className="btn-secondary text-sm px-4 py-2"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={() => disable2FA(disableCode)}
              disabled={isDisabling || disableCode.length !== 6}
              className="btn-danger text-sm px-4 py-2 flex items-center gap-2"
            >
              {isDisabling ? <Spinner size="sm" /> : null}
              {lang === 'ar' ? 'تأكيد الإلغاء' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();

  return (
    <div className="space-y-6 max-w-2xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('profile')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {lang === 'ar' ? 'إدارة معلوماتك الشخصية وإعدادات الأمان' : 'Manage your personal information and security settings'}
        </p>
      </div>

      {/* Profile Overview */}
      <div className="card">
        <div className="flex items-center gap-4">
          <AvatarInitials name={user?.fullName} size="lg" />
          <div>
            <h2 className="text-base font-semibold text-gray-900">{user?.fullName ?? '—'}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail size={13} className="text-gray-400" />
              <p className="text-sm text-gray-500">{user?.email ?? '—'}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield size={13} className="text-gray-400" />
              <p className="text-sm text-gray-500">{user?.role ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <SectionCard
        title={lang === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
        icon={User}
      >
        <EditProfileSection />
      </SectionCard>

      {/* Change Password */}
      <SectionCard
        title={lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
        icon={KeyRound}
      >
        <ChangePasswordSection />
      </SectionCard>

      {/* 2FA */}
      <SectionCard
        title={lang === 'ar' ? 'الأمان' : 'Security'}
        icon={Smartphone}
      >
        <TwoFactorSection />
      </SectionCard>
    </div>
  );
}
