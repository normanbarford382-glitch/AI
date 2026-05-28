import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Trash2, Eye, EyeOff, X, Upload, Loader2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { formatPrice, cn } from '../../lib/utils';
import api from '../../lib/api';
import type { Product } from '../../types';

interface Category { id: string; nameAr: string; nameEn: string; }

const emptyForm = {
  nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '',
  price: '', discountPrice: '', stock: '0', categoryId: '',
  brand: '', isFeatured: false, images: [] as string[],
};

export default function AdminProducts() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => api.get<{ products: Product[] }>(`/products?limit=200${search ? `&q=${search}` : ''}`),
  });

  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ categories: Category[] }>('/categories'),
  });

  const addMutation = useMutation({
    mutationFn: () => api.post('/products', {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionAr: form.descriptionAr.trim() || undefined,
      descriptionEn: form.descriptionEn.trim() || undefined,
      price: parseFloat(form.price),
      discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : undefined,
      stock: parseInt(form.stock) || 0,
      categoryId: form.categoryId,
      brand: form.brand.trim() || undefined,
      isFeatured: form.isFeatured,
      images: form.images,
      thumbnail: form.images?.[0] || null,
    }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      setForm({ ...emptyForm });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/admin/products/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => { toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const res = await api.post<{ url: string }>('/upload', { base64, folder: 'laptopstore/products' });
       setForm(p => ({
  ...p,
  images: [...(p.images || []), res.url]
}));;
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

  const categories = catsData?.categories || [];
  const products = data?.products || [];
  const canSubmit = form.nameAr && form.nameEn && form.price && form.categoryId;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'المنتجات' : 'Products'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{products.length} {locale === 'ar' ? 'منتج' : 'products'}</span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              {locale === 'ar' ? 'إضافة منتج' : 'Add Product'}
            </button>
          </div>
        </div>

        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'بحث في المنتجات...' : 'Search products...'}
            className="w-full ps-4 pe-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto opacity-30 mb-3" />
              <p>{locale === 'ar' ? 'لا توجد منتجات' : 'No products'}</p>
              <button onClick={() => setShowModal(true)} className="mt-3 text-primary text-sm hover:underline">
                {locale === 'ar' ? 'أضف أول منتج' : 'Add first product'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'المنتج' : 'Product'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">{locale === 'ar' ? 'السعر' : 'Price'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">{locale === 'ar' ? 'المخزون' : 'Stock'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{locale === 'ar' ? product.nameAr : product.nameEn}</p>
                            {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-semibold text-primary">{formatPrice(product.discountPrice ?? product.price)}</span>
                        {product.discountPrice && <span className="text-xs text-muted-foreground line-through ms-2">{formatPrice(product.price)}</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', product.stock === 0 ? 'bg-red-100 text-red-600' : product.stock < 5 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', product.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600')}>
                          {product.isActive ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'مخفي' : 'Hidden')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleMutation.mutate({ id: product.id, isActive: !product.isActive })}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-all text-muted-foreground hover:text-foreground">
                            {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => { if (confirm(locale === 'ar' ? 'هل أنت متأكد؟' : 'Confirm delete?')) deleteMutation.mutate(product.id); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all">
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{locale === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{locale === 'ar' ? 'صورة المنتج' : 'Product Image'}</label>
                <div className="flex items-center gap-4">
                  {form.images?.length > 0 ? (
  <div className="flex gap-2 flex-wrap">
    {form.images.map((img, i) => (
      <img
        key={i}
        src={img}
        alt="preview"
        className="w-20 h-20 rounded-xl object-cover border border-border"
      />
    ))}
  </div>
) : (
                    <div className="w-20 h-20 rounded-xl bg-muted border border-dashed border-border flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => imgRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-all disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (locale === 'ar' ? 'رفع صورة' : 'Upload Image')}
                    </button>
                    <input ref={imgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                    {form.images?.length > 0 && (
                      <button onClick={() => setForm(p => ({ ...p, images: [] }))} className="mt-1.5 text-xs text-red-500 hover:underline block">
                        {locale === 'ar' ? 'إزالة الصورة' : 'Remove image'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الاسم بالعربي *' : 'Name (Arabic) *'}</label>
                  <input value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))}
                    placeholder="مثال: لابتوب ديل"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Name (English) *</label>
                  <input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))}
                    placeholder="e.g. Dell Laptop"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الفئة *' : 'Category *'}</label>
                  <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">{locale === 'ar' ? '-- اختر الفئة --' : '-- Select Category --'}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{locale === 'ar' ? cat.nameAr : cat.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الماركة' : 'Brand'}</label>
                  <input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                    placeholder="Dell, HP, Asus..."
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'السعر *' : 'Price *'}</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'سعر الخصم' : 'Discount Price'}</label>
                  <input type="number" min="0" value={form.discountPrice} onChange={e => setForm(p => ({ ...p, discountPrice: e.target.value }))}
                    placeholder={locale === 'ar' ? 'اختياري' : 'Optional'}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'المخزون' : 'Stock'}</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الوصف بالعربي' : 'Description (Arabic)'}</label>
                <textarea value={form.descriptionAr} onChange={e => setForm(p => ({ ...p, descriptionAr: e.target.value }))} rows={2}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description (English)</label>
                <textarea value={form.descriptionEn} onChange={e => setForm(p => ({ ...p, descriptionEn: e.target.value }))} rows={2}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>

              <div className="flex items-center gap-3 py-2">
                <button type="button" onClick={() => setForm(p => ({ ...p, isFeatured: !p.isFeatured }))}
                  className={cn('w-11 h-6 rounded-full transition-colors relative flex-shrink-0', form.isFeatured ? 'bg-primary' : 'bg-muted')}>
                  <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', form.isFeatured ? 'left-[calc(100%-22px)]' : 'left-0.5')} />
                </button>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">{locale === 'ar' ? 'منتج مميز (يظهر في الصفحة الرئيسية)' : 'Featured (shown on homepage)'}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={!canSubmit || addMutation.isPending || uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
                >
                  {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {addMutation.isPending ? (locale === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (locale === 'ar' ? 'إضافة المنتج' : 'Add Product')}
                </button>
                <button onClick={() => setShowModal(false)} className="px-5 py-3 border border-border rounded-xl text-sm hover:bg-accent transition-all">
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
