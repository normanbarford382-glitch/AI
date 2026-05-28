import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Trash2, Eye, EyeOff, Pencil, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import api from '../../lib/api';

const emptyForm = {
  nameAr: '',
  nameEn: '',
  accountInfo: '',
  description: '',
  logo: '',
  isActive: true,
  sortOrder: '0',
};

export default function AdminPaymentMethods() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods-admin'],
    queryFn: () => api.get<{ paymentMethods: any[] }>('/admin/payment-methods'),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        accountInfo: form.accountInfo || null,
        description: form.description || null,
        logo: form.logo || null,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };
      return editingId
        ? api.put(`/admin/payment-methods/${editingId}`, payload)
        : api.post('/admin/payment-methods', payload);
    },
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم الحفظ' : 'Saved');
      qc.invalidateQueries({ queryKey: ['payment-methods-admin'] });
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/admin/payment-methods/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods-admin'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/payment-methods/${id}`),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted');
      qc.invalidateQueries({ queryKey: ['payment-methods-admin'] });
    },
  });

  const startEdit = (method: any) => {
    setEditingId(method.id);
    setForm({
      nameAr: method.nameAr || '',
      nameEn: method.nameEn || '',
      accountInfo: method.accountInfo || '',
      description: method.description || '',
      logo: method.logo || '',
      isActive: method.isActive ?? true,
      sortOrder: method.sortOrder || '0',
    });
    setShowForm(true);
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await api.post<{ url?: string }>('/upload', {
          base64: e.target?.result as string,
          folder: 'laptopstore/payment-methods',
        });
        if (!res.url) throw new Error('Upload failed');
        setForm(p => ({ ...p, logo: res.url! }));
        toast.success(locale === 'ar' ? 'تم رفع الشعار' : 'Logo uploaded');
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const methods = data?.paymentMethods || [];

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-header flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary" />
              {locale === 'ar' ? 'طرق شحن المحفظة' : 'Wallet Recharge Methods'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === 'ar' ? 'مثل: شام كاش، سيرياتيل كاش' : 'e.g. Sham Cash, Syriatel Cash'}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            {locale === 'ar' ? 'إضافة طريقة' : 'Add Method'}
          </button>
        </div>

        {showForm && (
          <div className="card-premium p-5 space-y-4">
            <h2 className="font-bold">{editingId ? (locale === 'ar' ? 'تعديل الطريقة' : 'Edit Method') : (locale === 'ar' ? 'طريقة جديدة' : 'New Method')}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الاسم (عربي) *' : 'Name (Arabic) *'}</label>
                <input value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} className="input-premium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</label>
                <input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} className="input-premium" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'تعليمات الشحن' : 'Recharge instructions'}</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="input-premium resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'رقم/حساب/عنوان التحويل *' : 'Transfer destination *'}</label>
              <input value={form.accountInfo} onChange={e => setForm(p => ({ ...p, accountInfo: e.target.value }))} className="input-premium" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'شعار (اختياري)' : 'Logo (optional)'}</label>
              <div className="flex items-center gap-3">
                {form.logo && <img src={form.logo} alt="" className="w-12 h-12 rounded-lg object-contain border border-border" />}
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm cursor-pointer hover:bg-accent">
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {locale === 'ar' ? 'رفع' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!form.nameAr || !form.nameEn || !form.accountInfo || saveMutation.isPending}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {saveMutation.isPending ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ' : 'Save')}
              </button>
              <button onClick={resetForm} className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent">
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            [...Array(2)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)
          ) : methods.length === 0 ? (
            <div className="card-premium p-12 text-center text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {locale === 'ar' ? 'لا توجد طرق شحن' : 'No recharge methods'}
            </div>
          ) : methods.map((method: any) => (
            <div key={method.id} className="card-premium p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                {method.logo ? (
                  <img src={method.logo} alt="" className="w-11 h-11 rounded-lg object-contain bg-muted border border-border" />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold">{locale === 'ar' ? method.nameAr : method.nameEn}</p>
                  <p className="text-xs text-muted-foreground truncate">{method.accountInfo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${method.isActive ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                  {method.isActive ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'معطّل' : 'Inactive')}
                </span>
                <button onClick={() => startEdit(method)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => toggleMutation.mutate({ id: method.id, isActive: !method.isActive })}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground">
                  {method.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { if (confirm(locale === 'ar' ? 'تأكيد الحذف؟' : 'Delete?')) deleteMutation.mutate(method.id); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
