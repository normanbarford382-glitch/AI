import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { formatPrice, formatDate, cn } from '../../lib/utils';
import api from '../../lib/api';

export default function AdminWallet() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wallet'],
    queryFn: () => api.get<{ topups: any[] }>('/admin/wallet'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      api.put(`/admin/wallet/${id}`, { status, adminNote }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم التحديث' : 'Updated');
      setRejectId(null);
      setRejectNote('');
      qc.invalidateQueries({ queryKey: ['admin-wallet'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const topups = data?.topups || [];

  const statusConfig: Record<string, { icon: typeof Clock; ar: string; en: string; color: string; bg: string }> = {
    PENDING: { icon: Clock, ar: 'قيد الانتظار', en: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    APPROVED: { icon: CheckCircle, ar: 'مقبول', en: 'Approved', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    REJECTED: { icon: XCircle, ar: 'مرفوض', en: 'Rejected', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="page-header flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary" />
          {locale === 'ar' ? 'طلبات شحن المحفظة' : 'Wallet Recharge Requests'}
        </h1>

        <div className="card-premium overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : topups.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {locale === 'ar' ? 'لا توجد طلبات شحن' : 'No recharge requests'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs">
                    <th className="text-start p-4 font-semibold">{locale === 'ar' ? 'المستخدم' : 'User'}</th>
                    <th className="text-start p-4 font-semibold">{locale === 'ar' ? 'الطريقة' : 'Method'}</th>
                    <th className="text-start p-4 font-semibold">{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    <th className="text-start p-4 font-semibold">{locale === 'ar' ? 'الإثبات' : 'Proof'}</th>
                    <th className="text-start p-4 font-semibold">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="text-end p-4 font-semibold">{locale === 'ar' ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topups.map((topup: any) => {
                    const req = topup.wallet_topup_requests;
                    const st = req?.status || 'PENDING';
                    const sc = statusConfig[st] || statusConfig.PENDING;
                    const Icon = sc.icon;
                    return (
                      <tr key={req?.id} className="hover:bg-muted/20">
                        <td className="p-4">
                          <p className="font-semibold">{topup.users?.name || topup.users?.email}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(req?.createdAt, locale)}</p>
                        </td>
                        <td className="p-4">{locale === 'ar' ? topup.payment_methods?.nameAr : topup.payment_methods?.nameEn}</td>
                        <td className="p-4 font-bold text-primary">{formatPrice(req?.amount || 0)}</td>
                        <td className="p-4 text-xs">
                          {req?.transactionRef && <p>{req.transactionRef}</p>}
                          {req?.proofUrl && (
                            <a href={req.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline mt-1">
                              <ExternalLink className="w-3 h-3" />
                              {locale === 'ar' ? 'صورة' : 'Screenshot'}
                            </a>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full', sc.bg, sc.color)}>
                            <Icon className="w-3 h-3" />
                            {locale === 'ar' ? sc.ar : sc.en}
                          </span>
                          {req?.adminNote && st === 'REJECTED' && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">{req.adminNote}</p>
                          )}
                        </td>
                        <td className="p-4 text-end">
                          {st === 'PENDING' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => updateMutation.mutate({ id: req.id, status: 'APPROVED' })}
                                disabled={updateMutation.isPending}
                                className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100"
                              >
                                {locale === 'ar' ? 'قبول' : 'Approve'}
                              </button>
                              <button
                                onClick={() => setRejectId(req.id)}
                                disabled={updateMutation.isPending}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100"
                              >
                                {locale === 'ar' ? 'رفض' : 'Reject'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {rejectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
              <h3 className="font-bold">{locale === 'ar' ? 'سبب الرفض' : 'Rejection reason'}</h3>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                rows={3}
                className="input-premium resize-none"
                placeholder={locale === 'ar' ? 'أدخل سبب الرفض...' : 'Enter rejection reason...'}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => updateMutation.mutate({ id: rejectId, status: 'REJECTED', adminNote: rejectNote })}
                  disabled={!rejectNote.trim() || updateMutation.isPending}
                  className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  {locale === 'ar' ? 'تأكيد الرفض' : 'Confirm Reject'}
                </button>
                <button onClick={() => { setRejectId(null); setRejectNote(''); }} className="px-4 py-2.5 border border-border rounded-xl text-sm">
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
