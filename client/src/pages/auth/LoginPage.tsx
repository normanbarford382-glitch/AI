import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import api from '../../lib/api';
import PhoneInput from '../../components/PhoneInput';
import AuthLayout from '../../components/auth/AuthLayout';

export default function LoginPage() {
  const { locale } = useLocale();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post<{ token: string; user: any }>('/auth/login', { phone, password, lang: locale }),
    onSuccess: (data) => {
      login(data.token, data.user);
      toast.success(locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
      navigate('/');
    },
    onError: (err: Error) => toast.error(err.message || (locale === 'ar' ? 'بيانات غير صحيحة' : 'Invalid credentials')),
  });

  return (
    <AuthLayout>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</h1>
          <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'أهلاً بك مجدداً!' : 'Welcome back!'}</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
            <PhoneInput value={phone} onChange={setPhone} required />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</label>
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                {locale === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </Link>
            </div>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="input-premium pe-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-60">
            {mutation.isPending ? (locale === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...') : (locale === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {locale === 'ar' ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          <Link href="/auth/register" className="text-primary font-semibold hover:underline">
            {locale === 'ar' ? 'إنشاء حساب' : 'Register'}
          </Link>
        </p>
    </AuthLayout>
  );
}
