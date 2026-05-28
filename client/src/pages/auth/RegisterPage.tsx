import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import PhoneInput from '../../components/PhoneInput';
import AuthLayout from '../../components/auth/AuthLayout';

export default function RegisterPage() {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);

  const passwordStrong = password.length >= 8;
  const passwordMatch = password === confirmPassword && password.length > 0;

  const registerMutation = useMutation({
    mutationFn: () => api.post<{ token: string; user: any }>('/auth/register', { name, phone, password, confirmPassword, lang: locale }),
    onSuccess: (data) => {
      login(data.token, data.user);
      toast.success(ar ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
      navigate('/');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AuthLayout>
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          {ar ? 'إنشاء حساب جديد' : 'Create Account'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ar ? 'انضم إلينا وابدأ تجربة تسوق استثنائية.' : 'Join us and start an exceptional shopping experience.'}
        </p>
      </div>

      <form onSubmit={e => { e.preventDefault(); registerMutation.mutate(); }} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            {ar ? 'الاسم الكامل' : 'Full Name'}
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder={ar ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            className="input-premium"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            {ar ? 'رقم الهاتف' : 'Phone Number'}
          </label>
          <PhoneInput value={phone} onChange={setPhone} required />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            {ar ? 'كلمة المرور' : 'Password'}
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
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
          {password.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className={`h-1 flex-1 rounded-full transition-colors ${password.length >= 4 ? 'bg-yellow-400' : 'bg-border'}`} />
              <div className={`h-1 flex-1 rounded-full transition-colors ${password.length >= 6 ? 'bg-yellow-400' : 'bg-border'}`} />
              <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrong ? 'bg-green-500' : 'bg-border'}`} />
              <span className="text-xs text-muted-foreground ms-1">
                {passwordStrong ? (ar ? 'قوية' : 'Strong') : (ar ? 'ضعيفة' : 'Weak')}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              {ar ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            </label>
            {passwordMatch && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
            className={`input-premium transition-all ${
              confirmPassword.length > 0
                ? passwordMatch ? 'border-green-500/50 focus:ring-green-500/20' : 'border-red-400/50 focus:ring-red-400/20'
                : ''
            }`}
          />
          {confirmPassword.length > 0 && !passwordMatch && (
            <p className="text-xs text-destructive">
              {ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={registerMutation.isPending || !passwordMatch}
          className="w-full flex items-center justify-center gap-2 py-3.5 premium-gradient text-black font-bold rounded-xl
            hover:opacity-90 active:scale-[0.98] transition-all gold-glow
            disabled:opacity-60 disabled:pointer-events-none text-sm tracking-wide"
        >
          {registerMutation.isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              {ar ? 'جاري الإنشاء...' : 'Creating account...'}
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              {ar ? 'إنشاء الحساب' : 'Create Account'}
            </>
          )}
        </button>
      </form>

      {/* Login link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {ar ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
          <Link href="/auth/login"
            className="text-primary font-bold hover:underline underline-offset-2">
            {ar ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
