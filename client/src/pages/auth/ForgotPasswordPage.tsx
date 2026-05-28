import { useState } from 'react';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Laptop } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocale } from '../../context/LocaleContext';
import api from '../../lib/api';

export default function ForgotPasswordPage() {
  const { locale } = useLocale();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/forgot-password', { email, lang: locale }),
    onSuccess: () => { setSent(true); toast.success(locale === 'ar' ? 'تم إرسال رابط الاسترداد' : 'Reset link sent'); },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-950 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl shadow-lg">
            <Laptop className="w-7 h-7 text-white" />
          </Link>
          <h1 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'نسيت كلمة المرور' : 'Forgot Password'}</h1>
          <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'سنرسل لك رابط لاسترداد كلمة المرور' : "We'll send you a password reset link"}</p>
        </div>
        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-5xl">📬</p>
            <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'تم إرسال رابط الاسترداد إلى بريدك الإلكتروني' : 'Reset link sent to your email'}</p>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button type="submit" disabled={mutation.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-60">
              {mutation.isPending ? (locale === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (locale === 'ar' ? 'إرسال رابط الاسترداد' : 'Send Reset Link')}
            </button>
          </form>
        )}
        <p className="text-center text-sm">
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
          </Link>
        </p>
      </div>
    </div>
  );
}
