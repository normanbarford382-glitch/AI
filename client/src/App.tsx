import { Switch, Route, Router as WouterRouter, useParams, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocaleProvider, useLocale } from './context/LocaleContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import WalletPage from './pages/WalletPage';
import WishlistPage from './pages/WishlistPage';
import SupportPage from './pages/SupportPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBanners from './pages/admin/AdminBanners';
import AdminSettings from './pages/admin/AdminSettings';
import AdminWallet from './pages/admin/AdminWallet';
import AdminMessages from './pages/admin/AdminMessages';
import AdminPaymentMethods from './pages/admin/AdminPaymentMethods';
import AdminCategories from './pages/admin/AdminCategories';
import ComparePage from './pages/ComparePage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import NotFound from './pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function AppRoutes() {
  const { locale, isRTL } = useLocale();

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/:id" component={ProductDetailPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
      <Route path="/auth/reset-password" component={ResetPasswordPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/orders/:id" component={OrderDetailPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/wishlist" component={WishlistPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/banners" component={AdminBanners} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/wallet" component={AdminWallet} />
      <Route path="/admin/messages" component={AdminMessages} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/payment-methods" component={AdminPaymentMethods} />
      <Route path="/compare" component={ComparePage} />
      <Route path="/auth/verify" component={VerifyOTPPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <AppToaster />
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <AppRoutes />
              </WouterRouter>
            </ThemeProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

function AppToaster() {
  const { locale } = useLocale();
  return (
    <Toaster
      position={locale === 'ar' ? 'top-right' : 'top-left'}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '12px',
          fontFamily: locale === 'ar' ? 'Cairo, sans-serif' : 'Inter, sans-serif',
          direction: locale === 'ar' ? 'rtl' : 'ltr',
        },
      }}
    />
  );
}

export default App;
