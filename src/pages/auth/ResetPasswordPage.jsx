import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useLang } from '../../context/LangContext';
import { Spinner, ErrorMsg } from '../../components/common/index';

export default function ResetPasswordPage() {
  const { lang, isRTL } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // قراءة token و email من الـ URL
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError]   = useState('');
  const [done, setDone]                 = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { newPassword: '', confirmPassword: '' } });

  const newPassword = watch('newPassword');

  // التحقق من وجود token في الـ URL
  if (!token || !email) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <KeyRound size={28} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {lang === 'ar' ? 'رابط غير صالح' : 'Invalid Reset Link'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {lang === 'ar'
                ? 'الرابط الذي استخدمته غير صالح أو منتهي الصلاحية.'
                : 'The reset link you used is invalid or has expired.'}
            </p>
            <Link to="/forgot-password" className="btn-primary text-sm px-6 py-2.5 inline-block">
              {lang === 'ar' ? 'طلب رابط جديد' : 'Request a new link'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        email,
        token,
        newPassword:     data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setDone(true);
      toast.success(
        lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password reset successfully'
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        (lang === 'ar' ? 'حدث خطأ. الرابط قد يكون منتهي الصلاحية.' : 'Something went wrong. The link may have expired.');
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <KeyRound size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === 'ar' ? 'منصة الاستشارات' : 'Consulting Platform'}
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {done ? (
            /* ── نجاح ── */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {lang === 'ar' ? 'تم تغيير كلمة المرور!' : 'Password Changed!'}
              </h2>
              <p className="text-sm text-gray-500 mb-8">
                {lang === 'ar'
                  ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
                  : 'You can now sign in with your new password.'}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full btn-primary py-2.5 text-sm font-semibold"
              >
                {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </div>
          ) : (
            /* ── الفورم ── */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset your password'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {lang === 'ar'
                    ? 'أدخل كلمة المرور الجديدة'
                    : 'Enter your new password below'}
                </p>
                {/* عرض الإيميل المرتبط بالطلب */}
                <p className="text-xs text-primary-600 mt-2 bg-primary-50 rounded-lg px-3 py-2">
                  {email}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {serverError && <ErrorMsg message={serverError} />}

                {/* كلمة المرور الجديدة */}
                <div className="space-y-1.5">
                  <label className="label">
                    {lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                    <span className="text-red-500 ms-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`input pe-10 ${errors.newPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder={lang === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                      {...register('newPassword', {
                        required: lang === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required',
                        minLength: {
                          value: 8,
                          message: lang === 'ar'
                            ? 'يجب أن تكون 8 أحرف على الأقل'
                            : 'Must be at least 8 characters',
                        },
                        pattern: {
                          value: /^(?=.*[A-Z])(?=.*[0-9])/,
                          message: lang === 'ar'
                            ? 'يجب أن تحتوي على حرف كبير ورقم'
                            : 'Must contain an uppercase letter and a number',
                        },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-red-600">{errors.newPassword.message}</p>
                  )}

                  {/* Password strength hints */}
                  <div className="flex gap-2 flex-wrap mt-1">
                    {[
                      { label: lang === 'ar' ? '8+ أحرف' : '8+ chars',   pass: newPassword.length >= 8 },
                      { label: lang === 'ar' ? 'حرف كبير' : 'Uppercase',  pass: /[A-Z]/.test(newPassword) },
                      { label: lang === 'ar' ? 'رقم'      : 'Number',     pass: /[0-9]/.test(newPassword) },
                    ].map(({ label, pass }) => (
                      <span
                        key={label}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          pass ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {pass ? '✓' : '○'} {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* تأكيد كلمة المرور */}
                <div className="space-y-1.5">
                  <label className="label">
                    {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    <span className="text-red-500 ms-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`input pe-10 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder={lang === 'ar' ? 'أعد كتابة كلمة المرور' : 'Repeat new password'}
                      {...register('confirmPassword', {
                        required: lang === 'ar' ? 'التأكيد مطلوب' : 'Confirmation is required',
                        validate: (v) =>
                          v === newPassword ||
                          (lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'),
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  {isSubmitting ? (
                    <Spinner size="sm" />
                  ) : (
                    lang === 'ar' ? 'تغيير كلمة المرور' : 'Reset Password'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                >
                  {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                  {lang === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to login'}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
