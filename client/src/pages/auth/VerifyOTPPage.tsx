import { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Laptop, Shield, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function VerifyOTPPage() {
  const { locale } = useLocale();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const email = new URLSearchParams(window.location.search).get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const mutation = useMutation({
    mutationFn: () => api.post<{ token: string; user: any }>('/auth/verify-otp', {
      email, otp: otp.join(''), password, confirmPassword, name, lang: locale,
    }),
    onSuccess: (data) => {
      login(data.token, data.user);
      toast.success(locale === 'ar' ? 'تم التسجيل بنجاح!' : 'Registration successful!');
      navigate('/');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { toast.error(locale === 'ar' ? 'أدخل الكود كاملاً' : 'Enter the full code'); return; }
    if (password.length < 6) { toast.error(locale === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return; }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-950 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl shadow-lg">
            <Laptop className="w-7 h-7 text-white" />
          </Link>
          <h1 className="text-2xl font-black text-foreground flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {locale === 'ar' ? 'التحقق من البريد' : 'Email Verification'}
          </h1>
          {email && <p className="text-sm text-muted-foreground">{locale === 'ar' ? `تم إرسال الكود إلى:` : 'Code sent to:'} <span className="font-medium text-foreground">{email}</span></p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* OTP Input */}
          <div>
            <label className="text-sm font-medium block mb-3 text-center">{locale === 'ar' ? 'أدخل رمز التحقق (6 أرقام)' : 'Enter 6-digit verification code'}</label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric"
                  value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold bg-muted border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                  maxLength={1} />
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder={locale === 'ar' ? 'اختياري' : 'Optional'}
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{locale === 'ar' ? 'كلمة المرور *' : 'Password *'}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{locale === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <button type="submit" disabled={mutation.isPending}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />{locale === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</> :
              (locale === 'ar' ? 'تأكيد وإنشاء الحساب' : 'Verify & Create Account')}
          </button>

          <div className="text-center">
            <Link href="/auth/register" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className={`w-3 h-3 ${locale === 'ar' ? 'rotate-180' : ''}`} />
              {locale === 'ar' ? 'العودة للتسجيل' : 'Back to Registration'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
