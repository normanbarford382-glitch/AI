import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Ban, CheckCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { formatDate, cn } from '../../lib/utils';
import api from '../../lib/api';

export default function AdminUsers() {
  const { locale } = useLocale();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<{ users: any[] }>('/admin/users'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => api.put(`/admin/users/${id}`, updates),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم التحديث' : 'Updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const users = data?.users || [];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'المستخدمون' : 'Users'}
          </h1>
          <span className="text-sm text-muted-foreground">{users.length} {locale === 'ar' ? 'مستخدم' : 'users'}</span>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'المستخدم' : 'User'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">{locale === 'ar' ? 'الدور' : 'Role'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">{locale === 'ar' ? 'تاريخ التسجيل' : 'Registered'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{(user.name || user.email)[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <select value={user.role} onChange={e => updateMutation.mutate({ id: user.id, updates: { role: e.target.value } })}
                          className="text-xs px-2 py-1 bg-muted border border-border rounded-lg focus:outline-none">
                          <option value="USER">{locale === 'ar' ? 'عميل' : 'User'}</option>
                          <option value="ADMIN">{locale === 'ar' ? 'مدير' : 'Admin'}</option>
                          <option value="SUPER_ADMIN">{locale === 'ar' ? 'مدير عام' : 'Super Admin'}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(user.createdAt, locale)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', user.isBanned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}>
                          {user.isBanned ? (locale === 'ar' ? 'محظور' : 'Banned') : (locale === 'ar' ? 'نشط' : 'Active')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => updateMutation.mutate({ id: user.id, updates: { isBanned: !user.isBanned } })}
                          disabled={updateMutation.isPending}
                          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                            user.isBanned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100')}>
                          {user.isBanned ? <><CheckCircle className="w-3 h-3" />{locale === 'ar' ? 'رفع الحظر' : 'Unban'}</> : <><Ban className="w-3 h-3" />{locale === 'ar' ? 'حظر' : 'Ban'}</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
