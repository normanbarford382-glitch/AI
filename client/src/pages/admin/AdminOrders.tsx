import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Package, Truck, CheckCircle, XCircle, AlertCircle, ChevronDown, Send, Upload, Loader2, X, MessageSquare, Phone, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { formatPrice, formatDate, cn } from '../../lib/utils';
import api from '../../lib/api';

const statusConfig: Record<string, { icon: any; ar: string; en: string; color: string; bg: string }> = {
  PENDING: { icon: Clock, ar: 'قيد الانتظار', en: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  PROCESSING: { icon: Package, ar: 'قيد المعالجة', en: 'Processing', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  SHIPPED: { icon: Truck, ar: 'تم الإرسال', en: 'Shipped', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  DELIVERED: { icon: CheckCircle, ar: 'مكتمل', en: 'Delivered', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  CANCELLED: { icon: XCircle, ar: 'ملغي', en: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  OUT_OF_STOCK: { icon: AlertCircle, ar: 'نفد المخزون', en: 'Out of Stock', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
};

const allStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

interface ReceiptModal {
  orderId: string;
  orderNum: string;
  userId: string;
}

export default function AdminOrders() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<ReceiptModal | null>(null);
  const [receiptMsg, setReceiptMsg] = useState('');
  const [receiptImg, setReceiptImg] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get<{ orders: any[] }>('/orders'),
    refetchInterval: 30000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const messageMutation = useMutation({
    mutationFn: () => api.post(`/admin/orders/${receiptModal!.orderId}/message`, {
      message: receiptMsg.trim() || undefined,
      receiptUrl: receiptImg || undefined,
    }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم إرسال الرسالة للزبون' : 'Message sent to customer');
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      setReceiptModal(null);
      setReceiptMsg('');
      setReceiptImg('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleReceiptUpload = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const res = await api.post<{ url: string }>('/upload', { base64, folder: 'laptopstore/receipts' });
          setReceiptImg(res.url);
          toast.success(locale === 'ar' ? 'تم رفع الإيصال' : 'Receipt uploaded');
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

  const orders = (data?.orders || []).filter(o => !filter || o.status === filter);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'الطلبات' : 'Orders'}</h1>
          <span className="text-sm text-muted-foreground">{orders.length} {locale === 'ar' ? 'طلب' : 'orders'}</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('')} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', !filter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {locale === 'ar' ? 'الكل' : 'All'}
          </button>
          {allStatuses.map(s => {
            const sc = statusConfig[s];
            return (
              <button key={s} onClick={() => setFilter(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', filter === s ? `${sc.bg} ${sc.color}` : 'bg-muted text-muted-foreground hover:text-foreground')}>
                {locale === 'ar' ? sc.ar : sc.en}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{locale === 'ar' ? 'لا توجد طلبات' : 'No orders'}</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const sc = statusConfig[order.status] || statusConfig.PENDING;
              const Icon = sc.icon;
              const isExpanded = expandedId === order.id;
              return (
                <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                    <div className="flex items-center gap-4">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', sc.bg)}>
                        <Icon className={`w-4 h-4 ${sc.color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{order.user?.name || order.fullName} • {formatDate(order.createdAt, locale)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary text-sm">{formatPrice(order.totalAmount)}</span>
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-5">
                      <div className="bg-accent/30 rounded-xl p-4 space-y-2.5">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          {locale === 'ar' ? 'بيانات الزبون' : 'Customer Details'}
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">{locale === 'ar' ? 'الاسم:' : 'Name:'}</span>
                            <span className="font-medium">{order.fullName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">{locale === 'ar' ? 'واتساب:' : 'WhatsApp:'}</span>
                            <a href={`https://wa.me/${order.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                              className="font-medium text-green-600 hover:underline">{order.phone}</a>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">{locale === 'ar' ? 'المحافظة:' : 'Governorate:'}</span>
                            <span className="font-medium">{order.address}</span>
                          </div>
                          {order.shippingBranch && (
                            <div className="flex items-center gap-2">
                              <Truck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">{locale === 'ar' ? 'فرع الشحن:' : 'Branch:'}</span>
                              <span className="font-medium">{order.shippingBranch}</span>
                            </div>
                          )}
                          {order.notes && (
                            <div className="sm:col-span-2 flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{locale === 'ar' ? 'ملاحظات:' : 'Notes:'}</span>
                              <span className="font-medium">{order.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground pt-1">
                          {locale === 'ar' ? 'طريقة الدفع:' : 'Payment:'}
                          <span className="font-medium text-foreground ms-1">{order.paidFromWallet ? (locale === 'ar' ? 'محفظة' : 'Wallet') : (locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery')}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm mb-2">{locale === 'ar' ? 'المنتجات المطلوبة' : 'Ordered Items'}</h3>
                        <div className="space-y-2">
                          {(order.items || []).map((item: any) => {
                            const product = item.products || item.product;
                            const price = item.order_items?.price ?? item.price ?? 0;
                            const qty = item.order_items?.quantity ?? item.quantity ?? 1;
                            return (
                              <div key={item.order_items?.id || item.id} className="flex items-center gap-3 p-3 bg-accent/20 rounded-xl">
                                {product?.thumbnail && (
                                  <img src={product.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-1">{locale === 'ar' ? (product?.nameAr || product?.name_ar) : (product?.nameEn || product?.name_en)}</p>
                                  <p className="text-xs text-muted-foreground">{locale === 'ar' ? `الكمية: ${qty}` : `Qty: ${qty}`}</p>
                                </div>
                                <p className="font-bold text-primary text-sm flex-shrink-0">{formatPrice(price * qty)}</p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-border mt-3">
                          <span className="font-semibold">{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                          <span className="font-black text-primary text-base">{formatPrice(order.totalAmount)}</span>
                        </div>
                      </div>

                      {(order.adminNote || order.shippingReceiptUrl) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 space-y-2">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{locale === 'ar' ? 'رسالة سبق إرسالها للزبون:' : 'Previously sent to customer:'}</p>
                          {order.adminNote && <p className="text-sm text-blue-800 dark:text-blue-300">{order.adminNote}</p>}
                          {order.shippingReceiptUrl && <img src={order.shippingReceiptUrl} alt="receipt" className="w-32 h-32 object-cover rounded-lg border border-blue-200" />}
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium">{locale === 'ar' ? 'تغيير الحالة:' : 'Change Status:'}</span>
                        {allStatuses.map(s => {
                          const ssc = statusConfig[s];
                          return (
                            <button key={s} disabled={order.status === s || statusMutation.isPending}
                              onClick={() => statusMutation.mutate({ id: order.id, status: s })}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                                order.status === s ? `${ssc.bg} ${ssc.color} border-transparent` : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50'
                              )}>
                              {locale === 'ar' ? ssc.ar : ssc.en}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => { setReceiptModal({ orderId: order.id, orderNum: order.id.slice(-8).toUpperCase(), userId: order.userId }); setReceiptMsg(''); setReceiptImg(''); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        {locale === 'ar' ? 'إرسال رسالة / إيصال شحن للزبون' : 'Send Message / Shipping Receipt'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold">
                {locale === 'ar' ? `رسالة للزبون - طلب #${receiptModal.orderNum}` : `Message Customer - Order #${receiptModal.orderNum}`}
              </h2>
              <button onClick={() => setReceiptModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الرسالة' : 'Message'}</label>
                <textarea
                  value={receiptMsg}
                  onChange={e => setReceiptMsg(e.target.value)}
                  rows={3}
                  placeholder={locale === 'ar' ? 'اكتب رسالتك للزبون...' : 'Write your message to the customer...'}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{locale === 'ar' ? 'صورة إيصال الشحن (اختياري)' : 'Shipping Receipt Image (optional)'}</label>
                {receiptImg ? (
                  <div className="relative inline-block">
                    <img src={receiptImg} alt="receipt" className="w-full h-40 object-cover rounded-xl border border-border" />
                    <button onClick={() => setReceiptImg('')} className="absolute top-2 end-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span className="text-xs">{uploading ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (locale === 'ar' ? 'رفع صورة الإيصال' : 'Upload receipt image')}</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); }} />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => messageMutation.mutate()}
                  disabled={(!receiptMsg.trim() && !receiptImg) || messageMutation.isPending || uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-60"
                >
                  {messageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {messageMutation.isPending ? (locale === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (locale === 'ar' ? 'إرسال للزبون' : 'Send to Customer')}
                </button>
                <button onClick={() => setReceiptModal(null)} className="px-4 py-3 border border-border rounded-xl text-sm hover:bg-accent transition-all">
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
