import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Laptop, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocale } from '../../context/LocaleContext';
import api from '../../lib/api';

export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const [location] = useLocation();
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/reset-password', { token, password }),
    onSuccess: () => { setDone(true); toast.success(locale === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return; }
    if (password.length < 6) { toast.error(locale === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'); return; }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-950 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl shadow-lg">
            <Laptop className="w-7 h-7 text-white" />
          </Link>
          <h1 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}</h1>
        </div>
        {done ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <p className="text-foreground font-semibold">{locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully'}</p>
            <Link href="/auth/login" className="block w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-center hover:bg-primary/90 transition-all">
              {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pe-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute top-3 end-3 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button type="submit" disabled={mutation.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-60">
              {mutation.isPending ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ كلمة المرور' : 'Save Password')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
