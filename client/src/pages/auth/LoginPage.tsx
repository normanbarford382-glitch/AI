import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import api from '../../lib/api';
import PhoneInput from '../../components/PhoneInput';
import AuthLayout from '../../components/auth/AuthLayout';

export default function LoginPage() {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post<{ token: string; user: any }>('/auth/login', { phone, password, lang: locale }),
    onSuccess: (data) => {
      login(data.token, data.user);
      toast.success(ar ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
      navigate('/');
    },
    onError: (err: Error) => toast.error(err.message || (ar ? 'بيانات غير صحيحة' : 'Invalid credentials')),
  });

  return (
    <AuthLayout>
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          {ar ? 'تسجيل الدخول' : 'Sign In'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ar ? 'أهلاً بك مجدداً! سعيدون برؤيتك.' : 'Welcome back! We\'re glad to see you.'}
        </p>
      </div>

      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            {ar ? 'رقم الهاتف' : 'Phone Number'}
          </label>
          <PhoneInput value={phone} onChange={setPhone} required />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              {ar ? 'كلمة المرور' : 'Password'}
            </label>
            <Link href="/auth/forgot-password"
              className="text-xs text-primary font-medium hover:underline underline-offset-2">
              {ar ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder={ar ? '••••••••' : '••••••••'}
              className="input-premium pe-11"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute top-1/2 -translate-y-1/2 end-3.5 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 premium-gradient text-black font-bold rounded-xl
            hover:opacity-90 active:scale-[0.98] transition-all gold-glow
            disabled:opacity-60 disabled:pointer-events-none text-sm tracking-wide"
        >
          {mutation.isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              {ar ? 'جاري تسجيل الدخول...' : 'Signing in...'}
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              {ar ? 'تسجيل الدخول' : 'Sign In'}
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{ar ? 'أو' : 'or'}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Register link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {ar ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          <Link href="/auth/register"
            className="text-primary font-bold hover:underline underline-offset-2">
            {ar ? 'إنشاء حساب مجاني' : 'Create Free Account'}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
