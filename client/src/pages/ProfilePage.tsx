import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, Loader2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import StorePageShell from '../components/shared/StorePageShell';
import PageHeader from '../components/shared/PageHeader';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'wouter';
import api from '../lib/api';

export default function ProfilePage() {
  const { locale } = useLocale();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<{ user: { name?: string; phone?: string; address?: string } }>('/auth/me'),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name || '');
      setPhone(data.user.phone || '');
      setAddress(data.user.address || '');
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => api.put('/auth/profile', { name, phone, address }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated');
      updateUser({ name });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <StorePageShell mainClassName="flex items-center justify-center min-h-[60vh]">
        <Link href="/auth/login" className="btn-primary-lg">
          {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
        </Link>
      </StorePageShell>
    );
  }

  return (
    <StorePageShell>
        <div className="max-w-lg mx-auto">
          <PageHeader title={locale === 'ar' ? 'الملف الشخصي' : 'My Profile'} subtitle={user?.email} />

          <div className="card-premium p-6 space-y-5">
            <div className="flex items-center gap-4 pb-5 border-b border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{(name || user?.email || 'U')[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-bold text-foreground">{name || (locale === 'ar' ? 'المستخدم' : 'User')}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {user?.role === 'SUPER_ADMIN' ? (locale === 'ar' ? 'مدير عام' : 'Super Admin') : user?.role === 'ADMIN' ? (locale === 'ar' ? 'مدير' : 'Admin') : (locale === 'ar' ? 'عميل' : 'Customer')}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="input-premium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="input-premium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'العنوان' : 'Address'}</label>
                <input value={address} onChange={e => setAddress(e.target.value)}
                  className="input-premium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                <input value={user?.email || ''} disabled
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
                className="flex-1 btn-primary-lg disabled:opacity-60">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
              <button onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-2 px-4 py-3 border border-destructive/30 text-destructive rounded-xl font-semibold hover:bg-destructive/10 transition-all">
                <LogOut className="w-4 h-4" />
                {locale === 'ar' ? 'خروج' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
    </StorePageShell>
  );
}
