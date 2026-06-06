import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useLang } from '../../context/LangContext';
import { Spinner, ErrorMsg } from '../../components/common/index';

export default function ForgotPasswordPage() {
  const { t, lang, isRTL } = useLang();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email: data.email });
      setSentEmail(data.email);
      setSent(true);
      toast.success(
        lang === 'ar'
          ? 'تم إرسال رابط استعادة كلمة المرور'
          : 'Password reset link sent successfully'
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (lang === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.');
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
          {!sent ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {lang === 'ar'
                    ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة'
                    : "Enter your email and we'll send you a reset link"}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {serverError && <ErrorMsg message={serverError} />}

                <div className="space-y-1.5">
                  <label className="label">{t('email')}</label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      className={`input ps-9 ${errors.email ? 'border-red-400' : ''}`}
                      placeholder={
                        lang === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'
                      }
                      {...register('email', {
                        required:
                          lang === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message:
                            lang === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address',
                        },
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  {isSubmitting ? (
                    <Spinner size="sm" />
                  ) : (
                    lang === 'ar' ? 'إرسال رابط الاستعادة' : 'Send reset link'
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
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {lang === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                {lang === 'ar' ? 'أرسلنا رابط استعادة كلمة المرور إلى:' : 'We sent a reset link to:'}
              </p>
              <p className="text-sm font-semibold text-gray-800 mb-6 break-all">{sentEmail}</p>
              <p className="text-xs text-gray-400 mb-8">
                {lang === 'ar'
                  ? 'إذا لم تستلم البريد، تحقق من مجلد البريد غير المرغوب فيه.'
                  : "If you don't see the email, check your spam folder."}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setSent(false); setServerError(''); }}
                  className="btn-secondary py-2.5 text-sm"
                >
                  {lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}
                </button>
                <Link to="/login" className="text-sm text-primary-600 hover:underline">
                  {lang === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to login'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
