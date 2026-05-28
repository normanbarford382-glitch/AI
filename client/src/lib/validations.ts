import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم الكامل مطلوب'),
  phone: z.string().min(9, 'رقم الهاتف غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

export const verifyOTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'الكود مكون من 6 أرقام'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  phone: z.string().min(9, 'رقم الهاتف غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

export const orderSchema = z.object({
  fullName: z.string().min(3, 'الاسم الكامل مطلوب'),
  phone: z.string().min(9, 'رقم الهاتف غير صالح'),
  address: z.string().min(10, 'العنوان مطلوب'),
  shippingBranch: z.string().optional(),
  useWallet: z.boolean().optional(),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })),
});

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const productSchema = z.object({
  nameAr: z.string().min(2),
  nameEn: z.string().min(2),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number().positive(),
  discountPrice: z.number().optional(),
  stock: z.number().int().min(0),
  categoryId: z.string(),
  brand: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const walletTopupSchema = z.object({
  paymentMethodId: z.string(),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  transactionRef: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type WalletTopupInput = z.infer<typeof walletTopupSchema>;
