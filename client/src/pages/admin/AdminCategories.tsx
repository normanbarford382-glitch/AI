import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Plus, Trash2, Eye, EyeOff, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function AdminCategories() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nameAr: '', nameEn: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get<{ categories: Category[] }>('/categories?all=true'),
  });

  const addMutation = useMutation({
    mutationFn: () => {
      const slug = form.nameEn.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
      return api.post('/categories', { nameAr: form.nameAr.trim(), nameEn: form.nameEn.trim(), slug, isActive: true, sortOrder: 0 });
    },
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم إضافة الفئة' : 'Category added');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      setShowForm(false);
      setForm({ nameAr: '', nameEn: '' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/categories/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم حذف الفئة' : 'Category deleted');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const categories = data?.categories || [];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'الفئات' : 'Categories'}
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            {locale === 'ar' ? 'إضافة فئة' : 'Add Category'}
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{locale === 'ar' ? 'فئة جديدة' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الاسم بالعربي *' : 'Name (Arabic) *'}</label>
                <input
                  value={form.nameAr}
                  onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))}
                  placeholder="مثال: لابتوبات"
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الاسم بالإنجليزي *' : 'Name (English) *'}</label>
                <input
                  value={form.nameEn}
                  onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))}
                  placeholder="e.g. Laptops"
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => addMutation.mutate()}
                disabled={!form.nameAr.trim() || !form.nameEn.trim() || addMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {locale === 'ar' ? 'إضافة الفئة' : 'Add Category'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-all">
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">{locale === 'ar' ? 'لا توجد فئات بعد' : 'No categories yet'}</p>
              <button onClick={() => setShowForm(true)} className="mt-3 text-primary text-sm hover:underline">
                {locale === 'ar' ? 'أضف أول فئة' : 'Add first category'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Slug</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{locale === 'ar' ? cat.nameAr : cat.nameEn}</p>
                        <p className="text-xs text-muted-foreground">{locale === 'ar' ? cat.nameEn : cat.nameAr}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{cat.slug}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', cat.isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800')}>
                          {cat.isActive ? (locale === 'ar' ? 'نشطة' : 'Active') : (locale === 'ar' ? 'مخفية' : 'Hidden')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleMutation.mutate({ id: cat.id, isActive: !cat.isActive })}
                            disabled={toggleMutation.isPending}
                            title={cat.isActive ? (locale === 'ar' ? 'إخفاء' : 'Hide') : (locale === 'ar' ? 'إظهار' : 'Show')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
                          >
                            {cat.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => { if (confirm(locale === 'ar' ? 'هل تريد حذف هذه الفئة؟' : 'Delete this category?')) deleteMutation.mutate(cat.id); }}
                            disabled={deleteMutation.isPending}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
