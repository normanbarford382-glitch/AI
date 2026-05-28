import { Link } from 'wouter';
import { Home } from 'lucide-react';
import StorePageShell from '../components/shared/StorePageShell';
import { useLocale } from '../context/LocaleContext';

export default function NotFound() {
  const { locale } = useLocale();
  return (
    <StorePageShell mainClassName="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 card-premium p-12 max-w-lg w-full">
        <h1 className="text-8xl font-black premium-gradient bg-clip-text text-transparent">404</h1>
        <h2 className="text-2xl font-bold text-foreground">
          {locale === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h2>
        <p className="text-muted-foreground">
          {locale === 'ar' ? 'عذراً، الصفحة التي تبحث عنها غير موجودة.' : 'Sorry, the page you are looking for does not exist.'}
        </p>
        <Link href="/" className="btn-primary-lg inline-flex">
          <Home className="w-4 h-4" />
          {locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </div>
    </StorePageShell>
  );
}
