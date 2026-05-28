import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Plus, Trash2, Eye, EyeOff, Upload, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import api from '../../lib/api';

const emptyForm = { titleAr: '', titleEn: '', image: '', link: '' };

export default function AdminBanners() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api.get<{ banners: any[] }>('/admin/banners'),
  });

  const addMutation = useMutation({
    mutationFn: () => api.post('/admin/banners', { ...form, isActive: true, sortOrder: (data?.banners?.length ?? 0) }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم إضافة البانر' : 'Banner added');
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['banners'] });
      setShowForm(false);
      setForm({ ...emptyForm });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/admin/banners/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['banners'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/banners/${id}`),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted');
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['banners'] });
    },
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const res = await api.post<{ url: string }>('/upload', { base64, folder: 'laptopstore/banners' });
          setForm(p => ({ ...p, image: res.url }));
          toast.success(locale === 'ar' ? 'تم رفع الصورة' : 'Image uploaded');
        } catch (err: any) {
          toast.error(err.message || (locale === 'ar' ? 'فشل رفع الصورة' : 'Upload failed'));
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const banners = data?.banners || [];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Image className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'البانرات' : 'Banners'}
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            {locale === 'ar' ? 'إضافة بانر' : 'Add Banner'}
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{locale === 'ar' ? 'بانر جديد' : 'New Banner'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{locale === 'ar' ? 'صورة البانر *' : 'Banner Image *'}</label>
              {form.image ? (
                <div className="relative">
                  <img src={form.image} alt="preview" className="w-full h-40 object-cover rounded-xl border border-border" />
                  <button
                    onClick={() => setForm(p => ({ ...p, image: '' }))}
                    className="absolute top-2 end-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  <span className="text-sm">{uploading ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (locale === 'ar' ? 'اضغط لرفع صورة البانر' : 'Click to upload banner image')}</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />

              <div className="mt-2">
                <label className="text-xs text-muted-foreground">{locale === 'ar' ? 'أو أدخل رابط الصورة مباشرة' : 'Or enter image URL directly'}</label>
                <input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1 w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
                <input value={form.titleAr} onChange={e => setForm(p => ({ ...p, titleAr: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title (English)</label>
                <input value={form.titleEn} onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'رابط البانر (اختياري)' : 'Banner Link (optional)'}</label>
              <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                placeholder="/products" className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => addMutation.mutate()}
                disabled={!form.image || addMutation.isPending || uploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {locale === 'ar' ? 'حفظ البانر' : 'Save Banner'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-all">
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}</div>
        ) : banners.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Image className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">{locale === 'ar' ? 'لا توجد بانرات بعد' : 'No banners yet'}</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-primary text-sm hover:underline">
              {locale === 'ar' ? 'أضف أول بانر' : 'Add first banner'}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {banners.map(banner => (
              <div key={banner.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="relative aspect-video">
                  <img src={banner.image} alt={locale === 'ar' ? banner.titleAr : banner.titleEn}
                    className="w-full h-full object-cover" />
                  {(banner.titleAr || banner.titleEn) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 flex items-end p-3">
                      <p className="text-white font-semibold text-sm">{locale === 'ar' ? banner.titleAr : banner.titleEn}</p>
                    </div>
                  )}
                  <div className={`absolute top-2 end-2 px-2 py-1 rounded-full text-xs font-bold ${banner.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {banner.isActive ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'مخفي' : 'Hidden')}
                  </div>
                </div>
                <div className="flex gap-2 p-3">
                  <button
                    onClick={() => toggleMutation.mutate({ id: banner.id, isActive: !banner.isActive })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-xs hover:bg-accent transition-all"
                  >
                    {banner.isActive ? <><EyeOff className="w-3 h-3" />{locale === 'ar' ? 'إخفاء' : 'Hide'}</> : <><Eye className="w-3 h-3" />{locale === 'ar' ? 'إظهار' : 'Show'}</>}
                  </button>
                  <button
                    onClick={() => { if (confirm(locale === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) deleteMutation.mutate(banner.id); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
